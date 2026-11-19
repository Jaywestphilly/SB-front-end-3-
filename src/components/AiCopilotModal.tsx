import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
    } catch {
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
    "What is the Super Sonic Tsunami sector?",
    "Best grid power tickers?",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="copilot-modal-backdrop"
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#01040a]/86 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            key="copilot-modal-content"
            initial={{ opacity: 0, y: 36, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl xeno-glow-shell"
          >
            <div
              className={`w-full liquid-glass-surface sm:xeno-clip-lg h-[86vh] sm:h-[670px] flex flex-col overflow-hidden relative text-[#f2faff] transition-shadow ${
                isLoading
                  ? "copilot-streaming-frame border-[#00f5d4]/80"
                  : "border-[#00f5d4]/40"
              }`}
            >
              {/* Top Plasma Conduit */}
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-[2px] xeno-conduit-rail z-20 pointer-events-none"
              />

              {/* Holographic Neural Link Header */}
              <div className="relative z-10 flex items-center justify-between px-5 py-4 bg-[#041020]/94 border-b border-[#00f5d4]/25">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 44 44"
                      className="absolute inset-0 w-full h-full xeno-spin-slow"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r="20"
                        fill="none"
                        stroke="#00f5d4"
                        strokeWidth="1.2"
                        strokeDasharray="9 5 3 5"
                      />
                    </svg>
                    <div className="w-8 h-8 xeno-hex-pod bg-[#00f5d4]/18 flex items-center justify-center text-[#00f5d4]">
                      <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_#00f5d4]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base tracking-[0.12em] uppercase text-white flex items-center gap-2 xeno-neon-text">
                      <span>Stock Bloc Copilot</span>
                      {activeTicker && (
                        <span className="font-mono text-[11px] text-[#00f5d4]">
                          · ${activeTicker}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-[#00e5ff]/85 font-mono">
                      {isLoading
                        ? "Synthesizing live filings & telemetry..."
                        : "Quantitative Research & Filing Intelligence"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Stock Bloc Copilot"
                  className="xeno-cmd-btn w-9 h-9 flex items-center justify-center text-cyan-200 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="relative z-10 flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar xeno-hex-grid">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 max-w-[90%] ${
                      m.sender === "user"
                        ? "ml-auto flex-row-reverse"
                        : "mr-auto"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 xeno-hex-pod flex items-center justify-center shrink-0 ${
                        m.sender === "user"
                          ? "bg-[#00f5d4] text-slate-950 font-bold"
                          : "bg-[#071c33] text-[#00f5d4]"
                      }`}
                    >
                      {m.sender === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div
                      className={`px-4 py-3 xeno-clip-sm text-xs sm:text-[13px] leading-relaxed ${
                        m.sender === "user"
                          ? "bg-gradient-to-br from-[#00f5d4] to-[#00d1ff] text-slate-950 font-semibold shadow-[0_6px_22px_rgba(0,245,212,0.28)]"
                          : "bg-[#051324]/94 border border-[#00f5d4]/30 text-slate-100"
                      }`}
                    >
                      {m.sender === "bot" ? (
                        <div className="space-y-2 break-words">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="leading-relaxed text-slate-100 m-0">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-[#00f5d4]">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-cyan-200">
                                  {children}
                                </em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-4 space-y-1 text-slate-200">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-4 space-y-1 text-slate-200">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              code: ({ children }) => (
                                <code className="px-1.5 py-0.5 bg-cyan-950/90 border border-[#00f5d4]/35 text-[#00ff9d] font-mono text-[11px]">
                                  {children}
                                </code>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#00e5ff] underline hover:text-white"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.text}</span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-[#00f5d4] px-3.5 py-2.5 bg-[#06182c]/95 xeno-clip-sm border border-[#00f5d4]/45 max-w-[235px]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-[#00f5d4]" />
                    <span className="font-mono">Quant calculating...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Wrapped Quick-Prompt Blades (Zero Right-Edge Clipping) */}
              <div className="relative z-10 px-4 py-2.5 bg-[#030b17]/90 border-t border-[#00f5d4]/20 flex flex-wrap gap-1.5 text-[11px]">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="px-3 py-1.5 xeno-cmd-btn text-slate-200 hover:text-[#00f5d4] font-medium active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="relative z-10 p-3.5 bg-[#040e1c]/98 border-t border-[#00f5d4]/25 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about hardware, energy grid, filings, or tickers..."
                  className="flex-1 bg-[#020812] border border-[#00f5d4]/30 xeno-clip-sm px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00f5d4]/85 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message"
                  className="p-2.5 xeno-clip-sm bg-[#00f5d4] hover:bg-[#00e5ff] text-slate-950 font-bold disabled:opacity-40 transition-all active:scale-95 cursor-pointer shadow-[0_0_18px_rgba(0,245,212,0.4)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
