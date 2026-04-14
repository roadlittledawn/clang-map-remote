import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryExercisesTool(server: McpServer): void {
  server.registerTool(
    "query_exercises",
    {
      title: "Query Exercises",
      description: "Query the exercises library with optional filters. Use this to find exercises by name, target area, or required equipment.",
      inputSchema: {
        name: z.string().optional().describe("Filter by exercise name (case-insensitive partial match)"),
        targetArea: z.string().optional().describe("Filter by target area (e.g., 'chest', 'back', 'legs', 'shoulders', 'arms', 'core')"),
        requiredEquipment: z.string().optional().describe("Filter by required equipment (e.g., 'barbell', 'dumbbell', 'cable', 'bodyweight')"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("exercises", {
          method: "GET",
          params: {
            name: args.name,
            targetArea: args.targetArea,
            requiredEquipment: args.requiredEquipment,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying exercises: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
