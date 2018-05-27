declare module "bitmap-manipulation/Bitmap" {
    /**
     * Creates an in-memory bitmap.
     *
     * Bitmap can either be constructed from a Canvas implementation or with some image parameters, which causes
     * the bitmap to use a GrayscaleCanvas. The latter way is deprecated!
     *
     * TODO: Express this in JSDoc.
     *
     * @class
     * @param {number} width
     * @param {number} height
     * @param {number} [bytesPerPixel=1] Possible values: <code>1</code>, <code>2</code>,
     *                                    <code>4</code>
     * @param {Endianness} [endianness=BIG] Use big- or little-endian when storing multiple bytes per
     *                                      pixel
     */
    export class Bitmap {
        // TODO: constructor

        /**
         * @return {number} width of the bitmap in pixels
         */
        readonly width: number;

        /**
         * @return {number} height of the bitmap in pixels
         */
        readonly height: number;

        /**
         * @method module:bitmap_manipulation.Bitmap#data
         * @returns {Buffer} The byte data of this bitmap
         */
        data(): any; // TODO: Buffer

        /**
         * Sets all pixels to the specified value.
         *
         * @method module:bitmap_manipulation.Bitmap#clear
         * @param {number} [color=0]
         */
        clear(color?: number): void; // TODO: color type alias?

        /**
         * @method module:bitmap_manipulation.Bitmap#getPixel
         * @param {number} x X-coordinate
         * @param {number} y Y-coordinate
         * @returns {number} The pixel color or <code>null</code> when the coordinates are out of the
         *                    bitmap surface
         */
        getPixel(x: number, y: number): number | null; // TODO: color type alias?

        /**
         * Sets the pixel at the given coordinates.
         *
         * @method module:bitmap_manipulation.Bitmap#setPixel
         * @param {number} x X-coordinate
         * @param {number} y Y-coordinate
         * @param {number} color The raw pixel value according to the bytes per pixel
         */
        setPixel(x: number, y: number, color: number): void; // TODO: color type alias?

        /**
         * Sets the color of every pixel in a specific color to a new color.
         *
         * @method module:bitmap_manipulation.Bitmap#replaceColor
         * @param {number} color The current color to get rid of
         * @param {number} newColor The new color to use for the identified pixels
         */
        replaceColor(color: number, newColor: number): void; // TODO: color type alias?

        /**
         * Draws a rectangle, optionally filled, optionally with a border.
         *
         * @method module:bitmap_manipulation.Bitmap#drawRectangle
         * @param {number} left Starting x coordinate
         * @param {number} top Starting y coordinate
         * @param {number} width Width of the rectangle
         * @param {number} height Height of the rectangle
         * @param {?number} borderColor Color of the border. Pass <code>null</code> to indicate
         *                        no border
         * @param {?number} fillColor Color to fill the rectangle with. Pass <code>null</code> to indicate
         *                        no filling
         * @param {number} [borderWidth=1]
         */
        drawFilledRect(
            left: number,
            top: number,
            width: number,
            height: number,
            borderColor: number | null,
            fillColor: number | null,
            borderWidth?: number,
        ): void; // TODO: color type alias?

        /**
         * Draws a rectangle that's filled with a horizontal gradient.
         *
         * @method module:bitmap_manipulation.Bitmap#drawGradientRectangle
         * @param {number} left Starting x coordinate
         * @param {number} top Starting y coordinate
         * @param {number} width Width of the rectangle
         * @param {number} height Height of the rectangle
         * @param {number} leftColor Greyscale color of the leftmost pixel
         * @param {number} rightColor Greyscale color of the rightmost pixel
         */
        drawGradientRect(
            left: number,
            top: number,
            width: number,
            height: number,
            leftColor: number,
            rightColor: number,
        ): void; // TODO: color type alias?

        /**
         * Draws a circle or ellipse.
         *
         * <em>Note:</em> Drawing borders lacks quality. Consider drawing a filled shape on top of
         * another.
         *
         * @method module:bitmap_manipulation.Bitmap#drawEllipse
         * @param {number} left
         * @param {number} top
         * @param {number} width
         * @param {number} height
         * @param {?number} borderColor Color of the border. Pass <code>null</code> for transparency
         * @param {?number} fillColor Color of the filling. Pass <code>null</code> for transparency
         * @param {number} [borderWidth=1]
         */
        drawEllipse(
            left: number,
            top: number,
            width: number,
            height: number,
            borderColor: number | null,
            fillColor: number | null,
            borderWidth?: number,
        ): void; // TODO: color type alias?

        /**
         * Inverts the image by negating every data bit.
         *
         * @method module:bitmap_manipulation.Bitmap#invert
         */
        invert(): void;

        /**
         * Draws another bitmap or a portion of it on this bitmap. You can specify a color from the
         * source bitmap to be handled as transparent.
         *
         * @method module:bitmap_manipulation.Bitmap#drawBitmap
         * @param {Bitmap} bitmap
         * @param {number} x
         * @param {number} y
         * @param {number} [transparentColor]
         * @param {number} [sourceX]
         * @param {number} [sourceY]
         * @param {number} [width]
         * @param {number} [height]
         */
        drawBitmap(
            bitmap: Bitmap,
            x: number,
            y: number,
            transparentColor: number,
            sourceX: number,
            sourceY: number,
            width: number,
            height: number,
        ): void; // TODO: color type alias?

        /**
         * Draws text with a bitmap font by drawing a bitmap portion for each character. The text may
         * contain line breaks. The position is specified as the upper left coordinate of the rectangle
         * that will contain the text.
         *
         * @method module:bitmap_manipulation.Bitmap#drawText
         * @param {Font} font
         * @param {string} text
         * @param {number} x
         * @param {number} y
         */
        drawText(font: any, text: string, x: number, y: number): void; // TODO: Font type
    }
}
