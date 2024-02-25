<script lang="ts" setup>
import {nextTick, onMounted, ref, shallowRef, toRefs, watch} from 'vue';
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
const {selectionUpdates} = toRefs(session.editor.state);
const content = shallowRef('');
const aceRef = shallowRef(null);
const hovered = ref(false);

watch(
    [updates, layers],
    debounce(() => onUpdate(), 250)
);

watch(
    selectionUpdates,
    () => {
        selectRow();
    },
    {deep: true}
);
function selectRow() {
    const selectedLayers = layers.value.filter((l) => l.selected);
    if (selectedLayers.length == 1) {
        const layer = selectedLayers[0];
        const row = layersMap[layer.uid]?.line;
        if (row) {
            const {column} = aceRef.value._editor.getCursorPosition();
            aceRef.value._editor.gotoLine(row + 1, column, true);
        }
    }
}
function onUpdate() {
    if (hovered.value) {
        return;
    }
    const sourceCode = session.generateCode();
    content.value = sourceCode.code;
    layersMap = sourceCode.map;
    nextTick(() => {
        selectRow();
    });
}
onMounted(() => {
    onUpdate();
    const editor = aceRef.value._editor;
    editor.renderer.setShowGutter(false);
});
let layersMap = {};

function onChange() {
    const {row, column} = aceRef.value._editor.getCursorPosition();
    const uid = Object.keys(layersMap).find((key) => layersMap[key].line === row);
    if (uid) {
        const layer = session.state.layers.find((l) => l.uid === uid);
        session.state.layers.forEach((l) => (l.selected = false));
        session.virtualScreen.redraw();
        layer.selected = true;
        session.editor.selectionUpdate();
    }
}

const debouncedChange = debounce(() => onChange(), 500);
</script>
<template>
    <div
        class="fui-code"
        style="position: relative"
        @mouseenter.self="hovered = true"
        @mouseleave.self="hovered = false"
    >
        <VAceEditor
            ref="aceRef"
            v-model:value="content"
            :lang="aceMode"
            :theme="aceTheme"
            style="height: 100%; width: 100%; border-radius: 8px"
            :options="aceOptions"
            :readonly="true"
            @click="onChange"
            @keyup.up="debouncedChange"
            @keyup.down="debouncedChange"
        ></VAceEditor>
    </div>
    <!-- <textarea class="fui-code" v-model="content" readonly></textarea> -->
</template>
<style lang="css">
.ace_cursor {
    opacity: 0 !important;
}
</style>
