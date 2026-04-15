// FRIDAY API - Demo Mode
// Configure your own AI API key for full functionality

const SYSTEM_PROMPT = `You are FRIDAY - A smart, friendly female AI assistant.
Be concise, helpful, and friendly. Keep responses short unless code needed.`;

// Smart demo responses
function generateResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I'm FRIDAY, your AI assistant. How can I help you today? What would you like to work on?";
  }
  
  if (msg.includes('who are you') || msg.includes('your name')) {
    return "I'm FRIDAY - your personal AI assistant. I'm here to help you with coding, questions, and anything you need. Think of me as your digital sidekick!";
  }
  
  if (msg.includes('help')) {
    return "I can help you with:\n• Writing and debugging code\n• Answering questions\n• Explaining concepts\n• Brainstorming ideas\n\nJust ask me anything!";
  }
  
  if (msg.includes('code') || msg.includes('programming')) {
    return "I can help with code! Tell me:\n• What language you're using\n• What you're trying to build\n• Any errors you're seeing\n\nI work with JavaScript, Python, React, Node.js, and more.";
  }
  
  if (msg.includes('token')) {
    return "Tokens measure API usage. Each word/character costs tokens. I'm optimized to use fewer tokens while giving you the best responses!";
  }
  
  // Default response
  return `That's a great question! I understand you're asking about: "${userMessage.substring(0, 50)}..."\n\nTo get detailed AI responses, configure an API key in the backend. For now, I'm running in demo mode!`;
}

async function handler(req, res) {
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
      version: '1.0',
      mode: 'demo'
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
        choices: [{ message: { role: 'assistant', content: 'Send me a message!' } }]
      });
    }

    // Generate smart response
    const response = generateResponse(userMsg);
    const promptTokens = Math.ceil(userMsg.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    
    res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: response
        }
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      choices: [{ message: { role: 'assistant', content: `Oops! Something went wrong: ${error.message}` } }]
    });
  }
}

module.exports = handler;
