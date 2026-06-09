import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { CopilotAnalysisResult } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FinanceChatBotProps {
  income: number;
  savingsPercent: number;
  rawTransactions: any[];
  analysisResult: CopilotAnalysisResult | null;
}

export default function FinanceChatBot({
  income,
  savingsPercent,
  rawTransactions,
  analysisResult
}: FinanceChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am Krishna, your Privacy-First Financial Copilot. How can I help clarify your budget guidelines, check spending anomalies, or inspect co-correction audit metrics today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message entry
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    setInputText('');
    setErrorText(null);
    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Build session context to supply server-side Gemini prompt
      const context = {
        income,
        savingsPercent,
        transactionCount: rawTransactions.length,
        piiCount: analysisResult?.piiCount || 0,
        budget: analysisResult?.budget || {},
        savingTips: analysisResult?.savingTips || []
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages,
          context
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setErrorText(data.error || 'Unable to retrieve AI response.');
      }
    } catch (err: any) {
      setErrorText(`Connection Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Quick suggestion prompts
  const suggestions = [
    "How can I save ₹5,000 more?",
    "Show my highest spending category",
    "Explain my latest audit report",
    "Where did the system redact my PII?"
  ];

  return (
    <div className="fixed bottom-14 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="w-[380px] md:w-[410px] h-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Krishna Financial Assister</h4>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                    Copilot Context Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
                id="close-chat-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conversation Field */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-semibold leading-relaxed shadow-xs ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                    }`}
                  >
                    {/* Preserve line breaks and styling markers */}
                    <div className="whitespace-pre-wrap select-text">
                      {m.content.split('**').map((item, i) => (i % 2 === 1 ? <strong key={i} className="font-extrabold">{item}</strong> : item))}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start items-center gap-2 text-slate-400 text-[11px] font-bold tracking-wider pl-2 py-1 select-none">
                  <RefreshCw size={12} className="animate-spin text-blue-500" />
                  <span>Krishna logic tracing...</span>
                </div>
              )}

              {errorText && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-850 text-[10px] rounded-lg flex items-start gap-2 leading-relaxed font-bold animate-fade-in select-none">
                  <AlertCircle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorText}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Box */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 border-t border-slate-100 bg-white select-none">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                  Suggested Clarifications:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestClick(s)}
                      className="text-[10px] px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-900 border border-slate-200 rounded-lg font-bold cursor-pointer transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inflow field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Krishna about budgets or anomalies..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-850 focus:outline-none focus:border-blue-500 font-sans"
                disabled={isLoading}
                id="chat-input-text"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                id="send-chat-btn"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparking Core trigger Bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl cursor-pointer"
        id="trigger-chat-widget"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageSquare size={22} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black leading-none">
              1
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}
