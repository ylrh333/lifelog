
import { GoogleGenAI, Type } from "@google/genai";
import { Memory, MediaType, AIAnalysis, GraphData, UserModelConfig, Language } from '../types';

// --- Helper: Get Client based on Model ---
const getAIClient = (modelId: string, userConfigs: UserModelConfig[]) => {
  const config = userConfigs.find(c => c.modelId === modelId);
  const apiKey = config?.apiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error(`Please configure API Key for ${modelId}`);
  }

  if (modelId.includes('gemini')) {
    return { type: 'google', client: new GoogleGenAI({ apiKey }) };
  } else {
    return { type: 'other', apiKey, baseUrl: config?.baseUrl };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Analyze Single Memory ---
export const analyzeMemory = async (
  memory: Memory, 
  targetModelId: string,
  userConfigs: UserModelConfig[],
  language: Language = 'zh'
): Promise<AIAnalysis> => {
  
  const { type, client, apiKey, baseUrl } = getAIClient(targetModelId, userConfigs);
  
  if (type === 'other') {
      console.log(`Simulating call to ${targetModelId} with key ${apiKey?.substring(0, 4)}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
          mood: "Simulated",
          summary: `(By ${targetModelId}) Analysis simulation. Language: ${language}`,
          tags: ["Simulation", targetModelId, language],
          color: "#888888",
          analyzedByModel: targetModelId
      };
  }

  // Google Gemini Implementation
  const ai = (client as GoogleGenAI);
  
  const langInstruction = language === 'zh' ? "Use Chinese (Simplified)." : "Use English.";
  let prompt = `Analyze this memory. ${langInstruction} Keep it philosophical and concise. Output pure JSON.`;
  const parts: any[] = [];

  if (memory.mediaBlob) {
    const base64Data = await blobToBase64(memory.mediaBlob);
    parts.push({
      inlineData: {
        mimeType: memory.mediaBlob.type,
        data: base64Data
      }
    });
  }

  // Always include text content if present
  if (memory.content) {
    parts.push({ text: `User Note: ${memory.content}` });
  } else if (memory.mediaType === MediaType.AUDIO) {
      parts.push({ text: "Analyze this audio content." });
  }

  if (parts.length === 0) throw new Error("Empty memory");

  const response = await ai.models.generateContent({
    model: targetModelId, 
    contents: {
      role: 'user',
      parts: [ ...parts, { text: prompt } ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          summary: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          color: { type: Type.STRING }
        },
        required: ["mood", "summary", "tags", "color"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response");

  try {
    const res = JSON.parse(text) as AIAnalysis;
    res.analyzedByModel = targetModelId;
    return res;
  } catch (e) {
    return {
      mood: "Reflective",
      summary: language === 'zh' ? "记录下这一刻。" : "Recording this moment.",
      tags: ["Life"],
      color: "#E5E7EB",
      analyzedByModel: targetModelId
    };
  }
};

// --- Life Coach Chat ---
export const askLifeCoach = async (
    query: string, 
    memories: Memory[], 
    userConfigs: UserModelConfig[],
    targetModelId: string
): Promise<string> => {
  
  const { type, client } = getAIClient(targetModelId, userConfigs);

  if (type === 'other') {
      // Simulation for non-Gemini models (since we don't have real backends for them in this demo)
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `[Simulation] (${targetModelId}) I am processing your request about "${query}". To enable real responses for this model, please integrate the provider's SDK.`;
  }

  const ai = (client as GoogleGenAI);

  const memoryContext = memories
    .filter(m => m.content || m.aiAnalysis)
    .map(m => {
        const date = new Date(m.createdAt).toLocaleDateString();
        const analysis = m.aiAnalysis ? `[Summary: ${m.aiAnalysis.summary}, Tags: ${m.aiAnalysis.tags.join(',')}]` : '';
        const content = m.content ? `"${m.content}"` : '[Media]';
        return `[ID:${m.id}] - ${date}: ${content} ${analysis}`;
    })
    .join('\n');

  const systemPrompt = `
    You are "LifeLog". Answer based on the user's memories.
    Cite memories using [[ID:memory-id]].
    Language: Detect from user query (Chinese or English).
    Context:
    ${memoryContext}
  `;

  const response = await ai.models.generateContent({
    model: targetModelId,
    contents: [{ role: 'user', parts: [{ text: query }] }],
    config: { systemInstruction: systemPrompt }
  });

  return response.text || "...";
};

// --- Knowledge Graph Generator ---
export const generateGraphData = async (
    memories: Memory[],
    userConfigs: UserModelConfig[],
    targetModelId: string
): Promise<GraphData> => {
  
  const { type, client } = getAIClient(targetModelId, userConfigs);

  if (type === 'other') {
      return { nodes: [], links: [] };
  }

  const ai = (client as GoogleGenAI);
  const metadata = memories.map(m => ({
    id: m.id,
    summary: m.aiAnalysis?.summary || m.content || "Media",
    tags: m.aiAnalysis?.tags || []
  }));

  const prompt = `
    Analyze the relationships between these memory nodes.
    Return a JSON object with 'nodes' (use original IDs) and 'links'.
    Nodes should have a 'group' (a theme name) and 'val' (importance 1-5).
    Links should connect related memories and have a short 'reason'.
    Input Data: ${JSON.stringify(metadata)}
  `;

  const response = await ai.models.generateContent({
    model: targetModelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
         type: Type.OBJECT,
         properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        group: { type: Type.STRING },
                        val: { type: Type.NUMBER }
                    }
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    }
                }
            }
         }
      }
    }
  });

  const text = response.text;
  if (!text) return { nodes: [], links: [] };
  return JSON.parse(text) as GraphData;
};
