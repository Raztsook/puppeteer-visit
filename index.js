await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

// המתן לטעינה מלאה
await page.waitForFunction(() => document.readyState === 'complete');

// גלילה ועכבר
await page.mouse.move(100, 100);
await page.evaluate(() => {
  window.scrollTo(0, 100);
  window.dispatchEvent(new Event('mousemove'));
  window.dispatchEvent(new Event('focus'));
});

// המתן לאלמנט שמופיע רק לאחר שליחת ה-webhook (אם יש כזה)
try {
  await page.waitForSelector('span:text("Last sent:")', { timeout: 10000 });
} catch (e) {
  console.warn("Webhook indication not found in DOM");
}

// המתן עוד זמן ליתר ביטחון
await page.waitForTimeout(3000);
