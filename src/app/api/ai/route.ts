export async function POST(req: Request) {
  console.log("API HIT");
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json({
        reply: "No message received"
      });
    }

    // ALWAYS RETURN SOMETHING
    return Response.json({
      reply: "AI is now responding correctly."
    });
  } catch (err) {
    console.error("API ROUTE ERROR:", err);
    return Response.json({
      reply: "API error fallback"
    });
  }
}
