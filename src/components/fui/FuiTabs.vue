<script lang="ts" setup>
import {defineProps} from 'vue';
import {logEvent} from '/src/utils';

const props = defineProps<{
    activeTab: string;
}>();
const emit = defineEmits(['setActiveTab']);

const tabs = ['code', 'images'];

function setActiveTab(tab) {
    emit('setActiveTab', tab);
    logEvent('button_select_tab', tab);
}
</script>
<template>
    <div class="fui-tabs">
        <div
            v-for="(tab, idx) in tabs"
            :key="idx"
            class="fui-tab"
            :class="{'fui-tab_active': activeTab === tab}"
            @click="setActiveTab(tab)"
        >
            {{ tab }}
        </div>
    </div>
</template>
<style lang="css"></style>
