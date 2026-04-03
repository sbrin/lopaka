<script
    lang="ts"
    setup
>
import { defineProps } from 'vue';

const props = defineProps<{
    active?: boolean;
}>();
</script>
<template>
    <div class="shadow">
        <div class="popup">
            <slot></slot>
        </div>
    </div>
</template>
<style lang="css">
.shadow {
    z-index: 100;
    position: fixed;
    left: 0;
    top: 0;
    background-color: rgba(0, 0, 0, 0.7);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

.popup {
    margin-top: 20%;
    background: var(--bg-color);
    padding: 20px;
    border-radius: 8px;

}
</style>
