# Health Dashboard MCP Server

[![CI](https://github.com/roadlittledawn/clang-map-remote/actions/workflows/ci.yml/badge.svg)](https://github.com/roadlittledawn/clang-map-remote/actions/workflows/ci.yml)

A remote MCP (Model Context Protocol) server that provides AI clients access to your health dashboard APIs.

## Features

- **Query Workouts**: Search and filter Strava workout data
- **Query Health Incidents**: Access health incident history with analytics
- **Query Lab Results**: Retrieve lab test results with filtering
- **Get Fitness Goals**: Check fitness goal progress

## Prerequisites

- Node.js 18 or higher
- A deployed health dashboard with API endpoints
- An API token for authentication

## Local Development

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd clang-mcp-remote
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   - `API_BASE_URL`: Your health dashboard API base URL
   - `API_TOKEN`: JWT token for API authentication

5. Run the development server:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`.

## Deployment to Render

### Option 1: Using Render Dashboard

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `API_BASE_URL`: Your Netlify functions URL
     - `API_TOKEN`: Your JWT token

### Option 2: Using render.yaml

1. Push the `render.yaml` file to your repository
2. Go to Render Dashboard > Blueprints
3. Connect your repository
4. Render will automatically detect the blueprint

## Connecting AI Clients

### Claude.ai (Custom Connectors)

1. Go to Claude.ai Settings > Connectors
2. Click "Add custom connector"
3. Enter your Render URL: `https://your-service.onrender.com/mcp`
4. Complete authentication if required

### Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "health-dashboard": {
      "url": "https://your-service.onrender.com/mcp"
    }
  }
}
```

## API Endpoints

- `GET/POST /mcp` - MCP protocol endpoint (Streamable HTTP)
- `GET /health` - Health check endpoint

## Available Tools

| Tool | Description |
|------|-------------|
| `query_workouts` | Query Strava workout data with filters |
| `query_health_incidents` | Query health incidents with analytics |
| `query_lab_results` | Query lab test results |
| `get_fitness_goals` | Get fitness goals with progress |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `API_BASE_URL` | Health dashboard API base URL | Yes |
| `API_TOKEN` | JWT token for API authentication | Yes |

## License

ISC
