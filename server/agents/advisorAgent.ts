import { GoogleGenAI, Type } from '@google/genai';
import { Budget, SavingTip } from '../../src/types';
import { generateContentWithRetry, safeParseJSON } from '../utils/geminiResiliency';

// Let's implement local rules for the budget to guarantee success
export function runAdvisorLocal(
  categoryTotals: Record<string, number>,
  income: number,
  savingsGoalPercent: number,
  attempt: number,
  demoMode: boolean
): Budget {
  const savingsGoalValue = (savingsGoalPercent / 100) * income;

  // Let's analyze historical spending
  // Category totals are negative numbers since they are expenses
  const historicalFood = Math.abs(categoryTotals['Food & Dining'] || 0);
  const historicalGroceries = Math.abs(categoryTotals['Groceries'] || 0);
  const historicalHousing = Math.abs(categoryTotals['Housing/Rent'] || 0);
  const historicalUtilities = Math.abs(categoryTotals['Utilities'] || 0);
  const historicalTransport = Math.abs(categoryTotals['Transport/Travel'] || 0);
  const historicalShopping = Math.abs(categoryTotals['Shopping'] || 0);
  const historicalEntertainment = Math.abs(categoryTotals['Entertainment/Subscriptions'] || 0);
  const historicalHealth = Math.abs(categoryTotals['Health/Pharmacy/Insurance'] || 0);
  const historicalOthers = Math.abs(categoryTotals['Transfers/Payments/Other'] || 0);

  // If in Demo Mode and Attempt 1, generate a flawed budget that the Auditor will reject!
  if (demoMode && attempt === 1) {
    return {
      proposed_budget_per_category: {
        'Housing/Rent': historicalHousing || 28000,
        'Groceries': 4000,
        'Food & Dining': 800, // VIOLATION 1: Historically spent high (e.g. ~6000), but advised ₹800 (under 2% of income & unrealistic)
        'Transport/Travel': 1000,
        'Utilities': 2000,
        'Shopping': 1000,
        'Entertainment/Subscriptions': 500,
        'Health/Pharmacy/Insurance': 2000,
        'Transfers/Payments/Other': 5000
      },
      savings_target: income * 0.05, // VIOLATION 2: Savings is only 5% of income, violating the minimum 10% Auditor threshold
      saving_tips: [
        {
          title: 'Extreme Dining Cutback',
          category: 'Food & Dining',
          expected_savings: 5000,
          reasoning: 'Cut down restaurant visits entirely to fit the tight ₹800 budget limit.' // VIOLATION 3: Unreasonable cut/No actual audit-evidence basis
        }
      ]
    };
  }

  // Else, generate a healthy, balanced budget
  // Distribute remaining income realistically
  const proposedHousing = historicalHousing || 28000;
  const proposedUtilities = historicalUtilities || 3200;
  const proposedHealth = historicalHealth || 3000;
  
  // Calculate remaining room for other flexible categories
  const fixedCost = proposedHousing + proposedUtilities + proposedHealth;
  const flexiblePool = income - savingsGoalValue - fixedCost;

  // Realistically allocate budgets based on history, capping with a gentle saving pressure
  const proposedFood = Math.max(income * 0.03, Math.min(historicalFood, flexiblePool * 0.25)); 
  const proposedGroceries = Math.max(income * 0.04, Math.min(historicalGroceries, flexiblePool * 0.25));
  const proposedTransport = Math.max(income * 0.02, Math.min(historicalTransport, flexiblePool * 0.15));
  const proposedShopping = Math.min(historicalShopping, flexiblePool * 0.15);
  const proposedEntertainment = Math.min(historicalEntertainment, flexiblePool * 0.10);
  const proposedOthers = flexiblePool - (proposedFood + proposedGroceries + proposedTransport + proposedShopping + proposedEntertainment);

  const budgetAllocation: Record<string, number> = {
    'Housing/Rent': proposedHousing,
    'Groceries': Math.round(proposedGroceries),
    'Food & Dining': Math.round(proposedFood),
    'Transport/Travel': Math.round(proposedTransport),
    'Utilities': Math.round(proposedUtilities),
    'Shopping': Math.round(proposedShopping),
    'Entertainment/Subscriptions': Math.round(proposedEntertainment),
    'Health/Pharmacy/Insurance': Math.round(proposedHealth),
    'Transfers/Payments/Other': Math.round(Math.max(0, proposedOthers))
  };

  // Build highly personalized actionable tips based on observed spending!
  const tips: SavingTip[] = [];

  if (historicalFood > 3000) {
    const savings = Math.round(historicalFood * 0.35);
    tips.push({
      title: 'Optimize Food Orders',
      category: 'Food & Dining',
      expected_savings: savings,
      reasoning: `You spent ${historicalFood} on food delivery. Reducing 2 Swiggy/Zomato orders per week can save approximately ${savings} monthly while shifting towards home-cooked alternatives.`
    });
  }

  if (historicalShopping > 4000) {
    const savings = Math.round(historicalShopping * 0.3);
    tips.push({
      title: 'Postpone Unplanned Shopping',
      category: 'Shopping',
      expected_savings: savings,
      reasoning: `You spent ${historicalShopping} on shopping portals. Implementing a 48-hour cool-off rule before checking out on Amazon will save around ${savings} on impulsive apparel/electronics.`
    });
  }

  if (historicalEntertainment > 500) {
    // If user has subscription spends, trigger active subscription consolidation
    tips.push({
      title: 'Consolidate Media Subscriptions',
      category: 'Entertainment/Subscriptions',
      expected_savings: 150,
      reasoning: `You have active Spotify, Netflix, and YouTube subscriptions. Pausing one unused platform can save 150/month.`
    });
  }

  // Ensure there is at least 1 subscription optimization tip if there is entertainment spending (mandatory rule)
  if (historicalEntertainment > 0 && !tips.some(t => t.category === 'Entertainment/Subscriptions')) {
    tips.push({
      title: 'Cancel Sleeping Entertainment Subscriptions',
      category: 'Entertainment/Subscriptions',
      expected_savings: 149,
      reasoning: `You have subscriptions active. Trimming dormant entertainment platforms saves 149/month.`
    });
  }

  return {
    proposed_budget_per_category: budgetAllocation,
    savings_target: savingsGoalValue,
    saving_tips: tips
  };
}

// Full-Stack Agent Dispatcher
export async function runAdvisorAgent(
  categoryTotals: Record<string, number>,
  income: number,
  savingsGoalPercent: number,
  attempt: number,
  demoMode: boolean
): Promise<Budget> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '';

  if (!isKeyValid) {
    console.log('[Advisor Agent] No valid Gemini API Key. Proceeding with Local Rule engine Budget generator.');
    return runAdvisorLocal(categoryTotals, income, savingsGoalPercent, attempt, demoMode);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // In demo mode and attempt 1, force AI to output a failing draft by instructing it to do so
    let forceInstruction = '';
    if (demoMode && attempt === 1) {
      forceInstruction = `For this run, you MUST intentionally commit the following compliance violations:
1. Set the Food & Dining budget to ₹800 (this is extremely unrealistic given their history and is less than 2% of their income).
2. Set the savings_target to be exactly 5% of their income (which is below the mandatory auditor rule of 10% minimal savings).
3. Draft a single, unrealistic saving tip in Food & Dining that lacks realistic evidence.`;
    } else if (demoMode && attempt > 1) {
      forceInstruction = `This is a REVISED draft. You must CORRECT the previous issues:
1. Increase the savings_target to at least 15% to 20% of income.
2. Set the Food & Dining budget to a realistic ₹5000 (representing a safe, achievable scale-back from their historical spending).
3. Ensure there is at least one Media Subscription consolidation tip (since they have subscription transactions).`;
    }

    const prompt = `You are the Advisor Agent in a Copilot workflow.
Your goal is to build a monthly budget allocation and actionable savings tips for the user.

User data:
- Monthly Income: ₹${income}
- Target Savings Goal: ${savingsGoalPercent}% (expected ₹${(savingsGoalPercent / 100) * income})
- Past Spending Aggregates (category totals are negative values):
${JSON.stringify(categoryTotals, null, 2)}

Required categories are:
- Housing/Rent
- Groceries
- Food & Dining
- Transport/Travel
- Utilities
- Shopping
- Entertainment/Subscriptions
- Health/Pharmacy/Insurance
- Transfers/Payments/Other

${forceInstruction}

Your output must be a well-structured JSON object fitting this schema:
{
  "proposed_budget_per_category": {
    "Housing/Rent": number,
    "Groceries": number,
    "Food & Dining": number,
    ...
  },
  "savings_target": number,
  "saving_tips": [
    {
      "title": string,
      "category": string,
      "expected_savings": number,
      "reasoning": string
    }
  ]
}

Provide ONLY raw JSON, no markdown wrappers except raw text.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proposed_budget_per_category: {
              type: Type.OBJECT,
              properties: {
                'Housing/Rent': { type: Type.NUMBER },
                'Groceries': { type: Type.NUMBER },
                'Food & Dining': { type: Type.NUMBER },
                'Transport/Travel': { type: Type.NUMBER },
                'Utilities': { type: Type.NUMBER },
                'Shopping': { type: Type.NUMBER },
                'Entertainment/Subscriptions': { type: Type.NUMBER },
                'Health/Pharmacy/Insurance': { type: Type.NUMBER },
                'Transfers/Payments/Other': { type: Type.NUMBER }
              },
              required: [
                'Housing/Rent',
                'Groceries',
                'Food & Dining',
                'Transport/Travel',
                'Utilities',
                'Shopping',
                'Entertainment/Subscriptions',
                'Health/Pharmacy/Insurance',
                'Transfers/Payments/Other'
              ]
            },
            savings_target: { type: Type.NUMBER },
            saving_tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  expected_savings: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ['title', 'category', 'expected_savings', 'reasoning']
              }
            }
          },
          required: ['proposed_budget_per_category', 'savings_target', 'saving_tips']
        }
      }
    });

    const parsed: Budget = safeParseJSON<Budget>(response.text || '{}');
    return parsed;
  } catch (err) {
    console.error('[Advisor Agent] AI Budget draft generation failed. Falling back to local template generator.', err);
    return runAdvisorLocal(categoryTotals, income, savingsGoalPercent, attempt, demoMode);
  }
}
