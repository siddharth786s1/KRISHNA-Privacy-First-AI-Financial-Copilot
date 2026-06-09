import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

import { getSampleTransactions } from './server/utils/sampleData';
import { runFinancialWorkflow } from './server/agents/agentWorkflow';
import { runGoldenDatasetEvaluation } from './server/utils/evaluation';
import { generateContentWithRetry } from './server/utils/geminiResiliency';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing limits expanded to handle banking sheets
  app.use(express.json({ limit: '10mb' }));

  // API Route: Server health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API Route: Return sample workspace bank data
  app.get('/api/sandbox-transactions', (req, res) => {
    try {
      const data = getSampleTransactions();
      res.json({ success: true, count: data.length, transactions: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Run the multi-agent co-correction financial analysis
  app.post('/api/run-analysis', async (req, res) => {
    try {
      const { transactions, income, savingsGoalPercent, demoMode } = req.body;

      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ success: false, error: 'Empty or missing transactions array.' });
      }

      const inputIncome = Number(income) || 50000;
      const inputGoal = Number(savingsGoalPercent) !== undefined ? Number(savingsGoalPercent) : 20;
      const inputDemo = !!demoMode;

      console.log(`[Server] Running financial copilot with income=₹${inputIncome}, goal=${inputGoal}%, demo=${inputDemo}`);
      const result = await runFinancialWorkflow(transactions, inputIncome, inputGoal, inputDemo);

      res.json({ success: true, analysis: result });
    } catch (err: any) {
      console.error('[Server Error] Agent workflow run error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal Agent loop failure.' });
    }
  });

  // API Route: Run evaluations on the 100-row Golden Dataset
  app.get('/api/evaluate-accuracy', (req, res) => {
    try {
      console.log('[Server] Computing precision & recall metrics on 100-row golden dataset...');
      const results = runGoldenDatasetEvaluation();
      res.json({ success: true, evaluation: results });
    } catch (err: any) {
      console.error('[Server Error] Evaluation metrics trigger failure:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Conversational assistant chatbot route using gemini-3.5-flash
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '';

      if (!isKeyValid) {
        // High quality simulated conversational fallback responses to verify flow without keys
        const lastMessage = messages[messages.length - 1]?.content || "";
        let text = "";
        if (lastMessage.toLowerCase().includes("save") || lastMessage.toLowerCase().includes("saving")) {
          text = "To scale your monthly savings, cutting down on excessive **Food & Dining** delivery orders is key. Placing a sensible ₹5,000 budget (instead of spending ₹10,400 historically) can immediately reclaim an extra ₹5,400 buffer toward your ₹19,000 threshold requirement.";
        } else if (lastMessage.toLowerCase().includes("category") || lastMessage.toLowerCase().includes("spent")) {
          text = "Looking at your ledger distribution, your primary outflows are **Housing/Rent** (fixed at ₹34,000), **Shopping** (impulse spending around ₹9,350), and **Food & Dining** (high dining run rates totaling ₹10,400). Reducing flexible spend limits is the most viable strategy.";
        } else {
          text = "Greetings! I am Krishna, your Privacy-First Financial Copilot chatbot. I can help clear up doubts about your budget allocations, transaction counts, PII masking, or co-correction iterations! Ask me anything.";
        }
        return res.json({ success: true, text });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are KRISHNA AI, a helpful, precise, and privacy-first financial copilot chat assistant.
Your goal is to answer questions to clearify doubt concerning the user's budget recommendations, transaction records, audit compliance loop, or general finance.

Current session context parameters for accuracy:
- Declared Monthly Inflow (Income): ₹${context?.income || '95,000'}
- Target Savings percentage: ${context?.savingsPercent || '20'}%
- Total Ingestion Ledger transactions: ${context?.transactionCount || 0}
- Current co-corrected active budget: ${JSON.stringify(context?.budget || {})}
- Active savings tip items: ${JSON.stringify(context?.savingTips || [])}

Never hallucinate transactions. Address the user directly, and keep responses concise, conversational, and visually professional. Refuse to reveal private details if PII mask is absent (piiCount: ${context?.piiCount || 0}).`;

      // Structure messages list into Gemini standard roles ('user' or 'model')
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ success: true, text: response.text || "I apologize, I wasn't able to construct a response. How can I help you today?" });
    } catch (err: any) {
      console.error('[Server Error] Chatbot copilot response failure:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite Developer middleware versus Static build folder deployment
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Mounting Vite developer dynamic HMR middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Operating under secure certified production static fileserving...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Gateway Server] Listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Bootstrap server error]:', err);
});
