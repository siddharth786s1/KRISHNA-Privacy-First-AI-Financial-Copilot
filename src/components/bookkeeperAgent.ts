import { GoogleGenAI, Type } from '@google/genai';
import { Transaction } from '../../src/types';
import { generateContentWithRetry, safeParseJSON } from '../utils/geminiResiliency';

const FIXED_CATEGORIES = [
  'Income',
  'Housing/Rent',
  'Groceries',
  'Food & Dining',
  'Transport/Travel',
  'Utilities',
  'Shopping',
  'Entertainment/Subscriptions',
  'Health/Pharmacy/Insurance',
  'Transfers/Payments/Other'
];

interface Ruleset {
  category: string;
  keywords: string[];
}

const FALLBACK_RULESET: Ruleset[] = [
  {
    category: 'Income',
    keywords: ['salary', 'bonus', 'dividend', 'interest', 'payout', 'deposit', 'credit', 'remittance', 'compensation']
  },
  {
    category: 'Housing/Rent',
    keywords: ['rent', 'housing', 'lease', 'dep', 'deposit', 'maintenance', 'association', 'stayabode', 'zolo', 'flat', 'homeloan', 'emi', 'brokerage']
  },
  {
    category: 'Groceries',
    keywords: ['grocery', 'groceries', 'dmart', 'bigbasket', 'instamart', 'zepto', 'blinkit', 'market', 'frui', 'veg', 'nature', 'basket', 'superstore', 'smart']
  },
  {
    category: 'Food & Dining',
    keywords: ['swiggy', 'zomato', 'food', 'starbucks', 'coffee', 'mcdonald', 'burger', 'pizza', 'domino', 'restaurant', 'dining', 'tavern', 'cafe', 'pub', 'sweet', 'bakery']
  },
  {
    category: 'Transport/Travel',
    keywords: ['uber', 'ola', 'metro', 'cab', 'taxi', 'travel', 'trip', 'flight', 'indigo', 'makemytrip', 'petrol', 'gail', 'hp', 'shell', 'parking', 'rapido', 'irctc', 'rail', 'train']
  },
  {
    category: 'Utilities',
    keywords: ['electricity', 'utility', 'utilities', 'recharge', 'broadband', 'wifi', 'fiber', 'jio', 'airtel', 'phone', 'bill', 'mobile', 'png', 'gas', 'water', 'postpaid', 'tata play', 'cable']
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'flipkart', 'shopping', 'zara', 'clothes', 'apparel', 'fashion', 'myntra', 'adidas', 'puma', 'nike', 'ajio', 'nykaa', 'sports', 'decathlon', 'crocs', 'miniso', 'lenskart']
  },
  {
    category: 'Entertainment/Subscriptions',
    keywords: ['netflix', 'spotify', 'youtube', 'prime', 'subscription', 'hotstar', 'disney', 'bookmyshow', 'ticket', 'movie', 'show', 'game', 'playstation', 'xbox', 'steam', 'medium', 'apple']
  },
  {
    category: 'Health/Pharmacy/Insurance',
    keywords: ['pharmacy', 'apollo', 'drug', 'medicine', 'insurance', 'life insurance', 'medical', 'hospital', 'clinic', 'wellness', 'practo', 'care', 'gym', 'fitness', 'doctor', 'dental']
  },
  {
    category: 'Transfers/Payments/Other',
    keywords: ['transfer', 'cc outstanding', 'imps', 'neft', 'mutual', 'fund', 'sip', 'cash', 'atm', 'sent', 'paid', 'adjust', 'fees', 'stamp', 'charge']
  }
];

// Local categorizer fallback
export function runBookkeeperRuleset(transactions: Transaction[]): Transaction[] {
  return transactions.map((t) => {
    const cleanDesc = t.description.toLowerCase();
    let bestCategory = 'Transfers/Payments/Other';
    let maxMatches = 0;
    let confidence = 0.5;
    let reason = 'Default category based on transactional nature';

    for (const rule of FALLBACK_RULESET) {
      let matches = 0;
      for (const kw of rule.keywords) {
        if (cleanDesc.includes(kw)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = rule.category;
        confidence = 0.8 + Math.min(0.19, matches * 0.05); // dynamic confidence based on triggers count
        reason = `Matched keyword "${rule.keywords.find(k => cleanDesc.includes(k))}" in transaction description`;
      }
    }

    // Specific adjustment for salary which is major
    if (t.amount > 10000 && bestCategory === 'Transfers/Payments/Other' && cleanDesc.includes('ref')) {
      // Possible payroll credit
      bestCategory = 'Income';
      confidence = 0.7;
      reason = 'Heuristic: High value credit classified as Income';
    }

    return {
      ...t,
      category: bestCategory,
      confidence,
      reason
    };
  });
}

// AI-based categorizer
export async function runBookkeeperAgent(transactions: Transaction[]): Promise<Transaction[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '';

  if (!isKeyValid) {
    console.log('[Bookkeeper Agent] No valid Gemini API Key. Proceeding with Local Rule engine Fallback.');
    return runBookkeeperRuleset(transactions);
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

    const batchInput = transactions.map(t => ({ id: t.id, description: t.description, amount: t.amount }));
    
    const prompt = `You are the Bookkeeper Agent in a Privacy-First Copilot.
Your job is to accurately categorize transactions into EXACTLY these 10 categories:
${FIXED_CATEGORIES.join('\n')}

For each transaction, output a JSON array of objects representing classification results.
Avoid any markdown surrounding except raw JSON.
Output schema format:
[
  {
    "id": "1",
    "category": "Housing/Rent",
    "confidence": 0.98,
    "reason": "Description mentions rent and monthly flat maintenance"
  }
]

Do not omit any transaction ID from the input; you must categorize all of them.
Inputs:
${JSON.stringify(batchInput, null, 2)}`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ['id', 'category', 'confidence', 'reason']
          }
        }
      }
    });

    const responseText = response.text || '';
    const parsed: { id: string; category: string; confidence: number; reason: string }[] = safeParseJSON<any[]>(responseText);

    const mapped = transactions.map((t) => {
      const match = parsed.find(item => item.id === t.id);
      if (match && FIXED_CATEGORIES.includes(match.category)) {
        return {
          ...t,
          category: match.category,
          confidence: match.confidence,
          reason: match.reason
        };
      }
      // If mismatch or malformed category, slide to fallback
      return runBookkeeperRuleset([t])[0];
    });

    return mapped;
  } catch (error) {
    console.error('[Bookkeeper Agent] Gemini API Error during categorization. Falling back to local engine.', error);
    return runBookkeeperRuleset(transactions);
  }
}
