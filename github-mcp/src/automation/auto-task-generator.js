/**
 * Auto Task Generator for MCP Server
 * Automatically generates the next task and submits it for execution
 */

import createTools from "../tools/index.js";

export async function autoGenerateNextTask(
  githubClient,
  kvNamespace,
  currentTask
) {
  const tools = createTools(githubClient, kvNamespace);

  // Logic to generate the next task based on currentTask
  // For demonstration, we create a simple follow-up task prompt
  const nextTaskTitle = `Follow-up task for: ${currentTask.title}`;
  const nextTaskBody = `This task is automatically generated after completing: ${currentTask.title}`;

  const issueParams = {
    owner: currentTask.owner,
    repo: currentTask.repo,
    title: nextTaskTitle,
    body: nextTaskBody,
    labels: currentTask.labels || [],
    assignees: currentTask.assignees || [],
  };

  try {
    const newIssue = await tools.createIssue(issueParams);
    // Optionally, trigger further workflows or notify systems here
    return newIssue;
  } catch (error) {
    // Handle error gracefully
    return { error: `Failed to create next task: ${error.message}` };
  }
}
