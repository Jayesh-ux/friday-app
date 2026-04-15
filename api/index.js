const SYSTEM_PROMPT = `You are FRIDAY - A smart, friendly female AI assistant.
Be brief. Be helpful. Max 100 words unless code needed.`;

// Demo responses when API is unavailable
const DEMO_RESPONSES = [
  "Hello! I'm FRIDAY. How can I help you today?",
  "That's an interesting question. How can I assist you with your code?",
  "I'm here to help! What would you like to work on?",
  "Great question! Let me help you figure that out.",
  "I'm ready to assist. What do you need?"
];

async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      name: 'FRIDAY API',
      demo: true 
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

    // Try to call opencode API
    try {
      const response = await fetch('https://api.opencode.ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMsg }
          ],
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (apiError) {
      console.log('API call failed, using demo response');
    }

    // Fallback to demo response
    const demoResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
    
    res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: `${demoResponse}\n\n(Note: Configure your API key at api.opencode.ai for full functionality)`
        }
      }]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      choices: [{ message: { role: 'assistant', content: `Error: ${error.message}` } }]
    });
  }
}

module.exports = handler;
