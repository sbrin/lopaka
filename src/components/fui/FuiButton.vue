<script lang="ts" setup>
import { defineProps } from "vue";

const props = defineProps<{
  title: string;
  active?: boolean;
}>();
</script>
<template>
  <button class="button" :class="{ button_active: active }">
    {{ title }}
  </button>
</template>
<style lang="css"></style>
