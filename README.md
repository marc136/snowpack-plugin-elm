# Snowpack Elm Plugin

**!! work-in-progress !!**

## TODO

- [ ] In ./example/
  - [x] `npx snowpack dev` renders Sandbox1.elm
  - [x] Add HMR for changes to Sandbox1.elm
  - [ ] Add HMR for changes to Other.elm
  - [ ] Fix `npx snowpack build` (tries to build Other.elm which does not export a `main`)
- [ ] Convert ./example to a playwright test
- [ ] Add tests
  - [ ] For a Browser.sandbox (see ./example/)
  - [ ] For a Browser.element (with ports)
  - [ ] For a Browser.document
  - [ ] For a Browser.application (with URL change)
- [ ] Ask for feedback
  - [ ] On https://www.pika.dev/npm/snowpack/discuss/319
  - [ ] In elm slack

## Usage

To test it:

```sh
cd example
npm install
npx snowpack dev
```

## Notes

After I got it running, I would like to merge the changes into https://github.com/klazuka/elm-hot so the esm builds could be used in multiple tools (e.g. webpack, parcel2, vite), and then use elm-hot inside this plugin.

Maybe it will make sense to have different _hmr.js_ files that elm-hot can insert as necessary (configurable with flags).
