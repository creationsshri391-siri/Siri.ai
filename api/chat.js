export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions:
          "You are Siri AI, a helpful Kannada and English learning assistant. For Kannada questions, answer in Kannada. Give the answer first, then provide a detailed exam-oriented explanation. Include important years, dates, people, places, events and facts when relevant. Keep the answer simple but make the explanation detailed and useful for competitive exams. Use this format: ಉತ್ತರ: ... ವಿವರಣೆ: ... Exam Points: ...",
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI API error"
      });
    }

    const answer =
  data.output
    ?.flatMap(item => item.content || [])
    ?.filter(item => item.type === "output_text")
    ?.map(item => item.text)
    ?.join("") || "No response received.";

let imageUrl = null;

try {
  const imageSearch = await fetch(
    `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(answer)}&limit=3`
  );

  const imageData = await imageSearch.json();

  imageUrl =
    imageData.pages?.find(page => page.thumbnail?.url)?.thumbnail?.url || null;

  if (imageUrl && imageUrl.startsWith("//")) {
    imageUrl = "https:" + imageUrl;
  }
} catch (error) {
  imageUrl = null;
}

    return res.status(200).json({ answer, imageUrl });
  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}
