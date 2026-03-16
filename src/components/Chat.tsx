import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Code2, MessageSquare, Copy, Check } from 'lucide-react';
import { generateCodeStream } from '../services/gemini';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { CodeEditor } from './CodeEditor';
import { CodeState, ProjectAsset } from '../types';
import { useAIModels } from '../hooks/useAIModels';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  currentCode: CodeState;
  onCodeGenerated: (code: string, lang?: string) => void;
  theme: 'light' | 'dark';
  assets: ProjectAsset[];
}

export const Chat: React.FC<ChatProps> = ({ currentCode, onCodeGenerated, theme, assets }) => {
  const { models, activeModelId } = useAIModels();
  const activeModel = models.find(m => m.id === activeModelId) || models[0];

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello! I'm your AI assistant powered by ${activeModel.name}. Tell me what you'd like to build or modify in your code.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<'all' | 'html' | 'css' | 'js' | 'react' | 'php' | 'md'>('all');
  const [targetFormat, setTargetFormat] = useState<'auto' | 'page' | 'component' | 'function' | 'snippet'>('auto');
  const [activeView, setActiveView] = useState<'chat' | 'code'>('chat');
  const [lastGeneratedCode, setLastGeneratedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add a placeholder for the assistant's response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let fullResponse = '';

    try {
      const stream = generateCodeStream(userMessage, currentCode, targetLang, assets, targetFormat);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: fullResponse };
          return newMessages;
        });
        setLastGeneratedCode(fullResponse);
      }

      if (!fullResponse) {
        throw new Error("The AI returned an empty response. This might be due to safety filters or a temporary issue.");
      }

      // Check if the response looks like code
      if (fullResponse.includes('<html') || fullResponse.includes('body {') || fullResponse.includes('document.') || targetLang !== 'all') {
        onCodeGenerated(fullResponse, targetLang);
        // Switch to code view automatically if code was generated
        setActiveView('code');
      }
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      
      let errorMessage = "Sorry, I encountered an error while generating code.";
      
      if (error?.message?.includes('quota')) {
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (error?.message?.includes('safety')) {
        errorMessage = "The request was blocked by safety filters. Please try a different prompt.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'assistant', content: errorMessage };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lastGeneratedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-8 py-6 border-b border-black dark:border-white flex items-center justify-between bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-black dark:bg-zinc-800 border-2 border-black dark:border-white">
          <button
            onClick={() => setActiveView('chat')}
            className={`flex items-center gap-2 px-4 py-1.5 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeView === 'chat' 
                ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
          <button
            onClick={() => setActiveView('code')}
            className={`flex items-center gap-2 px-4 py-1.5 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeView === 'code' 
                ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
        </div>
        <div className="p-2 bg-accent/10 border-2 border-black dark:border-white">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === 'chat' ? (
            <motion.div 
              key="chat-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              ref={scrollRef} 
              className="absolute inset-0 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`chat-avatar ${
                      msg.role === 'assistant' 
                        ? 'chat-avatar-assistant' 
                        : 'chat-avatar-user'
                    }`}>
                      {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`chat-bubble ${
                      msg.role === 'assistant' 
                        ? 'chat-bubble-assistant' 
                        : 'chat-bubble-user'
                    }`}>
                      <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="chat-avatar chat-avatar-assistant">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="chat-bubble chat-bubble-assistant flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Forging...</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="code-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Generated Source</h3>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex-1 border-2 border-black dark:border-white overflow-hidden border border-black dark:border-white shadow-inner">
                <CodeEditor 
                  value={lastGeneratedCode}
                  language={targetLang === 'all' ? 'html' : targetLang === 'js' ? 'javascript' : targetLang === 'react' ? 'javascript' : targetLang === 'md' ? 'markdown' : targetLang}
                  theme={theme}
                  readOnly={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 border-t border-black dark:border-white bg-white/50 dark:bg-black/50 backdrop-blur-xl space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex gap-1 p-1 bg-white dark:bg-black dark:bg-zinc-800 border-2 border-black dark:border-white">
              {(['all', 'html', 'css', 'js', 'react', 'php', 'md'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLang(lang)}
                  className={`px-3 py-1.5 border-2 border-black dark:border-white text-[9px] font-bold uppercase tracking-widest transition-all ${
                    targetLang === lang 
                      ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="flex gap-1 p-1 bg-white dark:bg-black dark:bg-zinc-800 border-2 border-black dark:border-white">
              {(['auto', 'page', 'component', 'function', 'snippet'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  className={`px-3 py-1.5 border-2 border-black dark:border-white text-[9px] font-bold uppercase tracking-widest transition-all ${
                    targetFormat === fmt 
                      ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chat-input-container group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your vision..."
            className="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-4 text-[9px] text-zinc-400 text-center uppercase tracking-[0.3em] font-bold">
          Powered by <span className="text-accent">{activeModel.name}</span>
        </p>
      </div>
    </div>
  );
};
