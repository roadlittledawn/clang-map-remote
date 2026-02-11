import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryExerciseProgramsTool(server: McpServer): void {
  server.registerTool(
    "query_exercise_programs",
    {
      title: "Query Exercise Programs",
      description: "Query workout programs with optional filters. Use this to find programs by status or get a specific program by ID with full exercise details.",
      inputSchema: {
        status: z.string().optional().describe("Filter by program status (e.g., 'active', 'completed', 'draft')"),
        id: z.string().optional().describe("Get a specific program by its MongoDB ObjectId (returns populated exercise details)"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("workout-programs", {
          method: "GET",
          params: {
            status: args.status,
            id: args.id,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error querying exercise programs: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
