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
}
