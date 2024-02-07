<script lang="ts" setup>
import {computed, defineProps} from 'vue';

const props = defineProps<{
    active?: boolean;
    small?: boolean;
    danger?: boolean;
}>();

const classNames = computed(() => ({
    button_active: props.active,
    button_small: props.small,
    button_danger: props.danger,
}));

</script>
<template>
    <span class="button" :class="classNames">
        <slot></slot>
    </span>
</template>
<style lang="css">

.button {
  background: var(--secondary-color);
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  color: var(--primary-color);
  height: 32px;
  vertical-align: middle;
  text-transform: uppercase;
  font-family: 'haxrcorp4089_tr';
  font-size: 32px;
  padding: 3px 12px 4px 12px;
  cursor: pointer;
  box-sizing: border-box;
  line-height: 22px;
}

.button:hover,
.button_active {
  background-color: var(--primary-color);
  color: var(--secondary-color);
}

.button_danger {
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.button_danger:hover {
  background-color: var(--danger-color);
}

a.button {
  text-decoration: none;
  text-wrap: nowrap;
}

.button_small {
    font-size: 20px;
    height: 24px;
    line-height: 24px;
}
</style>
