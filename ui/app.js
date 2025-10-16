// MCP Client Implementation
class MCPClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.connected = false;
    }

    async connect() {
        try {
            // Check if MCP server SSE endpoint is available
            const response = await fetch(`${this.baseURL}/sse`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream'
                }
            });
            this.connected = response.ok;
            return this.connected;
        } catch (error) {
            console.error('Failed to connect to MCP server:', error);
            this.connected = false;
            return false;
        }
    }

    async sendMessage(message) {
        try {
            const response = await fetch(`${this.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'user',
                    content: message
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}

// Chat Application
class ChatApp {
    constructor() {
        this.mcpClient = new MCPClient('/api/mcp');
        this.messageContainer = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.statusIndicator = document.getElementById('mcpStatus');
        
        this.initialize();
    }

    async initialize() {
        // Set up event listeners
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Handle Enter key to send (Shift+Enter for new line)
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                // Manually trigger submit by clicking the send button
                const sendButton = document.getElementById('sendButton');
                if (sendButton) {
                    sendButton.click();
                }
            }
        });
        
        // Quick action buttons
        document.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', () => {
                const prompt = button.getAttribute('data-prompt');
                this.chatInput.value = prompt;
                this.chatInput.focus();
            });
        });

        // Example queries
        document.querySelectorAll('.example-query').forEach(query => {
            query.addEventListener('click', () => {
                this.chatInput.value = query.textContent.replace(/[""]/g, '');
                this.chatInput.focus();
            });
        });

        // Connect to MCP server
        await this.checkConnection();
        
        // Periodically check connection
        setInterval(() => this.checkConnection(), 30000);
    }

    async checkConnection() {
        const connected = await this.mcpClient.connect();
        this.updateStatus(connected);
    }

    updateStatus(connected) {
        if (connected) {
            this.statusIndicator.classList.add('connected');
            this.statusIndicator.classList.remove('error');
            this.statusIndicator.querySelector('.status-text').textContent = 'Connected';
        } else {
            this.statusIndicator.classList.add('error');
            this.statusIndicator.classList.remove('connected');
            this.statusIndicator.querySelector('.status-text').textContent = 'Disconnected';
        }
    }

    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Clear input
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        // Remove welcome message if present
        const welcomeMessage = this.messageContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // Add user message
        this.addMessage('user', message);

        // Disable input while processing
        this.setInputEnabled(false);

        // Show typing indicator
        const typingId = this.showTypingIndicator();

        try {
            // For demo purposes, simulate MCP response
            // In production, this would call the actual MCP server
            const response = await this.simulateMCPResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);

            // Add assistant response
            this.addMessage('assistant', response);

        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error processing your request. Please make sure the MCP server is running and try again.');
        } finally {
            this.setInputEnabled(true);
            this.chatInput.focus();
        }
    }

    async simulateMCPResponse(message) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const lowerMessage = message.toLowerCase();

        // Simulate different responses based on keywords
        if (lowerMessage.includes('dashboard')) {
            return `I found 2 dashboards in your Grafana instance:

**1. MCP Demo - Application Metrics** (UID: mcp-demo-metrics)
   - Demo App Request Rate
   - Error Rate
   - Response Time (Latency)
   - Endpoint Health (Blackbox)

**2. MCP Demo - Application Logs** (UID: mcp-demo-logs)
   - Demo Application Logs
   - Log Volume by Level

Would you like me to query specific metrics from any of these dashboards?`;
        }

        if (lowerMessage.includes('error') && lowerMessage.includes('rate')) {
            return `Based on the latest metrics from Prometheus:

**Current Error Rate:** 2.3%
- Total requests: ~1,245 req/min
- 5xx errors: ~29 req/min

**Trend:** Error rate increased by 0.8% in the last 5 minutes.

**Top error sources:**
- \`POST /api/data\` - 45% of errors
- \`GET /api/users/:id\` - 30% of errors
- \`PUT /api/settings\` - 25% of errors

Would you like me to check the error logs for more details?`;
        }

        if (lowerMessage.includes('log')) {
            return `Here are the most recent error logs from the demo application:

\`\`\`
[2025-10-16 14:32:15] ERROR: Database connection timeout
[2025-10-16 14:31:48] ERROR: Failed to process request: Invalid token
[2025-10-16 14:31:22] WARN: High memory usage detected: 87%
[2025-10-16 14:30:55] ERROR: API rate limit exceeded for client 192.168.1.100
[2025-10-16 14:30:33] INFO: Request processed successfully
\`\`\`

**Summary:**
- 12 errors in the last 5 minutes
- Most common: Database connection issues (5 occurrences)
- Warning: Memory usage trending upward

Would you like me to investigate any specific error?`;
        }

        if (lowerMessage.includes('datasource')) {
            return `Your Grafana instance has 2 datasources configured:

**1. Prometheus** (Default)
   - Type: prometheus
   - URL: http://prometheus:9090
   - Status: ✅ Connected
   - Scrape interval: 15s

**2. Loki**
   - Type: loki
   - URL: http://loki:3100
   - Status: ✅ Connected
   - Max lines: 1000

Both datasources are healthy and actively collecting data.`;
        }

        if (lowerMessage.includes('latency') || lowerMessage.includes('p95')) {
            return `**Response Time Metrics (Last 5 minutes):**

- **p50 (Median):** 145ms
- **p95:** 428ms
- **p99:** 856ms
- **Average:** 223ms

**Performance Status:** ✅ Within normal range

The p95 latency is currently stable. There was a spike to 1.2s at 14:28 UTC but it has since returned to normal levels.

Breakdown by endpoint:
- \`/api/metrics\`: p95 = 156ms
- \`/api/data\`: p95 = 623ms (slowest)
- \`/api/users\`: p95 = 234ms`;
        }

        if (lowerMessage.includes('health') || lowerMessage.includes('blackbox')) {
            return `**Endpoint Health Check Results:**

All monitored endpoints are currently healthy:

✅ **http://grafana:3000** - Response time: 45ms
✅ **http://demo-app:8080** - Response time: 23ms  
✅ **http://ui:80** - Response time: 12ms

**ICMP Probes:**
✅ grafana - Latency: 0.3ms
✅ prometheus - Latency: 0.2ms
✅ loki - Latency: 0.4ms

All services are operating normally with no connectivity issues detected.`;
        }

        // Default response
        return `I understand you're asking about: "${message}"

I can help you with:
- 📊 Querying dashboards and panels
- 📈 Checking metrics from Prometheus
- 📝 Analyzing logs from Loki
- 🔍 Investigating errors and performance issues
- ⚙️ Viewing datasource configurations

Try asking me something like:
- "What dashboards are available?"
- "Show me the current error rate"
- "What's the p95 latency?"
- "Check the endpoint health status"

Note: This is a demo simulation. In a production environment, I would query the actual Grafana MCP server for real-time data.`;
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const avatarIcon = role === 'user' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>';
        
        avatarDiv.innerHTML = avatarIcon;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Parse markdown-like formatting
        const formattedContent = this.formatMessage(content);
        contentDiv.innerHTML = formattedContent;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        let formatted = content
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        const typingId = 'typing-' + Date.now();
        typingDiv.id = typingId;
        typingDiv.className = 'message assistant';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.messageContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return typingId;
    }

    removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    setInputEnabled(enabled) {
        this.chatInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
    }

    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
}

// Initialize the chat application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
