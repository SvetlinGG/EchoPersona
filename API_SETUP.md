# EchoPersona API Setup Guide

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   - At minimum, you need **one** of these for AI responses:
     - `OPENAI_API_KEY` (recommended for natural conversations)
     - `GEMINI_API_KEY` (free alternative)
   - For speech-to-text:
     - `DEEPGRAM_API_KEY` (recommended)
   - For text-to-speech:
     - `ELEVENLABS_API_KEY` (recommended for natural voice)

3. **Get API Keys:**

   ### OpenAI (Recommended for Natural Conversations)
   - Visit: https://platform.openai.com/api-keys
   - Sign up/login and create a new API key
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

   ### Gemini (Free Alternative)
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add to `.env`: `GEMINI_API_KEY=...`

   ### Deepgram (Speech-to-Text)
   - Visit: https://console.deepgram.com/
   - Sign up and get your API key
   - Add to `.env`: `DEEPGRAM_API_KEY=...`

   ### ElevenLabs (Text-to-Speech)
   - Visit: https://elevenlabs.io/app/settings/api-keys
   - Sign up and create an API key
   - Add to `.env`: `ELEVENLABS_API_KEY=...`

4. **Restart the backend server:**
   ```bash
   cd backend
   npm start
   ```

## How It Works

The app now uses **real AI APIs** for natural, conversational responses:

1. **Priority Order:**
   - First tries OpenAI (if `OPENAI_API_KEY` is set) - most natural conversations
   - Falls back to Gemini (if `GEMINI_API_KEY` is set) - good free alternative
   - Falls back to template responses (if no API keys)

2. **Speech-to-Text:**
   - Uses Deepgram (if `DEEPGRAM_API_KEY` is set)
   - Falls back to simple transcription

3. **Text-to-Speech:**
   - Uses ElevenLabs (if `ELEVENLABS_API_KEY` is set)
   - Falls back to browser TTS

## Testing

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Open http://localhost:4200 in Chrome
4. Click "SPEAK" and try saying something
5. The AI should respond naturally, not with templates!

## Troubleshooting

- **Still showing "Offline"?** 
  - Check that backend is running on port 3000
  - Check browser console for WebSocket errors
  - Verify CORS is enabled in backend

- **Still getting template responses?**
  - Check that your `.env` file has at least one AI API key
  - Restart the backend server after adding keys
  - Check backend console logs for API errors

- **No speech recognition?**
  - Add `DEEPGRAM_API_KEY` to `.env`
  - Or it will use fallback transcription

