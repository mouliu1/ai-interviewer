import json
from collections.abc import Iterable


def encode_sse(event: str, data: object) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def encode_sse_stream(events: Iterable[dict]) -> Iterable[str]:
    for item in events:
        yield encode_sse(item["event"], item["data"])
