/**
 * Create MCP tools exposing GitHub API operations
 * @param {GitHubClient} githubClient - Initialized GitHub client
 * @param {KVNamespace} kvNamespace - Cloudflare KV namespace for state
 * @returns {Object} - Map of tool functions
 */
export function createTools(githubClient, kvNamespace) {
  return {
    /**
     * List open issues in the repository
     * @param {Object} params - Parameters
     * @returns {Promise<Array>} - List of issues
     */
    async listIssues(params) {
      const { owner, repo, state, labels } = params;
      return await githubClient.listIssues({ owner, repo, state, labels });
    },

    /**
     * Create a new issue
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created issue
     */
    async createIssue(params) {
      const { owner, repo, title, body, labels, assignees } = params;
      return await githubClient.createIssue({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
      });
    },

    /**
     * Create or update a file in the repository
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Result of file creation/update
     */
    async createOrUpdateFile(params) {
      return await githubClient.createOrUpdateFile(params);
    },

    /**
     * Create a pull request
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created pull request
     */
    async createPullRequest(params) {
      return await githubClient.createPullRequest(params);
    },

    /**
     * Create a branch
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created branch
     */
    async createBranch(params) {
      return await githubClient.createBranch(params);
    },

    /**
     * Create a release
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created release
     */
    async createRelease(params) {
      return await githubClient.createRelease(params);
    },

    /**
     * Example tool: Get repository info
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Repository info
     */
    async getRepositoryInfo(params) {
      const { owner, repo } = params;
      return await githubClient.getRepository(owner, repo);
    },
  };
}

/**
 * Create MCP tools exposing GitHub API operations
 * @param {GitHubClient} githubClient - Initialized GitHub client
 * @param {KVNamespace} kvNamespace - Cloudflare KV namespace for state
 * @returns {Object} - Map of tool functions
 */
export function createTools(githubClient, kvNamespace) {
  return {
    /**
     * List open issues in the repository
     * @param {Object} params - Parameters
     * @returns {Promise<Array>} - List of issues
     */
    async listIssues(params) {
      const { owner, repo, state, labels } = params;
      return await githubClient.listIssues({ owner, repo, state, labels });
    },

    /**
     * Create a new issue
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created issue
     */
    async createIssue(params) {
      const { owner, repo, title, body, labels, assignees } = params;
      return await githubClient.createIssue({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
      });
    },

    /**
     * Create or update a file in the repository
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Result of file creation/update
     */
    async createOrUpdateFile(params) {
      return await githubClient.createOrUpdateFile(params);
    },

    /**
     * Create a pull request
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created pull request
     */
    async createPullRequest(params) {
      return await githubClient.createPullRequest(params);
    },

    /**
     * Create a branch
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created branch
     */
    async createBranch(params) {
      return await githubClient.createBranch(params);
    },

    /**
     * Create a release
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Created release
     */
    async createRelease(params) {
      return await githubClient.createRelease(params);
    },

    /**
     * Example tool: Get repository info
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} - Repository info
     */
    async getRepositoryInfo(params) {
      const { owner, repo } = params;
      return await githubClient.getRepository(owner, repo);
    },
  };
}
