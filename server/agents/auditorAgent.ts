import { Budget, AuditResponse } from '../../src/types';

export function runAuditorAgent(
  budget: Budget,
  categoryTotals: Record<string, number>,
  income: number
): AuditResponse {
  const issues: string[] = [];
  const required_changes: string[] = [];
  let score = 100;

  // Rule 1: Sum of category budgets + savings must be <= income
  const proposedBudgets = budget.proposed_budget_per_category;
  const categoriesSum = Object.values(proposedBudgets).reduce((sum, val) => sum + val, 0);
  const totalAllocated = categoriesSum + budget.savings_target;

  if (totalAllocated > income) {
    const overflow = totalAllocated - income;
    issues.push(`Budget Overdraft: Total proposed allocations (budgets + savings) equal ₹${totalAllocated}, which exceeds monthly income of ₹${income} by ₹${overflow}.`);
    required_changes.push(`Reduce category budgets or lower the savings target to balance total allocation within the ₹${income} income ceiling.`);
    score -= 30;
  }

  // Rule 2: Savings should be at least 10% of income
  const savingsRatio = budget.savings_target / income;
  if (savingsRatio < 0.1) {
    issues.push(`Insufficient Savings: Proposed savings target is ₹${budget.savings_target} (${(savingsRatio * 100).toFixed(1)}%), which falls below the secure 10% minimal thrift threshold.`);
    required_changes.push(`Increase monthly savings allocation to at least 10% of income (₹${income * 0.1}).`);
    score -= 25;
  }

  // Rule 3: Food & Dining budget must be at least 2% of income (avoid starving)
  const proposedFood = proposedBudgets['Food & Dining'] || 0;
  const foodRatio = proposedFood / income;
  if (foodRatio < 0.02) {
    issues.push(`Unrealistic Meals Allowance: Food & Dining budget of ₹${proposedFood} (${(foodRatio * 100).toFixed(1)}%) is dangerous or unhealthy.`);
    required_changes.push(`Increase Food & Dining allocation to a minimum of 2% of income (₹${income * 0.02}) to reflect necessary sustenance.`);
    score -= 25;
  }

  // Rule 4: If subscription history exists, require at least 1 active subscription tip
  const historicalEntertainment = Math.abs(categoryTotals['Entertainment/Subscriptions'] || 0);
  const hasSubscriptionTip = budget.saving_tips.some(
    (t) => t.category === 'Entertainment/Subscriptions'
  );
  if (historicalEntertainment > 0 && !hasSubscriptionTip) {
    issues.push(`Missed Subscription Optimization: Detected ₹${historicalEntertainment} spent on entertainment/platforms, but no active subscription trimmer or optimization tip was provided.`);
    required_changes.push(`Provide an actionable subscription consolidation or pausing tip within Entertainment/Subscriptions (e.g. Pause Spotify/Netflix/YouTube for savings).`);
    score -= 20;
  }

  // Rule 5: Compare Food & Dining to historical spending (avoid unrealistic budget drops)
  const historicalFood = Math.abs(categoryTotals['Food & Dining'] || 0);
  if (historicalFood >= 3000 && proposedFood < historicalFood * 0.3) {
    issues.push(`Over-Aggressive Budget Cut: Proposed Food & Dining budget (₹${proposedFood}) is more than a 70% decrease from your observed historical spend (₹${historicalFood}), which is unsustainable.`);
    required_changes.push(`Raise Food & Dining budget to at least 30-50% of history (₹${Math.round(historicalFood * 0.4)}) for a gradual and viable reduction plan.`);
    score -= 20;
  }

  // Verify that any tips actually map to categories the user has spent on (No hallucinated tips)
  for (const tip of budget.saving_tips) {
    const historicalSpend = Math.abs(categoryTotals[tip.category] || 0);
    if (historicalSpend === 0) {
      issues.push(`Irrelevant Tip: Provided savings tip titled "${tip.title}" for "${tip.category}", but there is no historical spending recorded in that category.`);
      required_changes.push(`Remove suggestions for the empty "${tip.category}" category and prioritize active spend areas.`);
      score -= 10;
    }
  }

  // Final score constraints
  score = Math.max(0, score);
  const approved = score >= 90 && issues.length === 0;

  return {
    approved,
    issues,
    required_changes,
    audit_score: score
  };
}
