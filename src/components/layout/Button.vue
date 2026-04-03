<script
    lang="ts"
    setup
>
import { computed } from 'vue';

const props = defineProps<{
    active?: boolean;
    secondary?: boolean;
    filled?: boolean;
    danger?: boolean;
    success?: boolean;
    isIcon?: boolean;
    variant?: string;
    title?: string;
    disabled?: boolean;
    xs?: boolean;
    noFocus?: boolean;
}>();

const classNames = computed(() => ({
    'btn-primary': !props.secondary || props.active,
    'btn-outline': !props.active && !props.filled,
    'btn-secondary btn-error': props.danger,
    'btn-success': props.success,
    'btn-square text-2xl align-top': props.isIcon,
    [`btn-${props.variant}`]: props.variant,
    'btn-sm': !props.xs,
    'btn-xs': props.xs,
}));
</script>
<template>
    <div
        class="tooltip tooltip-bottom capitalize no-animation"
        :class="{ 'pointer-events-none': disabled }"
        :data-tip="title"
    >
        <button
            class="btn font-sans uppercase leading-none"
            :class="classNames"
            :disabled="disabled"
            tabindex="-1"
            @mousedown.prevent="() => { }"
        >
            <slot></slot>
        </button>
    </div>
</template>
<style
    lang="css"
    scoped
>
.tooltip-bottom:before {
    z-index: 10;
}
</style>
