import { GoogleGenAI } from "@google/genai";
import { ProjectAsset, CodeState } from "../types";

// Initialize the Gemini API with the environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment variables.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODELS = {
  primary: "gemini-3-flash-preview",
  reasoning: "gemini-3.1-pro-preview",
};

export async function generateCode(prompt: string, currentCode: string | CodeState = "") {
  const codeContext = typeof currentCode === 'string' 
    ? currentCode 
    : `HTML:\n${currentCode.html}\n\nCSS:\n${currentCode.css}\n\nJS:\n${currentCode.js}\n\nReact:\n${currentCode.react}\n\nMarkdown:\n${currentCode.md}`;

  const response = await ai.models.generateContent({
    model: MODELS.primary,
    contents: [
      {
        role: "user",
        parts: [{ text: `You are an expert web developer. Generate high-quality HTML/CSS/JS code based on the following request. 
        Return ONLY the code, no markdown blocks, no explanations.
        
        Current Code Context:
        ${codeContext}
        
        Request:
        ${prompt}` }],
      },
    ],
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "";
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

  const textParts: any[] = [{ text: `You are an expert web developer. ${formatInstruction}
        Return ONLY the code, no markdown blocks, no explanations.
        
        Current Code Context:
        ${codeContext}
        ${assetContext}
        
        Request:
        ${prompt}` }];

  // Add image assets as parts if they are small enough or relevant
  // For now, let's just add the text context. 
  // If we wanted to add images:
  /*
  assets.filter(a => a.type.startsWith('image/')).forEach(a => {
    textParts.push({
      inlineData: {
        data: a.data.split(',')[1],
        mimeType: a.type
      }
    });
  });
  */

  const response = await ai.models.generateContentStream({
    model: MODELS.primary,
    contents: [
      {
        role: "user",
        parts: textParts,
      },
    ],
    config: {
      temperature: 0.7,
    }
  });

  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

export async function generateComponent(description: string) {
  const response = await ai.models.generateContent({
    model: MODELS.primary,
    contents: [
      {
        role: "user",
        parts: [{ text: `Generate a modern, responsive HTML component based on this description: "${description}".
        Use Tailwind CSS classes for styling. 
        Return ONLY the HTML code for the component. 
        Do not include <html>, <head>, or <body> tags. 
        Do not include markdown blocks.` }],
      },
    ],
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "";
}

export async function generateWordPressTheme(description: string) {
  const response = await ai.models.generateContent({
    model: MODELS.reasoning,
    contents: [
      {
        role: "user",
        parts: [{ text: `You are a WordPress expert. Generate a complete WordPress theme based on this description: "${description}".
        The output should be a single block of code containing the contents of:
        1. style.css (with theme header)
        2. index.php
        3. functions.php
        
        Use clear separators like "--- FILE: filename ---" between files.
        Use modern WordPress best practices and Tailwind CSS if applicable.
        Return ONLY the code, no explanations.` }],
      },
    ],
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "";
}

export async function generateWordPressPlugin(description: string) {
  const response = await ai.models.generateContent({
    model: MODELS.reasoning,
    contents: [
      {
        role: "user",
        parts: [{ text: `You are a WordPress expert. Generate a complete WordPress plugin based on this description: "${description}".
        The output should be a single block of code containing the main plugin file with header and all necessary logic.
        Return ONLY the code, no explanations.` }],
      },
    ],
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "";
}
