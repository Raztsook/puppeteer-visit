const express = require('express');
const puppeteer = require('puppeteer');
const chromium = require('chromium');

const app = express();

app.get('/', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing URL parameter');

  try {
    const browser = await puppeteer.launch({
      executablePath: chromium.path,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const content = await page.content();
    await browser.close();

    res.status(200).send(content);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
