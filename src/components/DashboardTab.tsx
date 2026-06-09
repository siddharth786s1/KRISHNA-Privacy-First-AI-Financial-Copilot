import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { EvaluationResult, Transaction } from '../types';
import { TrendingDown, TrendingUp, AlertTriangle, Coins, Wallet, Sparkles, CheckCircle, Database } from 'lucide-react';

interface DashboardTabProps {
  categoryTotals: Record<string, number>;
  budget: Record<string, number>;
  savingsGoal: number;
  evaluation: EvaluationResult | null;
  onRunEvaluation: () => void;
  isLoadingEvaluation: boolean;
}

export default function DashboardTab({
  categoryTotals,
  budget,
  savingsGoal,
  evaluation,
  onRunEvaluation,
  isLoadingEvaluation
}: DashboardTabProps) {

  // Process data for charts
  const totalIncome = categoryTotals['Income'] || 0;
  
  // Expenses (convert negative categoryTotals entries to positive amounts for charting)
  const expenseCategories = Object.keys(categoryTotals).filter(cat => cat !== 'Income');
  const expensesData = expenseCategories.map(cat => ({
    name: cat,
    value: Math.abs(categoryTotals[cat] || 0)
  })).filter(item => item.value > 0);

  const totalExpenses = expensesData.reduce((sum, item) => sum + item.value, 0);
  const remainingBalance = totalIncome - totalExpenses;

  // Pie chart colors
  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7'
  ];

  // Budget vs Actual data
  const budgetVsActualData = Object.keys(budget).map(cat => {
    const act = Math.abs(categoryTotals[cat] || 0);
    const bud = budget[cat] || 0;
    return {
      category: cat.replace('/Subscriptions', '').replace('/Pharmacy/Insurance', ''),
      Budget: Math.round(bud),
      Actual: Math.round(act)
    };
  });

  // Calculate alerts
  const overspendingCategories: { name: string; budget: number; actual: number }[] = [];
  const topSpentCategories = [...expensesData].sort((a, b) => b.value - a.value).slice(0, 3);
  const spikes: { name: string; ratio: number }[] = [];

  Object.keys(budget).forEach(cat => {
    const actual = Math.abs(categoryTotals[cat] || 0);
    const limit = budget[cat] || 0;
    if (actual > limit && limit > 0) {
      overspendingCategories.push({ name: cat, budget: limit, actual });
    }
    if (totalExpenses > 0) {
      const ratio = actual / totalExpenses;
      if (ratio > 0.3) {
        spikes.push({ name: cat, ratio });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Inflow (Salary)', value: totalIncome, icon: Coins, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { title: 'Total Outflows (Expenses)', value: totalExpenses, icon: TrendingDown, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { title: 'Target Savings Buffer', value: savingsGoal, icon: Wallet, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { title: 'Net Retained Balance', value: remainingBalance, icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-xs uppercase tracking-wider font-extrabold text-slate-400">{kpi.title}</span>
                <span className="block text-2xl font-black text-slate-800 font-mono mt-1">
                  ₹{Math.round(Math.abs(kpi.value)).toLocaleString()}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color} shadow-xs`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Budget vs Actual Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Coins size={16} className="text-blue-600" />
            Budget Guidelines vs. Actual Spends (Monthly)
          </h4>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie & Alerts Panel */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Outflow Spread By Category
            </h4>
            {expensesData.length > 0 ? (
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="55%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Spent']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Micro Sidebar Legend */}
                <div className="absolute right-0 top-2 bottom-2 overflow-y-auto w-28 text-[9px] font-bold text-slate-500 flex flex-col justify-center space-y-1">
                  {expensesData.slice(0, 5).map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1 cursor-default">
                      <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span className="truncate">{entry.name.replace('/Rent', '').replace('Transfers/', 'Trans./')}</span>
                    </div>
                  ))}
                  {expensesData.length > 5 && <span className="text-[8px] text-slate-400 block pl-2">+{expensesData.length - 5} more</span>}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                No ledger records available to compile chart.
              </div>
            )}
          </div>

          {/* Rule engine alerts */}
          <div className="pt-4 border-t border-slate-150 space-y-3 flex-1 flex flex-col justify-end">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Copilot Safety Scans
            </span>
            <div className="space-y-2">
              {overspendingCategories.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-xs bg-rose-50 text-rose-800 p-2 border border-rose-100 rounded-lg">
                  <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                  <span className="truncate">Over-spend in <strong>{item.name}</strong> (+₹{Math.round(item.actual - item.budget)})</span>
                </div>
              ))}
              {spikes.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 p-2 border border-amber-100 rounded-lg">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span className="truncate">Spending Spike: <strong>{item.name}</strong> consumes {Math.round(item.ratio * 100)}% of expenses.</span>
                </div>
              ))}
              {overspendingCategories.length === 0 && spikes.length === 0 && (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 p-2 border border-emerald-100 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span>Budget compliance matches ledger guidelines. Secure state.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Golden Dataset Evaluation Section (Judge-Focussed) */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
              <Database size={20} className="text-blue-600" />
              Categorizer Benchmarking (100-Row Golden Dataset Evaluation)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Test classification performance parameters against our reference dataset. Running this validates actual bookkeeper agent reliability.
            </p>
          </div>
          <button
            onClick={onRunEvaluation}
            disabled={isLoadingEvaluation}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-100 cursor-pointer flex items-center gap-2 transition-colors shrink-0"
          >
            {isLoadingEvaluation ? (
              <>
                <Sparkles size={14} className="animate-spin" /> Calculating Indexes...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Trigger Golden Run
              </>
            )}
          </button>
        </div>

        {evaluation ? (
          <div className="space-y-6 animate-fade-in text-slate-700">
            {/* Evaluation Score overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
              <div className="text-center p-3">
                <span className="block text-sm font-medium text-slate-500">Benchmark Scale</span>
                <span className="block text-2xl font-bold text-blue-600 font-mono mt-1">
                  {evaluation.totalEvaluated} Rows
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ground Truth Dataset</span>
              </div>
              <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-200">
                <span className="block text-sm font-medium text-slate-500">Overall Accuracy</span>
                <span className="block text-2xl font-bold text-emerald-600 font-mono mt-1">
                  {evaluation.overallAccuracy}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Correct Classifications</span>
              </div>
              <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-200">
                <span className="block text-sm font-medium text-slate-500">Average Precision</span>
                <span className="block text-2xl font-bold text-cyan-600 font-mono mt-1">
                  {Math.round(evaluation.byCategory.reduce((acc, c) => acc + c.precision, 0) / evaluation.byCategory.length)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Precision Index</span>
              </div>
              <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-200">
                <span className="block text-sm font-medium text-slate-500">Average Recall</span>
                <span className="block text-2xl font-bold text-amber-600 font-mono mt-1">
                  {Math.round(evaluation.byCategory.reduce((acc, c) => acc + c.recall, 0) / evaluation.byCategory.length)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Recall Index</span>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3">Financial Category Classification Clusters</th>
                    <th className="p-3 text-center">Dataset Accuracy (TP Ratio)</th>
                    <th className="p-3 text-center">Precision Score</th>
                    <th className="p-3 text-center">Recall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.byCategory.map((row) => (
                    <tr key={row.category} className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors text-slate-700">
                      <td className="p-3 font-semibold text-slate-800">{row.category}</td>
                      <td className="p-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${row.accuracy >= 90 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>
                          {row.accuracy}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-cyan-600 font-bold">{row.precision}%</td>
                      <td className="p-3 text-center font-mono text-amber-600 font-bold">{row.recall}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
            Benchmarking has not been initiated. Click the trigger button to evaluate precision, recall, and categorical metrics!
          </div>
        )}
      </div>
    </div>
  );
}
