/**
 * GitHub Adapter for Agentbot
 *
 * Automate PR reviews, issue triage, and code analysis.
 * Uses Vercel Chat SDK patterns for GitHub integration.
 *
 * See: https://chat-sdk.dev/docs/adapters/github
 */

export interface GitHubBotConfig {
  token: string;
  webhookSecret?: string;
}

export async function createGitHubClient(config: GitHubBotConfig) {
  return {
    token: config.token,
    webhookSecret: config.webhookSecret,
    baseUrl: 'https://api.github.com',
  };
}

export const GITHUB_CAPABILITIES = [
  'PR reviews and comments',
  'Issue triage and labeling',
  'Code analysis',
  'CI/CD integration',
  'Release management',
  'Dependency updates',
];

export async function createGitHubPR(
  client: { token: string; baseUrl: string },
  repo: string,
  pr: {
    title: string;
    body?: string;
    head: string;
    base: string;
  }
) {
  const response = await fetch(`${client.baseUrl}/repos/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${client.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      title: pr.title,
      body: pr.body,
      head: pr.head,
      base: pr.base,
    }),
  });

  return response.json();
}

export async function createGitHubIssue(
  client: { token: string; baseUrl: string },
  repo: string,
  issue: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }
) {
  const response = await fetch(`${client.baseUrl}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${client.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      assignees: issue.assignees,
    }),
  });

  return response.json();
}

export async function addGitHubPRComment(
  client: { token: string; baseUrl: string },
  repo: string,
  prNumber: number,
  comment: string
) {
  const response = await fetch(`${client.baseUrl}/repos/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${client.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({ body: comment }),
  });

  return response.json();
}
