<script lang="ts" setup>
import { computed, ref } from "vue";
import { loadAndRun } from './app';

const textInput = ref('');
const fileUploaded = ref(null);
const args = computed(() => textInput.value.split(" "));
const fileInput = ref(null);

function onClick() {
    loadAndRun(args.value, fileUploaded.value);
}

async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file.name) {
        return;
    }
    fileUploaded.value = file;
}

function resetFileInput() {
    fileInput.value = null;
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
    </div>
</template>
<style lang="css">
</style>
