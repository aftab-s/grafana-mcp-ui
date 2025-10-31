# Claude Setup - Grafana MCP Demo

This directory contains a complete Grafana + MCP setup for use with Claude Desktop, allowing Claude to query your Grafana metrics, dashboards, and logs through the Model Context Protocol.

## 📋 Table of Contents

- [Components](#components)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup Guide](#step-by-step-setup-guide)
- [Claude Desktop Configuration](#claude-desktop-configuration)
- [Testing the Setup](#testing-the-setup)
- [Monitored Websites](#monitored-websites)
- [Troubleshooting](#troubleshooting)
- [Stopping Services](#stopping-services)

## 🔧 Components

This setup includes:

- **Prometheus** (port 9090) - Metrics collection and storage
- **Grafana** (port 3000) - Visualization and dashboards (login: admin/admin)
- **Blackbox Exporter** (port 9115) - HTTP/ICMP endpoint probing
- **MCP Grafana Server** (port 3001) - Model Context Protocol server for Claude

## ✅ Prerequisites

Before starting, ensure you have:

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop/
   - Minimum version: 20.10+
   
2. **Claude Desktop** installed
   - Download from: https://claude.ai/download
   
3. **Ports Available**: 3000, 3001, 9090, 9115
   - Check with: `netstat -ano | findstr "3000 3001 9090 9115"`

## 🚀 Step-by-Step Setup Guide

### Step 1: Start the Docker Services

1. Open PowerShell or Command Prompt

2. Navigate to the `claude-setup` directory:
   ```powershell
   cd path\to\grafana-mcp\claude-setup
   ```

3. Start all services:
   ```powershell
   docker-compose up -d
   ```

4. Verify all containers are running:
   ```powershell
   docker-compose ps
   ```
   
   You should see 4 services running:
   - `prometheus-claude`
   - `grafana-claude`
   - `blackbox-exporter-claude`
   - `mcp-grafana-claude`

5. Wait 30-60 seconds for all services to fully initialize

### Step 2: Verify Grafana is Running

1. Open your browser and go to: http://localhost:3000

2. Login with:
   - **Username**: `admin`
   - **Password**: `admin`

3. You may be prompted to change the password (you can skip this for testing)

4. Verify the dashboard is loaded:
   - Click "Dashboards" in the left menu
   - Look for "Blackbox Exporter - Website Monitoring"

### Step 3: Create a Grafana Service Account Token (Recommended)

For secure authentication, create a service account token:

1. In Grafana, navigate to: **Administration** → **Service Accounts**

2. Click **Add service account**

3. Fill in:
   - **Display name**: `Claude MCP`
   - **Role**: `Admin` or `Editor`
   
4. Click **Create**

5. Click **Add service account token**

6. Set:
   - **Display name**: `Claude Desktop Token`
   - **Expiration**: Choose your preference (or "No expiration" for testing)
   
7. Click **Generate token**

8. **IMPORTANT**: Copy the token immediately (starts with `glsa_`)
   - You won't be able to see it again!
   - Example: `glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_xxxxxxxx`

9. Save the token - you'll need it in the next step

### Step 4: Configure Claude Desktop

#### Option A: Through Claude Desktop Settings (Easier)

1. Open **Claude Desktop**

2. Go to **File** → **Settings** → **Developer**

3. Click **Edit Config** (this opens `claude_desktop_config.json`)

4. Replace the entire content with:

```json
{
  "mcpServers": {
    "grafana": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "GRAFANA_URL",
        "-e",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN",
        "mcp/grafana",
        "-t",
        "stdio"
      ],
      "env": {
        "GRAFANA_URL": "http://host.docker.internal:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "YOUR_TOKEN_HERE"
      }
    },
    "prometheus": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PROMETHEUS_URL",
        "ghcr.io/pab1it0/prometheus-mcp-server:latest"
      ],
      "env": {
        "PROMETHEUS_URL": "http://host.docker.internal:9090"
      }
    }
  }
}
```

5. **Replace** `YOUR_TOKEN_HERE` with your service account token from Step 3

6. **Save** the file and **close** the editor

7. **Restart Claude Desktop** completely (quit and reopen)

#### Option B: Manual File Edit

1. Close Claude Desktop if it's running

2. Navigate to the config directory:
   ```powershell
   cd C:\Users\<YourUsername>\AppData\Roaming\Claude
   ```
   Replace `<YourUsername>` with your Windows username

3. Open `claude_desktop_config.json` in a text editor (like Notepad)

4. Follow steps 4-7 from Option A above

#### Alternative: Using Username/Password (Not Recommended for Production)

If you prefer not to use a service account token, you can use username/password:

```json
{
  "mcpServers": {
    "grafana": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "GRAFANA_URL",
        "-e",
        "GRAFANA_USERNAME",
        "-e",
        "GRAFANA_PASSWORD",
        "mcp/grafana",
        "-t",
        "stdio"
      ],
      "env": {
        "GRAFANA_URL": "http://host.docker.internal:3000",
        "GRAFANA_USERNAME": "admin",
        "GRAFANA_PASSWORD": "admin"
      }
    },
    "prometheus": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PROMETHEUS_URL",
        "ghcr.io/pab1it0/prometheus-mcp-server:latest"
      ],
      "env": {
        "PROMETHEUS_URL": "http://host.docker.internal:9090"
      }
    }
  }
}
```

### Step 5: Verify MCP Connection in Claude

1. Open **Claude Desktop**

2. Look at the bottom right corner - you should see the MCP icon with a number badge showing connected servers

3. Click on the MCP icon (🔌) to see:
   - ✅ **grafana** - Connected
   - ✅ **prometheus** - Connected

4. If you see red X marks, check the [Troubleshooting](#troubleshooting) section

## 🧪 Testing the Setup

Once everything is configured, try asking Claude:

### Dashboard Queries
- "What dashboards are available in Grafana?"
- "Show me the Blackbox Exporter dashboard"
- "List all panels in the website monitoring dashboard"

### Datasource Queries
- "What datasources are configured?"
- "Show me details about the Prometheus datasource"

### Prometheus Queries
- "What is the current HTTP status code for portfolio.aftabs.me?"
- "Show me the probe success rate for thebagelproject.dev"
- "What's the response time for the monitored websites?"

### Metrics Queries
- "Query Prometheus for probe_success"
- "Show me all available metrics"
- "What metrics are being collected?"

## 🌐 Monitored Websites

The Blackbox exporter is configured to monitor these endpoints:

### Your Websites
- 🌐 https://portfolio.aftabs.me
- 🥯 https://thebagelproject.dev

### Reference Endpoints
- 🔍 https://www.google.com
- 💻 https://www.github.com

### Metrics Collected
- **HTTP Status Codes** - 200, 404, 500, etc.
- **Response Time** - Time to receive response
- **Probe Success** - Whether the endpoint is reachable
- **SSL Certificate** - Validity and expiration

## 📊 Pre-configured Dashboard

A dashboard called **"Blackbox Exporter - Website Monitoring"** is automatically provisioned with:

- **HTTP Status Codes** - Real-time status for each monitored site
- **Response Time (ms)** - Performance metrics
- **Availability** - Uptime percentage

Access it at: http://localhost:3000 → Dashboards → Blackbox Exporter - Website Monitoring

## 🔍 Troubleshooting

### MCP Servers Not Connecting in Claude

1. **Check Docker containers are running**:
   ```powershell
   docker-compose ps
   ```
   All should show "Up"

2. **Check Grafana is accessible**:
   ```powershell
   curl http://localhost:3000/api/health
   ```
   Should return: `{"database":"ok"}`

3. **Verify token is correct**:
   - Make sure you copied the full token including `glsa_` prefix
   - Check for extra spaces or quotes in the config file

4. **Restart Claude Desktop**:
   - Fully quit Claude (right-click system tray → Quit)
   - Wait 5 seconds
   - Reopen Claude Desktop

5. **Check Claude logs**:
   - Windows: `C:\Users\<YourUsername>\AppData\Roaming\Claude\logs\`
   - Look for MCP connection errors

### Docker Containers Not Starting

1. **Port conflicts**:
   ```powershell
   netstat -ano | findstr "3000 3001 9090 9115"
   ```
   If ports are in use, stop conflicting services

2. **Docker Desktop not running**:
   - Open Docker Desktop
   - Wait for it to fully start (whale icon solid)

3. **Reset and restart**:
   ```powershell
   docker-compose down -v
   docker-compose up -d
   ```

### Grafana Login Issues

- Default credentials: **admin** / **admin**
- If locked out, reset with:
  ```powershell
  docker-compose down -v
  docker-compose up -d
  ```

### No Data in Dashboards

1. Wait 1-2 minutes after startup for metrics to populate

2. Check Prometheus targets:
   - Go to http://localhost:9090/targets
   - All should show "UP" status

3. Verify Blackbox exporter is running:
   ```powershell
   curl http://localhost:9115/metrics
   ```

## 🛑 Stopping Services

### Temporarily Stop (preserves data)
```powershell
docker-compose stop
```

### Restart Services
```powershell
docker-compose start
```

### Stop and Remove Containers (preserves data volumes)
```powershell
docker-compose down
```

### Complete Cleanup (removes all data)
```powershell
docker-compose down -v
```

## 📁 Directory Structure

```
claude-setup/
├── docker-compose.yml              # Main Docker Compose configuration
├── claude_desktop_config.json      # Example Claude Desktop config
├── .env.example                    # Environment variables template
├── README.md                       # This file
├── prometheus/
│   └── prometheus.yml              # Prometheus scrape configs
├── blackbox/
│   └── blackbox.yml                # Blackbox exporter modules
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml      # Prometheus datasource config
        └── dashboards/
            ├── dashboard.yml       # Dashboard provider config
            └── blackbox-endpoints.json  # Website monitoring dashboard
```

## 🔐 Security Notes

- **Default credentials** (admin/admin) should be changed for production
- **Service account tokens** are more secure than username/password
- **Token expiration**: Set appropriate expiration dates for tokens
- **Network isolation**: In production, use Docker networks and firewalls
- **HTTPS**: Consider using HTTPS for production Grafana instances

## 📚 Additional Resources

- [Grafana MCP Server Documentation](https://github.com/grafana/mcp-grafana)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Blackbox Exporter](https://github.com/prometheus/blackbox_exporter)

## 💡 Next Steps

Once setup is complete, you can:

1. **Add more websites** to monitor in `prometheus/prometheus.yml`
2. **Create custom dashboards** in Grafana
3. **Set up alerting** for website downtime
4. **Explore Prometheus metrics** through Claude
5. **Query logs** if you add Loki to the stack

## 🤝 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker container logs: `docker-compose logs <service-name>`
3. Verify all prerequisites are met
4. Ensure Docker Desktop has sufficient resources (4GB+ RAM recommended)
