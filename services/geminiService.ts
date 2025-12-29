import { GoogleGenAI } from "@google/genai";
import { Project, ProjectType } from "../types";

const getSystemPrompt = (project: Project) => `
You are a log generator engine. Your task is to generate realistic terminal output lines for a ${project.type} application starting up.
The command running is: "${project.command}".
The port is: ${project.port}.

Return ONLY raw text lines. Do not use Markdown blocks.
Include timestamps or standard log prefixes if typical for that stack (e.g., [INFO], [webpack]).
If the prompt asks for "startup", provide the first 5-10 lines of initialization.
If the prompt asks for "running", provide a "Server listening" or "Compiled successfully" message.
If the prompt asks for "error", provide a realistic stack trace or port conflict error.
`;

export const generateStartupLogs = async (project: Project): Promise<string[]> => {
  try {
    // In a real app, this would be a real process. Here we simulate realism with AI.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate startup logs for a ${project.type} project running on port ${project.port}.`,
      config: {
        systemInstruction: getSystemPrompt(project),
        maxOutputTokens: 200,
      }
    });

    const text = response.text || "Initializing process...";
    return text.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error("Gemini Log Gen Error", error);
    return [
      `> ${project.command}`,
      "Starting development server...",
      "Process initialized (Simulated Fallback)"
    ];
  }
};

export const generateRuntimeLog = async (project: Project, context: string): Promise<string> => {
    // Simulating random runtime logs
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate one single log line indicating a request was received or a background task finished for ${context}.`,
            config: {
              systemInstruction: "Keep it brief. One line only.",
              maxOutputTokens: 50,
            }
          });
          return response.text?.trim() || `[INFO] Request processed /api/v1/status 200 OK`;
    } catch (e) {
        return `[INFO] Keep-alive ping...`;
    }
};