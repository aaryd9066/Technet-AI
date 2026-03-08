import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Message } from "../types";
import { chatWithGemini } from "../services/gemini";
import { cn, formatTime } from "../utils";
import ReactMarkdown from "react-markdown";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      text: "Hello! I'm Technet AI. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithGemini(input);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response || "I'm sorry, I couldn't process that.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-center relative min-h-[88px]">
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
            <span className="text-cyan-400 text-lg font-black">T</span>
            TECHNET AI
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mt-1">Intelligence Core</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400"
              )}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl relative",
                msg.role === "user" 
                  ? "bg-cyan-600 text-white rounded-tr-none" 
                  : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800"
              )}>
                <div className="prose prose-invert max-w-none text-base leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <span className="text-xs opacity-50 block mt-2 text-right">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="animate-spin text-cyan-400" size={16} />
              <span className="text-base text-zinc-400 italic">Technet is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all pr-16 text-lg"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-3 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
