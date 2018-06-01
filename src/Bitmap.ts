import * as BMP from "bmp-js";

import { Color } from "./Color";

export class Bitmap {
    public get width() {
        return this.bmp.width;
    }

    public get height() {
        return this.bmp.height;
    }

    constructor(private readonly bmp: BMP.Bitmap) {}

    public colorAt(x: number, y: number): Color {
        const linearOffset = this.bmp.width * y + x;
        const byteOffset = linearOffset * 4;
        const bytes = this.bmp.data;
        return Color.getColor(
            bytes[byteOffset + 3],
            bytes[byteOffset + 2],
            bytes[byteOffset + 1],
        );
    }

    public static async create(url: string): Promise<Bitmap> {
        return new Promise<Bitmap>(resolve => {
            const oReq = new XMLHttpRequest();
            oReq.open("GET", url, true);
            oReq.responseType = "arraybuffer";

            oReq.onload = oEvent => {
                const arrayBuffer = oReq.response;
                const nodeBuffer = Buffer.from(arrayBuffer);
                const bmp = BMP.decode(nodeBuffer);
                resolve(new Bitmap(bmp));
            };

            oReq.send(null);
        });
    }
}
