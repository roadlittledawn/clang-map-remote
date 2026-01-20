import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerCreateHealthLogTool(server: McpServer): void {
  server.registerTool(
    "create_health_log",
    {
      title: "Create Health Log",
      description: "Create a new health log entry. Use this to record a health event, symptom, or observation.",
      inputSchema: {
        incident_id: z.string().describe("The incident ID this log belongs to (MongoDB ObjectId)"),
        issue_type: z.string().describe("Type of health issue (e.g., 'back_pain', 'headache', 'chest_pain')"),
        description: z.string().describe("Description of the health event or symptom"),
        timestamp: z.string().optional().describe("When the event occurred (ISO format, defaults to now)"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("health-logs-create", {
          method: "POST",
          body: {
            incident_id: args.incident_id,
            issue_type: args.issue_type,
            description: args.description,
            timestamp: args.timestamp,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating health log: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
