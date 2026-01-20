import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryHealthLogsTool(server: McpServer): void {
  server.registerTool(
    "query_health_logs",
    {
      title: "Query Health Logs",
      description: "Query health log entries with filtering and pagination. Use this to find specific health logs, track symptoms over time, or analyze health patterns.",
      inputSchema: {
        _id: z.string().optional().describe("Filter by specific MongoDB ObjectId"),
        issue_type: z.string().optional().describe("Filter by issue type (e.g., 'back_pain', 'headache', 'chest_pain')"),
        incident_id: z.string().optional().describe("Filter by incident ID (MongoDB ObjectId)"),
        start_date: z.string().optional().describe("Start of date range (ISO format)"),
        end_date: z.string().optional().describe("End of date range (ISO format)"),
        limit: z.number().optional().default(50).describe("Maximum number of logs to return (default: 50)"),
        skip: z.number().optional().default(0).describe("Number of logs to skip for pagination"),
        sort_by: z.string().optional().default("timestamp").describe("Field to sort by (default: 'timestamp')"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort order (default: 'desc')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("health-logs-query", {
          method: "GET",
          params: {
            _id: args._id,
            issue_type: args.issue_type,
            incident_id: args.incident_id,
            start_date: args.start_date,
            end_date: args.end_date,
            limit: args.limit,
            skip: args.skip,
            sort_by: args.sort_by,
            sort_order: args.sort_order,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying health logs: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
