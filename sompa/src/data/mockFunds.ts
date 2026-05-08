export interface Fund {
  id: string;
  name: string;
  category: string;
  variant: 'Direct' | 'Regular';
  expenseRatio: number;
  nav: number;
  cagr: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  metrics: {
    sharpeRatio: number;
    volatility: number;
    drawdown: number;
    aum: number; // In Crores
    trackingError?: number;
    portfolioOverlap?: number;
    healthScore: number;
  };
  benchmark: string;
  exposure: { sector: string, weight: number }[];
  exitLoad: string;
  taxImplications: string;
}

export const mockFunds: Fund[] = [
  {
    id: '1',
    name: 'Parag Parikh Flexi Cap Fund - Direct Plan',
    category: 'Flexi Cap',
    variant: 'Direct',
    expenseRatio: 0.62,
    nav: 72.45,
    cagr: { oneYear: 32.4, threeYear: 24.1, fiveYear: 21.8 },
    metrics: {
      sharpeRatio: 1.85,
      volatility: 12.4,
      drawdown: -8.2,
      aum: 65420,
      healthScore: 92
    },
    benchmark: 'NIFTY 500 TRI',
    exposure: [
      { sector: 'Financial Services', weight: 28.4 },
      { sector: 'Technology', weight: 15.2 },
      { sector: 'Consumer Discretionary', weight: 12.8 }
    ],
    exitLoad: '2% if redeemed within 365 days, 1% if between 366-730 days',
    taxImplications: 'Long Term Capital Gain (LTCG) tax of 10% on gains exceeding ₹1.25 lakh.'
  },
  {
    id: '1-reg',
    name: 'Parag Parikh Flexi Cap Fund - Regular Plan',
    category: 'Flexi Cap',
    variant: 'Regular',
    expenseRatio: 1.48,
    nav: 68.12,
    cagr: { oneYear: 31.2, threeYear: 22.9, fiveYear: 20.6 },
    metrics: {
      sharpeRatio: 1.62,
      volatility: 12.5,
      drawdown: -8.5,
      aum: 65420,
      healthScore: 78
    },
    benchmark: 'NIFTY 500 TRI',
    exposure: [
      { sector: 'Financial Services', weight: 28.4 },
      { sector: 'Technology', weight: 15.2 },
      { sector: 'Consumer Discretionary', weight: 12.8 }
    ],
    exitLoad: '2% if redeemed within 365 days, 1% if between 366-730 days',
    taxImplications: 'Long Term Capital Gain (LTCG) tax of 10% on gains exceeding ₹1.25 lakh.'
  },
  {
    id: '2',
    name: 'UTI Nifty 50 Index Fund - Direct Plan',
    category: 'Index Fund',
    variant: 'Direct',
    expenseRatio: 0.21,
    nav: 154.23,
    cagr: { oneYear: 26.5, threeYear: 15.4, fiveYear: 14.2 },
    metrics: {
      sharpeRatio: 1.45,
      volatility: 14.2,
      drawdown: -12.4,
      aum: 18240,
      trackingError: 0.03,
      healthScore: 95
    },
    benchmark: 'NIFTY 50 TRI',
    exposure: [
      { sector: 'Financial Services', weight: 35.2 },
      { sector: 'IT', weight: 14.1 },
      { sector: 'Energy', weight: 12.5 }
    ],
    exitLoad: 'Nil',
    taxImplications: 'LTCG tax of 10% on gains exceeding ₹1.25 lakh.'
  },
  {
    id: '2-reg',
    name: 'UTI Nifty 50 Index Fund - Regular Plan',
    category: 'Index Fund',
    variant: 'Regular',
    expenseRatio: 0.85,
    nav: 148.90,
    cagr: { oneYear: 25.7, threeYear: 14.6, fiveYear: 13.4 },
    metrics: {
      sharpeRatio: 1.25,
      volatility: 14.3,
      drawdown: -12.8,
      aum: 18240,
      trackingError: 0.05,
      healthScore: 82
    },
    benchmark: 'NIFTY 50 TRI',
    exposure: [
      { sector: 'Financial Services', weight: 35.2 },
      { sector: 'IT', weight: 14.1 },
      { sector: 'Energy', weight: 12.5 }
    ],
    exitLoad: 'Nil',
    taxImplications: 'LTCG tax of 10% on gains exceeding ₹1.25 lakh.'
  },
  {
    id: '3',
    name: 'Quant Small Cap Fund - Direct Plan',
    category: 'Small Cap',
    variant: 'Direct',
    expenseRatio: 0.77,
    nav: 245.60,
    cagr: { oneYear: 58.2, threeYear: 38.5, fiveYear: 34.2 },
    metrics: {
      sharpeRatio: 2.15,
      volatility: 18.4,
      drawdown: -15.2,
      aum: 22400,
      healthScore: 94
    },
    benchmark: 'NIFTY Smallcap 250 TRI',
    exposure: [
      { sector: 'Healthcare', weight: 18.5 },
      { sector: 'Chemicals', weight: 16.2 },
      { sector: 'Consumer Goods', weight: 14.8 }
    ],
    exitLoad: '1% if redeemed within 1 year',
    taxImplications: 'LTCG tax of 10% on gains exceeding ₹1.25 lakh.'
  }
];
