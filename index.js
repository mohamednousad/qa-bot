import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; 

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];
  if (event !== 'pull_request') return res.status(200).send('Ignored');

  const { action, pull_request, installation, repository } = req.body;
  if (action !== 'opened' && action !== 'synchronize') return res.status(200).send('Ignored');

  try {
    const appJwt = jwt.sign({
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
      iss: process.env.APP_ID
    }, process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), { algorithm: 'RS256' });

    const tokenRes = await fetch(`https://api.github.com/app/installations/${installation.id}/access_tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${appJwt}`, Accept: 'application/vnd.github.v3+json' }
    });
    
    const { token: accessToken } = await tokenRes.json();

    const passed = !pull_request.title.includes('WIP'); 
    
    await fetch(`https://api.github.com/repos/${repository.full_name}/check-runs`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Custom Node QA',
        head_sha: pull_request.head.sha,
        status: 'completed',
        conclusion: passed ? 'success' : 'failure',
        output: { title: passed ? 'Code Good' : 'WIP Found', summary: 'Tested with ES6 Imports' }
      })
    });

    res.status(200).send('Check sent!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/', (req, res) => {
  res.send('My QA Bot is running and waiting for GitHub webhooks!');
});

// Environment variable check
if (process.env.APP_ID && process.env.PRIVATE_KEY) {
  console.log('✅ Credentials loaded: APP_ID and PRIVATE_KEY are present.');
} else {
  console.log('❌ Error: Missing APP_ID or PRIVATE_KEY in .env file!');
}

app.listen(3000, () => console.log('Bot running on port 3000'));