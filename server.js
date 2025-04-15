const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Load Jira credentials from environment variables
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://paymentology.atlassian.net'; // Optional override

// Create Basic Auth header
const authHeader = {
  Authorization:
    'Basic ' + Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'),
};

// Forward all API requests to Jira
app.all('/jira/*', async (req, res) => {
  const jiraPath = req.path.replace('/jira', '');
  try {
    const response = await axios({
      method: req.method,
      url: `${JIRA_BASE_URL}${jiraPath}`,
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      params: req.query,
      data: req.body,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('[Jira Proxy Error]', err.message);
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: err.message }
    );
  }
});

// Use environment variable for port (required by DigitalOcean)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Jira proxy running on port ${PORT}`);
});
