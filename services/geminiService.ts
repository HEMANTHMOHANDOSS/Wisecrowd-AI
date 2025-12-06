import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Alert, CrowdMetric } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCrowdData = async (
  metrics: CrowdMetric[],
  alerts: Alert[]
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Prepare a summary of the data
    const recentMetrics = metrics.slice(-5);
    const activeAlerts = alerts.filter(a => !a.resolved);
    
    const prompt = `
      Act as a Senior Crowd Safety Officer and AI Risk Analyst. 
      Analyze the following real-time telemetry from an event venue.
      
      TELEMETRY (Last 5 mins):
      ${JSON.stringify(recentMetrics, null, 2)}
      
      ACTIVE ALERTS:
      ${JSON.stringify(activeAlerts, null, 2)}
      
      Task:
      1. Assess the current crowd crush risk level (Low/Medium/High/Critical).
      2. Identify specific bottlenecks or anomaly patterns (e.g., sudden flow drops, density spikes).
      3. Provide 3 prioritized tactical recommendations for security staff (e.g., "Open Exit Gate B", "Deploy stewards to Sector 4").
      
      Format your response as a professional tactical report using Markdown. Use bold headings.
      Include a "Predicted Risk Trend" section for the next 15 minutes.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate safety report.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating safety analysis. Please check API Key and connection.";
  }
};

export const analyzeSurveillanceImage = async (
  imageBase64: string,
  locationName: string
): Promise<string> => {
  try {
    const ai = getAiClient();

    const prompt = `
      Analyze this surveillance frame from ${locationName}.
      
      Identify:
      1. Approximate crowd density (Low/Medium/High).
      2. Direction of dominant flow.
      3. Potential hazards (blocked paths, fallen objects, aggressive behavior, overcrowding).
      4. Estimate the "Mood" of the crowd (Calm, Agitated, Joyful).
      
      Provide a concise JSON-like summary in plain text.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return "Error analyzing feed. Please try again.";
  }
};