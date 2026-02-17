import { GoogleGenAI } from "@google/genai";
import { Task } from '../types';
import { formatDurationHuman } from '../utils';

export const generateProductivityInsight = async (tasks: Task[], period: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data summary for the AI
  const summary = tasks.map(t => {
    const totalTime = t.sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return `${t.title}: ${formatDurationHuman(totalTime)}`;
  }).join(', ');

  const prompt = `
    I am tracking my time using a task manager. 
    Here is my data summary for the period: ${period}.
    Data: [${summary}]
    
    Please provide a concise, motivating productivity analysis in markdown.
    1. Highlight my biggest focus area.
    2. Give me one suggestion to improve balance if needed.
    3. Keep it under 100 words.
    4. Use a friendly tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate insight at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while fetching insights.";
  }
};