export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  confidence?: number;
  reason?: string;
  rawDescription?: string;
}

export interface SanitizedSummary {
  original: string;
  sanitized: string;
  maskedType: string; // 'EMAIL' | 'PHONE' | 'UPI' | 'ID' | 'NONE'
}

export interface SavingTip {
  title: string;
  category: string;
  expected_savings: number;
  reasoning: string;
  evidence_spent?: number;
}

export interface Budget {
  proposed_budget_per_category: Record<string, number>;
  savings_target: number;
  saving_tips: SavingTip[];
}

export interface AuditResponse {
  approved: boolean;
  issues: string[];
  required_changes: string[];
  audit_score: number;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: 'Privacy' | 'Bookkeeper' | 'Advisor' | 'Auditor' | 'Explainability' | 'Coordinator';
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: string;
}

export interface GoldenMetric {
  category: string;
  accuracy: number;
  precision: number;
  recall: number;
}

export interface EvaluationResult {
  overallAccuracy: number;
  byCategory: GoldenMetric[];
  totalEvaluated: number;
  correctCount: number;
}

export interface CopilotAnalysisResult {
  rawTransactions: Transaction[];
  sanitizedTransactions: Transaction[];
  piiCount: number;
  categoryTotals: Record<string, number>;
  budget: Record<string, number>;
  savingsGoal: number;
  savingTips: SavingTip[];
  auditAttempts: {
    attempt: number;
    budget: Record<string, number>;
    savings_target: number;
    audit: AuditResponse;
    status: 'APPROVED' | 'REJECTED';
  }[];
  explainability: {
    overview: string;
    tipsEvidence: Record<string, string>;
    auditPassedSummary: string;
  };
  logs: AgentLog[];
}
