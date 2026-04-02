<script
    lang="ts"
    setup
>
import { onMounted, ref, toRefs } from 'vue';
import { useSession } from '/src/core/session';
import FuiEditor from '/src/components/fui/FuiEditor.vue';
import { Project, ProjectScreen } from '/src/types';
import FuiLayers from './fui/layers/FuiLayers.vue';
import OnboardingTour from './fui/onboarding/OnboardingTour.vue';
import { getDefaultTemplate } from '/src/templates/starter-templates';

const session = useSession();
const { setIsPublic } = session;
const currenProject = ref({} as Project);
const currentScreen = ref({} as ProjectScreen);
const isScreenLoaded = ref(false);
const isScreenNotFound = ref(false);
const infoMessage = ref();
const errorMessage = ref();
const showOnboarding = ref(false);

const emit = defineEmits(['showModal']);

onMounted(async () => {
    session.state.customImages = [];
    session.state.customFonts = [];
    isScreenLoaded.value = false;
    isScreenLoaded.value = true;
    currenProject.value = {
        id: 0,
        title: '',
        screens: [{ id: 0 }],
        platform: session.state.platform,
        screen_x: session.state.display.x,
        screen_y: session.state.display.y,
        private: true,
    };
    await session.initSandbox();
    isScreenLoaded.value = true;
    setIsPublic(false);

    // Onboarding: check if first visit
    const hasSeenOnboarding = localStorage.getItem('lopaka_onboarding_seen');
    if (!hasSeenOnboarding) {
        // Load starter template so user sees something immediately
        const template = getDefaultTemplate(session.state.platform);
        if (template) {
            await session.loadTemplate(template.layers);
        }
        // Show onboarding tour after a brief delay
        setTimeout(() => {
            showOnboarding.value = true;
        }, 500);
    }
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

    <!-- Onboarding Tour -->
    <OnboardingTour
        v-if="showOnboarding"
        @complete="showOnboarding = false"
        @skip="showOnboarding = false"
    />

    <datalist id="presetColors">
        <!-- 32 colors -->
        <!-- Grayscale -->
        <option>#FFFFFF</option>
        <option>#EEEEEE</option>
        <option>#BDBDBD</option>
        <option>#757575</option>
        <option>#424242</option>
        <option>#000000</option>

        <!-- Material UI Colors -->
        <option label="Red">#F44336</option>
        <option label="Pink">#E91E63</option>
        <option label="Purple">#9C27B0</option>
        <option label="Deep Purple">#673AB7</option>
        <option label="Indigo">#3F51B5</option>
        <option label="Blue">#2196F3</option>
        <option label="Light Blue">#03A9F4</option>
        <option label="Cyan">#00BCD4</option>
        <option label="Teal">#009688</option>
        <option label="Green">#4CAF50</option>
        <option label="Light Green">#8BC34A</option>
        <option label="Lime">#CDDC39</option>
        <option label="Yellow">#FFEB3B</option>
        <option label="Amber">#FFC107</option>
        <option label="Orange">#FF8200</option>
        <option label="Deep Orange">#FF5722</option>
        <option label="Brown">#795548</option>
        <option label="Blue Grey">#607D8B</option>
    </datalist>
</template>
<style lang="css">
body {
    visibility: visible !important;
}

.pixelated {
    image-rendering: pixelated;
}
</style>