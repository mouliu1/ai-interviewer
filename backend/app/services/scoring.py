WEIGHTS = {
    "technical_accuracy": 0.30,
    "relevance": 0.20,
    "depth": 0.20,
    "evidence": 0.15,
    "clarity": 0.15,
}


def weighted_score(scores: dict[str, int]) -> int:
    total = sum(scores[key] * WEIGHTS[key] for key in WEIGHTS)
    return round(total * 20)
