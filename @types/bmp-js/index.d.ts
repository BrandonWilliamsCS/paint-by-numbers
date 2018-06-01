declare module "bmp-js" {
    export function decode(buffer: Buffer): Bitmap;

    export interface Bitmap {
        width: number;
        height: number;
        data: Uint8Array;
    }
}
