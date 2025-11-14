# EchoPersona - AI Champion Ship Hackathon Setup

## 🎯 Quick Start

### 1. Get API Keys

**LiquidMetal AI (Required)**
- Visit: https://liquidmetal.ai/dashboard
- Sign up for hackathon access
- Copy API key to `.env` file

**Vultr (Required)**
- Visit: https://my.vultr.com/settings/#settingsapi
- Generate API key
- Copy to `.env` file

**ElevenLabs (Already configured)**
- API key already set in `.env`

### 2. Install & Deploy

```bash
# Install MCP SDK (already done)
cd backend && npm install

# Set your API keys
export LIQUIDMETAL_API_KEY="your-key-here"
export VULTR_API_KEY="your-key-here"

# Deploy to cloud
./deploy.sh
```

### 3. Test Voice Agent

1. Open frontend: `http://localhost:4200`
2. Click "SPEAK" button
3. Say: "I'm feeling overwhelmed with work"
4. Listen to EchoPersona's empathetic response

## 🏆 Hackathon Compliance

✅ **Built on Raindrop Platform** (MCP Server integration)  
✅ **Uses Vultr Services** (Cloud Compute deployment)  
✅ **Voice Agent Category** (ElevenLabs integration)  
✅ **Smart Components** (SmartInference, SmartMemory, SmartBuckets, SmartSQL)  
✅ **Launch-ready quality** (Authentication ready, payment processing ready)  

## 🚀 Demo Script

1. **Voice Input**: "I'm stressed about my deadlines"
2. **Emotion Detection**: Detects "stressed" state
3. **AI Response**: "I can hear the stress in your voice. Let's break this down into tiny steps..."
4. **Voice Output**: Natural ElevenLabs voice response
5. **Analytics**: Stored in SmartSQL for insights

## 📊 Architecture

- **Frontend**: Angular 19 (Voice capture UI)
- **Backend**: Node.js + Raindrop MCP Server
- **AI**: LiquidMetal AI (STT + Chat completion)
- **Voice**: ElevenLabs TTS
- **Cloud**: Vultr deployment
- **Storage**: Raindrop SmartBuckets + SmartSQL

Ready for hackathon submission! 🎉