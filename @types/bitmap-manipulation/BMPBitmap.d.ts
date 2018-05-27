declare module "bitmap-manipulation/BMPBitmap" {
    import { Bitmap } from "bitmap-manipulation/Bitmap";

    /**
     * Creates an in-memory bitmap with extensions for reading and writing BMP files.
     * Bitmaps with 1 byte per pixel are handled in conjunction with a palette.
     * BMPBitmap cannot be constructed with a custom canvas, it always uses a grayscale canvas
     * internally.
     *
     * @class
     * @param {number} width
     * @param {number} height
     * @param {number} [bytesPerPixel=1] Possible values: <code>1</code>, <code>2</code>,
     *                                    <code>4</code>
     * @param {Endianness} [endianness=BIG] Use big- or little-endian when storing multiple bytes per
     *                                      pixel
     */
    export class BMPBitmap extends Bitmap {
        // TODO: constructor

        /**
         * @returns {number[]} An array of RGB colors (<code>0xRRGGBB</code>) to indices. You can use
         *                      <code>indexOf()</code> to get a color for the other methods
         */
        readonly palette: number[];

        /**
         * Reads a bitmap file (extension <code>.bmp</code>). Only those with 1 byte per pixel are
         * supported.
         *
         * @method module:bitmap_manipulation.BMPBitmap.fromFile
         * @param {string} filePath
         * @returns {Bitmap}
         */
        static fromFile(filePath: string): BMPBitmap;

        /**
         * Saves the bitmap to a file in the <code>.bmp</code> format.
         *
         * @method module:bitmap_manipulation.BMPBitmap#save
         * @param {string} filePath
         */
        save(filePath: string): void;

        /**
         * Converts the color depth of the pixels. Pixels are viewed as RGB values,
         * <code>0xRRGGBB</code> for 4 bytes per pixel and the same with 5 bits, 6 bits and 5 bits for 2
         * bytes per pixel. 1-byte pixels are handled in conjunction with a palette. When there are more
         * than 256 different colors in the source pixels, the rest is set to <code>0x00</code>.
         *
         * @method module:bitmap_manipulation.Bitmap#changeColorDepth
         * @param {number} bytesPerPixel
         * @throws {Error} Invalid parameter
         */
        changeColorDepth(bytesPerPixel: number): void;
    }
}
