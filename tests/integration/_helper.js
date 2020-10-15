const { chromium } = require('playwright');
const debug = true;

const chromiumSettings = debug ? { headless: false, slowMo: 100 } : {};
const browserPromise = chromium.launch(chromiumSettings);

// refactor test setup
// copy test code to a temp location
// start snowpack on random port in temp location
// stop snowpack server in finally
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
