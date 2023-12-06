import { createApp } from "vue";
import Module from './wasm/bdfconv';
import AppVue from "./App.vue";

let moduleInstance = null;

Module({
    noInitialRun: true,
    thisProgram: false,
}).then((instance) => {
    moduleInstance = instance;
    // instance.callMain([]);
});
    
export function runMain(args) {
  if (moduleInstance) {
    moduleInstance.callMain(args);
  } else {
    console.error("Module is not initialized.");
  }
}

createApp(AppVue).mount('#bdfconv_app');