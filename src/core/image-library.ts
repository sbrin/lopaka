import {generateUID} from '../utils';
import {AbstractImageLayer} from './layers/abstract-image.layer';
import {useSession} from './session';

export type TImage = {
    name: string;
    data: string;
    width: number;
    height: number;
    id: string;
    unused: boolean;
};

export function getImage(id: string): TImage {
    const session = useSession();
    return session.state.images.get(id);
}

export function setImage(img: TImage): string {
    const {images} = useSession().state;
    if (img.id) {
        images.set(img.id, img);
        updateImageLibrary(img.id);
        return img.id;
    } else {
        const foundedImage = Array.from(images.values()).find((i: TImage) => i.data === img.data);
        if (foundedImage) {
            return foundedImage.id;
        } else {
            img.id = generateUID();
            images.set(img.id, img);
        }
        updateImageLibrary(img.id);
        return img.id;
    }
}

export function updateImageLibrary(id?: string) {
    const {images, layers} = useSession().state;
    const imagesInUse = new Set();
    if (id) {
        imagesInUse.add(id);
    }
    layers
        .filter((l) => l instanceof AbstractImageLayer)
        .forEach((l: AbstractImageLayer) => {
            imagesInUse.add(l.imageId);
        });
    images.forEach((v: TImage) => {
        v.unused = !imagesInUse.has(v.id);
    });
}
