import { simpleTranscribe } from './stt-simple.js';
import { generateOpenAIResponse } from './openai-chat.js';
import { transcribeWebmOpusBufferToText } from './stt-deepgram.js';
import { elevenLabsTtsStream } from './tts-eleven.js';

// Store conversation IDs per WebSocket connection
const wsConversationIds = new WeakMap();

export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona WS' } });

  // Generate unique conversation ID for this connection
  const conversationId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  wsConversationIds.set(ws, conversationId);

  let collecting = false;
  let audioBuffers = [];

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      if (collecting) {
        audioBuffers.push(Buffer.from(data));
        console.log('Received audio chunk:', data.byteLength, 'bytes');
      }
      return;
    }

    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'beginUtterance') {
      console.log('Starting audio collection');
      collecting = true;
      audioBuffers = [];
    }

    if (msg.type === 'endUtterance') {
      console.log('Ending audio collection');
      collecting = false;
      
      if (audioBuffers.length === 0) {
        send(ws, { type: 'finalTranscription', text: 'No audio received' });
        return;
      }
      
      const full = Buffer.concat(audioBuffers);
      
      // Get transcription - try Deepgram first, then fallback
      let transcript = '';
      try {
        if (process.env.DEEPGRAM_API_KEY) {
          transcript = await transcribeWebmOpusBufferToText(full);
          console.log('Deepgram transcript:', transcript);
        } else {
          throw new Error('DEEPGRAM_API_KEY not set');
        }
      } catch (error) {
        console.error('Deepgram transcription failed:', error.message);
        try {
          transcript = await simpleTranscribe(full);
          console.log('Fallback transcript:', transcript);
        } catch (fallbackError) {
          console.error('All transcription methods failed:', fallbackError);
          transcript = 'I heard you speaking';
        }
      }
      
      if (!transcript || transcript.trim() === '') {
        send(ws, { type: 'finalTranscription', text: '[No speech detected]' });
        send(ws, { type: 'assistantText', text: 'I couldn\'t understand what you said. Could you please try again?', final: true });
        send(ws, { type: 'done' });
        return;
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Detect emotion from text
      const emotion = detectEmotionFromText(transcript);
      send(ws, { type: 'emotion', payload: emotion });
      
      // Generate AI response using ONLY real AI APIs - NO TEMPLATES
      let response;
      
      // Check if API keys are valid (not placeholders) - declare outside try for catch block access
      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const liquidmetalKey = process.env.LIQUIDMETAL_API_KEY;
      
      // Validate keys - check they're not placeholder values
      const isOpenAIValid = openaiKey && 
        openaiKey.trim().length > 10 && 
        !openaiKey.includes('your_') && 
        !openaiKey.includes('_here') &&
        (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk_proj-'));
      
      const isGeminiValid = geminiKey && 
        geminiKey.trim().length > 10 && 
        !geminiKey.includes('your_') && 
        !geminiKey.includes('_here') &&
        geminiKey.startsWith('AIza');
      
      const isAnthropicValid = anthropicKey && 
        anthropicKey.trim().length > 10 && 
        !anthropicKey.includes('your_') && 
        !anthropicKey.includes('_here') &&
        anthropicKey.startsWith('sk-ant-');
      
      const isGroqValid = groqKey && 
        groqKey.trim().length > 10 && 
        !groqKey.includes('your_') && 
        !groqKey.includes('_here') &&
        groqKey.startsWith('gsk_');
      
      const isLiquidMetalValid = liquidmetalKey && 
        liquidmetalKey.trim().length > 10 && 
        !liquidmetalKey.includes('your_') && 
        !liquidmetalKey.includes('_here');
      
      console.log('API Key validation:', { 
        openaiValid: isOpenAIValid, 
        geminiValid: isGeminiValid,
        anthropicValid: isAnthropicValid,
        groqValid: isGroqValid,
        liquidmetalValid: isLiquidMetalValid
      });
      
      try {
        const conversationPrompt = `Someone just said to you: "${transcript}"

Respond naturally like you're talking to a friend. Use casual language, contractions, and be conversational. Keep it to 1-2 short sentences. Don't be formal or sound like a robot. Just respond like a real person would.`;
        
        // Try APIs in priority order, falling back to next if one fails
        let lastError = null;
        
        // 1. Try OpenAI first
        if (isOpenAIValid && !response) {
          try {
            const conversationId = wsConversationIds.get(ws) || 'default';
            response = await generateOpenAIResponse(transcript, emotion, conversationId);
            console.log('✅ OpenAI response:', response);
          } catch (error) {
            console.log('❌ OpenAI failed:', error.message);
            lastError = error;
          }
        }
        
        // 2. Try Gemini
        if (!response && isGeminiValid) {
          try {
            console.log('🔄 Trying Gemini...');
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: conversationPrompt }] }],
                generationConfig: { 
                  temperature: 0.9,
                  maxOutputTokens: 80,
                  topP: 0.95,
                  topK: 40
                }
              })
            });
            
            if (geminiResponse.ok) {
              const data = await geminiResponse.json();
              if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                response = data.candidates[0].content.parts[0].text.trim();
                console.log('✅ Gemini response:', response);
              } else {
                throw new Error('Invalid Gemini API response format');
              }
            } else {
              const errorText = await geminiResponse.text();
              throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorText}`);
            }
          } catch (error) {
            console.log('❌ Gemini failed:', error.message);
            lastError = error;
          }
        }
        
        // 3. Try Anthropic Claude
        if (!response && isAnthropicValid) {
          try {
            console.log('🔄 Trying Anthropic Claude...');
            const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 80,
                messages: [{
                  role: 'user',
                  content: conversationPrompt
                }]
              })
            });
            
            if (anthropicResponse.ok) {
              const data = await anthropicResponse.json();
              response = data.content[0].text.trim();
              console.log('✅ Anthropic response:', response);
            } else {
              const errorText = await anthropicResponse.text();
              throw new Error(`Anthropic API failed: ${anthropicResponse.status} - ${errorText}`);
            }
          } catch (error) {
            console.log('❌ Anthropic failed:', error.message);
            lastError = error;
          }
        }
        
        // 4. Try Groq
        if (!response && isGroqValid) {
          try {
            console.log('🔄 Trying Groq...');
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{
                  role: 'user',
                  content: conversationPrompt
                }],
                max_tokens: 80,
                temperature: 0.9
              })
            });
            
            if (groqResponse.ok) {
              const data = await groqResponse.json();
              response = data.choices[0].message.content.trim();
              console.log('✅ Groq response:', response);
            } else {
              const errorText = await groqResponse.text();
              throw new Error(`Groq API failed: ${groqResponse.status} - ${errorText}`);
            }
          } catch (error) {
            console.log('❌ Groq failed:', error.message);
            lastError = error;
          }
        }
        
        // 5. Try LiquidMetal
        if (!response && isLiquidMetalValid) {
          try {
            console.log('🔄 Trying LiquidMetal...');
            const liquidmetalResponse = await fetch('https://api.liquidmetal.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${liquidmetalKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{
                  role: 'system',
                  content: 'You are a helpful AI assistant. Respond naturally and conversationally.'
                }, {
                  role: 'user',
                  content: transcript
                }],
                max_tokens: 80,
                temperature: 0.9
              })
            });
            
            if (liquidmetalResponse.ok) {
              const data = await liquidmetalResponse.json();
              response = data.choices[0].message.content.trim();
              console.log('✅ LiquidMetal response:', response);
            } else {
              const errorText = await liquidmetalResponse.text();
              throw new Error(`LiquidMetal API failed: ${liquidmetalResponse.status} - ${errorText}`);
            }
          } catch (error) {
            console.log('❌ LiquidMetal failed:', error.message);
            lastError = error;
          }
        }
        
        // If no API worked, throw error
        if (!response) {
          if (!isOpenAIValid && !isGeminiValid && !isAnthropicValid && !isGroqValid && !isLiquidMetalValid) {
            throw new Error('No valid AI API keys configured. Please add at least one valid API key (OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or LIQUIDMETAL_API_KEY) to .env file.');
          } else {
            throw lastError || new Error('All configured AI APIs failed. Please check your API keys in the .env file.');
          }
        }
      } catch (error) {
        console.error('AI response generation failed:', error);
        console.error('Error details:', error.message);
        
        // Show helpful error message
        if (error.message.includes('No valid AI API keys')) {
          response = "I need a valid API key to chat with you. Please add at least one valid API key (OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or LIQUIDMETAL_API_KEY) to the .env file.";
        } else if (error.message.includes('All configured AI APIs failed')) {
          response = "All of your API keys appear to be invalid or expired. Please check and update your API keys in the .env file. You can get new keys from:\n- OpenAI: https://platform.openai.com/api-keys\n- Gemini: https://makersuite.google.com/app/apikey\n- Anthropic: https://console.anthropic.com/\n- Groq: https://console.groq.com/\n- LiquidMetal: https://liquidmetal.ai/dashboard";
        } else if (error.message.includes('401') || error.message.includes('403')) {
          response = "Your API key appears to be invalid or expired. Please check your API keys in the .env file and make sure they are valid and active.";
        } else if (error.message.includes('429')) {
          response = "I'm hitting rate limits. Please wait a moment and try again.";
        } else {
          response = `Sorry, I'm having trouble connecting to the AI services. Error: ${error.message}. Please check your API keys in the .env file.`;
        }
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // TTS with ElevenLabs
      try {
        if (process.env.ELEVENLABS_API_KEY) {
          send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
          
          let chunkCount = 0;
          for await (const chunk of elevenLabsTtsStream({ text: response })) {
            sendBinary(ws, chunk);
            chunkCount++;
          }
          console.log(`TTS completed with ${chunkCount} chunks`);
          send(ws, { type: 'done' });
        } else {
          // Fallback to browser TTS
          send(ws, { type: 'ttsText', text: response });
          send(ws, { type: 'done' });
        }
      } catch (error) {
        console.error('TTS failed:', error);
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      }
    }
  });

  ws.on('close', () => {
    // Clean up conversation history when connection closes
    const conversationId = wsConversationIds.get(ws);
    if (conversationId) {
      // Optionally clear history after delay to allow reconnection
      setTimeout(async () => {
        const { conversationHistory } = await import('./openai-chat.js');
        if (conversationHistory && conversationHistory.has(conversationId)) {
          conversationHistory.delete(conversationId);
        }
      }, 60000); // Clear after 1 minute
    }
  });
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}

function detectEmotionFromText(text) {
  const t = (text || '').toLowerCase();
  
  // Stress indicators
  if (t.includes('overwhelm') || t.includes('stress') || t.includes('difficult') || t.includes('tired') || t.includes('anxious') || t.includes('pressure')) {
    return { valence: -0.3, arousal: 0.7, label: 'stressed' };
  }
  
  // Positive indicators
  if (t.includes('great') || t.includes('awesome') || t.includes('happy') || t.includes('excited') || t.includes('good') || t.includes('wonderful')) {
    return { valence: 0.7, arousal: 0.6, label: 'happy' };
  }
  
  // Sadness indicators
  if (t.includes('sad') || t.includes('down') || t.includes('depressed') || t.includes('lonely') || t.includes('upset')) {
    return { valence: -0.5, arousal: 0.2, label: 'sad' };
  }
  
  // Energy indicators
  if (t.includes('energetic') || t.includes('motivated') || t.includes('ready') || t.includes('excited')) {
    return { valence: 0.4, arousal: 0.8, label: 'energetic' };
  }
  
  return { valence: 0.0, arousal: 0.4, label: 'neutral' };
}