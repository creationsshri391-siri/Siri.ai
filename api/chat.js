export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, language, image } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const selectedLanguage =
      language === "en"
        ? "English"
        : language === "hi"
        ? "Hindi"
        : "Kannada";

    const instructions = `
You are Siri AI, a helpful learning assistant.

Always answer in ${selectedLanguage}.

When an image is provided:
1. Carefully read the image.
2. For every question visible in the image, extract the complete question exactly as shown.
3. Extract A, B, C and D options only when they are actually visible in the image.
4. If no options are visible, answer the question directly using the image and your knowledge.
5. Show the extracted Question and Options as plain selectable text so they can be copied and pasted.
6. Give the correct Answer, followed by a detailed Explanation and Exam Points when relevant.

Use this format:

Question:
[question from image]

Options:
A. ...
B. ...
C. ...
D. ...

Answer:
...

Explanation:
...

Exam Points:
...

The Question and Options must be plain text so the user can select, copy and paste them.
`;

    const input = image
      ? [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: message
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      : message;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions,
          input
        })
      }
    );

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

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}
