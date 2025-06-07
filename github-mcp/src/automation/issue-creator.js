/**
 * Automated GitHub Issue Creator for 48 Continental USA project
 * This module creates issues based on predefined vehicle tracker tasks.
 */

import createTools from "../tools/index.js";

export async function createVehicleTrackerIssues(
  githubClient,
  kvNamespace,
  tasks
) {
  const tools = createTools(githubClient, kvNamespace);

  const createdIssues = [];

  for (const task of tasks) {
    const issueParams = {
      owner: task.owner,
      repo: task.repo,
      title: task.title,
      body: task.body,
      labels: task.labels,
      assignees: task.assignees,
    };

    try {
      const issue = await tools.createIssue(issueParams);
      createdIssues.push(issue);
    } catch (error) {
      console.error(`Failed to create issue: ${task.title}`, error);
    }
  }

  return createdIssues;
}
