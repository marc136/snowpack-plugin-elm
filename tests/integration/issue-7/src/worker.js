// import Elm from './Worker.js';
import Elm from "/_dist_/Worker.elm"; // that is elm file
// const app = Elm.Worker.init();
const app = 1
console.log('worker.js Elm app', app);

self.onmessage = (evt) => {
  console.log('worker.js received a message', evt.data);
};
