# Snowpack Elm Plugin

**!! work-in-progress !!**

## TODO

- [ ] In ./example/
  - [x] `npx snowpack dev` renders Sandbox1.elm
  - [x] Add HMR for changes to Sandbox1.elm
  - [ ] Add HMR for changes to Other.elm
  - [ ] Fix `npx snowpack build` (tries to build Other.elm which does not export a `main`)
- [x] Convert ./example to a playwright test
- [ ] Add tests
  - [x] For a Browser.sandbox (see ./example/)
  - [ ] For a Browser.element (with ports)
  - [ ] For a Browser.document
  - [ ] For a Browser.application (with URL change)
- [ ] Enhance tests
  - [ ] Test that the browser page reloads after incompatible change elm-hot [`page.waitForNavigation/1`](https://playwright.dev/#version=v1.4.2&path=docs%2Fapi.md&q=pagewaitfornavigationoptions)
- [ ] Ask for feedback
  - [ ] On https://www.pika.dev/npm/snowpack/discuss/319
  - [ ] In elm slack

## Usage

To play with it:

```sh
cd example
npm install
npx snowpack dev
# and then change src/Sandbox1.elm
```

## Tests

Execute `npm test`

## Notes

After I got it running, I would like to merge the changes into https://github.com/klazuka/elm-hot so the esm builds could be used in multiple tools (e.g. webpack, parcel2, vite), and then use elm-hot inside this plugin.

Maybe it will make sense to have different _hmr.js_ files that elm-hot can insert as necessary (configurable with flags).
