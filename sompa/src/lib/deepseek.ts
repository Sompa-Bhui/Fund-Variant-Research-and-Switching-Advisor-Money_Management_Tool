import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

export const deepseek = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com',
  dangerouslyAllowBrowser: true
});
