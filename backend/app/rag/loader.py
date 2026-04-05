import json
from pathlib import Path


def load_topics(path: Path) -> list[dict]:
    return json.loads(path.read_text())
