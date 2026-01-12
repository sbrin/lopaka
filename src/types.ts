export interface AnimationFrame {
    id: number;
    title?: string;
    duration?: number; // ms, optional per-frame timing
    layers: any[];
}

export interface AnimationSettings {
    fps: number;
    loop: boolean;
    pingPong: boolean;
    onionSkin: boolean;
    onionSkinOpacity: number;
    onionSkinFrames: number;
}

export interface Project {
    id: number;
    title: string;
    screens?: ProjectScreen[];
    platform: string;
    user_id?: string;
    screen_x: number;
    screen_y: number;
    private?: boolean;
    stars_count?: number;
    is_starred?: boolean;
}

export interface ProjectScreen {
    id: number;
    private?: boolean;
    project_id?: number;
    title?: string;
    user_id?: string;
    img_preview?: string;
    layers?: any[];
    frames?: AnimationFrame[];
    animationSettings?: AnimationSettings;
}
