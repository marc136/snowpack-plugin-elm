if (import.meta.hot.data) {
  console.info('We got import.meta.hot.data', import.meta.hot.data);
}

// index.js
const elmWorker = new Worker('/_dist_/worker.js', {
  name: 'my-web-worker',
  type: import.meta.env.MODE === 'development' ? 'module' : 'classic',
});

console.warn('elm', elmWorker);
elmWorker.postMessage('hagge');

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
