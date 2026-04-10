import { forwardToBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.text();
  return forwardToBackend("/api/v1/interview/answer/stream", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
    },
  });
}
