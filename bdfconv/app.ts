import { createApp } from "vue";
import Module from './wasm/bdfconv';
import AppVue from "./App.vue";

let moduleInstance = null;

Module({
    noInitialRun: true,
    thisProgram: false,
}).then((instance) => {
    moduleInstance = instance;
});

export async function loadAndRun(args, file) {
    const filePath = file.name;
    await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            moduleInstance.FS.writeFile(filePath, data);
            resolve(null);
        };
        reader.readAsArrayBuffer(file);
    });

    runMain([...args, filePath]);
}
    
export function runMain(args) {
  if (moduleInstance) {
    moduleInstance.callMain(args);
  } else {
    console.error("Module is not initialized.");
  }
}

createApp(AppVue).mount('#bdfconv_app');