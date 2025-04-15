const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Load environment variables
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';

// Validate essential variables
if (!JIRA_USER_EMAIL || !JIRA_API_TOKEN || !JIRA_BASE_URL) {
  console.error("❌ Missing one or more required environment variables.");
  process.exit(1);
}

// Build Basic Auth header
const basicAuthHeader = {
  Authorization: 'Basic ' + Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'),
};

// Proxy all /jira/* requests to Jira API
app.all('/jira/*', async (req, res) => {
  const jiraPath = req.path.replace('/jira', '');

  // Build clean full URL (avoid double slashes)
  const fullUrl = `${JIRA_BASE_URL.replace(/\/$/, '')}${jiraPath}`;
  console.log(`➡️  Proxying to: ${fullUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        ...basicAuthHeader,
        'Content-Type': 'application/json',
      },
      params: req.query,
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[Jira Proxy Error]`, error.response?.status, error.response?.data?.errorMessages || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// Start server on DigitalOcean-provided port or 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Jira proxy running on port ${PORT}`);
});
