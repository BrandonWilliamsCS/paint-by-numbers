import { Bitmap } from "../Bitmap";
import { Color } from "../Color";
import {
    findBaseAdjacencies,
    sanityCheckAdjacencies,
    TreeAdjacencyMap,
} from "../quadTree/Adjacencies";
import { buildTree } from "../quadTree/build";
import { QuadTree } from "../quadTree/QuadTree";
import { Region } from "../Region";

export interface Image {
    name: string | undefined;
    width: number;
    height: number;
    tree: QuadTree<Color>;
    adjacencies: TreeAdjacencyMap<Color>;
}

export namespace Image {
    export function create(bitmap: Bitmap) {
        const tree = generateTree(bitmap);
        const adjacencies = findAdjacencies(bitmap, tree);
        return {
            name: bitmap.fileName,
            width: bitmap.width,
            height: bitmap.height,
            tree,
            adjacencies,
        };
    }

    export function generateTree(bitmap: Bitmap): QuadTree<Color> {
        const colorAccessor = (x: number, y: number) => bitmap.colorAt(x, y);
        const region: Region = {
            x: 0,
            y: 0,
            width: bitmap.width,
            height: bitmap.height,
        };
        return buildTree(colorAccessor, region);
    }

    export function findAdjacencies(
        bitmap: Bitmap,
        tree: QuadTree<Color>,
    ): TreeAdjacencyMap<Color> {
        //!! sort by coordinates, then consolidate as possible.
        const adjacencies = findBaseAdjacencies(tree);
        sanityCheckAdjacencies(tree, adjacencies, bitmap.width, bitmap.height);
        return adjacencies;
    }
}
