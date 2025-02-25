<script lang="ts" setup>
import {onMounted, ref, toRefs} from 'vue';
import {useSession} from '/src/core/session';
import FuiEditor from '/src/components/fui/FuiEditor.vue';
import {Project, ProjectScreen} from '/src/types';
import FuiLayers from './fui/FuiLayers.vue';

const session = useSession();
const {setIsPublic} = session;
const currenProject = ref({} as Project);
const currentScreen = ref({} as ProjectScreen);
const isScreenLoaded = ref(false);
const isScreenNotFound = ref(false);
const infoMessage = ref();
const errorMessage = ref();

const emit = defineEmits(['showModal']);

onMounted(async () => {
    session.state.customImages = [];
    session.state.customFonts = [];
    isScreenLoaded.value = false;
    isScreenLoaded.value = true;
    session.initSandbox();
    isScreenLoaded.value = true;
    setIsPublic(false);
});

function setInfoMessage(msg) {
    infoMessage.value = msg;
    setTimeout(() => {
        infoMessage.value = null;
    }, 3000);
}
function setErrorMessage(msg) {
    errorMessage.value = msg;
    setTimeout(() => {
        errorMessage.value = null;
    }, 4000);
}
</script>

<template>
    <div class="flex flex-col flex-grow">
        <FuiEditor
            :project="currenProject"
            :screen="currentScreen"
            :isScreenLoaded="isScreenLoaded"
            :isScreenNotFound="isScreenNotFound"
            :isSandbox="true"
            @setErrorMessage="setErrorMessage"
            @setInfoMessage="setInfoMessage"
        >
            <template #messages>
                <div
                    class="alert alert-warning"
                    v-if="errorMessage"
                >
                    <span>{{ errorMessage }}</span>
                </div>
                <div
                    class="alert alert-success"
                    v-if="infoMessage"
                >
                    <span>{{ infoMessage }}</span>
                </div>
            </template>
            <template #left>
                <FuiLayers></FuiLayers>
            </template>
            <template #title></template>
        </FuiEditor>
    </div>
</template>
