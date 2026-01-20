import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi } from "./api.js";

export function registerQueryLabResultsTool(server: McpServer): void {
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
          method: "GET",
          params: {
            test_type: args.test_type,
            ordered_by: args.ordered_by,
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
          content: [{ type: "text", text: `Error querying lab results: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
