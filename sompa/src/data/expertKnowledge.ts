export const expertResponses: Record<string, string> = {
  "default": "That's a great question about mutual funds! In general, switching to a Direct plan can save you 0.5% to 1.5% in annual commissions, which significantly boosts your long-term wealth through compounding. Would you like me to analyze a specific fund for you?",
  "direct vs regular": "Regular plans include a distributor commission (usually 1%), which is paid out of your investment every year. Direct plans have no such commission, meaning more of your money stays invested and grows. Over 20 years, this can mean a difference of lakhs of rupees!",
  "expense ratio": "The Expense Ratio is the annual fee charged by the AMC to manage your fund. It includes management fees, administrative costs, and in Regular plans, distributor commissions. Lower is almost always better for your returns.",
  "sharpe ratio": "The Sharpe Ratio measures risk-adjusted return. A higher Sharpe ratio (above 1.0) indicates that the fund is giving you better returns for the amount of risk it is taking. It's a key metric for savvy investors.",
  "overlap": "Portfolio overlap happens when you own multiple funds that hold the same stocks. This reduces diversification and increases risk. Ideally, your overlap between two funds should be below 30%.",
  "tax": "When you switch from Regular to Direct, it is considered a 'Redemption' and 'Re-investment'. You may have to pay Capital Gains Tax (LTCG at 10% or STCG at 15%) and Exit Load (usually 1%) if you've held the units for less than a year."
};

export const getFallbackResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('direct') || lowerMsg.includes('regular')) return expertResponses["direct vs regular"];
  if (lowerMsg.includes('expense')) return expertResponses["expense ratio"];
  if (lowerMsg.includes('sharpe')) return expertResponses["sharpe ratio"];
  if (lowerMsg.includes('overlap')) return expertResponses["overlap"];
  if (lowerMsg.includes('tax')) return expertResponses["tax"];
  return expertResponses["default"];
};
