import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryIncidentsTool(server: McpServer): void {
  server.registerTool(
    "query_incidents",
    {
      title: "Query Health Incidents",
      description: "Query health incidents with filtering and pagination. Use this to find patterns in health issues, track recovery progress, or analyze incident history.",
      inputSchema: {
        _id: z.string().optional().describe("Filter by specific MongoDB ObjectId"),
        status: z.string().optional().describe("Filter by status ('active', 'improving', 'resolved')"),
        limit: z.number().optional().default(50).describe("Maximum number of incidents to return (default: 50)"),
        skip: z.number().optional().default(0).describe("Number of incidents to skip for pagination"),
        sort_by: z.string().optional().default("dateStarted").describe("Field to sort by (default: 'dateStarted')"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort order (default: 'desc')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("incidents-query", {
          method: "GET",
          params: {
            _id: args._id,
            status: args.status,
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
          content: [{ type: "text", text: `Error querying incidents: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
