const test = require('ava').default;
const { pageMacro, closeBrowser } = require('./_helper');
const snow = require('snowpack');
const path = require('path');
const execa = require('execa');
const getPort = require('get-port');
const touch = require('touch');

const debug = false;

if (debug) console.log('Current working directory:', process.cwd());

const fullTestEnvPath = path.join(__dirname, 'first');
const options = {
  cwd: fullTestEnvPath,
  preferLocal: true,
  // localDir: process.cwd(),
  shell: true,
  stdio: debug ? 'inherit' : 'pipe',
};

const servers = [];

test.after.always('guaranteed cleanup', (t) => {
  // https://github.com/avajs/ava/blob/master/docs/01-writing-tests.md#before--after-hooks
  if (debug) console.log('cleanup');
  // force-kill snowpack servers if they were not shut down gracefully
  servers.filter((s) => !s.isCanceled).forEach((server) => server.kill());
  // closeBrowser();
});

test('Can compile the Elm app', pageMacro, async (t, page) => {
  const port = await getPort(); // TODO change pageMacro
  const snowPackServer = execa.command(
    `snowpack dev --port ${port} --config snowpack.config.json`,
    options,
  );
  servers.push[snowPackServer];

  await page.goto(`http://localhost:${port}`);
  await page.waitForSelector('#counter-value');

  t.is(await page.textContent('#counter-value'), '1');

  snowPackServer.cancel();
});

test(
  'Will hot-reload when touching Sandbox1.elm',
  pageMacro,
  async (t, page) => {
    const port = await getPort(); // TODO change pageMacro
    const snowPackServer = execa.command(
      `snowpack dev --port ${port} --config snowpack.config.json`,
      options,
    );
    servers.push[snowPackServer];

    await delay(1);

    await page.goto(`http://localhost:${port}`);
    await page.waitForSelector('#counter-value');

    const expectHotSwapNotice = waitForHotSwap('Sandbox1', page);
    touch(path.join(fullTestEnvPath, 'src/Sandbox1.elm'));
    await expectHotSwapNotice;

    snowPackServer.cancel();
  },
);

test(
  'Will hot-reload when changing Sandbox1.elm and retain the state',
  pageMacro,
  async (t, page) => {
    const port = await getPort(); // TODO change pageMacro
    const snowPackServer = execa.command(
      `snowpack dev --port ${port} --config snowpack.config.json`,
      options,
    );
    servers.push[snowPackServer];

    await delay(2);

    await page.goto(`http://localhost:${port}`);
    await page.waitForSelector('#counter-value');

    function getCounterValue() {
      return page
        .textContent('#counter-value')
        .then((str) => Number.parseInt(str));
    }

    t.plan(3);
    t.is(await getCounterValue(), 1);
    await page.click('#add-1');
    t.is(await getCounterValue(), 2);

    touch(path.join(fullTestEnvPath, 'src/Sandbox1.elm'));
    await waitForHotSwap('Sandbox1', page);

    t.is(
      await getCounterValue(),
      2,
      'The app state should be retained after hot-swap',
    );

    snowPackServer.cancel();
  },
);

test.only(
  'Will hot-reload when changing files that Sandbox1.elm  imports and retain the state',
  pageMacro,
  async (t, page, server, workingDir) => {
    await page.goto(`${server}/index.html`);
    await page.waitForSelector('#counter-value');

    function getCounterValue() {
      return page
        .textContent('#counter-value')
        .then((str) => Number.parseInt(str));
    }

    t.plan(3);
    t.is(await getCounterValue(), 1);
    await page.click('#add-1');
    t.is(await getCounterValue(), 2);

    // Snowpack1.elm imports Indirect.elm which imports Nested/Number8.elm
    touch(path.join(workingDir, 'src/Nested/Number8.elm'));
    await waitForHotSwap('Sandbox1', page);

    t.is(
      await getCounterValue(),
      2,
      'The app state should be retained after hot-swap',
    );
  },
);

function waitForHotSwap(moduleName, page) {
  return waitForConsoleMessage(
    page,
    '[elm-hot]',
    `Hot-swapped module: ${moduleName}`,
  );
}

/**
 * Attaches an event listener to all browser console messages of the given Page object.
 * It will resolve if a console message with the expected values was received.
 *
 * The expected arguments may be fewer than the actual call, see this example:
 *
 * ```js
 * const expect = waitForConsoleMessage(page, 'Good');
 * page.evaluate(() => { console.log('Good', 'morning')); });
 * await expected;
 * ```
 */
function waitForConsoleMessage(page, ...expected) {
  if (expected.length < 1)
    return Promise.reject(
      'You need to supply at least one expected console message',
    );
  return new Promise((resolve) => {
    page.on('console', async (msg) => {
      // https://playwright.dev/#version=v1.4.2&path=docs%2Fapi.md&q=class-consolemessage
      const args = msg.args();
      if (args.length < expected.length) return;
      // https://playwright.dev/#version=v1.4.2&path=docs%2Fapi.md&q=class-jshandle
      const unwrapJsHandle = (jsHandle) => jsHandle.evaluate((h) => h);
      const actual = await Promise.all(args.map(unwrapJsHandle));
      // console.log('checking', { actual, expected });
      for (let index = 0; index < expected.length; index++) {
        if (actual[index] != expected[index]) return;
      }
      resolve();
    });
  });
}

function delay(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}
