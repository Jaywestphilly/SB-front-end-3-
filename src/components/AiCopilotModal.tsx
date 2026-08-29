import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Send, Bot, User } from "lucide-react";

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTicker?: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  activeTicker,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "bot",
      text: `Hello! I am **Stock Bloc Assistant**. Ask me anything about infrastructure, HBM memory chip shortages, grid energy bottlenecks, or tickers like **BE**, **SKHY**, **POET**, **NVDA**, or **PLPC**.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend, activeTicker }),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Analysis generated.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Network issue connecting to Stock Bloc engine.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    "Why is Bloom Energy (BE) surging?",
    "Explain SK Hynix (SKHY) HBM3e market share",
    "What is the Super sonic Tsunami sector?",
    "Best grid power tickers?",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="copilot-modal-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            key="copilot-modal-content"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="w-full max-w-xl bg-neutral-950 border border-cyan-500/20 rounded-t-3xl sm:rounded-3xl h-[85vh] sm:h-[650px] flex flex-col shadow-2xl overflow-hidden relative text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-neutral-900/80 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                    Stock Bloc Copilot
                  </h3>
                  <p className="text-[11px] text-cyan-400 font-medium">
                    Powered by Gemini 2.5 Flash
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.sender === "user"
                        ? "bg-cyan-500 text-black font-bold"
                        : "bg-neutral-800 text-cyan-400 border border-white/10"
                    }`}
                  >
                    {m.sender === "user" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-cyan-500 text-black font-semibold rounded-tr-none"
                        : "bg-white/5 border border-white/10 text-neutral-200 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 bg-white/5 rounded-xl border border-white/10 max-w-[200px]">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Quant calculating...</span>
                </div>
              )}
            </div>

            {/* Sample Pills */}
            <div className="px-4 py-2 border-t border-white/5 overflow-x-auto no-scrollbar flex gap-2 text-[11px]">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 text-neutral-300 font-medium whitespace-nowrap active:scale-95 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-neutral-900 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about hardware, energy grid, or stocks..."
                className="flex-1 bg-neutral-950 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
