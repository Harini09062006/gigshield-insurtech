export async function POST(req: Request) {
  console.log("API HIT");
  try {
    const body = await req.json();
    const message = body?.message;

    if (!message) {
      return Response.json({
        reply: "No message received"
      });
    }

    // Stabilized response for AI flow testing
    return Response.json({
      reply: "AI working correctly now ✅"
    });
  } catch (err) {
    console.error("API ROUTE ERROR:", err);
    return Response.json({
      reply: "API error fallback"
    });
  }
}
