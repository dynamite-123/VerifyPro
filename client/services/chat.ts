export async function chatQuery(query: string, top_k = 20) {
  const resp = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k }),
    credentials: 'include'
  });
  const data = await resp.json();

  // Prefer the top-level `answer` field. Fall back to nested shapes if present.
  const answer = data?.answer ?? data?.data?.answer ?? data?.data?.answer_text ?? null;

  // Return only the answer string (or an empty string when unavailable).
  return typeof answer === 'string' ? answer : '';
}
