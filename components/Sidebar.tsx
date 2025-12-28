
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  isOpen,
  onToggle
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={onToggle}
        />
      )}
      
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-72 bg-[#252526] border-r border-[#3e3e42] 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-[#3e3e42]">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md font-medium text-sm mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
          
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center">
              <span className="text-blue-400 font-bold text-[10px]">T</span>
            </div>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">History</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-center text-gray-500 mt-8 italic px-4">No projects yet. Start a new one!</p>
          ) : (
            sessions.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).map((session) => (
              <div 
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                  ${currentSessionId === session.id 
                    ? 'bg-[#37373d] text-white border border-[#4a4a4f]' 
                    : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200 border border-transparent'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-xs font-medium truncate pr-6">{session.title || 'Untitled Project'}</span>
                
                <button 
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#3e3e42] bg-[#1e1e1e]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Tublox Core Online</span>
          </div>
          <p className="text-[10px] text-gray-600 leading-tight">Elite engineering AI for Roblox development and platform intelligence.</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
