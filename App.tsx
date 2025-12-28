
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, Source } from './types';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';
import { geminiService } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'roblox_mentor_chats_v6';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((s: any) => ({
          ...s,
          lastModified: new Date(s.lastModified),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(hydrated);
        if (hydrated.length > 0) {
          setCurrentSessionId(hydrated[0].id);
        } else {
          startNewChat();
        }
      } catch (e) {
        startNewChat();
      }
    } else {
      startNewChat();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Engineering Task',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "# Intelligence Core: ONLINE\nI'm **Tublox AI**, powered by **Gemini 3 Pro** for elite engineering analysis and system architecture.\n\n### Core Capabilities:\n- **Advanced Reasoning**: Expert-level parallel logic, multithreading strategies, and CCU optimization.\n- **Security Auditing**: Deep scan of RemoteEvents and server-side verification logic.\n- **Asset Intelligence**: Direct sourcing of high-reputation items from the Creator Store.\n\nPaste a problematic script or describe your architectural goal to begin.",
          timestamp: new Date()
        }
      ],
      lastModified: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    const isFirstUserMessage = !currentSession?.messages.some(m => m.role === 'user');
    const newTitle = isFirstUserMessage ? text.slice(0, 30).trim() + (text.length > 30 ? '...' : '') : currentSession?.title;

    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s,
      title: newTitle || s.title,
      lastModified: new Date(),
      messages: [...s.messages, userMessage]
    } : s));

    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const newAssistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s,
      messages: [...s.messages, newAssistantMessage]
    } : s));

    try {
      let accumulatedResponse = '';
      const chatHistory = currentSession?.messages || [];
      
      await geminiService.streamMessage(
        [...chatHistory, userMessage], 
        (chunk) => {
          accumulatedResponse += chunk;
          setSessions(prev => prev.map(s => s.id === currentSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantId ? { ...m, content: accumulatedResponse } : m)
          } : s));
        },
        (sources) => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantId ? { ...m, sources } : m)
          } : s));
        }
      );
    } catch (error) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: "ERROR: Communication with Gemini Pro failed. Please verify API configuration." } : m)
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        startNewChat();
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#05070a] text-[#c9d1d9] overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={startNewChat}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col relative bg-[#05070a] border-l border-[#1f242d]">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Header */}
        <header className="h-16 border-b border-[#1f242d] bg-[#0d1117]/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <span className="text-white font-black text-sm tracking-tighter">TUX</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <h1 className="font-bold text-[11px] text-white tracking-[0.1em] uppercase truncate max-w-[200px]">
                  {currentSession?.title || 'Tublox Engineering'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-400">
                    Gemini 3 Pro Core Active
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="https://www.roblox.com/create" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
              title="Open Roblox Studio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <span className="hidden lg:inline">Launch Studio</span>
            </a>

            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2 rounded-xl bg-[#1a1f26] border border-[#2d333b] text-gray-400 hover:text-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
        </header>

        {/* Message View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-10">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {messages.length === 1 && (
              <div className="mt-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 relative bg-blue-600/10 border border-blue-500/20">
                   <div className="absolute inset-0 blur-3xl rounded-full opacity-40 bg-blue-500/30"></div>
                   <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 text-blue-500">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                   </svg>
                </div>
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Tublox AI <span className="text-blue-500">Pro</span></h2>
                <p className="text-gray-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
                  Peak performance reasoning for complex Luau logic, parallel systems, and high-concurrency game architecture.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-5 mt-12">
                  <a 
                    href="https://www.roblox.com/create" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] transition-all font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    Launch Studio
                  </a>
                  <a 
                    href="https://create.roblox.com/store" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-10 py-5 bg-[#1a1f26] border border-[#2d333b] hover:border-blue-500/50 text-gray-300 rounded-[1.8rem] transition-all font-black uppercase tracking-widest active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Creator Store
                  </a>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex gap-2.5 p-6 items-center ml-2 bg-[#161b22]/50 border border-[#2d333b] rounded-3xl w-fit">
                <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-blue-600/60 animate-bounce [animation-delay:200ms]"></div>
                <div className="w-3 h-3 rounded-full bg-blue-600/30 animate-bounce [animation-delay:400ms]"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Deep Engineering Cycle...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-10 bg-gradient-to-t from-[#05070a] to-transparent z-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Design a complex system or paste code for audit..."
                className="w-full bg-[#0d1117] border rounded-[1.8rem] py-6 pl-8 pr-16 text-[#e6edf3] placeholder-gray-600 focus:outline-none focus:ring-4 transition-all resize-none min-h-[72px] max-h-[400px] shadow-2xl font-medium text-lg leading-relaxed border-[#2d333b] focus:border-blue-600 focus:ring-blue-600/5"
                rows={1}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className={`absolute right-4 bottom-3.5 p-3.5 rounded-2xl transition-all active:scale-95 ${
                  input.trim() && !isLoading
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#1f242d] text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </div>
            <div className="flex justify-between items-center mt-6 px-4">
              <div className="flex items-center gap-5">
                 <span className="text-[10px] text-gray-600 font-black tracking-widest uppercase flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  ENGINE: T3_PRO_CORE
                </span>
                <span className="text-[10px] text-gray-700 font-mono tracking-tight uppercase hidden sm:inline-block">LUAU_SPEC_v0.9.1_STABLE</span>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setInput("How do I optimize CCU in a large-scale Roblox experience?")} className="text-[9px] text-gray-600 hover:text-blue-400 font-black uppercase tracking-widest transition-colors">CCU Strategy</button>
                 <button onClick={() => setInput("Convert this while-loop to use the task library: ")} className="text-[9px] text-gray-600 hover:text-blue-400 font-black uppercase tracking-widest transition-colors">Luau task.wait</button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Modal */}
        {isInfoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0d1117] border border-[#1f242d] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="relative p-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <button 
                  onClick={() => setIsInfoModalOpen(false)}
                  className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                    <span className="text-white font-black text-3xl">T</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">Tublox AI Mastermind</h3>
                    <p className="text-blue-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-1">Architecture Core v4.0.0-PRO</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-[#161b22] border border-[#1f242d] p-7 rounded-[2.2rem]">
                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-2">Intelligence Core</h4>
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center mt-0.5 shrink-0"><span className="text-[10px] text-blue-400 font-black">P</span></div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-wider">Gemini 3 Pro Reasoning</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Specialized in multithreading, Parallel Luau design patterns, and complex DataStore architectures.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center mt-0.5 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-wider">Deep Security Audit</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Advanced vulnerability detection for RemoteEvent logic and server-authoritative states.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#1f242d] p-7 rounded-[2.2rem]">
                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-2">Engineering Telemetry</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">System Uptime</span>
                        <span className="text-xs font-black text-emerald-500">99.999%</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Model Version</span>
                        <span className="text-xs font-black text-blue-400">G3_PRO_v1</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Roblox API Sync</span>
                        <span className="text-xs font-black text-white">UP-TO-DATE</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] text-center mb-10">
                  <p className="text-[13px] text-gray-300 font-medium leading-relaxed italic">
                    "Engineered to provide the definitive engineering edge. Tublox AI Pro delivers unparalleled technical depth for the next generation of Roblox Studio pioneers."
                  </p>
                </div>

                <div className="pt-8 border-t border-[#1f242d] flex flex-col sm:flex-row gap-5 items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 font-mono tracking-tighter">BUILD_HASH: CORE_PRO_4.0_FINAL_STABLE</span>
                    <span className="text-[10px] text-gray-700 font-mono tracking-tighter uppercase">PLATFORM: ARCHITECTURE_PREMIUM</span>
                  </div>
                  <button 
                    onClick={() => setIsInfoModalOpen(false)}
                    className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-95"
                  >
                    RETURN TO CORE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
