# Kala Sutra — Hackathon Demo

A working artisan-to-buyer marketplace app: artisans list handmade products,
run them through a demo AI verification check, post short "Reels" showing
how they make their craft, and buyers discover, wishlist, and order those
verified pieces.

This is a **real, working app** — not just a clickable picture. It has:
- A backend server (written in plain Node.js — no extra software to install)
- A database (a simple file called `db.json` — easy to open and look at)
- A frontend app (built with React) that talks to that backend over the network

---

## 1. What you need to install (one-time, ~5 minutes)

You only need **one thing**: **Node.js**.

1. Go to **https://nodejs.org** in your web browser.
2. Click the big green button that says **LTS** (it means "Long Term Support" — the stable version).
3. Run the installer you downloaded and click Next/Continue through it, accepting the defaults.
4. That's it — nothing else to install. This project does **not** use `npm install`,
   Vite, React Native, or any other build tool, so there's nothing else to set up.

To check it worked: open a **Terminal** (Mac) or **Command Prompt** (Windows), type:
```
node --version
```
and press Enter. If you see something like `v20.11.0`, you're ready.

> **Where's the Terminal / Command Prompt?**
> - **Windows**: Click Start, type `cmd`, press Enter.
> - **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter.

---

## 2. How to run the app (every time)

1. Unzip the `kalasutra-app` folder you downloaded, somewhere easy to find (like your Desktop).
2. Open Terminal / Command Prompt.
3. Type `cd ` (with a space after it), then drag the `kalasutra-app` folder from your file
   explorer straight into the terminal window — it will paste the folder path in automatically.
   Press Enter. You are now "inside" the project folder.
4. Type this and press Enter:
   ```
   node server/server.js
   ```
5. You should see:
   ```
   ========================================
     KalaSutra demo server is running!
     Open this in your browser:  http://localhost:3000
   ========================================
   ```
6. Open your web browser (Chrome or Edge recommended) and go to:
   **http://localhost:3000**

### Phone / tablet testing (location permission)
Phone browsers require a secure (HTTPS) context before they can show the device location permission prompt.
Keep the laptop and phone on the same Wi-Fi/hotspot and use the **Phone secure URL** printed by `npm start`, for example:
**https://172.20.10.3:3443**
The first time, the browser may show a local certificate warning; continue to the site for this local hackathon demo.
Once the secure page is open, tap **Allow** for Location. The same permission flow is used for both Buyer and Artisan.

The project also loads `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` automatically from the project `.env` file on every server restart, so you do not need to re-enter them in Command Prompt each time.

That's the whole app. Leave the Terminal window open while you use the app —
closing it stops the server. To stop it on purpose, click into that Terminal
window and press `Ctrl + C`.

**Note:** the app loads React and some fonts from the internet the first time
(the same way a normal website loads Google Fonts), so make sure the computer
running it has an internet connection. Nothing needs to be installed for this —
it just needs to be online.

---

## 3. Demo script (what to click during your hackathon demo)

### As an Artisan:
1. Open the app → tap **Get Started**
2. Enter any phone number → tap **Send OTP**
3. Enter any 4 digits → tap **Verify & Continue**
4. Enter your name → tap **Continue**
5. Tap **I'm an Artisan**
6. On the dashboard, tap the **+ Add** button (or the ➕ circle)
7. Upload a photo, fill in the product name/description/price/category
8. Tap **Scan & Verify Product** — watch the demo verification animation run
9. See the Verified/Needs Review result
10. Tap **Create a Reel for this product**
11. Tap **Record** (allow camera access) or **Upload** a video from your device
12. Add a caption, confirm the product is attached → tap **Post Reel**
13. Check **My Reels** to see it listed (you can edit the caption or delete it)

### As a Buyer:
1. From the artisan dashboard, tap **⇄ Switch to Buyer** (or log in fresh and choose **I'm a Buyer**)
2. Tap the **Reels** tab → watch a Reel
3. Tap **View Product** on a Reel with a product attached
4. Tap **Add to Cart** or the heart icon to wishlist it
5. Go to the **Cart** tab → tap **Place Order**
6. Go to the **Orders** tab → see your order listed

---

## 4. What's "real" vs. what's "demo" in this project

Being upfront about this, since it matters for a hackathon:

| Feature | Status |
|---|---|
| Backend server, REST API | **Real** — plain Node.js, actually runs, actually saves data |
| Database | **Real**, but simple — a JSON file (`server/db.json`) instead of a full database engine like PostgreSQL. This is intentional for a hackathon: it's zero-setup, and you can literally open `db.json` in any text editor to see everything the app has stored. |
| Login / OTP | **Demo** — no real SMS is sent. Any phone number and any 4-digit code will work. This is called out on-screen. |
| AI product verification | **Demo** — there's no real trained computer-vision model here. `server/server.js` has a clearly-labelled `runDemoVerification()` function that simulates a realistic result (mostly "verified", sometimes "needs review", occasionally "rejected"). The UI always shows a "Demo verification" tag so this is never presented as real. Swapping in a real model later just means replacing that one function. |
| Video recording | **Real** — it uses your device's actual camera via the browser (a standard web feature called MediaRecorder), or lets you upload a real video file. Clips are capped at 20 seconds so they stay small enough for this demo's simple storage. |
| Payments | **Demo** — "Place Order" is a real button that creates a real order record in the database, but no real payment is charged. This is clearly labelled "demo checkout" in the app. |

---

## 5. Project structure (for reference — you don't need to edit these)

```
kalasutra-app/
├── package.json          → lets you optionally run "npm start" instead of the node command
├── server/
│   ├── server.js          → the whole backend (Node.js, no external libraries)
│   └── db.json            → the "database" — open this in any text editor to see all the data
└── public/                → everything the browser loads
    ├── index.html          → the page shell that loads React
    ├── app.tsx             → the entire React app (all screens live in this one file)
    ├── styles.css          → all the visual styling (colors, fonts, cards — matches your prototype)
    └── assets/             → logo and product images
```

If something ever looks broken and you want to start fresh, you can restore the
original sample data by asking for a fresh copy of `server/db.json` — or just
delete the extra entries you don't want by opening it in a text editor (it's
plain, readable JSON).

---

## 6. If something goes wrong

- **"Port 3000 is already in use"** — you already have the server running in
  another window, or something else on your computer is using that port.
  Close the other Terminal window, or open `server/server.js` in a text editor,
  change `const PORT = 3000;` near the top to `const PORT = 3001;`, save, and
  restart.
- **Blank page in the browser** — make sure the computer has an internet
  connection (needed once, to load React and fonts), and make sure the
  Terminal window running the server is still open.
- **Camera doesn't work when recording a Reel** — your browser will ask for
  camera/microphone permission the first time; click Allow. If you say no by
  mistake, you can still use the "Upload" button to pick a video file instead.
- Anything else: check the Terminal window running the server — real error
  messages will print there in plain English.


## Final real-photo gallery
The featured Handwoven Cane Pendant Lamp keeps the existing 6-second making Reel and now includes the user-provided craft-shop photo gallery on its product-detail screen. All original app flows remain intact.

## Real Razorpay payments + Cash on Delivery

The checkout now supports two real flows:
- **Razorpay**: creates a Razorpay order on the Node.js server, opens the official Razorpay Checkout, and verifies the payment signature on the server before creating the KalaSutra order.
- **Cash on delivery**: creates the order immediately and stores the delivery details and COD method.

### Configure Razorpay
1. Create a Razorpay account and open the API Keys page.
2. For hackathon testing, use **Test Mode** keys first.
3. In Windows Command Prompt, inside `kalasutra-app`, run:

```cmd
set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
set RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
npm start
```

Use your own key values; never put the secret key in `public/app.tsx` or expose it to the browser. The app exposes only the public key to the checkout page.

To take real money later, replace the Test Mode keys with the Live Mode keys from your Razorpay account.

## New: Location + Notifications + Voice permissions
This version preserves the existing CAPTCHA, real-photo storefront, Razorpay Test/Live key integration, COD checkout, artisan verification flow, reels, cart, wishlist and navigation.

On the first logged-in app session, KalaSutra shows a polished permission center with:
- **Location** — requests browser location permission and reverse-geocodes the GPS position into area, city and pincode. Checkout auto-fills saved location details.
- **Notifications** — requests browser notification permission and shows order/payment confirmation notifications when permission is granted.
- **Voice & microphone** — requests microphone permission for AI Talker and buyer voice search.

There is also a **Use my current location & auto-fill** button inside checkout so the buyer can refresh their delivery address anytime.

### Browser note
Browser GPS permission requires a secure context in many browsers (HTTPS, or `localhost`). If the app is opened on a phone using a plain `http://<laptop-IP>:3000` address, the browser may block GPS/microphone/notification permissions. For the cleanest phone demo, deploy the same folder on an HTTPS host such as Replit, or use the browser's allowed local-development setup.

## Razorpay: one-time setup
1. Double-click `SETUP-RAZORPAY-ONCE.cmd`.
2. Enter your Razorpay **TEST** Key ID and Secret when prompted.
3. After that, `npm start` automatically loads the saved `.env` file every time. You no longer need to run `set RAZORPAY_...` commands in CMD.
4. Never upload/share `.env` or your secret key.

## Phone permissions (location / microphone / notifications)
For laptop use, continue to open `http://localhost:3000`.
For a phone, the browser must use HTTPS before it can grant location and microphone permissions. The included `START-PHONE-SECURE.cmd` starts the server and opens a secure HTTPS tunnel. Keep the window open and use the `https://...loca.lt` link it prints on the phone. On iPhone, notifications require adding KalaSutra to the Home Screen first; location and microphone work from the secure link.
