// Seed script to populate skills marketplace
// Run: node scripts/seed-skills.js

const skills = [
  {
    name: 'Web Scraper',
    description: 'Extract data from any website with CSS selectors',
    category: 'data',
    code: `async function scrape(url, selector) {
  const response = await fetch(url);
  const html = await response.text();
  // Parse and extract data
  return data;
}`,
    author: 'Agentbot',
    featured: true
  },
  {
    name: 'Email Sender',
    description: 'Send emails via SMTP with attachments',
    category: 'automation',
    code: `async function sendEmail(to, subject, body) {
  // SMTP implementation
  return { sent: true };
}`,
    author: 'Agentbot',
    featured: true
  },
  {
    name: 'CSV Parser',
    description: 'Parse and analyze CSV files with statistics',
    category: 'data',
    code: `function parseCSV(file) {
  // Parse CSV and return structured data
  return rows;
}`,
    author: 'Community',
    featured: false
  },
  {
    name: 'API Caller',
    description: 'Make HTTP requests to any REST API',
    category: 'web',
    code: `async function callAPI(url, method, data) {
  const response = await fetch(url, { method, body: JSON.stringify(data) });
  return response.json();
}`,
    author: 'Agentbot',
    featured: true
  },
  {
    name: 'Database Query',
    description: 'Query PostgreSQL databases safely',
    category: 'data',
    code: `async function queryDB(sql, params) {
  // Execute parameterized query
  return results;
}`,
    author: 'Community',
    featured: false
  },
  {
    name: 'PDF Generator',
    description: 'Generate PDF documents from HTML',
    category: 'automation',
    code: `async function generatePDF(html) {
  // Convert HTML to PDF
  return pdfBuffer;
}`,
    author: 'Agentbot',
    featured: true
  },
  {
    name: 'Image Optimizer',
    description: 'Compress and resize images',
    category: 'web',
    code: `async function optimizeImage(file, options) {
  // Optimize image
  return optimizedFile;
}`,
    author: 'Community',
    featured: false
  },
  {
    name: 'Slack Notifier',
    description: 'Send notifications to Slack channels',
    category: 'automation',
    code: `async function notifySlack(webhook, message) {
  await fetch(webhook, { method: 'POST', body: JSON.stringify({ text: message }) });
}`,
    author: 'Agentbot',
    featured: true
  },
  {
    name: 'JSON Validator',
    description: 'Validate JSON against schemas',
    category: 'data',
    code: `function validateJSON(data, schema) {
  // Validate against JSON schema
  return { valid: true, errors: [] };
}`,
    author: 'Community',
    featured: false
  },
  {
    name: 'Calendar Sync',
    description: 'Sync events with Google Calendar',
    category: 'automation',
    code: `async function syncCalendar(events) {
  // Sync with Google Calendar API
  return { synced: events.length };
}`,
    author: 'Agentbot',
    featured: false
  }
]

console.log('Skills to seed:', skills.length)
console.log(JSON.stringify(skills, null, 2))
