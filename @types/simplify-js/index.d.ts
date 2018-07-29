declare module "simplify-js" {
    import { Point } from "src/Geometry";

    export default function simplify(
        points: Point[],
        tolerance?: number,
        highestQuality?: boolean,
    ): Point[];
}
