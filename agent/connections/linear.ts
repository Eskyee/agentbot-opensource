import { defineOpenAPIConnection } from 'eve/connections';

export default defineOpenAPIConnection({
  description: 'Linear project management integration for issue tracking.',
  baseUrl: 'https://api.linear.app/graphql',
  auth: {
    type: 'bearer',
    async getToken() {
      return { token: process.env.LINEAR_API_KEY! };
    },
  },
  spec: {
    openapi: '3.0.0',
    info: { title: 'Linear', version: '1.0.0' },
    paths: {},
  },
});
