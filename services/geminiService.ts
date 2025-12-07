import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LiturgyDay } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to decode audio
async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // The TTS output is raw PCM, usually mono
  // We need to convert int16 or whatever the model returns to float32 for AudioBuffer
  // However, the new API guidelines suggest using the raw data differently or that decodeAudioData handles it.
  // Actually, the example in guidelines shows specific manual decoding for PCM.
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const getDailyLiturgy = async (dateStr: string): Promise<LiturgyDay> => {
  const prompt = `
    Agis comme un expert en liturgie catholique francophone.
    Pour la date du ${dateStr}, fournis les textes de la messe selon le lectionnaire romain (traduction AELF si possible).
    
    Je veux impérativement:
    1. La première lecture
    2. Le Psaume
    3. L'Évangile (C'est le plus important)
    4. La couleur liturgique (green, red, white, purple, rose)
    5. Le nom du jour liturgique (ex: "Mardi de la 1ère semaine de l'Avent")
    
    Retourne uniquement du JSON valide respectant le schéma.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          liturgicalColor: { type: Type.STRING, enum: ["green", "red", "white", "purple", "rose"] },
          liturgicalDayName: { type: Type.STRING },
          firstReading: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              text: { type: Type.STRING, description: "Le texte complet de la lecture" }
            }
          },
          psalm: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              text: { type: Type.STRING }
            }
          },
          secondReading: {
             type: Type.OBJECT,
             properties: {
               title: { type: Type.STRING },
               reference: { type: Type.STRING },
               text: { type: Type.STRING }
             }
          },
          gospel: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              text: { type: Type.STRING, description: "Le texte complet de l'Évangile" }
            }
          }
        },
        required: ["date", "liturgicalColor", "liturgicalDayName", "gospel"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from AI");
  return JSON.parse(text) as LiturgyDay;
};

export const getReflection = async (gospelText: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Donne une courte méditation spirituelle (environ 150 mots) pour cet Évangile. Reste profond, inspirant et concret pour la vie quotidienne: \n\n${gospelText}`,
  });
  return response.text || "Pas de méditation disponible.";
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  // We use the specific TTS model
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // A gentle female voice fits well, or Charcoal/Puck
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio generated");
  }

  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  return await decodeAudioData(base64Audio, outputAudioContext, 24000);
};
