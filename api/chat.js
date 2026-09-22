export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, language, image, file, fileName } = req.body || {};

   if (
  (!message || typeof message !== "string") &&
  !image &&
  !file
) {
  return res.status(400).json({ error: "Message, image or file is required" });
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
2. Preserve every question number exactly as shown in the image.
3. Keep the original order of all questions.
4. Write the question number first, exactly as shown.
5. Write the complete question exactly as visible in the image.
6. Show A, B, C and D options only when they are actually visible.
7. Never invent missing options.
8. If options are not present, answer the question directly.
9. Give the correct answer clearly in natural text.
10. Give a useful explanation in natural text.
11. Include important exam facts when relevant.
12. Do not use labels or headings such as Question:, Options:, Answer:, Explanation:, or Exam Points:.
13. Do not summarize or shorten the question.
14. Keep all extracted text as normal selectable text.
15. If multiple questions are visible, answer each question separately while preserving its original number and order.

Example:

21. ಭಾರತೀಯ ... ?

A. ...
B. ...
C. ...
D. ...

ಸರಿಯಾದ ಉತ್ತರ: B. ...

ಇದರ ವಿವರಣೆ ...

22. ಮುಂದಿನ ಪ್ರಶ್ನೆ ... ?

ಸರಿಯಾದ ಉತ್ತರ: ...

ಇದರ ವಿವರಣೆ ...
`;
   let openAIFileId = null;

if (file) {
  const blobResponse = await fetch(file);

  if (!blobResponse.ok) {
    throw new Error("Uploaded file could not be downloaded from Blob.");
  }

  const arrayBuffer = await blobResponse.arrayBuffer();

  const formData = new FormData();
  formData.append("purpose", "user_data");
  formData.append(
    "file",
    new Blob([arrayBuffer]),
    fileName || "uploaded-file"
  );

  const fileUploadResponse = await fetch(
    "https://api.openai.com/v1/files",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    }
  );

  const fileUploadData = await fileUploadResponse.json();

  if (!fileUploadResponse.ok) {
    throw new Error(
      fileUploadData.error?.message || "OpenAI file upload failed."
    );
  }

  openAIFileId = fileUploadData.id;
}

const input = openAIFileId
  ? [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              message ||
              "ಈ document ಅನ್ನು ಓದಿ. ಅದರಲ್ಲಿರುವ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸರಿಯಾದ ಉತ್ತರ ಮತ್ತು ವಿವರಣೆ ನೀಡಿ."
          },
          {
            type: "input_file",
            file_id: openAIFileId
          }
        ]
      }
    ]
  : image
  ? [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              message ||
              "ಈ image ಅನ್ನು ಓದಿ. ಅದರಲ್ಲಿರುವ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸರಿಯಾದ ಉತ್ತರ ಮತ್ತು ವಿವರಣೆ ನೀಡಿ."
          },
          {
            type: "input_image",
            image_url: image
          }
        ]
      }
    ]
  : message;
    const response = await fetch("https://api.openai.com/v1/responses", {
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
