<script lang="ts" setup>
import { computed, ref } from "vue";
import { runMain } from './app';

const textInput = ref('');
const args = computed(() => textInput.value.split(" "));

function onClick() {
    runMain(args.value);
}

</script>
<template>
    <div class="bdfconv">
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
