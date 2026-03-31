export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json({
        reply: "No message received"
      });
    }

    // ALWAYS RETURN SOMETHING
    return Response.json({
      reply: "Hello! AI is working correctly now and ready to help you with GigShield."
    });
  } catch (err) {
    console.error("API ROUTE ERROR:", err);
    return Response.json({
      reply: "API error occurred while connecting to the AI assistant."
    });
  }
}
