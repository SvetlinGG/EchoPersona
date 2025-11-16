// Vultr Cloud Services Integration for EchoPersona
import fetch from 'node-fetch';

class VultrServices {
  constructor() {
    this.apiKey = process.env.VULTR_API_KEY;
    this.baseUrl = 'https://api.vultr.com/v2';
  }

  async deployAIWorkload() {
    // Deploy EchoPersona backend on Vultr Cloud Compute
    const instance = await this.createInstance({
      plan: 'vc2-1c-2gb',
      region: 'ewr',
      os_id: 387, // Ubuntu 20.04
      label: 'echopersona-backend',
      tag: 'ai-voice-agent',
      user_data: this.getStartupScript()
    });

    return instance;
  }

  async createInstance(config) {
    const response = await fetch(`${this.baseUrl}/instances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Vultr API error: ${response.status}`);
    }

    return await response.json();
  }

  getStartupScript() {
    return `#!/bin/bash
# EchoPersona Auto-Deploy Script
apt-get update
apt-get install -y nodejs npm nginx

# Clone and setup EchoPersona
git clone https://github.com/your-repo/echopersona.git /opt/echopersona
cd /opt/echopersona/backend
npm install

# Setup environment
echo "LIQUIDMETAL_API_KEY=${process.env.LIQUIDMETAL_API_KEY}" > .env
echo "ELEVENLABS_API_KEY=${process.env.ELEVENLABS_API_KEY}" >> .env
echo "PORT=3000" >> .env

# Start services
npm start &

# Configure Nginx proxy
cat > /etc/nginx/sites-available/echopersona << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/echopersona /etc/nginx/sites-enabled/
systemctl restart nginx
`;
  }

  async getInstanceStatus(instanceId) {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return await response.json();
  }

  async scaleForLoad() {
    // Auto-scaling logic for high-traffic periods
    const loadBalancer = await this.createLoadBalancer({
      region: 'ewr',
      label: 'echopersona-lb',
      balancing_algorithm: 'roundrobin',
      forwarding_rules: [{
        frontend_protocol: 'http',
        frontend_port: 80,
        backend_protocol: 'http',
        backend_port: 3000
      }]
    });

    return loadBalancer;
  }

  async createLoadBalancer(config) {
    const response = await fetch(`${this.baseUrl}/load-balancers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    return await response.json();
  }
}

export default VultrServices;