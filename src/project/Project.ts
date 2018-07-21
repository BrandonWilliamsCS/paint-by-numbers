import { Bitmap } from "../Bitmap";
import { Image } from "./Image";

export interface Project {
    image: Image;
    // user edges
    //  corner points
    //  etc.
}

export namespace Project {
    export function create(bitmap: Bitmap) {
        return {
            image: Image.create(bitmap),
        };
    }
}
