import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import { registerAllTools, API_TOKEN } from "./tools/index.js";

// Configuration
const PORT = parseInt(process.env.PORT || "3000");

if (!API_TOKEN) {
  console.warn("Warning: API_TOKEN not set. API calls will fail authentication.");
}

// Factory function to create MCP server (ensures clean state per session)
function createServer() {
  const server = new McpServer({
    name: "health-dashboard",
    version: "1.0.0",
  }, {
    capabilities: {
      tools: {},
    },
    instructions: `This MCP server provides access to a personal health dashboard with workout data from Strava, health incident tracking, lab results, and fitness goals. Use these tools to query and analyze health data.`,
  });

  // Register all tools
  registerAllTools(server);

  return server;
}

// Create Express app
const app = express();
app.use(express.json());

// Store transports by session ID for stateful connections
const transports: Record<string, StreamableHTTPServerTransport> = {};

// MCP POST endpoint - handles messages
app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  console.log(`Received MCP POST request${sessionId ? ` for session: ${sessionId}` : ""}`);

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - create new transport and server
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          console.log(`Session initialized with ID: ${newSessionId}`);
          transports[newSessionId] = transport;
        },
      });

      // Set up cleanup on close
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports`);
          delete transports[sid];
        }
      };

      // Connect transport to a new MCP server instance
      const server = createServer();
      await server.connect(transport);

      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      // Invalid request - no session ID and not an init request
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    // Handle request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// MCP GET endpoint - SSE stream for server-to-client messages
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  console.log(`Establishing SSE stream for session ${sessionId}`);

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// MCP DELETE endpoint - session termination
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling session termination:", error);
    if (!res.headersSent) {
      res.status(500).send("Error processing session termination");
    }
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    server: "health-dashboard-mcp",
    version: "1.0.0",
    apiConfigured: !!API_TOKEN,
    activeSessions: Object.keys(transports).length,
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Health Dashboard MCP Server running on http://0.0.0.0:${PORT}`);
  console.log(`MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`API Token configured: ${!!API_TOKEN}`);
});

// Handle server shutdown gracefully
process.on("SIGINT", async () => {
  console.log("Shutting down server...");

  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }

  console.log("Server shutdown complete");
  process.exit(0);
});
