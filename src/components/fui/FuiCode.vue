<script lang="ts" setup>
import {Layer} from '../../core/layer';
import {useSession} from '../../core/session';
import {computed, toRefs} from 'vue';
const session = useSession();
const {platform, layers} = toRefs(session.state);

const content = computed(() => {
    if (session.virtualScreen) {
        const sourceCode = session.platforms[platform.value].generateSourceCode(
            layers.value as Layer[],
            session.virtualScreen.ctx
        );
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
