import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Since we are in a demo/prototype phase
});
