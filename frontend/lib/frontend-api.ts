import type {
  FinishInterviewResponse,
  PrepareResponse,
  ReportResponse,
  StartInterviewPayload,
  StartInterviewResponse,
  TurnSummary,
} from "@/lib/types";
import { formatBackendError } from "@/lib/copy";
import { consumeSseStream, type SseEvent } from "@/lib/streaming";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : `请求失败，状态码 ${response.status}。`;
    throw new Error(formatBackendError(detail));
  }

  return payload as T;
}

export async function prepareInterview(formData: FormData): Promise<PrepareResponse> {
  const response = await fetch("/api/prepare", {
    method: "POST",
    body: formData,
  });
  return parseResponse<PrepareResponse>(response);
}

export async function startInterview(payload: StartInterviewPayload): Promise<StartInterviewResponse> {
  const response = await fetch("/api/interview/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<StartInterviewResponse>(response);
}

export async function answerInterview(sessionId: string, answerText: string): Promise<TurnSummary> {
  const response = await fetch("/api/interview/answer", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      answer_text: answerText,
    }),
  });
  return parseResponse<TurnSummary>(response);
}

export async function finishInterview(sessionId: string): Promise<FinishInterviewResponse> {
  const response = await fetch("/api/interview/finish", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });
  return parseResponse<FinishInterviewResponse>(response);
}

export async function getReport(sessionId: string): Promise<ReportResponse> {
  const response = await fetch(`/api/report/${sessionId}`, {
    cache: "no-store",
  });
  return parseResponse<ReportResponse>(response);
}

async function consumeFormattedStream(
  response: Response,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  try {
    await consumeSseStream(response, async (event) => {
      if (event.event === "error" && event.data && typeof event.data === "object" && "message" in event.data) {
        throw new Error(formatBackendError(String(event.data.message)));
      }
      await onEvent(event);
    });
  } catch (error) {
    throw new Error(formatBackendError(error instanceof Error ? error.message : "流式请求失败。"));
  }
}

export async function streamPrepareInterview(
  formData: FormData,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch("/api/prepare/stream", {
    method: "POST",
    body: formData,
  });
  await consumeFormattedStream(response, onEvent);
}

export async function streamStartInterview(
  payload: StartInterviewPayload,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch("/api/interview/start/stream", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  await consumeFormattedStream(response, onEvent);
}

export async function streamAnswerInterview(
  sessionId: string,
  answerText: string,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch("/api/interview/answer/stream", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      answer_text: answerText,
    }),
  });
  await consumeFormattedStream(response, onEvent);
}

export async function streamFinishInterview(
  sessionId: string,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch("/api/interview/finish/stream", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });
  await consumeFormattedStream(response, onEvent);
}
