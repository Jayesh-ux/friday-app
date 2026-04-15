const SYSTEM_PROMPT = `You are FRIDAY - A smart, friendly female AI assistant with a warm personality.
You help with coding, questions, and conversation.
Be concise, helpful, and friendly.`;

// Demo responses for when API is unavailable
const DEMO_RESPONSES = [
  "Hello! I'm FRIDAY, your AI assistant. How can I help you today?",
  "That's interesting! Tell me more about what you're working on.",
  "Great question! Let me help you with that.",
  "I'm here to help! What would you like to know?",
  "How can I assist you today? Ask me anything!",
];

async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      name: 'FRIDAY API',
      version: '1.0'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body || {};
    const userMsg = messages?.find(m => m.role === 'user')?.content || '';
    
    if (!userMsg) {
      return res.status(200).json({ 
        choices: [{ message: { role: 'assistant', content: 'Please send a message.' } }]
      });
    }

    // Try opencode API
    try {
      const response = await fetch('https://api.opencode.ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMsg }
          ],
          max_tokens: 500,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.log('opencode API unavailable, using demo mode');
    }

    // Demo response
    const demo = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
    const responseLength = Math.ceil(userMsg.length / 4);
    
    res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: `${demo}\n\n(Demo mode - Configure API at api.opencode.ai for full functionality)`
        }
      }],
      usage: {
        prompt_tokens: responseLength,
        completion_tokens: Math.ceil(demo.length / 4),
        total_tokens: responseLength + Math.ceil(demo.length / 4)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      choices: [{ message: { role: 'assistant', content: `Error: ${error.message}` } }]
    });
  }
}

module.exports = handler;
