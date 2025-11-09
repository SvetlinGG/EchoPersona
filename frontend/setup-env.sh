#!/bin/bash

# Setup script for OpenAI API key
echo "Setting up environment variables..."

# Check if API key is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-env.sh YOUR_OPENAI_API_KEY"
    echo "Example: ./setup-env.sh sk-proj-abc123..."
    exit 1
fi

# Export the API key
export OPENAI_API_KEY="$1"

# Test the API key
echo "Testing API key..."
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  | head -n 10

echo "API key set successfully!"
echo "Run: export OPENAI_API_KEY='$1' to use in your current session"