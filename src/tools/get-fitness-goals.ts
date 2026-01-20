import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerGetFitnessGoalsTool(server: McpServer): void {
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
          method: "GET",
          params: {
            status: args.status,
            goal_type: args.goal_type,
            activity_type: args.activity_type,
          },
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
}
