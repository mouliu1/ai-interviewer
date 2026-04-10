import { forwardToBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const formData = await request.formData();
  return forwardToBackend("/api/v1/prepare", {
    method: "POST",
    body: formData,
  });
}
