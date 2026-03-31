export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const msg = message.toLowerCase();

    let reply = "";

    if (msg.includes("rain") || msg.includes("weather")) {
      reply = "Rain risk is moderate today. Stay alert for automated disruption alerts.";
    } else if (msg.includes("earnings") || msg.includes("dna") || msg.includes("money")) {
      reply = "Your Income DNA indicates peak earnings during evening hours (5-9 PM).";
    } else if (msg.includes("claim") || msg.includes("payout")) {
      reply = "Claims are processed instantly after automated GPS and weather verification.";
    } else {
      reply = "I am your GigShield assistant. Ask me about weather risk, earnings, or claims.";
    }

    return Response.json({ reply });
  } catch (err) {
    return Response.json({ 
      reply: "I am your GigShield assistant. How can I help you today?" 
    });
  }
}
