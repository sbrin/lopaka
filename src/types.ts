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
    color_bg?: string;
}

export interface ProjectScreen {
    id: number;
    private?: boolean;
    project_id?: number;
    title?: string;
    user_id?: string;
    img_preview?: string;
    layers?: any[];
    order?: number; // Add order field for sorting
}

export interface PlatformTemplates {
    [key: string]: {
        template: any;
        name?: string;
        settings: {
            progmem?: boolean;
            wrap?: boolean;
            include_fonts?: boolean;
            include_images?: boolean;
            comments?: boolean;
            declare_vars?: boolean;
            clear_screen?: boolean;
        };
    };
}
