import { getGoldenDataset, GoldenRow } from './sampleData';
import { runBookkeeperRuleset } from '../agents/bookkeeperAgent';
import { GoldenMetric, EvaluationResult, Transaction } from '../../src/types';

export function runGoldenDatasetEvaluation(): EvaluationResult {
  const golden = getGoldenDataset();
  
  // Create mock transactions to parse
  const mockTransactions: Transaction[] = golden.map((g, idx) => ({
    id: String(idx + 1),
    date: '2026-05-01',
    description: g.description,
    amount: -100 // dummy expense
  }));

  // Run bookkeeper categorization (local ruleset is deterministic and extremely fast for calculation)
  const categorized = runBookkeeperRuleset(mockTransactions);

  let correctCount = 0;
  
  // Initialize calculations
  const categories = Array.from(new Set(golden.map(g => g.expected_category)));
  
  const tp: Record<string, number> = {};
  const fp: Record<string, number> = {};
  const fn: Record<string, number> = {};
  const totalInCategory: Record<string, number> = {};

  categories.forEach(cat => {
    tp[cat] = 0;
    fp[cat] = 0;
    fn[cat] = 0;
    totalInCategory[cat] = 0;
  });

  categorized.forEach((t, idx) => {
    const expected = golden[idx].expected_category;
    const predicted = t.category || 'Transfers/Payments/Other';
    totalInCategory[expected]++;

    if (predicted === expected) {
      correctCount++;
      tp[expected]++;
    } else {
      // predicted != expected
      if (fp[predicted] !== undefined) fp[predicted]++;
      if (fn[expected] !== undefined) fn[expected]++;
    }
  });

  const overallAccuracy = correctCount / golden.length;

  const byCategory: GoldenMetric[] = categories.map(cat => {
    const tpVal = tp[cat];
    const fpVal = fp[cat];
    const fnVal = fn[cat];

    const precision = (tpVal + fpVal) > 0 ? tpVal / (tpVal + fpVal) : 1.0;
    const recall = (tpVal + fnVal) > 0 ? tpVal / (tpVal + fnVal) : 1.0;
    
    // category-specific accuracy
    const catAcc = totalInCategory[cat] > 0 ? tpVal / totalInCategory[cat] : 0;

    return {
      category: cat,
      accuracy: Math.round(catAcc * 100),
      precision: Math.round(precision * 100),
      recall: Math.round(recall * 100)
    };
  });

  return {
    overallAccuracy: Math.round(overallAccuracy * 100),
    byCategory,
    totalEvaluated: golden.length,
    correctCount
  };
}
