
// KALASUTRA KARIGAR AI SERVER ROUTE
// Add this route to your existing Express server/server.js.
// It uses native fetch; no OpenAI npm package is required.
// Render Environment must contain OPENAI_API_KEY.

const KARIGAR_SYSTEM_PROMPT = `
You are Karigar AI, the voice-first AI copilot inside KalaSutra.

You are clearly an AI assistant, never pretend to be a human.
Your personality is warm, natural, respectful, practical and conversational.
Speak like a thoughtful friend helping an artisan, not like a call-center script.
Use short spoken turns, usually 1–2 sentences.
Do not narrate UI labels.
Ask only one useful question at a time.
Do not repeat the same greeting or script.
Understand mixed Hindi-English and the selected Indian language.
Reply in the user's selected language unless they clearly switch.

Your FIRST priority is the artisan's Add Product journey.

When the artisan says they want to add a product:
1. Open Add Product.
2. Ask for 2–3 clear product photos.
3. React naturally after photos.
4. Ask the artisan to tell the product story naturally.
5. Extract product name, craft, material, region, story and useful details from their speech.
6. Guide a 15–30 second making-proof video.
7. Review the collected information.
8. Give fair-price guidance when requested.
9. Ask for explicit confirmation before publishing.
Never invent orders, earnings, views, buyers, prices, ratings or other personal business data.
If real app data is provided in context, summarize that data naturally.

Return JSON only:
{
  "reply": "short spoken response",
  "action": "NONE | ADD_PRODUCT_START | ORDERS | PROFILE | CREATE_REEL | HOME",
  "language": "hi | en | mr | gu | pa | bn | ta | te | kn | ml | or | ur"
}
`;

function registerKarigarAIRoute(app) {
    app.post("/api/karigar-ai/chat", async (req, res) => {
        try {
            const apiKey = process.env.OPENAI_API_KEY;

            if (!apiKey) {
                return res.status(503).json({
                    error:"OPENAI_API_KEY is not configured"
                });
            }

            const body = req.body || {};

            const userPrompt = JSON.stringify({
                message: body.message || "",
                selectedLanguage: body.language || "hi-IN",
                role: body.role || "artisan",
                flow: body.flow || {},
                context: body.context || {}
            });

            const response = await fetch(
                "https://api.openai.com/v1/responses",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        "Authorization":"Bearer " + apiKey
                    },
                    body:JSON.stringify({
                        model:process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna",
                        input:[
                            {
                                role:"system",
                                content:KARIGAR_SYSTEM_PROMPT
                            },
                            {
                                role:"user",
                                content:userPrompt
                            }
                        ]
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                return res.status(502).json({
                    error:"OpenAI request failed",
                    details:errorText
                });
            }

            const data = await response.json();

            let text = "";

            if (data.output_text) {
                text = data.output_text;
            } else if (Array.isArray(data.output)) {
                for (const item of data.output) {
                    if (Array.isArray(item.content)) {
                        for (const part of item.content) {
                            if (part.text) text += part.text;
                        }
                    }
                }
            }

            text = String(text || "").trim();

            let parsed;

            try {
                parsed = JSON.parse(text);
            } catch (_) {
                parsed = {
                    reply:text || "I’m here. Tell me what you want to do.",
                    action:"NONE",
                    language:"en"
                };
            }

            return res.json(parsed);

        } catch (error) {
            return res.status(500).json({
                error:"Karigar AI server error",
                details:error.message
            });
        }
    });
}

module.exports = { registerKarigarAIRoute };
