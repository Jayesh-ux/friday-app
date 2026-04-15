// FRIDAY API - Streaming Server
const SYSTEM_PROMPT = `You are FRIDAY - Tony Stark's female AI assistant.
- Be conversational, warm, and helpful
- Keep responses under 50 words unless code needed
- Use minimal tokens`;

// Smart responses
const RESPONSES = {
  hello: "Good morning, Boss. I'm FRIDAY, online and ready. What would you like to work on today?",
  hi: "Hey there. FRIDAY at your service. What can I help you with?",
  'who are you': "I'm FRIDAY. Your personal AI assistant. Think of me as your digital sidekick. I can help with coding, research, or just about anything.",
  help: "I can assist with:\n• Writing and debugging code\n• Explaining concepts\n• Answering questions\n• Brainstorming\n\nJust speak or type, Boss.",
  code: "I love coding. What language are we working with? JavaScript, Python, React? Tell me what you're building.",
  build: "Let's build something great. What do you have in mind? I can help with architecture, code, and deployment.",
  error: "I encountered an issue. Let me try again. What do you need help with?",
  thanks: "You're welcome, Boss. Always here to help.",
};

function generateResponse(msg) {
  const lower = msg.toLowerCase();
  for (const [key, response] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  if (msg.split(' ').length < 5) {
    return "Interesting. Tell me more about that, Boss.";
  }
  return `I understand. You want to discuss "${msg.substring(0, 40)}...". Let me help you with that. What specific aspect would you like to focus on?`;
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', name: 'FRIDAY API', version: '1.0' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body || {};
    const userMsg = messages?.find(m => m.role === 'user')?.content || '';
    
    if (!userMsg) {
      return res.status(200).json({ 
        choices: [{ message: { role: 'assistant', content: 'Send me a message, Boss!' } }]
      });
    }

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
      choices: [{ message: { role: 'assistant', content: `Error: ${error.message}` } }]
    });
  }
}

module.exports = handler;
