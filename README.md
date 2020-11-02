# Snowpack Elm Plugin

This plugin adds support for the [Elm language](https://elm-lang.org) to any Snowpack project. With it, you can import \*.elm files and have them compile to JavaScript modules.

## Usage

### Plugin options

Default values:

```js
{
  "verbose": false,
  // When to enable Elm's time-traveling debugger
  "debugger": "dev", // One of "never", "dev" (only on `snowpack dev`) or "always"
  "optimize": "build", // One of "never", "build" (only on `snowpack build`) or "always"
}
```

Note: The Elm `debugger` needs information that is stripped away when using `optimize`, so a setting like `{ "debugger": "always", "optimize": "build" }` would fail and is rejected by the plugin.  
If you want to e.g. have a build with an enabled debugger, you need to use `{ "debugger": "always", "optimize": "never" }`.

### Add the plugin to a Snowpack project

Install `snowpack-plugin-elm`, for instance with `npm install --save-dev snowpack-plugin-elm`.

Then add the plugin to your [Snowpack config, e.g. `snowpack.config.json`](https://www.snowpack.dev/#config-files)

```json
{
  "plugins": ["snowpack-plugin-elm"]
}
```

or with plugin options

```json
{
  "plugins": [["snowpack-plugin-elm", { "verbose": false }]]
}
```

### Or play with the included example first

```sh
cd example
npm install
npx snowpack dev
# and then change src/Sandbox1.elm
```

## Development

### To use it on another project

As described in [this Snowpack guide](https://www.snowpack.dev/guides/plugins#develop-and-test):

1. Clone this repo and `cd` into it.

2. Run `npm link` to expose the plugin globally (in regard to your development machine).

3. Create a new, example Snowpack project in a different location for testing

4. In your example Snowpack project, run `npm install && npm link snowpack-plugin-elm`.

   - Be aware that `npm install` will remove your linked plugin, so on any install, you will need to redo the `npm link snowpack-plugin-elm`.
   - (The alternative would be to use `npm install --save-dev <folder_to_this_repo>`, which would create the "symlink-like" entry in your example Snowpack project’s package.json)

5. In your example Snowpack project, add `snowpack-plugin-elm` to the snowpack.config.json along with any plugin options you’d like to test.

### Tests

Execute `npm test` to start the integration tests.

## Notes

After I got it running, I would like to merge the changes into https://github.com/klazuka/elm-hot so the esm builds could be used in multiple tools (e.g. webpack, parcel2, vite), and then use elm-hot inside this plugin.

Maybe it will make sense to have different _hmr.js_ files that elm-hot can insert as necessary (configurable with flags).

## TODO

- [x] In ./example/
  - [x] `npx snowpack dev` renders Sandbox1.elm
  - [x] Add HMR for changes to Sandbox1.elm
  - [x] Add HMR for changes to Indirect.elm (needs Snowpack >= 2.14.0)
  - [x] Fix `npx snowpack build` (tries to build Indirect.elm which does not export a `main`)
- [x] Convert ./example to a playwright test
- [ ] Add tests
  - [x] For a Browser.sandbox (see ./example/)
  - [ ] For a Browser.element (with ports)
  - [ ] For a Browser.document
  - [ ] For a Browser.application (with URL change)
- [x] Run tests in parallel from temp folders on random ports
- [ ] Enhance tests
  - [ ] Test that the browser page reloads after incompatible change elm-hot [`page.waitForNavigation/1`](https://playwright.dev/#version=v1.4.2&path=docs%2Fapi.md&q=pagewaitfornavigationoptions)
- [ ] Ask for feedback
  - [x] On https://www.pika.dev/npm/snowpack/discuss/319
  - [ ] In elm slack
