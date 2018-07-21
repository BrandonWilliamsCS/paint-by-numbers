import { Bitmap } from "../Bitmap";
import { Project } from "../project/Project";

export async function processFile(file: File): Promise<Project> {
    if (file.type === "image/bmp") {
        return await generateProjectFromBitmap(file);
    } else {
        // TODO pbn file
        throw new Error(`Unsupported file type "${file.type}"`);
    }
}

export async function generateProjectFromBitmap(file: File): Promise<Project> {
    const image = await Bitmap.fromFile(file);
    return Project.create(image);
}

export async function generateProjectFromUrl(url: string): Promise<Project> {
    const image = await Bitmap.fromUrl(url);
    return Project.create(image);
}
