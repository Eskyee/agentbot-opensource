import { defineOpenAPIConnection } from 'eve/connections';

export default defineOpenAPIConnection({
  description: 'GitHub integration for repository operations, PRs, and issues.',
  baseUrl: 'https://api.github.com',
  auth: {
    type: 'bearer',
    async getToken() {
      return { token: process.env.GITHUB_TOKEN! };
    },
  },
  spec: {
    openapi: '3.0.0',
    info: { title: 'GitHub', version: '1.0.0' },
    paths: {},
  },
});
