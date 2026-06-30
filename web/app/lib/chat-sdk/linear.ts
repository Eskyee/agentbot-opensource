/**
 * Linear Adapter for Agentbot
 *
 * Automate issue tracking, triage, and project management.
 * Uses Vercel Chat SDK patterns for Linear integration.
 *
 * See: https://chat-sdk.dev/docs/adapters/linear
 */

export interface LinearBotConfig {
  apiKey: string;
  teamId?: string;
}

export async function createLinearClient(config: LinearBotConfig) {
  return {
    apiKey: config.apiKey,
    teamId: config.teamId,
    baseUrl: 'https://api.linear.app/graphql',
  };
}

export const LINEAR_CAPABILITIES = [
  'Issue creation and updates',
  'Label management',
  'Priority assignment',
  'Team member tagging',
  'Project tracking',
  'Sprint management',
  'Cycle tracking',
];

export async function createLinearIssue(
  client: { apiKey: string; baseUrl: string },
  issue: {
    title: string;
    description?: string;
    teamId?: string;
    assigneeId?: string;
    priority?: number;
    labelIds?: string[];
  }
) {
  const mutation = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const response = await fetch(client.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: client.apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          title: issue.title,
          description: issue.description,
          teamId: issue.teamId,
          assigneeId: issue.assigneeId,
          priority: issue.priority,
          labelIds: issue.labelIds,
        },
      },
    }),
  });

  return response.json();
}

export async function updateLinearIssue(
  client: { apiKey: string; baseUrl: string },
  issueId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: number;
    stateId?: string;
    assigneeId?: string;
  }
) {
  const mutation = `
    mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
        }
      }
    }
  `;

  const response = await fetch(client.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: client.apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { id: issueId, input: updates },
    }),
  });

  return response.json();
}
