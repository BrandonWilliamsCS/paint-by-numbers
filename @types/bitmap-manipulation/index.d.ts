declare module "bitmap-manipulation" {
    // exports.Endianness = require("./lib/Endianness");
    export const Endianness: any;
    // exports.Bitmap = require("./lib/Bitmap");
    export * from "bitmap-manipulation/Bitmap";
    // exports.BMPBitmap = require("./lib/BMPBitmap");
    export * from "bitmap-manipulation/BMPBitmap";
    // exports.Font = require("./lib/Font");
    export const Font: any;
    // exports.canvas = {
    //     Base: require("./lib/canvas/Canvas"),
    //     Grayscale: require("./lib/canvas/GrayscaleCanvas"),
    //     Interleaved: require("./lib/canvas/InterleavedStorageCanvas"),
    //     Planar: require("./lib/canvas/PlanarStorageCanvas"),
    //     RGB: require("./lib/canvas/RGBCanvas"),
    //     PlanarRGB: require("./lib/canvas/PlanarRGBCanvas"),
    // };
    export const canvas: any;
}
