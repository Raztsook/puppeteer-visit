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

    // טען את העמוד
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

    // המתן שהעמוד יהיה ב-readyState=complete
    await page.waitForFunction(() => document.readyState === 'complete');

    // אינטראקציה מדומה
    await page.mouse.move(100, 100);
    await page.evaluate(() => {
      window.scrollTo(0, 100);
      window.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('focus'));
    });

    // האזן לקונסול כדי לזהות את ה-webhook אם יש הדפסה
    page.on('console', msg => {
      if (msg.text().includes('webhook sent')) {
        console.log('📡 Webhook Triggered!');
      }
    });

    // המתן לאלמנט שמעיד על השלמת webhook (אם יש כזה)
    try {
      await page.waitForSelector('span:text("Last sent:")', { timeout: 10000 });
    } catch (e) {
      console.warn("⚠️ Webhook indication not found in DOM.");
    }

    // המתן זמן נוסף
    await page.waitForTimeout(3000);

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
