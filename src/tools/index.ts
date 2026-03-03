import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryWorkoutsTool } from "./query-workouts.js";
import { registerQueryLabResultsTool } from "./query-lab-results.js";
import { registerGetFitnessGoalsTool } from "./get-fitness-goals.js";
import { registerQueryHealthLogsTool } from "./health-logs-query.js";
import { registerCreateHealthLogTool } from "./health-logs-create.js";
import { registerQueryIncidentsTool } from "./incidents-query.js";
import { registerCreateIncidentTool } from "./incidents-create.js";
import { registerQueryExercisesTool } from "./query-exercises.js";
import { registerQueryExerciseProgramsTool } from "./query-exercise-programs.js";

export { API_BASE_URL, API_TOKEN } from "./api.js";

/**
 * Register all health dashboard tools with the MCP server
 */
export function registerAllTools(server: McpServer): void {
  // Workout tools
  registerQueryWorkoutsTool(server);

  // Lab results tools
  registerQueryLabResultsTool(server);

  // Fitness goals tools
  registerGetFitnessGoalsTool(server);

  // Health logs tools
  registerQueryHealthLogsTool(server);
  registerCreateHealthLogTool(server);

  // Incidents tools
  registerQueryIncidentsTool(server);
  registerCreateIncidentTool(server);

  // Exercises & Programs tools
  registerQueryExercisesTool(server);
  registerQueryExerciseProgramsTool(server);
}

// Re-export individual registration functions for flexibility
export { registerQueryWorkoutsTool } from "./query-workouts.js";
export { registerQueryLabResultsTool } from "./query-lab-results.js";
export { registerGetFitnessGoalsTool } from "./get-fitness-goals.js";
export { registerQueryHealthLogsTool } from "./health-logs-query.js";
export { registerCreateHealthLogTool } from "./health-logs-create.js";
export { registerQueryIncidentsTool } from "./incidents-query.js";
export { registerCreateIncidentTool } from "./incidents-create.js";
export { registerQueryExercisesTool } from "./query-exercises.js";
export { registerQueryExerciseProgramsTool } from "./query-exercise-programs.js";
