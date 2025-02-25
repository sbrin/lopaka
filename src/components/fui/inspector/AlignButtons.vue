<script lang="ts" setup>
import Icon from '/src/components/layout/Icon.vue';
import Button from '/src/components/layout/Button.vue';

const tools = [
    {
        type: 'align_left',
        title: 'Align left',
        icon: 'align_left',
    },
    {
        type: 'align_center_h',
        title: 'Align horisontal centers',
        icon: 'align_center_h',
    },
    {
        type: 'align_right',
        title: 'Align right',
        icon: 'align_right',
    },
    {
        type: 'align_top',
        title: 'Align top',
        icon: 'align_top',
    },
    {
        type: 'align_center_v',
        title: 'Align vertical centers',
        icon: 'align_center_v',
    },
    {
        type: 'align_bottom',
        title: 'Align bottom',
        icon: 'align_bottom',
    },
];
const emit = defineEmits(['align']);
</script>

<template>
    <div class="flex justify-between mb-2">
        <Button
            v-for="(tool, idx) in tools"
            :key="idx"
            isIcon
            variant="secondary border-secondary"
            @click="$emit('align', tool.type)"
            :title="tool.title"
        >
            <Icon :type="tool.icon"></Icon>
        </Button>
    </div>
</template>

<style></style>
