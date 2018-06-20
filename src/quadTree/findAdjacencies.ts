import {
    Adjacencies,
    Adjacency,
    AdjacencyEntry,
    SpecialAdjacency,
    trivialAdjacencies,
} from "../Adjacencies";
import { CornerPosition, Position, SidePosition } from "../Position";
import { HeterogeneousRegion, QuadTree } from "./QuadTree";

export type TreeAdjacency<T> = Adjacency<QuadTree<T>>;
export type TreeAdjacencies<T> = Adjacencies<QuadTree<T>>;
export type TreeAdjacencyMap<T> = Map<QuadTree<T>, TreeAdjacencies<T>>;

// NOTE: this does duplicate adjacencies when two same-sized regions end up adjacent
export function findBaseAdjacencies<T>(tree: QuadTree<T>): TreeAdjacencyMap<T> {
    const computedAdjacencies = new Map<QuadTree<T>, TreeAdjacencies<T>>();
    addBaseAdjacencies(tree, trivialAdjacencies, computedAdjacencies);
    return computedAdjacencies;
}

function addBaseAdjacencies<T>(
    tree: QuadTree<T>,
    incomingAdjacencies: TreeAdjacencies<T>,
    adjacenciesSoFar: TreeAdjacencyMap<T>,
): void {
    // This is where the "base" part comes in. We only record the adjacencies
    //  for the leaf nodes of the tree.
    if (tree.variant !== "heterogeneous") {
        adjacenciesSoFar.set(tree, incomingAdjacencies);
        return;
    }
    // Otherwise, just recurse on each child.
    Position.corners.forEach(corner => {
        const subtreeAdjacencies = findSubtreeAdjacencies<T>(
            tree,
            corner,
            incomingAdjacencies,
        );
        addBaseAdjacencies(tree[corner], subtreeAdjacencies, adjacenciesSoFar);
    });
}

function findSubtreeAdjacencies<T>(
    tree: HeterogeneousRegion<T>,
    subtreeCorner: CornerPosition,
    parentAdjacencies: TreeAdjacencies<T>,
): TreeAdjacencies<T> {
    const adjacencyEntries = [
        // for the internal sides, just take the other subtree on the corner
        //  that is on that side.
        ...Position.sides.map(side => {
            const adjacencyOnSide = findSubtreeAdjacencyOnSide<T>(
                tree,
                subtreeCorner,
                parentAdjacencies,
                side,
            );
            const entry: AdjacencyEntry<QuadTree<T>> = [side, adjacencyOnSide];
            return entry;
        }),
    ];
    return Adjacencies.fromEntries<TreeAdjacency<T>>(adjacencyEntries);
}

function findSubtreeAdjacencyOnSide<T>(
    tree: HeterogeneousRegion<T>,
    subtreeCorner: CornerPosition,
    parentAdjacencies: TreeAdjacencies<T>,
    side: SidePosition,
): TreeAdjacency<T> {
    // Let's take the example where subtreeCorner === Position.TopLeft.
    // Then adjacentCornerOnSide with a side of Left is TopRight,
    //  with a side of Bottom is BottomLeft, etc.
    const adjacentCornerOnSide = Position.afterMovingTowards(
        subtreeCorner,
        side,
    );

    // If the side we're looking at is *not* rotationally adjacent, it's one of
    //  the "internal" adjacent sides.
    // In our TopLeft example, the Top and Left sides are rotationally adjacent.
    // The Bottom and Right sides, then, correspond to sides internal
    //  to the current tree.
    if (!Position.isRotationallyAdjacentTo(side, subtreeCorner)) {
        return tree[adjacentCornerOnSide];
    }

    // For external sides, we need to look to the parent's adjacencies.
    // The Left adjacency of the TopLeft subtree is also on the Left
    //  of the parent.
    const parentAdjacency = parentAdjacencies[side];
    // If that adjacency is an "atom" of some kind, we can just run with it.
    // (Example: to the Left of the parent is a homogeneous region; that region
    //   is also to the Left of the subtree.)
    if (
        parentAdjacency === SpecialAdjacency.None ||
        parentAdjacency.variant !== "heterogeneous"
    ) {
        return parentAdjacency;
    }

    // Otherwise we need to break it down to get a more precise adjacency.
    // For example, if the Left adjacency of the parent is heterogeneous, the
    // Left adjacency of the parent's TopLeft subtree is actually the
    //  TopRight subtree of the parent's Left adjacency
    // In the following visual example, y is the Left adjacency of x.
    // But all of w is the Right adjacency of z.
    //  — —    — —    ———
    // | |y|  |x| |  |   |
    //  — —    — —   | w |
    // | | |  | |z|  |   |
    //  — —    — —    ———
    return parentAdjacency[adjacentCornerOnSide];
}
