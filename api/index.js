const SYSTEM_PROMPT = `You are FRIDAY - A smart, friendly female AI assistant.
Be brief. Be helpful. Max 100 words unless code needed.`;

async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', name: 'FRIDAY API' });
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

    // Call opencode API
    const response = await fetch('https://api.opencode.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'opencode',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return res.status(200).json({ 
        choices: [{ message: { role: 'assistant', content: `Error: ${response.status}. Please try again.` } }]
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      choices: [{ message: { role: 'assistant', content: `Error: ${error.message}` } }]
    });
  }
}

module.exports = handler;
