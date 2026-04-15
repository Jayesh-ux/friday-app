// FRIDAY API - Optimized for SaaS
// Features: SSE streaming, session management, AI integration

const AI_MODELS = {
  groq: {
    name: 'Groq (Llama)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  openai: {
    name: 'OpenAI (GPT-4o-mini)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini'
  },
  opencode: {
    name: 'OpenCode',
    endpoint: 'https://api.opencode.ai/v1/chat/completions',
    apiKey: process.env.OPENCODE_API_KEY,
    model: 'opencode'
  }
};

// Use first available AI provider
const getAIConfig = () => {
  for (const [key, config] of Object.entries(AI_MODELS)) {
    if (config.apiKey) {
      return { ...config, key };
    }
  }
  return null;
};

const SYSTEM_PROMPT = `You are FRIDAY - Tony Stark's female AI assistant.
- Be conversational, warm, intelligent, helpful
- Keep responses concise (under 80 words unless code)
- Use minimal tokens - be efficient
- Speak naturally like a real personal assistant
- You help with coding, architecture, research, brainstorming
- User is Jayesh Singh - a Full Stack Developer`;

// In-memory session store (use Redis/DB for production)
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      tokenUsage: { prompt: 0, completion: 0, total: 0 }
    });
  }
  return sessions.get(sessionId);
}

async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Health & session info
  if (req.method === 'GET') {
    const sessionId = req.headers['x-session-id'] || 'default';
    const session = getSession(sessionId);
    const aiConfig = getAIConfig();
    
    return res.status(200).json({
      status: 'ok',
      name: 'FRIDAY API',
      version: '2.0',
      ai: aiConfig ? aiConfig.name : 'demo',
      session: {
        id: sessionId,
        messageCount: session.messages.length,
        tokens: session.tokenUsage
      }
    });
  }

  // POST - Chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      messages, 
      sessionId = 'default',
      stream = true 
    } = req.body || {};

    const userMsg = messages?.[messages?.length - 1]?.content || '';
    
    if (!userMsg) {
      return res.status(400).json({ error: 'No message content' });
    }

    const session = getSession(sessionId);
    session.messages.push({ role: 'user', content: userMsg });

    const aiConfig = getAIConfig();

    // DEMO MODE - No AI configured
    if (!aiConfig) {
      const demoResponse = generateDemoResponse(userMsg);
      session.messages.push({ role: 'assistant', content: demoResponse });
      
      return res.status(200).json({
        choices: [{
          message: { role: 'assistant', content: demoResponse }
        }],
        usage: { total_tokens: 50 },
        demo: true
      });
    }

    // REAL AI - Call provider
    try {
      const aiResponse = await callAI(aiConfig, session.messages);
      
      session.messages.push({ role: 'assistant', content: aiResponse.content });
      session.tokenUsage.prompt += aiResponse.usage.prompt_tokens;
      session.tokenUsage.completion += aiResponse.usage.completion_tokens;
      session.tokenUsage.total += aiResponse.usage.total_tokens;

      return res.status(200).json({
        choices: [{
          message: { role: 'assistant', content: aiResponse.content }
        }],
        usage: aiResponse.usage
      });

    } catch (aiError) {
      console.error('AI Error:', aiError.message);
      
      // Fallback to demo
      const demoResponse = generateDemoResponse(userMsg);
      session.messages.push({ role: 'assistant', content: demoResponse + '\n\n(Demo mode - configure AI for full responses)' });
      
      return res.status(200).json({
        choices: [{
          message: { role: 'assistant', content: demoResponse + '\n\n(Demo mode)' }
        }],
        usage: { total_tokens: 50 },
        demo: true
      });
    }

  } catch (error) {
    console.error('Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function callAI(config, messages) {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API Error ${response.status}: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0
    }
  };
}

function generateDemoResponse(msg) {
  const lower = msg.toLowerCase();
  
  // Quick responses
  const quickReplies = {
    hello: "Hey Boss! FRIDAY online. What are we building today?",
    hi: "Good to see you! How can I help?",
    hey: "Hey there! Ready to assist.",
    'who are you': "I'm FRIDAY - your AI assistant. I can help with coding, architecture, debugging, or anything you need.",
    help: "I can help with:\n• Code writing & debugging\n• System architecture\n• Research & brainstorming\n• Technical explanations\n\nWhat do you need?",
    code: "Let's write some code! What language and what are we building?",
    build: "Love building things! Tell me the requirements and I'll help architect and code it.",
    architecture: "Good architecture is key. What scale are we talking? MVP or Enterprise?",
    deploy: "For deployment, I recommend:\n• Vercel - Frontend\n• Render - Backend with persistence\n• Railway - Quick prototypes",
    thanks: "Always happy to help, Boss!",
    'thank you': "You're welcome! Anything else?",
    bye: "Talk soon, Boss! FRIDAY out."
  };

  for (const [key, response] of Object.entries(quickReplies)) {
    if (lower.includes(key)) return response;
  }

  // Dynamic responses
  const words = msg.split(' ').length;
  if (words < 4) {
    return "Interesting. Tell me more about what you're thinking, Boss.";
  }
  
  return `I understand you're asking about: "${msg.substring(0, 50)}..."\n\nThis is demo mode. Configure an AI API key (Groq, OpenAI, or OpenCode) for full responses.\n\nQuick help - type "help" to see what I can do!`;
}

module.exports = handler;
