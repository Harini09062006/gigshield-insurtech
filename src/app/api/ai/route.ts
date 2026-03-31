export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json({
        reply: "No message received"
      });
    }

    // GUARANTEED RESPONSE FOR INITIAL TESTING
    return Response.json({
      reply: "Hello! I am your GigShield Assistant. This is a stabilized API response ensuring our connection is working perfectly."
    });
  } catch (err) {
    console.error("API ROUTE ERROR:", err);
    return Response.json({
      reply: "The AI service encountered an internal error. Please try again shortly."
    });
  }
}
