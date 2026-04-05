def retrieve_topics(topics: list[dict], query_terms: list[str], top_k: int = 2) -> list[dict]:
    query = {term.lower() for term in query_terms}
    scored = []
    for topic in topics:
        overlap = len(query & {keyword.lower() for keyword in topic["keywords"]})
        scored.append((overlap, topic))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [topic for score, topic in scored[:top_k] if score > 0]
