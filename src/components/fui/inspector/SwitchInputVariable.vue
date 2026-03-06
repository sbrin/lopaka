<script lang="ts" setup>
import Icon from '/src/components/layout/Icon.vue';

const props = defineProps<{
    value: boolean;
    absolute?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:value', value: boolean): void;
}>();
</script>
<template>
    <label
        class="switch-input -right-[8px] top-[6px] p-0"
        :class="{absolute: absolute}"
    >
        <input
            type="checkbox"
            :checked="value"
            @change="emit('update:value', ($event.target as HTMLInputElement).checked)"
            class="hidden"
        />
        <div
            v-if="value"
            class="text-primary cursor-pointer hover:opacity-80 bg-black hover:text-neutral-200 rounded-lg"
            @click="emit('update:value', false)"
            title="Remove variable"
        >
            <Icon
                type="variable"
                sm
            />
        </div>
        <div
            class="text-neutral-700 cursor-pointer hover:opacity-80 bg-black hover:text-neutral-400 rounded-lg"
            @click="emit('update:value', true)"
            title="Add variable"
            v-else
        >
            <Icon
                type="variable"
                sm
            />
        </div>
    </label>
</template>
