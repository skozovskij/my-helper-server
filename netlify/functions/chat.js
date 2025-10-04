export async function handler(event) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://skozovskij.github.io"
  ];

  const origin = event.headers.origin;
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    const token = process.env.HF_API_KEY;

    const body = {
      inputs: `<s>[INST] ${message} [/INST]`,
      parameters: { max_new_tokens: 200, temperature: 0.7 },
    };

    const apiRes = await fetch(
      "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await apiRes.json();

    if (data.error) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: data.error }),
      };
    }

    let reply = "⚠️ Неможливо згенерувати відповідь";
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text.replace(/<s>|\[INST\]|\[\/INST\]/g, "").trim();
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
