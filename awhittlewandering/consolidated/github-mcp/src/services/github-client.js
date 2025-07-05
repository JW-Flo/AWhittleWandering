import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

/**
 * GitHub Client Service for interacting with the GitHub API
 */
class GitHubClient {
  constructor(config) {
    this.config = config;
    this.initializeClient();
  }

  /**
   * Initialize the GitHub API client with authentication
   */
  initializeClient() {
    try {
      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.config.appId,
          privateKey: this.config.privateKey,
          installationId: this.config.installationId,
        },
      });
      console.log("GitHub client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize GitHub client:", error);
      throw error;
    }
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Repository information
   */
  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      console.error(`Failed to get repository ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   * @param {Object} params - File parameters
   * @returns {Promise<Object>} - File creation/update result
   */
  async createOrUpdateFile(params) {
    const { owner, repo, path, message, content, branch, sha } = params;

    try {
      const contentEncoded = Buffer.from(content).toString("base64");

      const requestParams = {
        owner,
        repo,
        path,
        message,
        content: contentEncoded,
        branch: branch || "main",
      };

      // If sha is provided, it's an update operation
      if (sha) {
        requestParams.sha = sha;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(
        requestParams
      );
      return data;
    } catch (error) {
      console.error(
        `Failed to create/update file ${path} in ${owner}/${repo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a pull request
   * @param {Object} params - Pull request parameters
   * @returns {Promise<Object>} - Pull request creation result
   */
  async createPullRequest(params) {
    const { owner, repo, title, body, head, base } = params;

    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base: base || "main",
      });
      return data;
    } catch (error) {
      console.error(
        `Failed to create pull request in ${owner}/${repo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a branch
   * @param {Object} params - Branch parameters
   * @returns {Promise<Object>} - Branch creation result
   */
  async createBranch(params) {
    const { owner, repo, branch, sha } = params;

    try {
      // Get the SHA of the latest commit on the default branch
      let baseSha = sha;
      if (!baseSha) {
        const { data } = await this.octokit.repos.getBranch({
          owner,
          repo,
          branch: "main",
        });
        baseSha = data.commit.sha;
      }

      // Create reference (branch)
      const { data } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: baseSha,
      });

      return data;
    } catch (error) {
      console.error(
        `Failed to create branch ${branch} in ${owner}/${repo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * List repository issues
   * @param {Object} params - Issue parameters
   * @returns {Promise<Array>} - List of issues
   */
  async listIssues(params) {
    const { owner, repo, state, labels } = params;

    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: state || "open",
        labels,
      });

      return data;
    } catch (error) {
      console.error(`Failed to list issues for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Create an issue
   * @param {Object} params - Issue parameters
   * @returns {Promise<Object>} - Issue creation result
   */
  async createIssue(params) {
    const { owner, repo, title, body, labels, assignees } = params;

    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
      });

      return data;
    } catch (error) {
      console.error(`Failed to create issue in ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Create a release
   * @param {Object} params - Release parameters
   * @returns {Promise<Object>} - Release creation result
   */
  async createRelease(params) {
    const { owner, repo, tagName, name, body, draft, prerelease } = params;

    try {
      const { data } = await this.octokit.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name,
        body,
        draft: draft || false,
        prerelease: prerelease || false,
      });

      return data;
    } catch (error) {
      console.error(`Failed to create release in ${owner}/${repo}:`, error);
      throw error;
    }
  }
}

export default GitHubClient;
