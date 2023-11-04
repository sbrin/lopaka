<script lang="ts" setup>
import {shallowRef, toRefs, watch} from 'vue';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
const session = useSession();
const {platform, layers} = toRefs(session.state);
const {updates} = toRefs(session.virtualScreen.state);
const content = shallowRef('');
let timeout;
watch([updates], () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const sourceCode = session.platforms[platform.value].generateSourceCode(
            layers.value as AbstractLayer[],
            session.virtualScreen.ctx
        );
        content.value = sourceCode.declarations.reverse().join('\n') + '\n' + sourceCode.code.reverse().join('\n');
    }, 100);
});
</script>
<template>
    <div class="fui-code">
        <pre>{{ content }}</pre>
    </div>
</template>
<style lang="css"></style>
