<script lang="ts" setup>
import {computed, onMounted, ref, toRefs, watch} from 'vue';
import {useSession} from '/src/core/session';
import FuiEditor from '/src/components/fui/FuiEditor.vue';
import Presenter from '/src/components/fui/Presenter.vue';
import {Project, ProjectScreen} from '/src/types';
import FuiLayers from './fui/FuiLayers.vue';

const session = useSession();
const {state, setIsPublic} = session;
const {platform, display} = toRefs(state);
const currenProject = ref({} as Project);
const currentScreen = ref({} as ProjectScreen);
const isScreenLoaded = ref(false);
const isScreenNotFound = ref(false);
const isSandbox = ref(false);
const isPresenterVisible = ref(false);

const emit = defineEmits(['showModal']);

// methods

async function openProject(project_id, screen_id) {
    if (project_id === null || project_id === undefined) {
        currenProject.value = {
            id: 0,
            title: '',
            screens: [{id: 0}],
            platform: platform.value,
            screen_x: display.value.x,
            screen_y: display.value.y,
            private: true,
        };
        return;
    }
}

function openPresenter() {
    isPresenterVisible.value = true;
}

function closePresenter() {
    isPresenterVisible.value = false;
}

onMounted(async () => {
    session.state.customImages = [];
    session.state.customFonts = [];
    isScreenLoaded.value = false;
    isScreenLoaded.value = true;
    isSandbox.value = true;
    session.initSandbox();
    isScreenLoaded.value = true;
    setIsPublic(false);
});
</script>

<template>
    <div class="flex flex-col flex-grow">
        <FuiEditor
            :project="currenProject"
            :screen="currentScreen"
            :isScreenLoaded="isScreenLoaded"
            :isScreenNotFound="isScreenNotFound"
            :isSandbox="isSandbox"
            @openPresenter="openPresenter"
        >
            <template #left>
                <FuiLayers></FuiLayers>
            </template>
            <template #title></template>
        </FuiEditor>
        <Presenter
            v-if="isPresenterVisible"
            :screens="currenProject.screens"
            @close="closePresenter"
        />
    </div>
</template>
