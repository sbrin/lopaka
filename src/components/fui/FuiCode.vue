<script
    lang="ts"
    setup
>
import { nextTick, onMounted, onUnmounted, ref, shallowRef, toRefs, watch } from 'vue';
import { VAceEditor } from 'vue3-ace-editor';
import { useSession } from '../../core/session';
import { debounce } from '../../utils';
import { aceMode, aceTheme } from './ace/ace-config';
const aceOptions = {
    fontSize: 12,
    showPrintMargin: false,
    showGutter: false,
    highlightActiveLine: true,
    // enableBasicAutocompletion: true,
    // enableLiveAutocompletion: true,
    tabSize: 4,
    useSoftTabs: true,
    wrap: true,
};

const props = defineProps<{
    readonly: boolean;
}>();

const session = useSession();
const { immidiateUpdates, selectionUpdates } = toRefs(session.state);
const content = shallowRef('');
const aceRef = shallowRef(null);
const hovered = ref(false);

onMounted(() => {
    watch(immidiateUpdates, onUpdate, { immediate: true });
});

watch(
    selectionUpdates,
    () => {
        selectRow();
    },
    { deep: true }
);
function selectRow() {
    const { selected } = session.layersManager;
    if (selected.length == 1) {
        const layer = selected[0];
        const row = layersMap[layer.uid]?.line;
        if (row && aceRef.value?._editor) {
            const { column } = aceRef.value._editor.getCursorPosition() ?? { column: 0 };
            aceRef.value._editor.gotoLine(row + 1, column, true);
        }
    }
}
function onUpdate() {
    const sourceCode = session.generateCode();
    content.value = sourceCode.code ?? '';
    layersMap = sourceCode.map;
    nextTick(() => {
        selectRow();
    });
}
onMounted(() => {
    onUpdate();
});
let layersMap = {};

function onChange() {
    if (!aceRef.value?._editor) return;

    const { row, column } = aceRef.value._editor.getCursorPosition();
    const uid = Object.keys(layersMap).find((key) => layersMap[key].line === row);
    if (uid) {
        const layer = session.layersManager.getLayer(uid);
        session.layersManager.clearSelection();
        session.virtualScreen.redraw();
        session.layersManager.selectLayer(layer);
    }
}

const debouncedChange = debounce(() => onChange(), 500);

const rootRef = shallowRef<HTMLElement | null>(null);

function onPaste(e: ClipboardEvent) {
    if (!rootRef.value?.contains(document.activeElement)) return;
    const text = e.clipboardData?.getData('text/plain');
    if (text) {
        session.importCode(text, true);
    }
}

onMounted(() => {
    document.addEventListener('paste', onPaste);
});

onUnmounted(() => {
    document.removeEventListener('paste', onPaste);
});
</script>
<template>
    <div
        ref="rootRef"
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
            style="height: 100%; width: 100%; border-radius: 8px;"
            :options="aceOptions"
            :readonly="true"
            @click="onChange"
            @keyup.up="debouncedChange"
            @keyup.down="debouncedChange"
        ></VAceEditor>
    </div>
</template>
<style lang="css">
.fui-code {
    height: 25vh;
    min-height: 200px;
    color: var(--secondary-color);
    text-transform: none;
    overflow: auto;
    white-space: pre;
}

.fui-code:focus {
    outline: none;
}

.fui-code pre {
    margin: 0;
}

.ace_cursor {
    opacity: 0 !important;
}

.ace_scroller {
    padding: 8px;
}
</style>
