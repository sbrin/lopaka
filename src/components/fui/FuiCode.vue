<script lang="ts" setup>
import {shallowRef, toRefs, watch} from 'vue';
import {VAceEditor} from 'vue3-ace-editor';
import {useSession} from '../../core/session';
import {debounce} from '../../utils';
import {aceMode, aceTheme} from './ace/ace-config';
const aceOptions = {
    fontSize: 12,
    showPrintMargin: false,
    showGutter: true,
    highlightActiveLine: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    tabSize: 4,
    useSoftTabs: true,
    wrap: true
};
const session = useSession();
const {updates} = toRefs(session.virtualScreen.state);
const {layers} = toRefs(session.state);
const {selectedLayers} = toRefs(session.editor.state);
const content = shallowRef('');
const aceRef = shallowRef(null);

watch(
    [updates, layers],
    debounce(() => onUpdate(), 250)
);

watch(
    selectedLayers,
    () => {
        if (selectedLayers.value.length == 1) {
            const layer = selectedLayers.value[0];
            const row = layersMap[layer.uid];
            if (row) {
                aceRef.value._editor.gotoLine(row + 1, 0, true);
            }
        }
    },
    {deep: true}
);
function onUpdate() {
    content.value = parseCode(session.generateCode('Default'));
}
let layersMap = {};
const layerNameRegex = /^@([\d\w]+);/g;
const paramsRegex = /@(\w+):/g;
function parseCode(code: string) {
    layersMap = {};
    const lines = code.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = layerNameRegex.exec(line);
        if (match?.length > 1) {
            const id = match[1];
            layersMap[id] = i;
        }
        result.push(line.replaceAll(paramsRegex, '').replace(layerNameRegex, ''));
    }
    return result.join('\n');
}
function onChange(...args) {
    const {row, column} = aceRef.value._editor.getCursorPosition();
    const uid = Object.keys(layersMap).find((key) => layersMap[key] === row);
    if (uid) {
        const layer = session.state.layers.find((l) => l.uid === uid);
        session.state.layers.forEach((l) => (l.selected = false));
        if (layer) {
            layer.selected = true;
        }
        session.virtualScreen.redraw();
    }
}
</script>
<template>
    <div class="fui-code">
        <VAceEditor
            ref="aceRef"
            v-model:value="content"
            :lang="aceMode"
            :theme="aceTheme"
            style="height: 100%; width: 100%; border-radius: 8px"
            :options="aceOptions"
            :readonly="true"
            @click="onChange"
        ></VAceEditor>
    </div>
    <!-- <textarea class="fui-code" v-model="content" readonly></textarea> -->
</template>
<style lang="css"></style>
