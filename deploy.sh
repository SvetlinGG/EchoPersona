#!/bin/bash
# EchoPersona Deployment Script for Hackathon

echo "🚀 Deploying EchoPersona to Raindrop Platform..."

# Check for required API keys
if [ -z "$LIQUIDMETAL_API_KEY" ]; then
    echo "❌ LIQUIDMETAL_API_KEY not set"
    echo "Get your API key from: https://liquidmetal.ai/dashboard"
    exit 1
fi

if [ -z "$VULTR_API_KEY" ]; then
    echo "❌ VULTR_API_KEY not set"
    echo "Get your API key from: https://my.vultr.com/settings/#settingsapi"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Deploy to Vultr
echo "☁️ Deploying to Vultr Cloud..."
cd ../backend
node -e "
const VultrServices = require('./src/vultr-integration.js').default;
const vultr = new VultrServices();
vultr.deployAIWorkload().then(instance => {
  console.log('✅ Deployed to Vultr:', instance.instance.main_ip);
}).catch(console.error);
"

echo "✅ EchoPersona deployed successfully!"
echo "🎯 Ready for AI Champion Ship hackathon submission"