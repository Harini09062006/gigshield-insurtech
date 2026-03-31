/**
 * @fileOverview A modular, rule-based chatbot service for the GigShield Support system.
 * Handles categorization, random response variations, and escalation triggers.
 */

type BotResult = {
  botResponse: string;
  needsEscalation: boolean;
};

const RESPONSES = {
  GREETING: [
    "Hi there! I'm your GigShield assistant. How can I help you today?",
    "Hello! I'm ready to help you with your protection plan. What's on your mind?",
    "Hey! Hope your deliveries are going well. How can I assist you with your coverage?"
  ],
  WEATHER: [
    "I'm monitoring the skies! Your coverage automatically protects you during severe weather triggers.",
    "The weather forecast is updated every few minutes. You can check the 'Heatmap' for live disruption zones.",
    "If heavy rain or extreme pollution affects your earnings, our parametric system will process your claim instantly."
  ],
  DNA: [
    "Your Income DNA is used to calculate your payouts accurately based on when you earn most. Your current peak is Evening (5-9 PM).",
    "Income DNA ensures you get paid more during your busiest hours. It currently shows a 1.3x multiplier for your evening shifts."
  ],
  PAYMENT_CLAIM: [
    "I understand you're having an issue with a payment or claim. I'm connecting you to our priority support team right now for manual review.",
    "I've detected a concern regarding your funds. I am escalating this to a human administrator immediately. Please stay online.",
    "I've flagged this payment query for immediate admin attention. A support member will be with you shortly."
  ],
  HELP: [
    "You can ask me about 'weather risk', 'claim status', or 'how to upgrade your plan'. What do you need?",
    "I can help you understand your protection limits or check current city risk. Just let me know!",
    "I'm here to ensure your income stays protected. Need help navigating your dashboard?"
  ],
  FALLBACK: [
    "I'm not quite sure I understand '{{input}}'. Could you rephrase that? You can ask about weather, claims, or your plan.",
    "I'm still learning! Regarding '{{input}}', I've noted it for our team. Would you like to talk to a human agent?",
    "I specialize in GigShield protection. Can we talk about your weather coverage or recent claims?"
  ]
};

/**
 * Analyzes user input and returns a structured bot response.
 * @param input The user's message text.
 * @param userName Optional name to personalize greetings.
 */
export function getBotResponse(input: string, userName?: string): BotResult {
  try {
    const text = (input || "").toLowerCase();
    let category: keyof typeof RESPONSES = 'FALLBACK';
    let needsEscalation = false;

    // 1. Check for Greetings
    if (text.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
      category = 'GREETING';
    } 
    // 2. Check for DNA/Earnings
    else if (text.match(/\b(dna|earnings|peak|multiplier|income|working hours)\b/)) {
      category = 'DNA';
    }
    // 3. Check for Weather Queries
    else if (text.match(/\b(rain|weather|forecast|storm|flood|pollution|aqi|risk|heat)\b/)) {
      category = 'WEATHER';
    } 
    // 4. Check for Payment/Claim Issues (Triggers Escalation)
    else if (text.match(/\b(payment|claim|money|payout|not received|issue|error|failed|rejected|delayed|refund)\b/)) {
      category = 'PAYMENT_CLAIM';
      needsEscalation = true;
    } 
    // 5. Check for General Help
    else if (text.match(/\b(help|support|assist|info|how to|manual|guide)\b/)) {
      category = 'HELP';
    }

    const responses = RESPONSES[category];
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Replace placeholders
    if (category === 'FALLBACK') {
      response = response.replace('{{input}}', input || "this");
    }

    if (userName && category === 'GREETING') {
      response = response.replace('there', userName.split(' ')[0]);
    }

    // Final safety check
    if (!response) {
      return {
        botResponse: "I'm listening. How can I help you with GigShield?",
        needsEscalation: false
      };
    }

    return {
      botResponse: response,
      needsEscalation
    };
  } catch (error) {
    console.error("[Bot Service] Logic error:", error);
    return {
      botResponse: "I encountered a small hiccup. What were we talking about?",
      needsEscalation: false
    };
  }
}
