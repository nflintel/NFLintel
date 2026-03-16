import { useState, useEffect } from 'react';
import { AIModel, AIProvider } from '../types';

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'gemini',
    description: 'Fast and versatile multimodal model for general tasks.',
    contextWindow: 1000000,
    downloaded: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    description: 'Advanced reasoning and coding capabilities.',
    contextWindow: 2000000,
    downloaded: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s flagship model for complex tasks.',
    contextWindow: 128000,
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic\'s most intelligent model.',
    contextWindow: 200000,
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B',
    provider: 'huggingface',
    description: 'Meta\'s open-source Llama 3.1 model.',
    contextWindow: 128000,
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B',
    provider: 'huggingface',
    description: 'Fast and efficient open-source model.',
    contextWindow: 32000,
  },
  {
    id: 'llama3',
    name: 'Llama 3 (Ollama)',
    provider: 'ollama',
    description: 'Local Llama 3 running via Ollama.',
    contextWindow: 8192,
    baseUrl: 'http://localhost:11434',
  }
];

export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>(() => {
    const saved = localStorage.getItem('ai_models');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new defaults are added
        const merged = [...DEFAULT_MODELS];
        parsed.forEach((p: AIModel) => {
          if (!merged.find(m => m.id === p.id)) {
            merged.push(p);
          } else {
            // Update existing custom settings (like API keys)
            const index = merged.findIndex(m => m.id === p.id);
            merged[index] = { ...merged[index], ...p };
          }
        });
        return merged;
      } catch (e) {
        return DEFAULT_MODELS;
      }
    }
    return DEFAULT_MODELS;
  });

  const [activeModelId, setActiveModelId] = useState<string>(() => {
    return localStorage.getItem('active_ai_model') || 'gemini-3-flash-preview';
  });

  useEffect(() => {
    localStorage.setItem('ai_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('active_ai_model', activeModelId);
  }, [activeModelId]);

  const addModel = (model: AIModel) => {
    setModels(prev => [...prev.filter(m => m.id !== model.id), model]);
  };

  const updateModel = (id: string, updates: Partial<AIModel>) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    if (activeModelId === id) {
      setActiveModelId('gemini-3-flash-preview');
    }
  };

  const activeModel = models.find(m => m.id === activeModelId) || models[0];

  return {
    models,
    activeModelId,
    activeModel,
    setActiveModelId,
    addModel,
    updateModel,
    removeModel
  };
}
