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
    console.log('📤 Outgoing headers:', {
      Authorization: basicAuthHeader.Authorization.slice(0, 30) + '...',
      'Content-Type': 'application/json',
    });
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        ...basicAuthHeader,
        'Content-Type': 'application/json',
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
       params: req.query,
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
      const status = error.response?.status || 500;
      const data = error.response?.data || {};
      const headers = error.response?.headers || {};
    
      console.error('[Jira Proxy Error]', {
        status,
        data,
        headers,
      });
    
      res.status(status).json({
        error: data,
      });
}

});

// Start server on DigitalOcean-provided port or 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Jira proxy running on port ${PORT}`);
});
