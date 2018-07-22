import { Bitmap } from "../Bitmap";
import { Boundries } from "./Boundries";
import { Image } from "./Image";

export interface Project {
    image: Image;
    boundries: Boundries;
}

export namespace Project {
    export function create(bitmap: Bitmap) {
        const image = Image.create(bitmap);
        const boundries = Boundries.create(image);
        return {
            image,
            boundries,
        };
    }
}
