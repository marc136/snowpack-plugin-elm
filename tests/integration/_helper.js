const execa = require('execa');
const path = require('path');
const getPort = require('get-port');
const { chromium } = require('playwright');

const debug = true;

const chromiumSettings = debug ? { headless: false, slowMo: 100 } : {};
const browserPromise = chromium.launch(chromiumSettings);

async function pageMacro(t, callback) {
  // TODO copy to a temp location
  const fullTestEnvPath = path.join(__dirname, 'first');

  const port = await getPort();
  const serverBaseurl = `http://localhost:${port}`;
  const startServer = startSnowpack(fullTestEnvPath, port);

  const browser = await browserPromise;
  const page = await browser.newPage();
  const snowpack = await startServer;
  try {
    await callback(t, page, serverBaseurl);
  } finally {
    await page.close();
    await snowpack.stop();
  }
}

async function startSnowpack(workingDir, port) {
  console.log(`Starting Snowpack:${port} in ${workingDir}`);

  const options = {
    cwd: workingDir,
    preferLocal: true,
    // localDir: process.cwd(),
    shell: true,
    stdio: debug ? 'inherit' : 'pipe',
  };

  const server = execa.command(
    `snowpack dev --port ${port} --config snowpack.config.json`,
    options,
  );

  const stop = async () => {
    server.cancel();
    await server.catch((error) => {
      if (error.isCanceled) return;
      console.error(`Snowpack (port ${port} did not exit as expected`);
      throw error;
    });
    if (debug) console.log(`Snowpack:${port} was closed`);
  };

  await delay(2); // TODO find a better way

  return { port, workingDir, server, stop };
}

async function closeBrowser() {
  return (await browserPromise).close();
}

function delay(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

module.exports = { pageMacro, closeBrowser };
