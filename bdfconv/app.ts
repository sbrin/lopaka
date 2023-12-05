import bdfconvModule from './wasm/bdfconv.wasm?url';
const importObject = {
    env: {
        __memory_base: 0,
        __table_base: 0,
        memory: new WebAssembly.Memory({initial: 1})
    }
};

const main = async () => {
    const responsePromise = fetch(bdfconvModule);
    const {module, instance} = await WebAssembly.instantiateStreaming(responsePromise, importObject);
    console.log(module, instance);
};

main();
