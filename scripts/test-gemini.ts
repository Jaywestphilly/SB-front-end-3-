import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const symUpper = 'AAPL';
  const prompt = `Search for the current live stock price for ticker symbol ${symUpper}. Return ONLY a valid JSON object with: symbol (string), name (string), price (number), change (number, price change in dollars from yesterday's close), changePercent (number), high52 (number), low52 (number), and volume (string, like "15.2M" or "1.5B"). Do not include any other text, markdown formatting, or comments. Example output: {"symbol":"AAPL","name":"Apple Inc.","price":150.25,"change":1.5,"changePercent":1.0,"high52":180.0,"low52":120.0,"volume":"50.1M"}`;
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          temperature: 0.1
        }
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}
test();
