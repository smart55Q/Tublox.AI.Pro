
import { GoogleGenAI } from "@google/genai";
import { Message, Source } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export type ModelType = 'gemini-3-pro-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async streamMessage(
    messages: Message[], 
    onChunk: (chunk: string) => void,
    onComplete?: (sources: Source[]) => void
  ): Promise<void> {
    const responseStream = await this.ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
      },
    });

    let groundingSources: Source[] = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) onChunk(text);

      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        metadata.groundingChunks.forEach((c: any) => {
          if (c.web) {
            groundingSources.push({
              title: c.web.title || 'Reference',
              uri: c.web.uri
            });
          }
        });
      }
    }

    if (onComplete) {
      const uniqueSources = Array.from(new Map(groundingSources.map(s => [s.uri, s])).values());
      onComplete(uniqueSources);
    }
  }
}

export const geminiService = new GeminiService();
