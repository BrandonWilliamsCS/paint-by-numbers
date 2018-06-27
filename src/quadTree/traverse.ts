import { Position } from "../Position";
import {
    DegenerateRegion,
    HeterogeneousRegion,
    HomogeneousRegion,
    QuadTree,
} from "./QuadTree";

export function traversePreOrder<T>(
    tree: QuadTree<T>,
    processHeterogeneousRegion: (region: HeterogeneousRegion<T>) => void,
    processHomogeneousRegion: (region: HomogeneousRegion<T>) => void,
    processDegenerateRegion: (region: DegenerateRegion) => void,
) {
    switch (tree.variant) {
        case "heterogeneous":
            processHeterogeneousRegion(tree);
            break;
        case "homogeneous":
            processHomogeneousRegion(tree);
            break;
        case "degenerate":
            processDegenerateRegion(tree);
            break;
    }
    if (tree.variant === "heterogeneous") {
        Position.corners.forEach(corner => {
            traversePreOrder(
                tree[corner],
                processHeterogeneousRegion,
                processHomogeneousRegion,
                processDegenerateRegion,
            );
        });
    }
}
