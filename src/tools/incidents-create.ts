import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerCreateIncidentTool(server: McpServer): void {
  server.registerTool(
    "create_incident",
    {
      title: "Create Health Incident",
      description: "Create a new health incident. Use this to start tracking a new health issue or condition.",
      inputSchema: {
        incidentId: z.string().describe("Unique identifier for the incident (e.g., 'back_2024_07_001')"),
        dateStarted: z.string().optional().describe("When the incident started (ISO format, defaults to now)"),
        status: z.array(z.string()).optional().describe("Initial status array (e.g., ['active'])"),
        issueType: z.string().optional().describe("Type of health issue"),
        bodyArea: z.string().optional().describe("Affected body area"),
        description: z.string().optional().describe("Description of the incident"),
        symptoms: z.array(z.string()).optional().describe("List of symptoms"),
        triggers: z.array(z.string()).optional().describe("Potential triggers"),
      },
    },
    async (args) => {
      try {
        const result = await callApi("incidents-create", {
          method: "POST",
          body: {
            incidentId: args.incidentId,
            dateStarted: args.dateStarted,
            status: args.status,
            issueType: args.issueType,
            bodyArea: args.bodyArea,
            description: args.description,
            symptoms: args.symptoms,
            triggers: args.triggers,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating incident: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
