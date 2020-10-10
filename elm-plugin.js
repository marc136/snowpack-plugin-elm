const fs = require('fs').promises;
const path = require('path');
const elm = require('node-elm-compiler');
const elmHot = require('elm-hot');

module.exports = (snowpackConfig, userPluginOptions) => {
  return {
    name: 'elm-plugin',

    resolve: { input: ['.elm'], output: ['.js'] },

    config(snowpackConfig) {
      // snowpack config was built and can be accessed here
      console.warn('elm-plugin.config()');
    },

    async load({ fileExt, filePath, isDev, isHmrEnabled }) {
      const args = { fileExt, filePath, isDev, isHmrEnabled };
      console.warn('elm-plugin.load()', args);
      try {
        const iife = await elm.compileToString([filePath], {
          debug: isDev,
          optimize: !isDev,
        });

        if (isHmrEnabled) {
          // TODO use the inject function from elm-hot
          return toESM(iife);
        } else {
          return toESM(iife);
        }
      } catch (err) {
        console.error('ERROR:', err.message || err);
        throw err;
      }
    },

    async onchange({ filePath }) {
      // TODO use this to check Elm module dependencies and support HMR for imported modules
      console.warn('elm-plugin.onchange', filePath);
    },
  };
};

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
