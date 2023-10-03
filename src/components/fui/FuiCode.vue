<script lang="ts" setup>
import {useSession} from '../../core/session';
import {computed, toRefs} from 'vue';
const {platform, layers, virtualScreen} = toRefs(useSession());

const content = computed(() => {
    if (virtualScreen.value) {
        const sourceCode = platform.value.generateSourceCode(layers.value, virtualScreen.value.ctx);
        return sourceCode.declarations.join('\n') + '\n' + sourceCode.code.join('\n');
    } else {
        return '';
    }
});
</script>
<template>
    <div class="fui-code">
        <pre>{{ content }}</pre>
    </div>
</template>
<style lang="css"></style>
