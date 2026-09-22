import { handleUpload } from "@vercel/blob/client";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log("Blob upload completed:", blob.url);
      }
    });

    return response.status(200).json(jsonResponse);

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return response.status(400).json({
      error: error instanceof Error ? error.message : "Upload failed"
    });
  }
}
