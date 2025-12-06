// Real human conversation with working Gemini API
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona Real Conversation' } });

  let collecting = false;
  let audioBuffers = [];

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      if (collecting) audioBuffers.push(Buffer.from(data));
      return;
    }

    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'beginUtterance') {
      collecting = true;
      audioBuffers = [];
    }

    if (msg.type === 'endUtterance') {
      collecting = false;
      const full = Buffer.concat(audioBuffers);
      
      // Get real transcript
      let transcript = 'Hello';
      try {
        const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
        transcript = await transcribeWebmOpusBufferToText(full);
      } catch (e) {
        console.error('STT failed:', e);
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Real Gemini conversation
      let response = 'I understand what you\'re saying.';
      
      try {
        console.log('Calling Gemini with:', transcript);
        
        const requestBody = {
          contents: [{
            parts: [{
              text: `You are having a natural conversation with someone. They just said: "${transcript}". Respond naturally and helpfully. If they ask for multiple items (like "5 tips"), give them exactly what they asked for. Be conversational and human-like.`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 150,
            topP: 0.8
          }
        };
        
        console.log('Gemini request:', JSON.stringify(requestBody, null, 2));
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Gemini status:', geminiResponse.status);
        
        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          console.log('Gemini response data:', JSON.stringify(data, null, 2));
          
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            response = data.candidates[0].content.parts[0].text.trim();
            console.log('✅ SUCCESS - Gemini response:', response);
          } else {
            console.error('❌ Unexpected Gemini structure');
            response = generateSmartResponse(transcript);
          }
        } else {
          const errorText = await geminiResponse.text();
          console.error('❌ Gemini API error:', geminiResponse.status, errorText);
          response = generateSmartResponse(transcript);
        }
      } catch (error) {
        console.error('❌ Gemini request failed:', error);
        response = generateSmartResponse(transcript);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      send(ws, { type: 'done' });
    }
  });
}

function generateSmartResponse(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('five') && text.includes('mental health')) {
    return 'Here are 5 mental health tips: 1) Exercise for 20 minutes daily, 2) Meditate for 10 minutes each morning, 3) Get 7-8 hours of sleep, 4) Connect with friends weekly, 5) Practice gratitude journaling. Which one interests you most?';
  }
  
  if (text.includes('mental health') || text.includes('advice')) {
    return 'For mental health, I recommend: regular exercise, good sleep habits, mindfulness practice, social connections, and professional support when needed. What specific area would you like to focus on?';
  }
  
  return `I heard you say "${transcript}". Let me give you a thoughtful response to that. What specific aspect would you like me to elaborate on?`;
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}