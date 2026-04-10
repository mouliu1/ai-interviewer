import { forwardToBackend } from "@/lib/backend";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      sessionId: string;
    }>;
  },
) {
  const { sessionId } = await context.params;
  return forwardToBackend(`/api/v1/report/${sessionId}`);
}
