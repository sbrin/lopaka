<script lang="ts" setup>
import {computed, defineProps} from 'vue';
import AbcIcon from '/src/assets/icons/abc.svg?component';
import CircleIcon from '/src/assets/icons/Circle.svg?component';
import GithubIcon from '/src/assets/icons/github.svg?component';
import GoogleIcon from '/src/assets/icons/google.svg?component';
import LineIcon from '/src/assets/icons/Line.svg?component';
import TextIcon from '/src/assets/icons/Text.svg?component';
import TwitterIcon from '/src/assets/icons/twitter.svg?component';
import ForkIcon from '/src/assets/icons/fork.svg?component';
import InvertIcon from '/src/assets/icons/invert.svg?component';
import AlignTopIcon from '/src/assets/icons/align_top.svg?component';
import AlignCenterVIcon from '/src/assets/icons/align_center_v.svg?component';
import AlignBottomIcon from '/src/assets/icons/align_bottom.svg?component';
import AlignLeftIcon from '/src/assets/icons/align_left.svg?component';
import AlignCenterHIcon from '/src/assets/icons/align_center_h.svg?component';
import AlignRightIcon from '/src/assets/icons/align_right.svg?component';

import {
    CogIcon,
    CursorArrowRaysIcon,
    DocumentDuplicateIcon,
    EllipsisHorizontalIcon,
    GlobeAltIcon,
    PaintBrushIcon,
    PhotoIcon,
    RectangleGroupIcon,
    ShieldExclamationIcon,
    TrashIcon,
    HeartIcon,
    Square3Stack3DIcon,
    ClipboardDocumentIcon,
    PaperClipIcon,
    ArrowUpTrayIcon,
    ArrowsRightLeftIcon,
    ArrowsUpDownIcon,
    ArrowPathIcon,
    ArrowsPointingInIcon,
    PencilIcon,
    PencilSquareIcon,
    LockClosedIcon,
    LockOpenIcon,
    StarIcon,
    LinkIcon,
    MagnifyingGlassPlusIcon,
    MagnifyingGlassMinusIcon,
    ArrowUpOnSquareIcon,
} from '@heroicons/vue/24/outline';
import {StarIcon as StarSolidIcon, XMarkIcon} from '@heroicons/vue/24/solid';

const props = defineProps<{
    type: string;
    class?: string;
    title?: string;
    xs?: boolean;
    sm?: boolean;
    lg?: boolean;
    primary?: boolean;
    danger?: boolean;
    pointer?: boolean;
}>();

const icons = {
    abc: AbcIcon,
    string: TextIcon,
    circle: CircleIcon,
    ellipse: CircleIcon,
    google: GoogleIcon,
    line: LineIcon,
    github: GithubIcon,
    twitter: TwitterIcon,
    fork: ForkIcon,
    invert: InvertIcon,
    align_top: AlignTopIcon,
    align_center_v: AlignCenterVIcon,
    align_bottom: AlignBottomIcon,
    align_left: AlignLeftIcon,
    align_center_h: AlignCenterHIcon,
    align_right: AlignRightIcon,
    clone: DocumentDuplicateIcon,
    cog: CogIcon,
    clipboard: ClipboardDocumentIcon,
    clip: PaperClipIcon,
    ellipsis: EllipsisHorizontalIcon,
    edit: PencilSquareIcon,
    globe: GlobeAltIcon,
    icon: PaintBrushIcon,
    paint: PaintBrushIcon,
    photo: PhotoIcon,
    rect: RectangleGroupIcon,
    select: CursorArrowRaysIcon,
    shield: ShieldExclamationIcon,
    trash: TrashIcon,
    upload: ArrowUpTrayIcon,
    share: ArrowUpOnSquareIcon,
    like: HeartIcon,
    stack: Square3Stack3DIcon,
    flip_h: ArrowsRightLeftIcon,
    flip_v: ArrowsUpDownIcon,
    rotate: ArrowPathIcon,
    padding: ArrowsPointingInIcon,
    'lock-closed': LockClosedIcon,
    'lock-open': LockOpenIcon,
    star: StarIcon,
    'star-solid': StarSolidIcon,
    x: XMarkIcon,
    'zoom-in': MagnifyingGlassPlusIcon,
    'zoom-out': MagnifyingGlassMinusIcon,
};

const classList = computed(() => ({
    [props.class]: !!props.class,
    'cursor-pointer': props.pointer,
    'text-error': props.danger,
    'text-primary': props.primary,
    'min-w-[12px] w-[12px] h-[12px]': props.xs,
    'min-w-[16px] w-[16px] h-[16px]': props.sm,
    'w-[24px]': props.lg,
    'w-[20px] h-[20px]': !props.sm && !props.lg && !props.xs,
}));
</script>

<template>
    <component
        v-if="icons[props.type]"
        :is="icons[props.type]"
        :class="classList"
        :title="title"
    />
</template>
