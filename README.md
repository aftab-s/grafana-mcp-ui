# Grafana MCP Demo - AI Conversational Interface

A complete, containerized demo showcasing how an AI-style conversational interface can interact with Grafana metrics and logs via Grafana's Model Context Protocol (MCP) server.

![Grafana MCP Demo](https://img.shields.io/badge/Grafana-MCP-orange?style=for-the-badge&logo=grafana)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Quick Start](#-quick-start)
4. [Using the Demo](#-using-the-demo)
5. [Pre-configured Dashboards](#-pre-configured-dashboards)
6. [Troubleshooting](#-troubleshooting)
7. [Demo Presentation Guide](#-demo-presentation-guide)
8. [Cheat Sheet](#-cheat-sheet)
9. [Project Structure](#-project-structure)
10. [Customization](#-customization)
11. [Technical Details](#-technical-details)

---

## 🎯 Overview

This demo provides a complete end-to-end solution for a **Grafana & Friends meetup**, demonstrating:

- **AI Conversational Interface** - A modern, Grafana-themed chat UI for natural language queries
- **Real-time Metrics** - Prometheus + Blackbox Exporter collecting application and endpoint metrics
- **Log Aggregation** - Loki + Promtail gathering structured logs
- **Interactive Dashboards** - Pre-configured Grafana OSS dashboards
- **MCP Integration** - Grafana's Model Context Protocol server enabling AI interactions

All components run as Docker containers for easy replication and demonstration.

### What is MCP?

Model Context Protocol (MCP) is an open standard for connecting AI assistants to data sources. Grafana has an official MCP server that bridges AI tools with your dashboards, metrics, and logs. Instead of manually navigating dashboards, you can just ask questions in natural language.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │   UI     │────▶│   MCP    │────▶│ Grafana  │           │
│  │  :8888   │     │  Server  │     │   OSS    │           │
│  └──────────┘     │  :3001   │     │  :3000   │           │
│                    └──────────┘     └────┬─────┘           │
│                                          │                  │
│  ┌──────────┐     ┌──────────┐     ┌────▼─────┐           │
│  │   Demo   │────▶│Prometheus│────▶│   Loki   │           │
│  │   App    │     │  :9090   │     │  :3100   │           │
│  │  :8081   │     └────┬─────┘     └────▲─────┘           │
│  └──────────┘          │                 │                 │
│       │                │                 │                 │
│       │           ┌────▼─────┐     ┌────┴─────┐           │
│       └──────────▶│ Blackbox │     │ Promtail │           │
│                   │ Exporter │     │          │           │
│                   │  :9115   │     └──────────┘           │
│                   └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Image | Port | Purpose |
|-----------|-------|------|---------|
| **Grafana OSS** | `grafana/grafana:latest` | 3000 | Visualization & dashboards |
| **Prometheus** | `prom/prometheus:latest` | 9090 | Metrics collection & storage |
| **Blackbox Exporter** | `prom/blackbox-exporter:latest` | 9115 | Endpoint probing |
| **Loki** | `grafana/loki:latest` | 3100 | Log aggregation |
| **Promtail** | `grafana/promtail:latest` | - | Log collection agent |
| **MCP Server** | `mcp/grafana:latest` | 3001 | Official Grafana MCP server |
| **Custom UI** | `nginx:alpine` | 8888 | Conversational interface |
| **Demo App** | `python:3.11-slim` | 8081 | Metrics & log generator |

> **Note:** Using official `mcp/grafana` image from Docker Hub - no custom builds required!

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (v2.0+)
- 4GB+ RAM available
- Ports 3000, 3001, 8888, 8081, 9090, 9115, 3100 available

### Installation

**1. Start all services**

```powershell
# Navigate to the project directory
cd grafana-mcp

# Start all containers
docker-compose up -d
```

**2. Wait for services to initialize** (~30-60 seconds)

```powershell
# Check container status
docker-compose ps
```

**3. Access the services**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Conversational UI** | http://localhost:8888 | None |
| **Grafana** | http://localhost:3000 | admin / admin |
| **Prometheus** | http://localhost:9090 | None |
| **Demo App** | http://localhost:8081 | None |

### Verification Steps

```powershell
# Check all containers are running
docker-compose ps

# Verify Grafana health
curl http://localhost:3000/api/health

# Verify Prometheus
curl http://localhost:9090/-/healthy

# Verify Loki (wait 15s after startup)
curl http://localhost:3100/ready

# Check demo app metrics
curl http://localhost:8081/metrics
```

### MCP Server Configuration

The demo uses the official `mcp/grafana` image with **SSE (Server-Sent Events) transport** for HTTP/web API access.

#### Why SSE Transport?

The official documentation shows:
```bash
docker run -e GRAFANA_URL=http://localhost:3000 \
  -e GRAFANA_SERVICE_ACCOUNT_TOKEN=<token> \
  mcp/grafana -t stdio
```

However, this demo uses:
```yaml
command: ["-transport", "sse", "-address", "0.0.0.0:3001"]
```

**Transport Options:**
- **stdio** (default) - For CLI tools and desktop apps like Claude Desktop
- **sse** (our choice) - For HTTP/web APIs and browser-based UIs ✅
- **streamable-http** - For streaming HTTP connections

**We use SSE because:**
- The custom web UI needs HTTP endpoints
- Enables REST API access from JavaScript
- Works with browser-based conversational interfaces
- Allows multiple concurrent connections

#### Authentication Options

**Option 1: Service Account Token (Recommended for Production)**

1. Create a service account in Grafana:
   - Go to Configuration → Service Accounts
   - Click "Add service account"
   - Add a token with appropriate permissions

2. Set the environment variable:
   ```bash
   GRAFANA_SERVICE_ACCOUNT_TOKEN=glsa_YourTokenHere
   ```

3. Update `docker-compose.yml` or create a `.env` file

**Option 2: Username/Password (Demo/Development)**

Used by default in this demo for simplicity:
```yaml
environment:
  - GRAFANA_USERNAME=admin
  - GRAFANA_PASSWORD=admin
```

The MCP server will use the token if provided, otherwise falls back to username/password.

---

## 💬 Using the Demo

### Conversational Interface

1. **Open the UI** at http://localhost:8888

2. **Wait for "Connected" status** in the top right corner

3. **Try these example queries:**

   - "Show me all available dashboards"
   - "What are the current error rates?"
   - "Show me recent error logs from the demo application"
   - "What's the p95 latency for the demo app?"
   - "Are there any failing health checks?"
   - "What datasources are configured in Grafana?"

4. **Use Quick Actions** in the sidebar for common queries

5. **Click example queries** to populate the input field

### Generate Demo Traffic

Simulate traffic patterns to see real-time changes:

```powershell
# Generate a traffic spike
curl "http://localhost:8081/simulate/load?pattern=spike"

# Generate errors
curl "http://localhost:8081/simulate/load?pattern=errors"
```

Then ask the UI: **"What just happened with the error rate?"**

---

## 📊 Pre-configured Dashboards

Access dashboards in Grafana at http://localhost:3000

### 1. MCP Demo - Application Metrics
- **Demo App Request Rate** - Real-time request rates by method and status
- **Error Rate** - Percentage of 5xx errors with threshold indicators
- **Response Time (Latency)** - p50 and p95 percentiles over time
- **Endpoint Health (Blackbox)** - HTTP probe results for all endpoints

### 2. MCP Demo - Application Logs
- **Demo Application Logs** - Real-time log viewer with filtering
- **Log Volume by Level** - Bar chart showing log distribution by severity

### Prometheus Queries

Navigate to http://localhost:9090 and try:

```promql
# Request rate
rate(demo_app_requests_total[5m])

# Error rate
sum(rate(demo_app_requests_total{status=~"5.."}[5m])) / sum(rate(demo_app_requests_total[5m]))

# p95 latency
histogram_quantile(0.95, sum(rate(demo_app_request_duration_seconds_bucket[5m])) by (le))

# Active connections
demo_app_active_connections
```

### Loki Queries

In Grafana Explore (http://localhost:3000/explore):

```logql
# All demo app logs
{job="demo-app"}

# Error logs only
{job="demo-app"} |~ "ERROR"

# Logs with specific text
{job="demo-app"} |~ "database"

# Count errors per minute
sum(count_over_time({job="demo-app"} |~ "ERROR" [1m]))
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Docker Desktop Not Running

**Symptom:** `error during connect`

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully initialize
3. Run `docker ps` to verify
4. Try `docker-compose up -d` again

#### Port Conflicts

**Symptom:** `port is already allocated`

**Solution:**
```powershell
# Find process using the port (e.g., 3000)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

#### Containers Exit Immediately

**Diagnosis:**
```powershell
# Check logs for failing container
docker-compose logs [service-name]
```

**Common fixes:**
```powershell
# Remove volumes and restart
docker-compose down -v
docker-compose up -d

# Increase Docker resources
# Docker Desktop → Settings → Resources
# Set Memory to 4GB+, CPU to 2+ cores
```

#### UI Shows "Disconnected"

**Solution:**
```powershell
# Check MCP server status
docker-compose logs mcp-server

# Verify Grafana is accessible
curl http://localhost:3000/api/health

# Restart MCP server
docker-compose restart mcp-server
```

#### No Metrics Appearing

**Solution:**
```powershell
# Check Prometheus targets
# Visit http://localhost:9090/targets (all should be UP)

# Verify demo app is running
curl http://localhost:8081/metrics

# Restart Prometheus
docker-compose restart prometheus
```

#### No Logs Appearing

**Solution:**
```powershell
# Check Promtail status
docker-compose logs promtail

# Restart Promtail
docker-compose restart promtail
```

### Complete Reset

When nothing else works:

```powershell
# Stop and remove everything
docker-compose down -v

# Remove logs
Remove-Item -Recurse -Force logs\*

# Start fresh
docker-compose up -d
```

### Health Check Commands

```powershell
# Grafana
curl http://localhost:3000/api/health

# Prometheus
curl http://localhost:9090/-/healthy

# Loki (wait 15s after startup)
curl http://localhost:3100/ready

# Demo App
curl http://localhost:8081

# UI
curl http://localhost:8888
```

---

## 🎤 Demo Presentation Guide

### Pre-Demo Setup (5 minutes before)

1. Start all containers: `docker-compose up -d`
2. Open browser tabs:
   - Tab 1: http://localhost:8888 (Custom UI)
   - Tab 2: http://localhost:3000 (Grafana)
   - Tab 3: http://localhost:9090 (Prometheus)
3. Login to Grafana (admin/admin, skip password change)
4. Ensure metrics are flowing

### Presentation Flow (20 minutes)

**Act 1: Introduction (3 minutes)**

"Today I'm showing you how to use natural language to interact with Grafana's observability data through the Model Context Protocol."

- Explain MCP concept
- Show architecture diagram
- Point out all components running in Docker

**Act 2: Component Tour (4 minutes)**

```powershell
# Show running services
docker-compose ps
```

Navigate through:
1. Grafana datasources (Settings → Data Sources)
2. Pre-configured dashboards
3. Prometheus targets (http://localhost:9090/targets)

**Act 3: Conversational Interface Demo (8 minutes)**

Switch to Custom UI (Tab 1):

**Query 1: Discovery**
```
Show me all available dashboards
```

**Query 2: Metrics**
```
What are the current error rates from the demo application?
```

**Query 3: Performance**
```
What's the p95 latency for the demo app?
```

**Query 4: Logs**
```
Show me recent error logs from the demo application
```

**Act 4: Live Incident Simulation (4 minutes)**

```powershell
# Generate traffic spike
curl "http://localhost:8081/simulate/load?pattern=spike"

# Generate errors
curl "http://localhost:8081/simulate/load?pattern=errors"
```

In UI, type:
```
What's happening with the error rate?
```

Switch to Grafana to show the spike in dashboards.

**Act 5: Q&A (3 minutes)**

Common questions:
- **Q:** Is this using ChatGPT or Claude?  
  **A:** The MCP server is model-agnostic. This demo simulates responses, but you could connect any LLM.

- **Q:** Does this work with Grafana Cloud?  
  **A:** Yes! Works with any Grafana instance - OSS, Enterprise, or Cloud.

- **Q:** What about security?  
  **A:** This is a demo. Production needs proper auth, TLS, and API token management.

### Reset Between Sessions

```powershell
# Quick reset (keeps data)
docker-compose restart

# Full reset (fresh data)
docker-compose down -v
docker-compose up -d
```

---

## 📋 Cheat Sheet

### Startup Commands

```powershell
# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Access URLs

| Service | URL |
|---------|-----|
| **UI** | http://localhost:8888 |
| **Grafana** | http://localhost:3000 (admin/admin) |
| **Prometheus** | http://localhost:9090 |
| **Demo App** | http://localhost:8081 |

### Example Queries

Copy-paste these into the UI:

```
Show me all available dashboards
What are the current error rates from the demo application?
What's the p95 latency for the demo app?
Show me recent error logs from the demo application
What datasources are configured in Grafana?
Are there any failing health checks?
```

### Generate Traffic

```powershell
# Traffic spike
curl "http://localhost:8081/simulate/load?pattern=spike"

# Errors
curl "http://localhost:8081/simulate/load?pattern=errors"

# Normal traffic
curl http://localhost:8081/api/data
```

### Docker Commands

```powershell
# View logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Stop all
docker-compose stop

# Complete teardown
docker-compose down -v
```

---

## 📁 Project Structure

```
grafana-mcp/
├── docker-compose.yml           # Main orchestration file
├── README.md                    # This file
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore patterns
│
├── config/                      # Configuration files
│   ├── prometheus/
│   │   └── prometheus.yml       # Prometheus scrape config
│   ├── blackbox/
│   │   └── blackbox.yml         # Blackbox exporter modules
│   ├── loki/
│   │   └── loki-config.yml      # Loki storage config
│   ├── promtail/
│   │   └── promtail-config.yml  # Log collection config
│   └── grafana/
│       └── provisioning/
│           ├── datasources/     # Auto-provisioned datasources
│           │   └── datasources.yml
│           └── dashboards/      # Auto-provisioned dashboards
│               ├── dashboards.yml
│               └── json/
│                   ├── demo-metrics.json
│                   └── demo-logs.json
│
├── ui/                          # Custom conversational UI
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── demo-app/                    # Demo application
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app.py
│
└── logs/                        # Application logs (created at runtime)
```

---

## 🔧 Customization

### Change UI Colors

Edit `ui/styles.css`:

```css
:root {
    --grafana-orange: #YOUR_COLOR;
    --grafana-accent: #YOUR_COLOR;
}
```

### Add Custom Dashboard

1. Create dashboard in Grafana UI
2. Export JSON
3. Save to `config/grafana/provisioning/dashboards/json/`
4. Restart Grafana: `docker-compose restart grafana`

### Modify Demo App

Edit `demo-app/app.py` to:
- Add custom endpoints
- Change metric names
- Modify log formats
- Adjust error rates

### Add Prometheus Target

Edit `config/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'my-custom-app'
    static_configs:
      - targets: ['my-app:8080']
```

### Environment Variables

Create a `.env` file:

```env
# Grafana credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin

# MCP Server configuration
MCP_PORT=3001
```

---

## 🔍 Technical Details

### Data Flow

**Metrics Collection:**
```
Demo App → /metrics endpoint → Prometheus scrapes → Stores in TSDB
         → Grafana queries ← MCP Server translates ← User question
```

**Logs Collection:**
```
Demo App → Writes logs → Promtail tails files → Pushes to Loki
        → Grafana queries ← MCP Server translates ← User question
```

**Conversational Query:**
```
User types → UI (JavaScript) → HTTP POST → MCP Server
         → Grafana API → Datasources → Response → UI display
```

### MCP Server Architecture

**Official Image:** `mcp/grafana:latest` from Docker Hub

**Transport Configuration:**
- **Type:** SSE (Server-Sent Events)
- **Address:** `0.0.0.0:3001`
- **Why not stdio?** The official docs show `-t stdio` for CLI/desktop apps. We use `-transport sse` for web/HTTP API access needed by the browser-based UI.

**Authentication Flow:**
1. MCP server checks for `GRAFANA_SERVICE_ACCOUNT_TOKEN`
2. If token exists, uses token-based auth (recommended)
3. If no token, falls back to `GRAFANA_USERNAME`/`GRAFANA_PASSWORD`
4. Connects to Grafana API at `http://grafana:3000`

**Available Transports:**
- `stdio` - Standard input/output (for Claude Desktop, CLI tools)
- `sse` - Server-Sent Events (for web APIs, HTTP) ✅ **Used in this demo**
- `streamable-http` - Streaming HTTP (for long-lived connections)

### Resource Requirements

| Component | CPU | Memory | Disk |
|-----------|-----|--------|------|
| Grafana | 0.5 | 512MB | 100MB |
| Prometheus | 0.5 | 1GB | 500MB |
| Loki | 0.5 | 512MB | 500MB |
| MCP Server | 0.2 | 256MB | 50MB |
| UI | 0.1 | 128MB | 50MB |
| Demo App | 0.2 | 256MB | 100MB |
| Blackbox | 0.1 | 128MB | 50MB |
| Promtail | 0.1 | 128MB | 50MB |
| **Total** | **~2.2** | **~3GB** | **~1.4GB** |

**Recommended:** 4 CPU cores, 4GB RAM, 5GB disk space

### Network Communication

All services communicate via Docker bridge network (`grafana-network`). Internal DNS allows services to reference each other by name (e.g., `http://grafana:3000`).

External access is provided through port mappings:
- UI: 8888 → 80
- Grafana: 3000 → 3000
- Prometheus: 9090 → 9090
- etc.

### Security Notes

**⚠️ This is a demo environment - NOT production-ready!**

- Default credentials are used (admin/admin)
- No TLS/HTTPS configured
- No authentication on MCP server
- Services exposed on all interfaces
- No resource limits configured

For production use:
- Change all default passwords
- Enable TLS/HTTPS
- Configure proper authentication
- Use secrets management
- Set resource limits
- Enable network policies

---

## 🎯 Use Cases

### Perfect For:

1. **Grafana & Friends Meetups**
   - 20-30 minute presentation
   - Live demo of MCP capabilities
   - Interactive Q&A

2. **Internal Demos**
   - Show what's possible with MCP
   - Inspire teams to build similar tools
   - Proof of concept for AI observability

3. **Learning & Experimentation**
   - Understand Grafana architecture
   - Learn Prometheus and Loki
   - Explore MCP protocol

4. **Template for Projects**
   - Foundation for custom integrations
   - Reference implementation
   - Docker Compose best practices

---

## 🤝 Contributing & Sharing

This demo is designed to be shared:
- ✅ Use at meetups and conferences
- ✅ Customize for your organization
- ✅ Fork and extend
- ✅ Learn and experiment

### Potential Improvements

Ideas for contributions:
- Additional dashboard examples
- More realistic demo data
- Alternative LLM integrations
- Mobile-first UI
- Voice interface
- Multi-language support

---

## 📄 License

MIT License - Feel free to use this demo for your meetups, presentations, and learning!

---

## 🔗 Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Grafana MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/grafana)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Docker Hub - mcp/grafana](https://hub.docker.com/r/mcp/grafana)

---

## 💡 Tips & Best Practices

### Before Presentation

1. Start containers 5-10 minutes early
2. Test all example queries
3. Have browser tabs ready
4. Prepare for common questions
5. Test traffic simulation endpoints

### During Presentation

1. Keep Grafana open in background
2. Show correlation between UI and dashboards
3. Emphasize ease of replication
4. Be honest about limitations
5. Invite audience participation

### Maintenance

```powershell
# Weekly cleanup
docker system prune -a

# Update images
docker-compose pull
docker-compose up -d

# Backup configuration
Copy-Item -Recurse config config-backup
```

---

## 🎉 Ready to Present!

Your demo is complete and includes:

- ✅ 8 containerized services working together
- ✅ Custom Grafana-themed conversational UI
- ✅ Real metrics and logs flowing
- ✅ Pre-configured dashboards
- ✅ Official MCP server integration
- ✅ Traffic simulation capabilities
- ✅ Comprehensive documentation

**Start your demo:**

```powershell
docker-compose up -d
```

**Access the UI:**

http://localhost:8888

---

**Built for the Grafana & Friends community** 🎉

For questions or issues, check the troubleshooting section or review container logs with `docker-compose logs [service-name]`.

Happy demoing! 🚀
