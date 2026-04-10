export type SseEvent = {
  event: string;
  data: unknown;
};

export function parseSseChunk(chunk: string, remainder = ""): { events: SseEvent[]; remainder: string } {
  const combined = `${remainder}${chunk}`;
  const rawEvents = combined.split("\n\n");
  const nextRemainder = rawEvents.pop() ?? "";
  const events: SseEvent[] = [];

  for (const rawEvent of rawEvents) {
    const lines = rawEvent.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    if (!dataLines.length) {
      continue;
    }

    const payloadText = dataLines.join("\n");
    events.push({
      event: eventName,
      data: JSON.parse(payloadText),
    });
  }

  return {
    events,
    remainder: nextRemainder,
  };
}

export async function consumeSseStream(
  response: Response,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : `请求失败，状态码 ${response.status}。`;
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("流式响应不可用。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let remainder = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const parsed = parseSseChunk(decoder.decode(value, { stream: true }), remainder);
    remainder = parsed.remainder;
    for (const event of parsed.events) {
      await onEvent(event);
    }
  }

  const tail = parseSseChunk(decoder.decode(), remainder);
  for (const event of tail.events) {
    await onEvent(event);
  }
}
