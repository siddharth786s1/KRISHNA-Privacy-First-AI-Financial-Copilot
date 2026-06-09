import React, { useState } from 'react';
import { Transaction } from '../types';
import { ShieldCheck, Mail, Phone, Hash, CreditCard, Search } from 'lucide-react';

interface PrivacyTabProps {
  rawTransactions: Transaction[];
  sanitizedTransactions: Transaction[];
  piiCount: number;
}

export default function PrivacyTab({
  rawTransactions,
  sanitizedTransactions,
  piiCount
}: PrivacyTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Find corresponding raw element for comparison
  const lookupRaw = (id: string, defText: string) => {
    return rawTransactions.find((r) => r.id === id)?.description || defText;
  };

  const filtered = sanitizedTransactions.filter(t => {
    const raw = lookupRaw(t.id, t.description).toLowerCase();
    const clean = t.description.toLowerCase();
    return raw.includes(searchTerm.toLowerCase()) || clean.includes(searchTerm.toLowerCase());
  });

  const getRedactedBadge = (text: string) => {
    const parts = [];
    let currentText = text;

    // Helper to find and render badge components
    const tokens = [
      { key: '[REDACTED_EMAIL]', label: 'Email', icon: Mail, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { key: '[REDACTED_PHONE]', label: 'Phone', icon: Phone, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      { key: '[REDACTED_UPI]', label: 'UPI Handle', icon: Hash, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { key: '[REDACTED_ID]', label: 'Account ID', icon: CreditCard, bg: 'bg-blue-50 text-blue-700 border-blue-200' }
    ];

    let foundToken = true;
    while (foundToken) {
      foundToken = false;
      let earliestIndex = Infinity;
      let matchingToken: typeof tokens[0] | null = null;

      for (const token of tokens) {
        const idx = currentText.indexOf(token.key);
        if (idx !== -1 && idx < earliestIndex) {
          earliestIndex = idx;
          matchingToken = token;
          foundToken = true;
        }
      }

      if (foundToken && matchingToken) {
        if (earliestIndex > 0) {
          parts.push(currentText.substring(0, earliestIndex));
        }
        const Icon = matchingToken.icon;
        parts.push(
          <span
            key={Math.random()}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-bold rounded border ${matchingToken.bg}`}
          >
            <Icon size={10} className="shrink-0" />
            {matchingToken.label}
          </span>
        );
        currentText = currentText.substring(earliestIndex + matchingToken.key.length);
      }
    }

    if (currentText.length > 0) {
      parts.push(currentText);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Agent banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 flex items-center gap-2">
              Privacy Shield Active
            </h3>
            <p className="text-sm text-slate-500">
              The Privacy Agent scrubs and masks PII locally inside your app container BEFORE passing descriptions to any LLM engine.
            </p>
          </div>
        </div>
        <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 text-center rounded-xl min-w-[120px]">
          <span className="block text-2xl font-black text-emerald-600 font-mono">
            {piiCount}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
            PII Redacted
          </span>
        </div>
      </div>

      {/* Rules ledger summary */}
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
        Redaction Guardrails Summary
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Emails', mask: '[REDACTED_EMAIL]', match: 'john@gmail.com', desc: 'Shorthand or full format email tags' },
          { title: 'Phones', mask: '[REDACTED_PHONE]', match: '+91 9876543210', desc: 'Matches standard 10-digit formats' },
          { title: 'UPI Handles', mask: '[REDACTED_UPI]', match: 'shashank@upi', desc: 'Clears direct unified payment tags' },
          { title: 'Numeric IDs', mask: '[REDACTED_ID]', match: '123456789012', desc: 'Masks CC logs, references and bank accounts' }
        ].map((rule) => (
          <div key={rule.title} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <span className="block text-xs font-extrabold text-blue-600 uppercase tracking-wider">{rule.title}</span>
              <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">{rule.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1 font-mono text-[11px]">
              <span className="text-slate-400">Before: <span className="text-slate-600 line-through">{rule.match}</span></span>
              <span className="text-emerald-600 font-bold">After: {rule.mask}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CSV comparison table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-6 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            Sanitized Ledger
            <span className="text-xs px-2.5 py-0.5 bg-slate-150 text-slate-600 rounded-full font-mono font-bold">
              showing {filtered.length} of {sanitizedTransactions.length}
            </span>
          </h4>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-4 py-2 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                <th className="p-4 w-28">Date</th>
                <th className="p-4 hidden md:table-cell">Raw Description (What Banker Logs)</th>
                <th className="p-4">Sanitized Description (What AI processes)</th>
                <th className="p-4 w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const rawDesc = lookupRaw(t.id, t.description);
                const isRedacted = rawDesc !== t.description;
                const isCredit = t.amount > 0;

                return (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="p-4 font-mono text-xs text-slate-400">{t.date}</td>
                    <td className="p-4 hidden md:table-cell text-slate-400 line-through truncate max-w-sm">
                      {rawDesc}
                    </td>
                    <td className="p-4 font-medium">
                      <div className={`p-1 rounded ${isRedacted ? 'bg-blue-50/40 border border-blue-105/10' : ''}`}>
                        {getRedactedBadge(t.description)}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {isCredit ? '+' : ''}₹{Math.abs(t.amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No transactions matching search term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
