import { NextResponse } from "next/server";

const DEFAULT_BACKEND_API_BASE_URL = "http://127.0.0.1:8000";

function getBackendBaseUrl() {
  return (process.env.BACKEND_API_BASE_URL ?? DEFAULT_BACKEND_API_BASE_URL).replace(/\/$/, "");
}

export async function forwardToBackend(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (isFormData) {
    headers.delete("content-type");
  } else if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  if (contentType?.startsWith("text/event-stream") && response.body) {
    const nextHeaders = new Headers();
    nextHeaders.set("content-type", contentType);
    nextHeaders.set("cache-control", "no-cache, no-transform");
    return new NextResponse(response.body, {
      status: response.status,
      headers: nextHeaders,
    });
  }

  const body = await response.text();
  const nextHeaders = new Headers();

  if (contentType) {
    nextHeaders.set("content-type", contentType);
  }

  return new NextResponse(body, {
    status: response.status,
    headers: nextHeaders,
  });
}
