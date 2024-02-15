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
const content = shallowRef('');
watch(
    [updates, layers],
    debounce(() => (content.value = session.generateCode('Default')), 250)
);
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
        ></VAceEditor>
    </div>
    <!-- <textarea class="fui-code" v-model="content" readonly></textarea> -->
</template>
<style lang="css"></style>
