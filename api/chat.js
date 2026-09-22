export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, language, image } = req.body || {};

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
         `You are Siri AI, a helpful learning assistant. Always answer in the selected language: ${
  language === "en"
    ? "English"
    : language === "hi"
    ? "Hindi"
    : "Kannada"
}. Give the answer first, then provide a detailed exam-oriented explanation. Include important years, dates, people, places, events and facts when relevant. Use this format: Answer: ... Explanation: ... Exam Points: ...`,
        input: image
  ? [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              message ||
              "ಈ image ಅನ್ನು ಓದಿ. ಅದರಲ್ಲಿರುವ ಪ್ರಶ್ನೆಗೆ ಸರಿಯಾದ ಉತ್ತರ ಮತ್ತು explanation ನೀಡಿ."
          },
          {
            type: "input_image",
            image_url: image
          }
        ]
      }
    ]
  : message
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

const imageRequest =
  /image|photo|picture|ಚಿತ್ರ|ಫೋಟೋ|ಚಿತ್ರ ತೋರಿಸಿ/i.test(message);

if (imageRequest) {
  try {
    const imageSearch = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(message)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&formatversion=2`
    );

    const imageData = await imageSearch.json();

    const pages = imageData.query?.pages || [];

    imageUrl =
      pages.find(page => page.thumbnail?.source)?.thumbnail?.source || null;
  } catch (error) {
    console.error("IMAGE SEARCH ERROR:", error);
    imageUrl = null;
  }
}    return res.status(200).json({ answer, imageUrl });
  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}
