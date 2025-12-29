import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  title: string;
}

const Terminal: React.FC<TerminalProps> = ({ logs, title }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-lg border border-gray-800 font-mono text-sm shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-850 border-b border-gray-800">
        <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">{title} Output</span>
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 terminal-scroll text-gray-300">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">No output. Ready to start...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-1 break-words whitespace-pre-wrap">
              <span className="text-gray-600 select-none mr-3">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <span className={
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                'text-gray-300'
              }>
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;