export function getMockAIResponse(message: string) {
  const msg = message.toLowerCase();
  
  if (msg.includes('claim')) {
    return "To file a claim, go to 'My Claims' and fill out the form. AI will instantly calculate your payout based on your Income DNA.";
  }
  
  if (msg.includes('plan')) {
    return "I recommend the 'Pro Shield' for most active workers. It covers accidents and income replacement for only ₹25/week.";
  }
  
  if (msg.includes('earn') || msg.includes('income')) {
    return "Your Income DNA shows you earn most during morning hours. Try to work consistently between 8 AM and 11 AM to maximize protection benefits.";
  }
  
  if (msg.includes('risk')) {
    return "Your risk score is calculated based on income consistency. You can lower it by maintaining a regular work schedule.";
  }
  
  return "I'm here to help with GigShield. You can ask me about claims, insurance plans, or how to improve your Income DNA.";
}

export function getIncomeDNAInsight(dna: any) {
  if (!dna) return 'Complete your Income DNA profile to get personalized insights.';
  
  if (dna.risk_score > 70) {
    return `High risk detected (${dna.risk_score}/100). Consider upgrading to Elite Shield for maximum protection.`;
  }
  
  if (dna.consistency_score < 40) {
    return 'Your income is inconsistent. Try to maintain regular working hours to improve your score.';
  }
  
  return `Great consistency (${dna.consistency_score}/100)! Your avg hourly rate of ₹${dna.avg_hourly_income} qualifies you for Pro Shield benefits.`;
}
