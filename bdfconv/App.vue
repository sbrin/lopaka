<script lang="ts" setup>
import { computed, ref } from "vue";
import Module from './wasm/bdfconv';

const textInput = ref('');
const fileUploaded = ref(null);
const args = computed(() => textInput.value.split(" "));
const fileInput = ref(null);
const outputFile = ref();
const outputUrl = ref();

function onClick() {
    loadAndRun(args.value, fileUploaded.value);
}

async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file.name) {
        return;
    }
    fileUploaded.value = file;
    console.log("fileUploaded", file);
}

function resetFileInput() {
    fileInput.value = null;
    outputFile.value = null;
    outputUrl.value = null;
}

let moduleInstance = null;

Module({
    noInitialRun: true,
    thisProgram: false,
}).then((instance) => {
    moduleInstance = instance;
    console.log("Module created", moduleInstance);
    moduleInstance.onExit = onExit;
    moduleInstance.onAbort = onExit;
});

function onExit() {
    console.log("onExit");
    try {
        // Assuming the output file has the same name but with a .u8g extension
        outputFile.value = args[0] + '.u8g';
        const outputFileData = moduleInstance?.FS.readFile(outputFile);
        const blob = new Blob([outputFileData], { type: 'application/octet-stream' });
        outputUrl.value = URL.createObjectURL(blob);
    } catch (err) {
        console.error('Error reading output file:', err);
    }
}

async function loadAndRun(args, file) {
    if (!file) {
        return;
    }
    console.log("loadAndRun", file.name);
    await new Promise((resolve) => {
        const reader = new FileReader();
        console.log("Promise");
        reader.onload = (e) => {
            console.log("onload", e.target?.result);
            const data = new Uint8Array(e.target?.result as ArrayBufferLike);
            moduleInstance?.FS.writeFile(file.name, data);
            resolve(null);
        };
        reader.readAsArrayBuffer(file);
    });

    runMain([...args, file.name]);
}
    
function runMain(args) {
  if (moduleInstance) {
    moduleInstance.callMain(args);
    console.log("callMain", args);
  } else {
    console.error("Module is not initialized.");
  }
}

</script>
<template>
    <div class="bdfconv">
        <div>
            <input
                type="file"
                @change="onFileChange"
                @click="resetFileInput"
                ref="fileInput"
            />
        </div>
        <div>
            <textarea name="" id="" cols="50" rows="10" v-model="textInput"></textarea>
        </div>
        <div>{{ args }}</div>
        <div>
            <button @click="onClick">Run</button>
        </div>
        <div v-if="outputFile">
            <a :href="outputUrl">{{ outputFile }}</a>
        </div>
    </div>
</template>
<style lang="css">
</style>
