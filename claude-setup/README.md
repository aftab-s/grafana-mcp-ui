# Claude Setup - Grafana MCP Demo

This directory contains a simplified Grafana + MCP setup for use with Claude Desktop or other MCP clients.

## Components

- **Prometheus** - Metrics collection on port 9090
- **Grafana** - Visualization on port 3000 (admin/admin)
- **Blackbox Exporter** - HTTP/ICMP probing on port 9115
- **MCP Grafana Server** - Model Context Protocol server on port 3001

## Quick Start

1. Start all services:
```bash
docker-compose up -d
```

2. Access Grafana at http://localhost:3000 (admin/admin)

3. The MCP server is available at http://localhost:3001 using SSE transport

## Monitored Websites

The Blackbox exporter is configured to monitor:
- https://portfolio.aftabs.me
- https://thebagelproject.dev
- https://www.google.com
- https://www.github.com

## Dashboard

A pre-configured dashboard "Blackbox Exporter - Website Monitoring" is automatically provisioned and includes:
- HTTP Status Codes
- Response Time (ms)
- Availability metrics

## MCP Configuration

The MCP server uses SSE (Server-Sent Events) transport and authenticates to Grafana using:
- Username: admin
- Password: admin

For production use, create a service account token and set the `GRAFANA_SERVICE_ACCOUNT_TOKEN` environment variable.

## Stopping Services

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```
