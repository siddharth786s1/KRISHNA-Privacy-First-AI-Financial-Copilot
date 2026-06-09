import React, { useState } from 'react';
import { AgentLog } from '../types';
import { ShieldCheck, MessageSquare, ShieldAlert, Cpu, ChevronRight, Terminal, Clock, Settings } from 'lucide-react';

interface AgentLogsTabProps {
  logs: AgentLog[];
}

export default function AgentLogsTab({ logs }: AgentLogsTabProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleLog = (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const getAgentColor = (agent: AgentLog['agent']) => {
    switch (agent) {
      case 'Coordinator': return 'text-slate-700 bg-slate-100 border-slate-200';
      case 'Privacy': return 'text-emerald-700 bg-emerald-50 border-emerald-250';
      case 'Bookkeeper': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'Advisor': return 'text-indigo-700 bg-indigo-50 border-indigo-250';
      case 'Auditor': return 'text-amber-800 bg-amber-50 border-amber-250';
      case 'Explainability': return 'text-pink-705 bg-pink-50 border-pink-200';
      default: return 'text-slate-600 bg-slate-55 border-slate-200';
    }
  };

  const getLogTypeIcon = (type: AgentLog['type']) => {
    switch (type) {
      case 'success': return <ShieldCheck className="text-emerald-600 shrink-0" size={16} />;
      case 'warn': return <ShieldAlert className="text-amber-600 shrink-0" size={16} />;
      case 'error': return <ShieldAlert className="text-rose-600 shrink-0" size={16} />;
      default: return <Cpu className="text-blue-600 shrink-0" size={16} />;
    }
  };

  const getBorderColor = (type: AgentLog['type']) => {
    switch (type) {
      case 'success': return 'border-l-emerald-500';
      case 'warn': return 'border-l-amber-500';
      case 'error': return 'border-l-rose-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Console Header Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Terminal size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              Multi-Agent Console Ledger
            </h4>
            <span className="text-[10px] text-slate-500 block">
              Continuous chronological step outcomes of server-side agent runs.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-[10px] font-mono rounded-lg border border-slate-200 text-slate-600">
          <Clock size={12} className="text-slate-400" />
          {logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).toLocaleTimeString() : 'Dormant'}
        </div>
      </div>

      {/* Chronological List */}
      <div className="space-y-3">
        {logs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const time = new Date(log.timestamp).toLocaleTimeString();

          return (
            <div 
              key={log.id}
              className={`bg-white border-l-[3px] ${getBorderColor(log.type)} border border-slate-205 border-l-inherit rounded-lg overflow-hidden shadow-xs transition-colors`}
            >
              <div 
                onClick={() => log.details && toggleLog(log.id)}
                className={`p-4 flex items-center justify-between gap-4 cursor-pointer select-none ${log.details ? 'hover:bg-slate-50/50' : ''}`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  {getLogTypeIcon(log.type)}
                  
                  {/* Agent badge */}
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded border shrink-0 ${getAgentColor(log.agent)}`}>
                    {log.agent}
                  </span>

                  <p className="text-xs md:text-sm text-slate-750 font-semibold truncate w-full">
                    {log.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[10px] text-slate-400">{time}</span>
                  {log.details && (
                    <ChevronRight 
                      size={16} 
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  )}
                </div>
              </div>

              {/* Collapsed Detail Panel */}
              {isExpanded && log.details && (
                <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/60 font-mono text-[11px] text-slate-600 space-y-2 animate-fade-in leading-relaxed whitespace-pre-line">
                  {log.details}
                </div>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400 text-sm">
            Console feed is empty. Select CSV data or trigger a Copilot simulation to stream active logs.
          </div>
        )}
      </div>

    </div>
  );
}
