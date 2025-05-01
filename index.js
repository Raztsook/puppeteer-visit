const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const app = express();

app.get('/', async (req, res) => {
  const url = req.query.url;
  const returnScreenshot = req.query.screenshot === 'true';

  if (!url) return res.status(400).send('Missing URL parameter');

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

    // המתן ש-document יהיה בסטטוס 'complete'
    await page.waitForFunction(() => document.readyState === 'complete');

    // אינטראקציה "אנושית"
    await page.mouse.move(200, 200);
    await page.evaluate(() => {
      window.scrollTo(0, 150);
      document.body.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('focus'));
    });

    // המתן לפעולת webhook מהדף (אם היא תתרחש)
    await page.waitForTimeout(4000);

    if (returnScreenshot) {
      const screenshot = await page.screenshot({ type: 'png', fullPage: true });
      await browser.close();
      res.set('Content-Type', 'image/png');
      return res.send(screenshot);
    } else {
      const html = await page.content();
      await browser.close();
      return res.status(200).send(html);
    }

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
