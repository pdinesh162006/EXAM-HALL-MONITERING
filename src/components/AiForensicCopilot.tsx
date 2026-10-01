import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Globe,
  ShieldCheck,
  Bot,
  User,
  ExternalLink,
  RotateCcw,
  FileCheck2,
  Scale,
  Search,
  AlertCircle
} from 'lucide-react';
import { AlertIncident, ChatMessage } from '../types';

interface AiForensicCopilotProps {
  activeAlert: AlertIncident | null;
  examName: string;
}

export const AiForensicCopilot: React.FC<AiForensicCopilotProps> = ({
  activeAlert,
  examName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'model',
      text: `Hello! I am your AI Forensic Proctor & Academic Integrity Advisor for ${examName}. 
I am grounded in live university examination regulations and computer vision evidentiary standards via Google Search.

How can I assist your surveillance session? You can ask me to:
• Objectively analyze any flagged candidate incident for intent vs. natural distraction
• Search university honor codes & legal evidentiary precedents
• Draft formal, defensible logbook entries for the Examination Board
• Recommend proportionate intervention protocols (reseating, quiet observation, or item confiscation)`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    setErrorMsg(null);
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history,
          context: {
            activeAlert: activeAlert
              ? {
                  id: activeAlert.id,
                  seatLabel: activeAlert.seatLabel,
                  studentName: activeAlert.studentName,
                  rollNo: activeAlert.rollNo,
                  behaviorTitle: activeAlert.behaviorTitle,
                  confidence: activeAlert.confidence,
                  metrics: activeAlert.metrics,
                }
              : null,
            examName,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();

      // Extract search grounding sources if returned
      const groundingSources: Array<{ title?: string; uri?: string }> = [];
      if (data.groundingMetadata?.groundingChunks) {
        data.groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.title || chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || 'Source Reference',
              uri: chunk.web.uri || '#',
            });
          }
        });
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('[Copilot Error]:', err);
      setErrorMsg(err.message || 'Failed to communicate with AI Copilot.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputPrompt(promptText);
    handleSendMessage(promptText);
  };

  return (
    <div className="grid lg:grid-cols-4 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
      {/* Sidebar: Context & Quick Prompts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Forensic Assistant</h3>
              <p className="text-[11px] text-slate-400">Powered by Gemini &amp; Google Search</p>
            </div>
          </div>

          {/* Active Context Card */}
          {activeAlert ? (
            <div className="bg-slate-950 border border-indigo-900/50 rounded-xl p-3 text-xs space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Current Attached Incident
              </span>
              <p className="font-bold text-white text-xs">{activeAlert.behaviorTitle}</p>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p>Candidate: <strong className="text-slate-200">{activeAlert.studentName}</strong> ({activeAlert.seatLabel})</p>
                <p>AI Confidence: <strong className="text-emerald-400">{(activeAlert.confidence * 100).toFixed(1)}%</strong></p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Context Status
              </span>
              <p className="text-[11px]">No specific alert selected. AI will advise on general hall integrity rules.</p>
            </div>
          )}

          {/* Prompt Recommendations */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Forensic Queries:
            </span>

            {activeAlert && (
              <button
                onClick={() =>
                  handleQuickPrompt(
                    `Analyze the evidence for ${activeAlert.seatLabel} (${activeAlert.behaviorTitle}): Does this indicate deliberate malpractice, and what is the proportionate invigilator response?`
                  )
                }
                className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs transition cursor-pointer flex items-start gap-2"
              >
                <Scale className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Evaluate intent &amp; proportionality for {activeAlert.seatLabel}</span>
              </button>
            )}

            <button
              onClick={() =>
                handleQuickPrompt(
                  'Search Google for standard university examination board penalties for cell phone possession in exam halls vs actively using it.'
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs transition cursor-pointer flex items-start gap-2"
            >
              <Globe className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Search university exam sanctions for phone possession</span>
            </button>

            <button
              onClick={() =>
                handleQuickPrompt(
                  'Draft a neutral, fact-based incident report entry suitable for the official university Examination Board logbook.'
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs transition cursor-pointer flex items-start gap-2"
            >
              <FileCheck2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Draft formal logbook entry for examination board</span>
            </button>
          </div>
        </div>

        {/* Search Grounding Badge */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Real-time Google Search data active for up-to-date academic bylaws.</span>
        </div>
      </div>

      {/* Main Chat Conversation Thread */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-br from-amber-500 to-indigo-600 text-white shadow-md'
                }`}
              >
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Citations */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] space-y-1">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Globe className="h-3 w-3 text-cyan-400" /> Grounded Search Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 hover:text-indigo-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition"
                        >
                          <span className="truncate max-w-[180px]">{source.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] text-right ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Consulting Gemini &amp; verifying regulations with Google Search...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask the AI forensic copilot or search academic integrity bylaws..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/20"
              title="Send query"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
