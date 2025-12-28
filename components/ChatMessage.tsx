
import React, { useState } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`|#.*?\n|^[\s]*-|^[\s]*\d+\.)/gm);
    
    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith('#')) {
        return <h3 key={i} className="text-blue-400 font-black text-lg mt-6 mb-3 tracking-tighter uppercase border-l-4 border-blue-600 pl-4">{part.replace(/#/g, '').trim()}</h3>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-blue-600/20 px-1.5 py-0.5 rounded text-[13px] text-blue-300 code-font border border-blue-600/30 font-semibold">{part.slice(1, -1)}</code>;
      }
      if (/^[\s]*-/.test(part)) {
        return <span key={i} className="inline-block w-4 text-blue-500 font-bold">•</span>;
      }
      if (/^[\s]*\d+\./.test(part)) {
        return <span key={i} className="inline-block pr-2 text-blue-500 font-bold">{part.trim()}</span>;
      }
      
      return part;
    });
  };

  const renderContent = (content: string) => {
    const segments = content.split(/(```lua[\s\S]*?```|```[\s\S]*?```)/g);
    
    return segments.map((segment, index) => {
      if (segment.startsWith('```')) {
        const isLua = segment.startsWith('```lua');
        const code = segment.replace(/```lua|```/g, '').trim();
        
        return (
          <div key={index} className="group/code relative bg-[#02040a] rounded-xl my-6 overflow-hidden border border-[#1f242d] shadow-2xl transition-all hover:border-blue-600/40">
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#0d1117] border-b border-[#1f242d]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                <span className="text-[9px] text-gray-500 font-mono font-black uppercase tracking-[0.2em]">
                  {isLua ? 'ROBLOX_LUAU_CORE' : 'GENERIC_OUTPUT'}
                </span>
              </div>
              <button 
                onClick={() => copyToClipboard(code, index)}
                className="text-[9px] font-black text-gray-500 hover:text-white transition-all flex items-center gap-1.5 bg-[#1a1f26] px-3 py-1 rounded-md border border-[#30363d] active:scale-95"
              >
                {copiedIndex === index ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="p-6 overflow-x-auto custom-scrollbar bg-black/30">
              <pre className="code-font text-[13px] leading-relaxed text-[#e6edf3] selection:bg-blue-500/30"><code>{code}</code></pre>
            </div>
          </div>
        );
      }

      return (
        <div key={index} className="space-y-4">
          {segment.split('\n\n').map((para, pIdx) => (
            <div key={pIdx} className="leading-relaxed text-[#c9d1d9] font-medium text-[15px] sm:text-[16px]">
              {para.split('\n').map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {renderText(line)}
                  {lIdx < para.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-10 ${isAssistant ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[96%] sm:max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'} gap-4 items-start`}>
        <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-black shadow-2xl transition-transform hover:scale-105 ${
          isAssistant ? 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white' : 'bg-[#1a1f26] text-gray-400 border border-[#2d333b]'
        }`}>
          {isAssistant ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </div>
        <div className={`p-6 sm:p-7 rounded-[2rem] shadow-xl relative overflow-hidden ${
          isAssistant 
            ? 'bg-[#161b22] border border-[#2d333b] text-gray-300 rounded-tl-none' 
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}>
          {isAssistant && (
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30"></div>
          )}
          <div className="relative z-10">{renderContent(message.content)}</div>
          
          {/* Grounding Sources UI */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Platform Intelligence Links
              </p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((s, idx) => (
                  <a 
                    key={idx} 
                    href={s.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2 py-1 transition-colors truncate max-w-[180px]"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={`text-[9px] mt-4 font-black opacity-25 uppercase tracking-widest ${isAssistant ? 'text-left' : 'text-right'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
