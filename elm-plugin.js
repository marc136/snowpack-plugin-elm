const fs = require('fs-extra');
const path = require('path');
const elm = require('node-elm-compiler');
// const elmHot = require('elm-hot');

module.exports = (snowpackConfig, userPluginOptions) => {
  const elmModules = new Map();

  return {
    name: 'elm-plugin',
    resolve: { input: ['.elm'], output: ['.js'] },
    verbose: userPluginOptions.verbose || false,

    config(snowpackConfig) {
      // snowpack config was built and can be accessed here
      // https://www.snowpack.dev/guides/plugins#config()
      if (this.verbose) console.log('elm-plugin.config()', snowpackConfig);
    },

    async load({ fileExt, filePath, isDev, isHmrEnabled }) {
      const args = { fileExt, filePath, isDev, isHmrEnabled };
      console.warn('elm-plugin.load()', args);
      try {
        const iife = await elm.compileToString([filePath], {
          debug: isDev,
          optimize: !isDev,
        });

        elm.findAllDependencies(filePath).then((deps) => {
          if (this.verbose) {
            console.log('elm-plugin-deps', { filePath, deps });
          }
          deps.forEach((depFilePath) => {
            const known = elmModules.get(depFilePath) || [];
            known.push(filePath);
            elmModules.set(depFilePath, known);
          });
        });

        if (isDev || isHmrEnabled) {
          return toHMR(iife);
        } else {
          return toESM(iife);
        }
      } catch (err) {
        const ERROR_NO_MAIN = '-- NO MAIN --';
        if (err.message.includes(ERROR_NO_MAIN)) return;

        if (this.debug) console.error(`ERROR: "${err.message}"`);
        throw err;
      }
    },

    async onChange({ filePath }) {
      const modules = elmModules.get(filePath);
      if (!modules) return;
      modules.forEach((module) => {
        if (this.verbose) {
          console.log(`Will compile ${module} because ${filePath} was changed`);
        }
        if (typeof this.markChanged === 'function') this.markChanged(module);
      });
    },
  };
};

async function toHMR(step0) {
  const debug = true;
  async function writeDebug(name, content) {
    if (!debug) return;
    return fs.writeFile(path.join(__dirname, '.temp', name), content);
  }
  if (debug) await fs.ensureDir(path.join(__dirname, '.temp'));
  await writeDebug('step0.js', step0);

  const step1 = toESM(step0);
  await writeDebug('step1.js', step1);

  const step2 = await elmHotInject(step1);
  await writeDebug('step2.js', step2);

  return step2;
}

/**
 * Inject the HMR code into the Elm compiler's JS output
 * @param {string} originalElmCodeJS
 */
async function elmHotInject(originalElmCodeJS) {
  // copied from https://github.com/klazuka/elm-hot/blob/efe9db967496415944246006b4e711c0aed1e777/src/inject.js

  const hmrCode = await fs.readFile(
    path.join(__dirname, 'lib/elm-hot/hmr.js'),
    { encoding: 'utf8' },
  );

  // first, verify that we have not been given Elm 0.18 code
  if (
    originalElmCodeJS.indexOf('_elm_lang$core$Native_Platform.initialize') >= 0
  ) {
    throw new Error(
      '[elm-hot] Elm 0.18 is not supported. Please use fluxxu/elm-hot-loader@0.5.x instead.',
    );
  }

  let modifiedCode = originalElmCodeJS;

  if (originalElmCodeJS.indexOf('elm$browser$Browser$application') !== -1) {
    // attach a tag to Browser.Navigation.Key values. It's not really fair to call this a hack
    // as this entire project is a hack, but this is evil evil evil. We need to be able to find
    // the Browser.Navigation.Key in a user's model so that we do not swap out the new one for
    // the old. But as currently implemented (2018-08-19), there's no good way to detect it.
    // So we will add a property to the key immediately after it's created so that we can find it.
    const navKeyDefinition =
      'var key = function() { key.a(onUrlChange(_Browser_getUrl())); };';
    const navKeyTag = "key['elm-hot-nav-key'] = true";
    modifiedCode = originalElmCodeJS.replace(
      navKeyDefinition,
      navKeyDefinition + '\n' + navKeyTag,
    );
    if (modifiedCode === originalElmCodeJS) {
      throw new Error(
        '[elm-hot] Browser.Navigation.Key def not found. Version mismatch?',
      );
    }
  }

  return modifiedCode + '\n\n' + hmrCode;
}

/**
 * Transforms the IIFE the elm compiler returns to an ES module
 * @param {string} iife - the js source code emitted from the elm compiler
 */
function toESM(iife) {
  // Copied from https://github.com/ChristophP/elm-esm/blob/17e7f56aa1ec313f0ab0c47ef15142ba64fd9169/src/index.js
  const elmExports = iife.match(/^_Platform_export\(([^]*?)\);/m)[1];
  return iife
    .replace(/^\(function\(scope\)\{$/m, '// -- $&')
    .replace(/^'use strict';$/m, '// -- $&')
    .replace(/function _Platform_export([^]*?)\n\}\n/g, '/*\n$&\n*/')
    .replace(/function _Platform_mergeExports([^]*?)\n\}\n/g, '/*\n$&\n*/')
    .replace(/^_Platform_export\(([^]*?);$/m, '/*\n$&\n*/')
    .concat('\n')
    .concat(`export const Elm = ${elmExports};\nexport default Elm;\n`);
}
