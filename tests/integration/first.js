const test = require('ava').default;
const { pageMacro, closeBrowser } = require('./_helper');
const snow = require('snowpack');
const path = require('path');
const execa = require('execa');
const getPort = require('get-port');
const touch = require('touch');

const debug = false;

if (debug) console.log('Current working directory:', process.cwd());

test.after.always('guaranteed cleanup', (t) => {
  // https://github.com/avajs/ava/blob/master/docs/01-writing-tests.md#before--after-hooks
  if (debug) console.log('cleanup');
  closeBrowser();
});

test('Can compile the Elm app', pageMacro, async (t, page, server) => {
  await page.goto(`${server}/index.html`);
  await page.waitForSelector('#counter-value');
  t.is(await page.textContent('#counter-value'), '1');
});

test(
  'Will hot-reload when touching Sandbox1.elm',
  pageMacro,
  async (t, page, server, workingDir) => {
    await page.goto(`${server}/index.html`);
    await page.waitForSelector('#counter-value');

    const expectHotSwapNotice = waitForHotSwap('Sandbox1', page, t);
    touch(path.join(workingDir, 'src/Sandbox1.elm'));
    await expectHotSwapNotice;
  },
);

test(
  'Will hot-reload when changing Sandbox1.elm and retain the state',
  pageMacro,
  async (t, page, server, workingDir) => {
    await page.goto(`${server}/index.html`);
    await page.waitForSelector('#counter-value');

    t.is(await getCounterValue(page), 1);
    await page.click('#add-1');
    t.is(await getCounterValue(page), 2);

    touch(path.join(workingDir, 'src/Sandbox1.elm'));
    await waitForHotSwap('Sandbox1', page, t);

    t.is(
      await getCounterValue(page),
      2,
      'The app state should be retained after hot-swap',
    );
  },
);

test(
  'Will hot-reload when changing files that Sandbox1.elm imports and retain the state',
  pageMacro,
  async (t, page, server, workingDir) => {
    await page.goto(`${server}/index.html`);
    await page.waitForSelector('#counter-value');

    t.is(await getCounterValue(page), 1);
    await page.click('#add-1');
    t.is(await getCounterValue(page), 2);

    // Snowpack1.elm imports Indirect.elm which imports Nested/Number8.elm
    touch(path.join(workingDir, 'src/Nested/Number8.elm'));
    await waitForHotSwap('Sandbox1', page, t);

    t.is(
      await getCounterValue(page),
      2,
      'The app state should be retained after hot-swap',
    );
  },
);

test(
  'Will compile a Browser.document where Flags is a record (issue #3)',
  pageMacro,
  async (t, page, server, workingDir) => {
    await page.goto(`${server}/documentWithRecordFlags.html`);
    await page.waitForSelector('#counter-value');

    t.is(await getCounterValue(page), 11);
    await page.click('#add-1');
    t.is(await getCounterValue(page), 12);

    // Snowpack1.elm imports Indirect.elm which imports Nested/Number8.elm
    touch(path.join(workingDir, 'src/Nested/Number8.elm'));
    await waitForHotSwap('DocumentWithRecordFlags', page, t);

    t.is(
      await getCounterValue(page),
      12,
      'The app state should be retained after hot-swap',
    );
  },
);

function getCounterValue(page) {
  return page.textContent('#counter-value').then((str) => Number.parseInt(str));
}

async function waitForHotSwap(moduleName, page, test) {
  return waitForConsoleMessage(
    test,
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
 * const expect = waitForConsoleMessage(test, page, 'Good');
 * page.evaluate(() => { console.log('Good', 'morning')); });
 * await expected;
 * ```
 */
function waitForConsoleMessage(test, page, ...expected) {
  if (expected.length < 1) {
    const err = 'You need to supply at least one expected console message';
    test.fail(err);
    return Promise.reject(err);
  }
  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = 5;
    setTimeout(() => {
      if (resolved) return;
      reject(test.fail(`console message did not arrive in ${timeout}s`));
    }, timeout * 1000);
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
      resolved = true;
      resolve(test.pass('Got expected console message'));
    });
  });
}

function delay(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}
