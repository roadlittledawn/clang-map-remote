import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryWorkoutsTool(server: McpServer): void {
  server.registerTool(
    "query_workouts",
    {
      title: "Query Workouts",
      description: "Query workout data from Strava with filtering options. Use this to find specific workouts, analyze training patterns, or get workout statistics. Returns paginated results with `pagination.total` (total matching records), `pagination.limit` (results per page), `pagination.skip` (offset from start), and `pagination.hasMore` (boolean indicating more results exist).",
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
          method: "GET",
          params: {
            type: args.type,
            sport_type: args.sport_type,
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
          content: [{ type: "text", text: `Error querying workouts: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
