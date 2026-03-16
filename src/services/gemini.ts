import { GoogleGenAI } from "@google/genai";
import { ProjectAsset, CodeState, AIModel } from "../types";

// Initialize the Gemini API with the environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment variables.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const getActiveModel = (): AIModel => {
  const saved = localStorage.getItem('ai_models');
  const activeId = localStorage.getItem('active_ai_model') || "gemini-3-flash-preview";
  if (saved) {
    try {
      const models = JSON.parse(saved);
      const active = models.find((m: AIModel) => m.id === activeId);
      if (active) return active;
    } catch (e) {}
  }
  return {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'gemini',
    description: 'Fast and versatile multimodal model for general tasks.',
    contextWindow: 1000000,
    downloaded: true,
  };
};

async function generateWithProvider(prompt: string, model: AIModel, systemInstruction?: string): Promise<string> {
  if (model.provider === 'gemini') {
    const response = await ai.models.generateContent({
      model: model.id,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "";
  }

  // Generic OpenAI-compatible endpoint fallback
  const baseUrl = model.baseUrl || (model.provider === 'openai' ? 'https://api.openai.com/v1' : 
                  model.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 
                  model.provider === 'ollama' ? 'http://localhost:11434/v1' : '');
  
  if (!baseUrl) {
    throw new Error(`Provider ${model.provider} not fully supported without a base URL.`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  } else if (model.provider !== 'ollama') {
    throw new Error(`API key required for ${model.provider}. Please configure it in settings.`);
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature: 0.7,
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function generateCode(prompt: string, currentCode: string | CodeState = "") {
  const codeContext = typeof currentCode === 'string' 
    ? currentCode 
    : `HTML:\n${currentCode.html}\n\nCSS:\n${currentCode.css}\n\nJS:\n${currentCode.js}\n\nReact:\n${currentCode.react}\n\nMarkdown:\n${currentCode.md}`;

  const model = getActiveModel();
  const systemInstruction = `You are an expert web developer. Generate high-quality HTML/CSS/JS code based on the following request. 
        Return ONLY the code, no markdown blocks, no explanations.
        
        Current Code Context:
        ${codeContext}`;

  return generateWithProvider(prompt, model, systemInstruction);
}

async function* generateStreamWithProvider(prompt: string, model: AIModel, systemInstruction?: string): AsyncGenerator<string, void, unknown> {
  if (model.provider === 'gemini') {
    const response = await ai.models.generateContentStream({
      model: model.id,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    for await (const chunk of response) {
      yield chunk.text || "";
    }
    return;
  }

  // Generic OpenAI-compatible endpoint fallback
  const baseUrl = model.baseUrl || (model.provider === 'openai' ? 'https://api.openai.com/v1' : 
                  model.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 
                  model.provider === 'ollama' ? 'http://localhost:11434/v1' : '');
  
  if (!baseUrl) {
    throw new Error(`Provider ${model.provider} not fully supported without a base URL.`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  } else if (model.provider !== 'ollama') {
    throw new Error(`API key required for ${model.provider}. Please configure it in settings.`);
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature: 0.7,
      stream: true,
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error: ${err}`);
  }

  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices?.[0]?.delta?.content) {
            yield data.choices[0].delta.content;
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
}

export async function* generateCodeStream(
  prompt: string, 
  currentCode: string | CodeState = "", 
  language: string = "all", 
  assets: ProjectAsset[] = [],
  format: string = "auto"
) {
  let formatInstruction = "";
  switch (format) {
    case "page":
      formatInstruction = language === "php"
        ? "Generate a complete, self-contained PHP page."
        : language === "md"
        ? "Generate a complete Markdown document."
        : "Generate a complete, self-contained HTML page including <head> and <body> tags.";
      break;
    case "component":
      formatInstruction = language === "react"
        ? "Generate a reusable React component snippet. Do not include markdown blocks."
        : "Generate a reusable UI component snippet (HTML/Tailwind). Do not include <html> or <body> tags.";
      break;
    case "function":
      formatInstruction = language === "php"
        ? "Generate a specific PHP function or logic block."
        : "Generate a specific JavaScript/TypeScript function or logic block.";
      break;
    case "snippet":
      formatInstruction = "Generate a code snippet for the specified language.";
      break;
    default:
      formatInstruction = language === "all" 
        ? "Generate high-quality HTML/CSS/JS code." 
        : `Generate ONLY the ${language.toUpperCase()} code.`;
  }

  const codeContext = typeof currentCode === 'string' 
    ? currentCode 
    : `HTML:\n${currentCode.html}\n\nCSS:\n${currentCode.css}\n\nJS:\n${currentCode.js}\n\nReact:\n${currentCode.react}\n\nMarkdown:\n${currentCode.md}`;

  const assetContext = assets.length > 0 
    ? `\n\nAvailable Project Assets:\n${assets.map(a => `- ${a.name} (${a.type}, ${a.size} bytes)`).join('\n')}`
    : "";

  const systemInstruction = `You are an expert web developer. ${formatInstruction}
        Return ONLY the code, no markdown blocks, no explanations.
        
        Current Code Context:
        ${codeContext}
        ${assetContext}`;

  const model = getActiveModel();
  yield* generateStreamWithProvider(prompt, model, systemInstruction);
}

export async function generateComponent(description: string) {
  const model = getActiveModel();
  const systemInstruction = `Generate a modern, responsive HTML component based on this description. Use Tailwind CSS classes for styling. Return ONLY the HTML code for the component. Do not include <html>, <head>, or <body> tags. Do not include markdown blocks.`;
  return generateWithProvider(description, model, systemInstruction);
}

export async function generateWordPressTheme(description: string) {
  const model = getActiveModel();
  const systemInstruction = `You are a WordPress expert. Generate a complete WordPress theme based on this description. The output should be a single block of code containing the contents of: 1. style.css (with theme header) 2. index.php 3. functions.php. Use clear separators like "--- FILE: filename ---" between files. Use modern WordPress best practices and Tailwind CSS if applicable. Return ONLY the code, no explanations.`;
  return generateWithProvider(description, model, systemInstruction);
}

export async function generateWordPressPlugin(description: string) {
  const model = getActiveModel();
  const systemInstruction = `You are a WordPress expert. Generate a complete WordPress plugin based on this description. The output should be a single block of code containing the main plugin file with header and all necessary logic. Return ONLY the code, no explanations.`;
  return generateWithProvider(description, model, systemInstruction);
}
