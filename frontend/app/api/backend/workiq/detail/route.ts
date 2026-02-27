export async function POST(request: Request) {
  const body = await request.text();

  let backendRes: Response;
  try {
    backendRes = await fetch("http://localhost:3001/api/workiq/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Backend unreachable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const text = await backendRes.text();
  return new Response(text, {
    status: backendRes.status,
    headers: { "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json" },
  });
}
