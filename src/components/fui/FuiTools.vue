<script
    lang="ts"
    setup
>
import { computed, toRefs } from 'vue';
import { useSession } from '../../core/session';
import { AbstractTool } from '../../editor/tools/abstract.tool';
import Button from '/src/components/layout/Button.vue';
import { logEvent } from '../../utils';
import Icon from '/src/components/layout/Icon.vue';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const { platform } = toRefs(session.state);
const tools = computed(() => session.editor.getSupportedTools(platform.value));
const { activeTool } = toRefs(session.editor.state);

function setActive(tool: AbstractTool, isLogged?: boolean) {
    session.editor.setTool(tool?.getName());
    isLogged && logEvent('select_tool', tool?.getName() ?? 'select');
}

function isActive(name: string) {
    return activeTool.value?.getName() === name;
}
</script>
<template>
    <div class="flex flex-row justify-center gap-1 items-center">
        <div class="mr-3">
            <Button
                @click="setActive(null, true)"
                filled
                secondary
                isIcon
                :noFocus="true"
                :active="activeTool == null"
                title="Select"
            >
                <Icon
                    type="select"
                    :primary="!!activeTool"
                    :class="{ 'text-black': activeTool == null }"
                ></Icon>
            </Button>
        </div>
        <div
            v-for="(tool, idx) in tools"
            :class="{ 'mr-3': tool.getName() === 'image' }"
        >
            <Button
                :key="idx"
                isIcon
                filled
                secondary
                :noFocus="true"
                @click="setActive(tool, true)"
                :active="isActive(tool.getName())"
                :title="tool.getTitle()"
            >
                <Icon
                    :type="tool.getIcon()"
                    :primary="!isActive(tool.getName())"
                    :class="{ 'text-black': isActive(tool.getName()) }"
                ></Icon>
            </Button>
        </div>
    </div>
</template>
<style lang="css"></style>
