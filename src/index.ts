import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { randomUUID } from "crypto";

// Configuration from environment variables
const PORT = parseInt(process.env.PORT || "3000");
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8888/.netlify/functions";
const API_TOKEN = process.env.API_TOKEN || "";

if (!API_TOKEN) {
  console.warn("Warning: API_TOKEN not set. API calls will fail authentication.");
}

// Helper to call health dashboard APIs
async function callApi(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  // Add query parameters, filtering out undefined values
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
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

  // Tool: Query Workouts
  server.registerTool(
    "query_workouts",
    {
      title: "Query Workouts",
      description: "Query workout data from Strava with filtering options. Use this to find specific workouts, analyze training patterns, or get workout statistics.",
      inputSchema: {
        type: z.string().optional().describe("Activity type filter (e.g., 'Run', 'Ride')"),
        sport_type: z.string().optional().describe("Sport type filter (e.g., 'Run', 'Ride', 'Swim', 'TrailRun', 'MountainBikeRide')"),
        start_date: z.string().optional().describe("Start of date range (ISO format, e.g., '2024-01-01')"),
        end_date: z.string().optional().describe("End of date range (ISO format, e.g., '2024-12-31')"),
        limit: z.number().optional().default(20).describe("Maximum number of workouts to return (default: 20)"),
        skip: z.number().optional().default(0).describe("Number of workouts to skip for pagination"),
        sort_by: z.string().optional().default("start_date").describe("Field to sort by (default: 'start_date')"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort order (default: 'desc')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("strava-workouts", {
          type: args.type,
          sport_type: args.sport_type,
          start_date: args.start_date,
          end_date: args.end_date,
          limit: args.limit,
          skip: args.skip,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying workouts: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  // Tool: Query Health Incidents
  server.registerTool(
    "query_health_incidents",
    {
      title: "Query Health Incidents",
      description: "Query health incidents (grouped health logs) with analytics. Use this to find patterns in health issues, track recovery, or analyze symptom history.",
      inputSchema: {
        issue_type: z.string().optional().describe("Filter by issue type (e.g., 'back_pain', 'headache', 'chest_pain')"),
        status: z.string().optional().describe("Filter by status ('active', 'improving', 'resolved')"),
        start_date: z.string().optional().describe("Start of date range (ISO format)"),
        end_date: z.string().optional().describe("End of date range (ISO format)"),
        limit: z.number().optional().default(50).describe("Maximum number of incidents to return (default: 50)"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("health-incidents", {
          issue_type: args.issue_type,
          status: args.status,
          start_date: args.start_date,
          end_date: args.end_date,
          limit: args.limit,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying health incidents: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  // Tool: Query Lab Results
  server.registerTool(
    "query_lab_results",
    {
      title: "Query Lab Results",
      description: "Query lab test results with filtering and pagination. Use this to find specific lab results, track health markers over time, or analyze trends.",
      inputSchema: {
        test_type: z.string().optional().describe("Filter by test type (e.g., 'lipid_panel', 'cbc', 'metabolic_panel')"),
        ordered_by: z.string().optional().describe("Filter by ordering physician"),
        start_date: z.string().optional().describe("Start of date range (ISO format)"),
        end_date: z.string().optional().describe("End of date range (ISO format)"),
        limit: z.number().optional().default(50).describe("Maximum number of results to return (default: 50)"),
        skip: z.number().optional().default(0).describe("Number of results to skip for pagination"),
        sort_by: z.string().optional().default("test_date").describe("Field to sort by (default: 'test_date')"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort order (default: 'desc')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("lab-results-query", {
          test_type: args.test_type,
          ordered_by: args.ordered_by,
          start_date: args.start_date,
          end_date: args.end_date,
          limit: args.limit,
          skip: args.skip,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying lab results: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  // Tool: Get Fitness Goals
  server.registerTool(
    "get_fitness_goals",
    {
      title: "Get Fitness Goals",
      description: "Query fitness goals with current progress calculated from workout data. Use this to check goal status, track progress, or find goals by type.",
      inputSchema: {
        status: z.string().optional().describe("Filter by status ('active', 'completed', 'abandoned')"),
        goal_type: z.string().optional().describe("Filter by goal type ('distance', 'duration', 'elevation', 'frequency')"),
        activity_type: z.string().optional().describe("Filter by activity type (e.g., 'Run', 'Ride')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("fitness-goals", {
          status: args.status,
          goal_type: args.goal_type,
          activity_type: args.activity_type,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting fitness goals: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

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
  console.log(`API Base URL: ${API_BASE_URL}`);
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
