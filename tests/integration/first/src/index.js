import Elm from './Sandbox1.elm';
console.warn('Elm', Elm);

if (import.meta.hot.data) {
  console.info('We got import.meta.hot.data', import.meta.hot.data);
}

const node = document.getElementById('main');
node.innerHTML = '';
const elm = Elm.Sandbox1.init({
  // create a new child node for HMR, as elm replaces it
  node: node.appendChild(document.createElement('div')),
});
console.warn('elm', elm);

if (import.meta.hot) {
  // Receive any updates from the dev server, and update accordingly.
  import.meta.hot.accept((/*{ module }*/ args) => {
    // https://github.com/pikapkg/esm-hmr#accepthandler-module-any--void
    const { module } = args;
    console.warn('meta.hot.accept', args);
    try {
      // foo = module.foo;
    } catch (err) {
      // If you have trouble accepting an update, mark it as invalid (reload the page).
      console.warn('calling "import.meta.hot.invalidate();"');
      import.meta.hot.invalidate();
    }
  });

  // Optionally, clean up any side-effects in the module before loading a new copy.
  import.meta.hot.dispose(() => {
    console.warn('meta.hot.dispose');
    // pass data from this instance to the next instance
    // maybe useful for Elm app hydration if elm-hot won't work out
    // https://github.com/pikapkg/esm-hmr#importmetahotdata
    import.meta.hot.data = { now: Date.now(), marc: 'moin' };
  });
}
