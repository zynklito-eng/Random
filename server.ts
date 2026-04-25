import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const PORT = 3000;

const SYSTEM_PROMPT = `
You are a helpful and polite customer support AI for "Premium Accounts Hub", a store for premium accounts and subscriptions.
CRITICAL RULES:
1. You answer ONLY questions related to this website (buying process, products, GCash payment, delivery).
2. If asked about ANYTHING else, reply: "I can only assist with questions about this website. Please ask something related to your purchase."
3. If the user indicates they want to pay or buy: "Thank you for your purchase intent! The Admin is currently offline. Please wait for the Admin to come online to process your payment. Your message has been saved and will be attended to shortly."
4. You must never pretend to be the Admin, never accept payments, and never promise account delivery instantly.
`;

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const contents = history && Array.isArray(history) ? [...history] : [];
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      return res.json({ reply: response.text });
    } catch (error) {
      console.error('AI Error:', error);
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
