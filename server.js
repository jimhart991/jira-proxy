const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = 'https://your-domain.atlassian.net'; // ← Replace this

const authHeader = {
  Authorization:
    'Basic ' + Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'),
};

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
    console.error(err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.listen(3000, () => console.log('✅ Jira proxy running on http://localhost:3000'));
