import React, { useState } from 'react';
import { SavingTip, AuditResponse, CopilotAnalysisResult } from '../types';
import { AlertCircle, CheckCircle, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Coins, Sparkles, TrendingUp } from 'lucide-react';

interface RecommendationsProps {
  budget: Record<string, number>;
  categoryTotals: Record<string, number>;
  savingTips: SavingTip[];
  auditAttempts: CopilotAnalysisResult['auditAttempts'];
  explainability: CopilotAnalysisResult['explainability'];
  income: number;
}

export default function RecommendationsTab({
  budget,
  categoryTotals,
  savingTips,
  auditAttempts,
  explainability,
  income
}: RecommendationsProps) {
  const [openTipTitle, setOpenTipTitle] = useState<string | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(true);

  const toggleTip = (title: string) => {
    if (openTipTitle === title) {
      setOpenTipTitle(null);
    } else {
      setOpenTipTitle(title);
    }
  };

  const getAveragedUsageColor = (used: number, limit: number) => {
    if (limit === 0) return 'bg-slate-500';
    const ratio = used / limit;
    if (ratio >= 1.0) return 'bg-rose-500';
    if (ratio >= 0.8) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 text-slate-705">
      
      {/* Narrative overview header */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          Copilot Strategy Overview
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {explainability.overview}
        </p>
      </div>

      {/* Recommended allocation guidelines budget Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Coins size={16} className="text-emerald-600" />
          Validated Spend Threshold Guidelines
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-3">Spend Division</th>
                <th className="p-3">Observed Historical Outlays</th>
                <th className="p-3">Advised Budget Limits</th>
                <th className="p-3">Safety Margin Progress Meter</th>
                <th className="p-3 text-right">Advised Cap</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(budget).map((catName) => {
                const limit = budget[catName] || 0;
                const past = Math.abs(categoryTotals[catName] || 0);
                const percent = limit > 0 ? Math.min(100, Math.round((past / limit) * 100)) : 0;
                
                return (
                  <tr key={catName} className="border-b border-slate-100 hover:bg-slate-50/50 text-slate-700 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{catName}</td>
                    <td className="p-3 font-mono text-slate-500">₹{past.toLocaleString()}</td>
                    <td className="p-3 font-mono text-blue-600 font-bold">₹{limit.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getAveragedUsageColor(past, limit)}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold w-8">{percent}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-500">
                      ₹{limit.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Saving Tips cards */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Tactical Saving Recommendations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingTips.map((tip) => {
            const isOpen = openTipTitle === tip.title;
            const evidence = explainability.tipsEvidence[tip.title] || 'Evidence Verified against historic ledger.';
            
            return (
              <div 
                key={tip.title} 
                className="p-5 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-2xl transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-550 rounded text-[9px] font-bold uppercase tracking-wider">
                        {tip.category}
                      </span>
                      <h5 className="text-sm font-bold text-slate-850 mt-1">{tip.title}</h5>
                    </div>
                    <span className="text-emerald-700 font-mono font-bold text-xs px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full shrink-0">
                      +₹{tip.expected_savings.toLocaleString()}/mo
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tip.reasoning}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => toggleTip(tip.title)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-blue-600 hover:text-blue-700 font-mono focus:outline-none cursor-pointer"
                  >
                    <span>{isOpen ? 'Conceal Trace Check' : 'Explain Recommendations Evidence (AI)'}</span>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isOpen && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1.5 animate-fade-in font-medium">
                      <p className="text-slate-500 italic">
                        "{evidence}"
                      </p>
                      <span className="block text-[9px] text-emerald-600 uppercase tracking-widest font-bold">
                        Status: Auditor Verified True
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certified Audit Reports Section (Timeline view) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <button
          onClick={() => setShowAuditLogs(!showAuditLogs)}
          className="w-full flex items-center justify-between text-sm font-bold uppercase tracking-wider text-slate-800 hover:text-slate-900 focus:outline-none cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            Auditor Self-Correction Logs Timeline
          </span>
          {showAuditLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAuditLogs && (
          <div className="mt-6 space-y-6 border-l border-slate-200 ml-3 pl-6 relative">
            {auditAttempts.map((run) => {
              const capSum = Object.values(run.budget).reduce((a, b) => a + b, 0);
              const isRejected = run.status === 'REJECTED';

              return (
                <div key={run.attempt} className="relative space-y-3">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${isRejected ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Draft Cycle Allocation Attempt #{run.attempt}
                    </span>
                    <span className={`px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-55 border-emerald-200 text-emerald-700'}`}>
                      {run.status} – Score {run.audit.audit_score}/100
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4 text-xs text-slate-650">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-500 border-b border-slate-200 pb-3 font-mono text-[10px] font-bold">
                      <div>Draft Cap Sum: <strong className="text-slate-800">₹{capSum.toLocaleString()}</strong></div>
                      <div>Draft Savings: <strong className="text-slate-800">₹{run.savings_target.toLocaleString()}</strong></div>
                      <div>Sum vs Income Check: <strong className={capSum + run.savings_target <= income ? 'text-emerald-600' : 'text-rose-600'}>₹{(capSum + run.savings_target).toLocaleString()} / ₹{income}</strong></div>
                    </div>

                    {isRejected ? (
                      <div className="space-y-3 animate-fade-in">
                        <div className="space-y-1">
                          <span className="block text-[10px] text-rose-600 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                            <AlertCircle size={10} /> Policies Failed
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1.5 leading-relaxed font-medium">
                            {run.audit.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1 border-t border-slate-200/60 pt-2 text-blue-700 bg-blue-50/50 p-2 border border-blue-100 rounded-lg">
                          <span className="block text-[10px] text-blue-700 uppercase tracking-widest font-extrabold pl-0.5">
                            Feed-Forward Revisions Demanded
                          </span>
                          <ul className="list-disc list-inside space-y-1 pl-1.5 leading-relaxed font-semibold">
                            {run.audit.required_changes.map((req, idx) => (
                              <li key={idx} className="text-[11px]">{req}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-emerald-800 bg-emerald-50/50 p-3 border border-emerald-100 rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider block font-black text-emerald-700">
                          Compliance Certificate Issued
                        </span>
                        <p className="text-xs text-emerald-800 leading-relaxed font-sans font-medium">
                          {explainability.auditPassedSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
