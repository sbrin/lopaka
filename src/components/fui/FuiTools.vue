<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {AbstractTool} from '../../editor/tools/abstract.tool';
import Button from '/src/components/layout/Button.vue';
import {logEvent} from '../../utils';
import Icon from '/src/components/layout/Icon.vue';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {platform} = toRefs(session.state);
const tools = computed(() => session.editor.getSupportedTools(platform.value));
const {activeTool} = toRefs(session.editor.state);

function setActive(tool: AbstractTool, isLogged?: boolean) {
    session.editor.setTool(tool?.getName());
    activeTool.value = tool;
    isLogged && logEvent('select_tool', tool?.getName() ?? 'select');
}

function isActive(name: string) {
    return activeTool.value?.getName() === name;
}
</script>
<template>
    <div class="flex flex-row justify-center gap-1">
        <div class="mr-2">
            <Button
                @click="setActive(null, true)"
                filled
                secondary
                isIcon
                :active="activeTool == null"
                title="Select"
            >
                <Icon
                    type="select"
                    :primary="!!activeTool"
                    :class="{'text-black': activeTool == null}"
                ></Icon>
            </Button>
        </div>
        <Button
            v-for="(tool, idx) in tools"
            :key="idx"
            isIcon
            filled
            secondary
            @click="setActive(tool, true)"
            :active="isActive(tool.getName())"
            :title="tool.getTitle()"
        >
            <Icon
                :type="tool.getName()"
                :primary="!isActive(tool.getName())"
                :class="{'text-black': isActive(tool.getName())}"
            ></Icon>
        </Button>
    </div>
</template>
<style lang="css"></style>
