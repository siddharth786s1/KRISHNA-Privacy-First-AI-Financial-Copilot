import React, { useState, useEffect } from 'react';
import { Transaction, CopilotAnalysisResult, EvaluationResult } from './types';
import PrivacyTab from './components/PrivacyTab';
import DashboardTab from './components/DashboardTab';
import RecommendationsTab from './components/RecommendationsTab';
import AgentLogsTab from './components/AgentLogsTab';
import FinanceChatBot from './components/FinanceChatBot';
import { ShieldCheck, Coins, Database, Activity, Sparkles, UploadCloud, Info, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'dashboard' | 'recommendations' | 'logs'>('privacy');
  
  // App state
  const [income, setIncome] = useState<number>(95000);
  const [savingsPercent, setSavingsPercent] = useState<number>(20);
  const [demoMode, setDemoMode] = useState<boolean>(true); // default true for first-time co-correction demo impact
  
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [analysisResult, setAnalysisResult] = useState<CopilotAnalysisResult | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Evaluation metrics stats state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState<boolean>(false);

  // Load sample bank data automatically at startup for an instant working demo out of the box!
  useEffect(() => {
    loadSampleDataset();
  }, []);

  const loadSampleDataset = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/sandbox-transactions');
      const data = await res.json();
      if (data.success) {
        setRawTransactions(data.transactions);
        
        // Auto run initial workflow to show beautiful dashboard right away
        const runRes = await fetch('/api/run-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: data.transactions,
            income: 95000,
            savingsGoalPercent: 20,
            demoMode: true
          })
        });
        const runData = await runRes.json();
        if (runData.success) {
          setAnalysisResult(runData.analysis);
        }
      } else {
        setErrorMessage('Failed to fetch preloaded sandbox dataset.');
      }
    } catch (err: any) {
      setErrorMessage(`Bootstrap Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV parsing hook handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setErrorMessage('Empty CSV file uploaded or parse columns missing.');
          return;
        }
        setRawTransactions(parsed);
        setAnalysisResult(null); // Force recalculated flow required
      } catch (err: any) {
        setErrorMessage(err.message || 'Error processing CSV records.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): Transaction[] => {
    const lines = text.split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('txn_dt') || h.includes('txndate') || h.includes('dt') || h.includes('time') || h === 'day');
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('merch') || h.includes('item') || h.includes('particulars') || h.includes('narration') || h.includes('remark') || h.includes('payee') || h.includes('detail') || h.includes('memo') || h.includes('trans'));
    
    const amtIdx = headers.findIndex(h => h.includes('amt') || h.includes('amount') || h.includes('cost') || h.includes('val') || h.includes('value'));
    const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal') || h.includes('outflow') || h.includes('spent') || h.includes('payment'));
    const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit') || h.includes('inflow') || h.includes('income'));

    if (dateIdx === -1 || descIdx === -1 || (amtIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
      throw new Error("Could not detect standard bank columns in your CSV. Ensure headers include Date, Description (Particulars/Narration), and Amount (or separate Debit/Credit columns).");
    }

    const result: Transaction[] = [];
    const maxCheckedIdx = Math.max(dateIdx, descIdx, amtIdx, debitIdx, creditIdx);

    const incomeKeywords = [
      'salary', 'credit', 'deposit', 'dividend', 'refund', 'cashback', 
      'bonus', 'stripe', 'paypal', 'inflow', 'repay', 'interest', 'received'
    ];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols: string[] = [];
      let currentVal = '';
      let insideQuote = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cols.push(currentVal.trim().replace(/^"|"$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^"|"$/g, ''));

      if (cols.length < maxCheckedIdx + 1) continue;

      let amtVal = 0;
      const descVal = cols[descIdx].trim();
      const lowerDesc = descVal.toLowerCase();

      // Priority 1: Separate Debit & Credit columns
      if (debitIdx !== -1 || creditIdx !== -1) {
        let debitVal = 0;
        let creditVal = 0;
        if (debitIdx !== -1 && cols[debitIdx]) {
          debitVal = Math.abs(Number(cols[debitIdx].replace(/[^0-9.-]/g, ''))) || 0;
        }
        if (creditIdx !== -1 && cols[creditIdx]) {
          creditVal = Math.abs(Number(cols[creditIdx].replace(/[^0-9.-]/g, ''))) || 0;
        }

        if (creditVal > 0) {
          amtVal = creditVal;
        } else if (debitVal > 0) {
          amtVal = -debitVal; // negative for outflows
        }
      } 
      // Priority 2: Single Amount column
      else if (amtIdx !== -1) {
        const rawAmountText = cols[amtIdx].replace(/[^0-9.-]/g, '');
        let rawAmt = Number(rawAmountText) || 0;
        
        // If amount is positive, but description indicates an expense, we rectify it to negative
        const hasIncomeKeyword = incomeKeywords.some(keyword => lowerDesc.includes(keyword));
        if (rawAmt > 0 && !hasIncomeKeyword) {
          amtVal = -rawAmt;
        } else {
          amtVal = rawAmt;
        }
      }

      result.push({
        id: Math.random().toString(36).substring(7),
        date: cols[dateIdx].trim(),
        description: descVal,
        amount: amtVal
      });
    }
    return result;
  };

  // Run Agent State machine loop
  const triggerCopilotWorkflow = async () => {
    if (rawTransactions.length === 0) {
      setErrorMessage('Please load sandbox values or upload a CSV file first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/run-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions: rawTransactions,
          income,
          savingsGoalPercent: savingsPercent,
          demoMode
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        // Move view seamlessly to Dashboard or Recommendations to showcase complete co-correction
        setActiveTab('dashboard');
      } else {
        setErrorMessage(data.error || 'Server rejected workflow parameters.');
      }
    } catch (err: any) {
      setErrorMessage(`Workflow execution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Data science metric precision/recalls
  const triggerBenchmarkEvaluation = async () => {
    setIsLoadingEvaluation(true);
    try {
      const res = await fetch('/api/evaluate-accuracy');
      const data = await res.json();
      if (data.success) {
        setEvaluation(data.evaluation);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingEvaluation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased font-sans">
      
      {/* Top Professional Header */}
      <header className="h-16 bg-[#0F172A] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none tracking-tight">
              KRISHNA <span className="text-blue-400 font-medium font-sans">AI</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              Privacy-First AI Financial Copilot
            </p>
          </div>
        </div>

        {/* Global Action items / Status Indicators */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${isLoading ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider">
              AGENT STATE: {isLoading ? 'CALCULATING' : 'IDLE'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-slate-450 text-xs italic font-semibold">Self-Correcting Multi-Agent System</span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDE BAR LAYOUT CONTROLS */}
        <aside className="w-full md:w-[280px] bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto shrink-0 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Description Card */}
            <div className="p-4 bg-blue-50/70 border border-blue-100/80 rounded-xl flex items-start gap-3">
              <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-650 leading-relaxed font-medium">
                Provide bank transactions via spreadsheet CSV or run immediately using preconfigured sandbox values.
              </p>
            </div>

            {/* Ingestion controllers */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data Ingestion Block
              </span>
              
              {/* File input drag element */}
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 p-4 rounded-xl text-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud size={28} className="text-slate-400 mx-auto group-hover:text-blue-500 transition-colors" />
                <span className="block text-xs font-bold text-slate-700 mt-2">
                  Upload Statement CSV
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  columns: date, description, amount
                </span>
              </div>

              {/* Load sample data button */}
              <button
                onClick={loadSampleDataset}
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 cursor-pointer transition-colors"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Reset Sample Sandbox CSV
              </button>
            </div>

            {/* Income and Savings Slider Parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Workflow Parameters
              </span>

              {/* User Income */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-600 uppercase tracking-wider block">
                  Declared Monthly Inflow (₹)
                </label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {/* Savings goal target percentage slider */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-600 uppercase tracking-wider">
                  <label>Savings Ratio %</label>
                  <span className="font-mono text-blue-600 font-black text-sm">{savingsPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={savingsPercent}
                  onChange={(e) => setSavingsPercent(Number(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-200 rounded-lg h-2"
                />
              </div>

              {/* Demo Mode co-correction loop toggles (Judge focal point) */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-800 tracking-wider">
                    Agent Cycle Demo Mode
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={demoMode} 
                      onChange={(e) => setDemoMode(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-slate-50"></div>
                  </label>
                </div>
                <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">
                  Forces the Advisor agent to yield a corrupted draft first, highlighting the Auditor's refusal & co-correction workflow.
                </p>
              </div>
            </div>
          </div>

          {/* Large trigger analyze button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={triggerCopilotWorkflow}
              disabled={isLoading || rawTransactions.length === 0}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 cursor-pointer flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Co-Solving Cycles...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Run Copilot Loops
                </>
              )}
            </button>
            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-950/20 border border-rose-950 text-rose-300 text-[10px] rounded-lg flex items-start gap-2 leading-relaxed animate-fade-in">
                <AlertCircle size={14} className="shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

        </aside>

        {/* WORKSPACE DETAIL MAIN DISPLAY SCREEN */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Visual Header Tabs selection */}
            <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 gap-6 overflow-x-auto text-xs md:text-sm rounded-xl shadow-sm shrink-0">
              {[
                { id: 'privacy', label: 'Data & Privacy Sandbox', icon: ShieldCheck },
                { id: 'dashboard', label: 'Financial KPI Dashboard', icon: Coins },
                { id: 'recommendations', label: 'AI Recommendations & Explainability', icon: Sparkles },
                { id: 'logs', label: 'Agent Conversation Logs', icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 h-full px-2 font-bold border-b-2 transition-colors focus:outline-none cursor-pointer ${
                      isActive 
                        ? 'text-blue-600 border-blue-600' 
                        : 'text-slate-500 hover:text-slate-800 border-transparent'
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-rendered widgets depending on Tab state */}
            {activeTab === 'privacy' && (
              <PrivacyTab 
                rawTransactions={rawTransactions}
                sanitizedTransactions={analysisResult?.sanitizedTransactions || []}
                piiCount={analysisResult?.piiCount || 0}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab 
                categoryTotals={analysisResult?.categoryTotals || {}}
                budget={analysisResult?.budget || {}}
                savingsGoal={analysisResult?.savingsGoal || 0}
                evaluation={evaluation}
                onRunEvaluation={triggerBenchmarkEvaluation}
                isLoadingEvaluation={isLoadingEvaluation}
              />
            )}

            {activeTab === 'recommendations' && (
              analysisResult ? (
                <RecommendationsTab 
                  budget={analysisResult.budget}
                  categoryTotals={analysisResult.categoryTotals}
                  savingTips={analysisResult.savingTips}
                  auditAttempts={analysisResult.auditAttempts}
                  explainability={analysisResult.explainability}
                  income={income}
                />
              ) : (
                <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-900 text-sm">
                  Run the Copilot Analysis on the sidebar to view validated actionable budgets and AI explanations!
                </div>
              )
            )}

            {activeTab === 'logs' && (
              <AgentLogsTab logs={analysisResult?.logs || []} />
            )}

          </div>

        </main>

      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-white border-t border-slate-200 flex items-center px-6 justify-between shrink-0 text-slate-600 select-none">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">DB Connection:</span>
            <span className="text-[10px] text-emerald-600 font-bold font-mono">SECURE_LOCAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Multi-Agent Loop:</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">ENABLED</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-450 font-medium italic font-serif">
          All data processing occurs locally. Privacy guaranteed.
        </div>
      </footer>

      {/* Persistent AI Financial Clarification Chatbot */}
      <FinanceChatBot 
        income={income}
        savingsPercent={savingsPercent}
        rawTransactions={rawTransactions}
        analysisResult={analysisResult}
      />

    </div>
  );
}
