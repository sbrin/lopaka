<script lang="ts" setup>
import { computed, defineProps } from "vue";
import FuiButton from "./FuiButton.vue";

const props = defineProps<{
  callback: Function;
  activeTool: String;
  library: String;
}>();

const emit = defineEmits(["toolClicked"]);

const toolsList = computed(() => [
  ...(props.library !== "flipper" ? ["draw"] : []),
  "frame",
  "box",
  "line",
  "dot",
  "circle",
  "disc",
]);
</script>
<template>
  <div class="tools">
    <FuiButton
      v-for="(item, idx) in toolsList"
      :key="idx"
      class="tools__btn"
      @click="callback(item)"
      :title="item"
      :active="activeTool === item"
    ></FuiButton>
    <FuiButton
      class="tools__btn"
      @click="callback('str')"
      title="string"
      :active="activeTool === 'str'"
    >
    </FuiButton>
    <FuiButton
      class="tools__btn"
      @click="callback('select')"
      title="select"
      :active="activeTool === 'select'"
    >
    </FuiButton>
  </div>
</template>
<style lang="css"></style>
