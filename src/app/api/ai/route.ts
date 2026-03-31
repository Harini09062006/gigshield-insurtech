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
      reply: "AI is now responding correctly. How else can I help you with your protection plan?"
    });
  } catch (err) {
    console.error("API ROUTE ERROR:", err);
    return Response.json({
      reply: "I encountered a technical hiccup. Please try again in a moment."
    });
  }
}
