const { chromium } = require('playwright');
const debug = false;

const chromiumSettings = debug ? { headless: false, slowMo: 100 } : {};
const browserPromise = chromium.launch(chromiumSettings);

async function pageMacro(t, callback) {
  const browser = await browserPromise;
  const page = await browser.newPage();
  try {
    await callback(t, page);
  } finally {
    await page.close();
  }
}

async function closeBrowser() {
  return (await browserPromise).close();
}

module.exports = { pageMacro, closeBrowser };
