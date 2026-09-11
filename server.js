/**
 * KalaSutra backend — deliberately zero external dependencies.
 * Uses only Node's built-in "http" and "fs" modules so it runs with
 * nothing more than: node server/server.js
 *
 * Data is stored in server/db.json (a plain JSON file acting as our
 * demo database — easy to open and inspect in any text editor).
 */
const http = require('http');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load local .env automatically so Razorpay keys survive every restart.
// This uses Node's built-in fs only; no dotenv package is required.
function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (_) {
    // .env is optional; the server can still run for COD/demo mode.
  }
}
loadLocalEnv();

const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = 3443;
const IS_HOSTED = Boolean(process.env.PORT || process.env.RENDER);
const CERT_DIR = path.join(__dirname, 'certs');
const DB_PATH = path.join(__dirname, 'db.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ---------- tiny JSON "database" helpers ----------
function readDB() {
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  let changed = false;
  let max = 0;
  for (const p of (data.products || [])) {
    const m = String(p.uniqueProductId || '').match(/(\d{6})$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  for (const [i, p] of (data.products || []).entries()) {
    if (!p.uniqueProductId) { p.uniqueProductId = `KS-ART-${String(Math.max(i + 1, ++max)).padStart(6, '0')}`; changed = true; }
    if (!Array.isArray(p.customizations)) { p.customizations = []; changed = true; }
  }
  if (!Array.isArray(data.customizations)) { data.customizations = []; changed = true; }
  if (changed) fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data;
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function newId(db, prefix) {
  const id = `${prefix}${db._meta.nextId}`;
  db._meta.nextId += 1;
  return id;
}

// ---------- demo verification logic ----------
// NOTE: This is clearly a DEMO stand-in for a real computer-vision
// verification model. It simulates the 4-layer KalaSutra Anti-Fake
// protocol using simple weighted randomness so the demo is stable
// and never crashes, while still feeling realistic (mostly verified,
// sometimes needs review, rarely rejected).
function runDemoVerification() {
  const r = Math.random();
  let status, confidence, notes;
  if (r < 0.65) {
    status = 'verified';
    confidence = Math.round((0.85 + Math.random() * 0.14) * 100) / 100;
    notes = ['No industrial symmetry detected', 'No matches found in global databases', 'Not required for this listing'];
  } else if (r < 0.9) {
    status = 'needs_review';
    confidence = Math.round((0.55 + Math.random() * 0.2) * 100) / 100;
    notes = ['No industrial symmetry detected', 'No matches found in global databases', 'Additional making-process proof requested'];
  } else {
    status = 'rejected';
    confidence = Math.round((0.1 + Math.random() * 0.2) * 100) / 100;
    notes = ['Clinical symmetry detected — likely machine-made', 'No matches found in global databases', 'Not eligible without manual appeal'];
  }
  return { status, confidence, notes, isDemo: true };
}

// ---------- request helpers ----------
function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      // Guard against runaway uploads (e.g. a huge base64 video) crashing the demo server.
      if (size > 25 * 1024 * 1024) {
        reject(new Error('Upload too large for this demo (25MB limit)'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript',
  '.tsx': 'text/javascript', '.ts': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};
function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';
  const fullPath = path.join(PUBLIC_DIR, filePath);
  // prevent path traversal outside /public
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}


// Razorpay REST helper. The secret key never leaves this Node.js server.
function razorpayRequest(method, endpoint, payload) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const data = JSON.stringify(payload || {});
    const req = require('https').request({
      hostname: 'api.razorpay.com', path: endpoint, method,
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (r) => {
      let out = '';
      r.on('data', c => out += c);
      r.on('end', () => {
        let parsed; try { parsed = JSON.parse(out); } catch (_) { parsed = { error: { description: out || 'Razorpay request failed' } }; }
        if (r.statusCode >= 200 && r.statusCode < 300) resolve(parsed);
        else reject(new Error(parsed?.error?.description || `Razorpay returned ${r.statusCode}`));
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

// ---------- API router ----------
async function handleAPI(req, res, urlParts) {
  const db = readDB();
  const [, , resource, id] = urlParts; // /api/<resource>/<id>

  try {
    // ----- USERS (demo login / signup — no real auth/OTP backend needed) -----
    if (resource === 'users' && req.method === 'POST') {
      const body = await readBody(req);
      let user = db.users.find(u => u.contact === body.contact && u.role === body.role);
      if (!user) {
        user = {
          id: newId(db, 'u'),
          name: body.name || 'New User',
          contact: body.contact || '',
          role: body.role || 'buyer',
          profile: body.role === 'artisan'
            ? { craft: '', location: '', bio: '', trustScore: 100 }
            : { location: '' },
        };
        db.users.push(user);
        writeDB(db);
      } else if (body.name) {
        user.name = body.name;
        writeDB(db);
      }
      return sendJSON(res, 200, user);
    }

    // ----- PRODUCTS -----
    if (resource === 'products' && req.method === 'GET' && !id) {
      return sendJSON(res, 200, db.products);
    }
    if (resource === 'products' && req.method === 'GET' && id) {
      const product = db.products.find(p => p.id === id);
      if (!product) return sendJSON(res, 404, { error: 'Product not found' });
      const artisan = db.users.find(u => u.id === product.artisanId);
      return sendJSON(res, 200, { ...product, artisan });
    }
    if (resource === 'products' && req.method === 'POST' && !id) {
      const body = await readBody(req);
      const nextProductNumber = Math.max(0, ...(db.products || []).map(p => Number(String(p.uniqueProductId || '').match(/(\d{6})$/)?.[1] || 0))) + 1;
      const product = {
        id: newId(db, 'p'),
        uniqueProductId: `KS-ART-${String(nextProductNumber).padStart(6, '0')}`,
        customizations: [],
        artisanId: body.artisanId,
        title: body.title || 'Untitled product',
        description: body.description || '',
        price: Number(body.price) || 0,
        category: body.category || 'Other',
        image: body.image || null, // base64 data URL from the browser, or null
        verificationStatus: 'unverified',
        availability: true,
        craftInfo: body.craftInfo || {},
      };
      db.products.unshift(product);
      writeDB(db);
      return sendJSON(res, 201, product);
    }
    if (resource === 'products' && id && req.method === 'PUT') {
      const body = await readBody(req);
      const product = db.products.find(p => p.id === id);
      if (!product) return sendJSON(res, 404, { error: 'Product not found' });
      Object.assign(product, body);
      writeDB(db);
      return sendJSON(res, 200, product);
    }

    // ----- SCAN / VERIFY (demo AI verification) -----
    if (resource === 'scan' && req.method === 'POST') {
      const body = await readBody(req);
      const product = db.products.find(p => p.id === body.productId);
      const result = runDemoVerification();
      if (product) {
        product.verificationStatus = result.status;
        product.verificationDate = new Date().toISOString();
        product.trustScore = Math.round(result.confidence * 100);
        product.verificationLayers = { imageCheck: true, makingProof: true, productProcessMatch: Math.round(result.confidence * 100), originalityGuard: true, ownershipProof: true };
        writeDB(db);
      }
      return sendJSON(res, 200, result);
    }

    // ----- WISHLIST -----
    if (resource === 'wishlist' && req.method === 'GET') {
      const userId = urlParts[3] || new URL(req.url, 'http://x').searchParams.get('userId');
      const items = db.wishlist.filter(w => w.userId === userId)
        .map(w => db.products.find(p => p.id === w.productId)).filter(Boolean);
      return sendJSON(res, 200, items);
    }
    if (resource === 'wishlist' && req.method === 'POST') {
      const body = await readBody(req);
      const exists = db.wishlist.some(w => w.userId === body.userId && w.productId === body.productId);
      if (!exists) { db.wishlist.push({ userId: body.userId, productId: body.productId }); writeDB(db); }
      return sendJSON(res, 200, { ok: true });
    }
    if (resource === 'wishlist' && req.method === 'DELETE') {
      const body = await readBody(req);
      db.wishlist = db.wishlist.filter(w => !(w.userId === body.userId && w.productId === body.productId));
      writeDB(db);
      return sendJSON(res, 200, { ok: true });
    }

    // ----- CART -----
    if (resource === 'cart' && req.method === 'GET') {
      const userId = urlParts[3] || new URL(req.url, 'http://x').searchParams.get('userId');
      const items = db.cart.filter(c => c.userId === userId).map(c => ({
        ...c, product: db.products.find(p => p.id === c.productId),
      }));
      return sendJSON(res, 200, items);
    }
    if (resource === 'cart' && req.method === 'POST') {
      const body = await readBody(req);
      const existing = db.cart.find(c => c.userId === body.userId && c.productId === body.productId);
      if (existing) existing.qty += 1;
      else db.cart.push({ userId: body.userId, productId: body.productId, qty: 1 });
      writeDB(db);
      return sendJSON(res, 200, { ok: true });
    }
    if (resource === 'cart' && req.method === 'DELETE') {
      const body = await readBody(req);
      db.cart = db.cart.filter(c => !(c.userId === body.userId && c.productId === body.productId));
      writeDB(db);
      return sendJSON(res, 200, { ok: true });
    }

    // ----- ORDERS -----
    if (resource === 'orders' && req.method === 'GET') {
      const userId = urlParts[3] || new URL(req.url, 'http://x').searchParams.get('userId');
      const user = db.users.find(u => u.id === userId);
      if (user?.role === 'artisan') {
        const orders = db.orders.filter(o => (o.products || []).some(item => {
          const p = db.products.find(pp => pp.id === item.productId);
          return p && p.artisanId === userId;
        })).map(o => ({ ...o, artisanItems: (o.products || []).filter(item => { const p = db.products.find(pp => pp.id === item.productId); return p && p.artisanId === userId; }) }));
        return sendJSON(res, 200, orders);
      }
      const orders = db.orders.filter(o => o.buyerId === userId);
      return sendJSON(res, 200, orders);
    }
    if (resource === 'orders' && req.method === 'POST') {
      const body = await readBody(req);
      const cartItems = db.cart.filter(c => c.userId === body.buyerId);
      const products = cartItems.map(c => {
        const p = db.products.find(pp => pp.id === c.productId);
        return { productId: c.productId, title: p ? p.title : 'Unknown', price: p ? p.price : 0, qty: c.qty };
      });
      const amount = products.reduce((sum, p) => sum + p.price * p.qty, 0);
      const order = {
        id: newId(db, 'o'),
        buyerId: body.buyerId,
        products,
        amount,
        status: 'placed',
        date: new Date().toISOString(),
      };
      db.orders.unshift(order);
      db.cart = db.cart.filter(c => c.userId !== body.buyerId); // clear cart (demo checkout)
      writeDB(db);
      return sendJSON(res, 201, order);
    }


    // ----- DIGITAL CERTIFICATE & CUSTOMIZATION -----
    if (resource === 'certificate' && req.method === 'GET' && id) {
      const product = db.products.find(p => p.uniqueProductId === id || p.id === id);
      if (!product) return sendJSON(res, 404, { error: 'Product certificate not found' });
      const artisan = db.users.find(u => u.id === product.artisanId) || null;
      return sendJSON(res, 200, {
        product: { ...product, artisan },
        certificate: { productId: product.uniqueProductId, verificationResult: product.verificationStatus, verificationDate: product.verificationDate || null, status: product.verificationStatus }
      });
    }
    if (resource === 'customizations' && req.method === 'POST') {
      const body = await readBody(req);
      const product = db.products.find(p => p.id === body.productId);
      if (!product) return sendJSON(res, 404, { error: 'Product not found' });
      const request = String(body.request || '').trim();
      if (!request) return sendJSON(res, 400, { error: 'Please describe the customization' });
      if (!Array.isArray(db.customizations)) db.customizations = [];
      const next = Math.max(0, ...db.customizations.map(c => Number(c.customizationId) || 0)) + 1;
      const customization = {
        id: newId(db, 'c'), customizationId: String(next).padStart(4, '0'),
        productId: product.id, uniqueProductId: product.uniqueProductId, buyerId: body.buyerId,
        request, charge: Number(body.charge) || 100, status: 'requested', createdAt: new Date().toISOString()
      };
      db.customizations.unshift(customization);
      product.customizations = product.customizations || [];
      product.customizations.unshift(customization);
      writeDB(db);
      return sendJSON(res, 201, customization);
    }

    // ----- PAYMENTS / CHECKOUT -----
    // Location helper: reverse-geocode the browser's GPS coordinates so
    // delivery fields can be filled automatically. Uses OpenStreetMap Nominatim.
    if (resource === 'location' && id === 'reverse' && req.method === 'GET') {
      const u = new URL(req.url, 'http://localhost');
      const lat = Number(u.searchParams.get('lat'));
      const lon = Number(u.searchParams.get('lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return sendJSON(res, 400, { error: 'Valid latitude and longitude are required.' });
      }
      try {
        const qs = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), addressdetails: '1' });
        const geo = await new Promise((resolve, reject) => {
          const r = require('https').request({
            hostname: 'nominatim.openstreetmap.org', path: `/reverse?${qs.toString()}`, method: 'GET',
            headers: { 'User-Agent': 'KalaSutra-Hackathon-Demo/1.0 (location lookup)' }
          }, (rr) => {
            let out = '';
            rr.on('data', c => out += c);
            rr.on('end', () => {
              try {
                const parsed = JSON.parse(out);
                if (rr.statusCode >= 200 && rr.statusCode < 300) resolve(parsed);
                else reject(new Error(parsed?.error || 'Reverse geocoding failed'));
              } catch (_) { reject(new Error('Invalid location response')); }
            });
          });
          r.on('error', reject); r.end();
        });
        const a = geo.address || {};
        return sendJSON(res, 200, {
          displayName: geo.display_name || '',
          area: a.neighbourhood || a.suburb || a.residential || a.village || a.town || '',
          city: a.city || a.town || a.village || a.municipality || a.county || '',
          pincode: a.postcode || '',
          state: a.state || '',
          country: a.country || ''
        });
      } catch (e) {
        return sendJSON(res, 502, { error: 'Could not read the location address right now.' });
      }
    }

    if (resource === 'payment' && id === 'config' && req.method === 'GET') {
      return sendJSON(res, 200, {
        configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        keyId: process.env.RAZORPAY_KEY_ID || null,
        currency: 'INR'
      });
    }

    if (resource === 'payment' && id === 'create-order' && req.method === 'POST') {
      const body = await readBody(req);
      const buyerId = body.buyerId;
      const cartItems = db.cart.filter(c => c.userId === buyerId);
      if (!cartItems.length) return sendJSON(res, 400, { error: 'Your cart is empty' });
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return sendJSON(res, 503, { error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server environment.' });
      }
      const products = cartItems.map(c => {
        const p = db.products.find(pp => pp.id === c.productId);
        return { productId: c.productId, title: p ? p.title : 'Unknown', price: p ? Number(p.price) : 0, qty: c.qty };
      });
      const amount = products.reduce((sum, p) => sum + p.price * p.qty, 0);
      if (amount <= 0) return sendJSON(res, 400, { error: 'Invalid cart amount' });
      const receipt = `KS_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const razorOrder = await razorpayRequest('POST', '/v1/orders', {
        amount: Math.round(amount * 100), currency: 'INR', receipt, notes: { buyerId: String(buyerId) }
      });
      return sendJSON(res, 200, { keyId: process.env.RAZORPAY_KEY_ID, orderId: razorOrder.id, amount, currency: 'INR', receipt });
    }

    if (resource === 'payment' && id === 'verify' && req.method === 'POST') {
      const body = await readBody(req);
      if (!process.env.RAZORPAY_KEY_SECRET) return sendJSON(res, 503, { error: 'Razorpay secret is not configured on the server' });
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest('hex');
      if (expected !== body.razorpay_signature) return sendJSON(res, 400, { error: 'Payment signature verification failed' });
      const cartItems = db.cart.filter(c => c.userId === body.buyerId);
      if (!cartItems.length) return sendJSON(res, 400, { error: 'Your cart is empty' });
      const products = cartItems.map(c => {
        const p = db.products.find(pp => pp.id === c.productId);
        return { productId: c.productId, title: p ? p.title : 'Unknown', price: p ? Number(p.price) : 0, qty: c.qty };
      });
      const amount = products.reduce((sum, p) => sum + p.price * p.qty, 0);
      const order = {
        id: newId(db, 'o'), buyerId: body.buyerId, products, amount,
        status: 'paid', paymentMethod: 'razorpay', paymentId: body.razorpay_payment_id,
        razorpayOrderId: body.razorpay_order_id, address: body.address || {},
        date: new Date().toISOString()
      };
      db.orders.unshift(order);
      db.cart = db.cart.filter(c => c.userId !== body.buyerId);
      writeDB(db);
      return sendJSON(res, 201, order);
    }

    if (resource === 'checkout' && id === 'cod' && req.method === 'POST') {
      const body = await readBody(req);
      const cartItems = db.cart.filter(c => c.userId === body.buyerId);
      if (!cartItems.length) return sendJSON(res, 400, { error: 'Your cart is empty' });
      const products = cartItems.map(c => {
        const p = db.products.find(pp => pp.id === c.productId);
        return { productId: c.productId, title: p ? p.title : 'Unknown', price: p ? Number(p.price) : 0, qty: c.qty };
      });
      const amount = products.reduce((sum, p) => sum + p.price * p.qty, 0);
      const order = {
        id: newId(db, 'o'), buyerId: body.buyerId, products, amount,
        status: 'placed', paymentMethod: 'cod', address: body.address || {},
        date: new Date().toISOString()
      };
      db.orders.unshift(order);
      db.cart = db.cart.filter(c => c.userId !== body.buyerId);
      writeDB(db);
      return sendJSON(res, 201, order);
    }

    // ----- REELS -----
    if (resource === 'reels' && req.method === 'GET' && !id) {
      const artisanId = new URL(req.url, 'http://x').searchParams.get('artisanId');
      let reels = db.reels;
      if (artisanId) reels = reels.filter(r => r.artisanId === artisanId);
      const enriched = reels.map(r => ({
        ...r,
        product: db.products.find(p => p.id === r.productId) || null,
        artisan: db.users.find(u => u.id === r.artisanId) || null,
      }));
      return sendJSON(res, 200, enriched);
    }
    if (resource === 'reels' && req.method === 'POST' && !id) {
      const body = await readBody(req);
      const reel = {
        id: newId(db, 'r'),
        artisanId: body.artisanId,
        productId: body.productId || null,
        video: body.video || null, // base64 data URL, or null for a demo/no-clip reel
        thumbEmoji: body.thumbEmoji || '🎨',
        caption: body.caption || '',
        category: body.category || 'Other',
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };
      db.reels.unshift(reel);
      writeDB(db);
      return sendJSON(res, 201, reel);
    }
    if (resource === 'reels' && id && req.method === 'PUT') {
      const body = await readBody(req);
      const reel = db.reels.find(r => r.id === id);
      if (!reel) return sendJSON(res, 404, { error: 'Reel not found' });
      Object.assign(reel, body);
      writeDB(db);
      return sendJSON(res, 200, reel);
    }
    if (resource === 'reels' && id && req.method === 'DELETE') {
      db.reels = db.reels.filter(r => r.id !== id);
      writeDB(db);
      return sendJSON(res, 200, { ok: true });
    }

    return sendJSON(res, 404, { error: 'Unknown API route' });
  } catch (err) {
    // Any unexpected error becomes a clean JSON 500, never a server crash.
    console.error('API error:', err.message);
    return sendJSON(res, 500, { error: 'Something went wrong on the server (demo mode): ' + err.message });
  }
}

function appHandler(req, res, isSecure = false) {
  // If a phone opens the LAN HTTP address, redirect it to the bundled HTTPS
  // endpoint. This is important because iOS/Android block geolocation and
  // microphone permission prompts on ordinary HTTP network addresses.
  const hostHeader = String(req.headers.host || '');
  const hostOnly = hostHeader.split(':')[0];
  const isLanRequest = hostOnly && !['localhost', '127.0.0.1', '[::1]'].includes(hostOnly);
  const userAgent = String(req.headers['user-agent'] || '');
  const isPhone = /iPhone|iPad|iPod|Android/i.test(userAgent);
  if (!IS_HOSTED && isPhone && isLanRequest && !isSecure && req.headers['x-forwarded-proto'] !== 'https') {
    res.writeHead(302, { Location: `https://${hostOnly}:${HTTPS_PORT}${req.url}` });
    return res.end();
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }
  const urlParts = req.url.split('?')[0].split('/'); // ['', 'api', 'products', 'p1']
  if (urlParts[1] === 'api') {
    handleAPI(req, res, urlParts);
  } else {
    serveStatic(req, res);
  }
}

const server = http.createServer(appHandler);

function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of (nets[name] || [])) {
      if (n.family === 'IPv4' && !n.internal && !n.address.startsWith('169.254.')) return n.address;
    }
  }
  return '127.0.0.1';
}

function reportServerError(label, err, port) {
  if (err.code === 'EADDRINUSE') console.error(`\nPort ${port} is already in use (${label}).\n`);
  else console.error(`${label} server error:`, err);
}

server.on('error', (err) => reportServerError('HTTP', err, PORT));
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  KalaSutra demo server is running!');
  console.log(`  Laptop: http://localhost:${PORT}`);
  console.log(`  Phone (same Wi-Fi): http://${getLanIPv4()}:${PORT}`);
  console.log('  Phone location: use the HTTPS link below.');
  console.log('  Press Ctrl+C in this window to stop it.');
  console.log('========================================\n');
});

// HTTPS is provided for phone browsers because browser geolocation requires a secure context.
// A local self-signed certificate is bundled for hackathon/demo use.
if (!IS_HOSTED) try {
  const key = fs.readFileSync(path.join(CERT_DIR, 'local-key.pem'));
  const cert = fs.readFileSync(path.join(CERT_DIR, 'local-cert.pem'));
  const secureServer = https.createServer({ key, cert }, (req, res) => appHandler(req, res, true));
  secureServer.on('error', (err) => reportServerError('HTTPS', err, HTTPS_PORT));
  secureServer.listen(HTTPS_PORT, () => {
    console.log(`  Phone secure URL: https://${getLanIPv4()}:${HTTPS_PORT}`);
    console.log('========================================\n');
  });
} catch (err) {
  console.error('HTTPS setup unavailable; HTTP server is still running.', err.message);
}
