<script lang="ts" setup>
import {shallowRef, toRefs, watch} from 'vue';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {debounce} from '../../utils';
const session = useSession();
const {platform, layers} = toRefs(session.state);
const {updates} = toRefs(session.virtualScreen.state);
const content = shallowRef('');
watch(
    updates,
    debounce(() => {
        const sourceCode = session.platforms[platform.value].generateSourceCode(
            (layers.value as AbstractLayer[]).filter(
                (layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()
            ),
            session.virtualScreen.ctx
        );
        content.value = sourceCode.declarations.reverse().join('\n') + '\n' + sourceCode.code.reverse().join('\n');
        session.state.codePreview = content.value;
    }, 500)
);
</script>
<template>
    <div class="fui-code">
        <pre>{{ content }}</pre>
    </div>
</template>
<style lang="css"></style>
