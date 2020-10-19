const execa = require('execa');
const path = require('path');
const getPort = require('get-port');
const tempDir = require('temp-dir');
const fs = require('fs-extra');
const replaceInFile = require('replace-in-file');
const { chromium } = require('playwright');

const debug = false;

const chromiumSettings = debug ? { headless: false, slowMo: 100 } : {};
const browserPromise = chromium.launch(chromiumSettings);

async function pageMacro(t, callback) {
  const workingDir = await copyFolderToTemp(path.join(__dirname, 'first'));

  const port = await getPort();
  const serverBaseurl = `http://localhost:${port}`;
  const startServer = startSnowpack(workingDir, port);

  const browser = await browserPromise;
  const page = await browser.newPage();
  const snowpack = await startServer;
  try {
    await callback(t, page, serverBaseurl, workingDir);
  } finally {
    await page.close();
    await snowpack.stop();
    if (debug) console.log('Stopped server, will delete', workingDir);
    // process.on('exit', () => fs.remove(workingDir));
    await fs.remove(workingDir);
  }
}

async function copyFolderToTemp(src) {
  const [s, ns] = process.hrtime();
  const folderName = `snowpack-elm_${s}_${ns}`;
  const dest = path.join(tempDir, folderName);

  await fs.emptyDir(dest);
  if (debug) console.log('copy from ', src, 'to', dest);
  await fs.copy(src, dest, { filter: ignoreSome });

  await replacePluginPath(path.resolve(dest, 'snowpack.config.json'));

  return dest;
}

function ignoreSome(str) {
  const toIgnore = ['node_modules', 'elm-stuff', 'package-lock.json'];
  for (const ignore of toIgnore) {
    if (str.endsWith(ignore)) return false;
  }
  return true;
}

function replacePluginPath(snowpackConfigPath) {
  const pluginPath = path.resolve(__dirname, '../../');
  if (debug) {
    console.log(
      `Replace plugin path in ${snowpackConfigPath} with ${pluginPath}`,
    );
  }

  return replaceInFile({
    files: snowpackConfigPath,
    from: /([\.\/]+)(elm-plugin)/,
    to: path.resolve(__dirname, '../../').replace(/\\/g, '/') + '/$2',
  });
}

async function startSnowpack(workingDir, port) {
  if (debug) console.log(`Starting Snowpack:${port} in ${workingDir}`);

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
