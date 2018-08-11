import * as _ from "lodash";

import {
    Adjacencies,
    Adjacency,
    AdjacencyEntry,
    SpecialAdjacency,
    trivialAdjacencies,
} from "../Adjacencies";
import { CornerPosition, Position, SidePosition } from "../Position";
import { HeterogeneousRegion, HomogeneousRegion, QuadTree } from "./QuadTree";
import { traversePreOrder } from "./traverse";

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
    if (tree.variant === "degenerate") {
        return;
    } else if (tree.variant === "homogeneous") {
        // This is where the "base" part comes in. We only record the
        //  adjacencies for the leaf nodes of the tree.
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
    // If the side we're looking at is rotationally adjacent, it's one of
    //  the "external" adjacent sides.
    // The Top and Left sides are rotationally adjacent to TopLeft.
    // The Bottom and Right sides, then, correspond to sides internal
    //  to the current tree.
    if (Position.isRotationallyAdjacentTo(side, subtreeCorner)) {
        // For external sides, we need to look to the parent's adjacencies.
        return findExternalAdjacencyOnSide<T>(
            subtreeCorner,
            parentAdjacencies,
            side,
        );
    }

    // Now we know that the closest corner in the direction
    //  of `side` is internal.
    // In our TopLeft example, the adjacentCornerOnSide
    //  with a side of Right is TopRight,
    //  with a side of Bottom is BottomLeft, etc.
    const adjacentCornerOnSide = Position.afterMovingTowards(
        subtreeCorner,
        side,
    );
    // If the adjacent corner is degenerate, we will need to keep looking.
    // It not, we can happily take that internal corner and run with it.
    if (tree[adjacentCornerOnSide].variant !== "degenerate") {
        return tree[adjacentCornerOnSide];
    }

    // Moving past the internal corner brings us to an external one.
    // Handle that case, noting that we're starting from a different corner.
    return findExternalAdjacencyOnSide<T>(
        adjacentCornerOnSide,
        parentAdjacencies,
        side,
    );
}

function findExternalAdjacencyOnSide<T>(
    startingCorner: CornerPosition,
    parentAdjacencies: TreeAdjacencies<T>,
    side: SidePosition,
): TreeAdjacency<T> {
    // The Left adjacency of the TopLeft subtree is also on the Left
    //  of the parent.
    const parentAdjacency = parentAdjacencies[side];
    // If that adjacency is an "atom" of some kind, we can just use it.
    // (Example: to the Left of the parent is a homogeneous region; that region
    //   is also to the Left of the subtree.)
    if (
        parentAdjacency === SpecialAdjacency.None ||
        parentAdjacency.variant !== "heterogeneous"
    ) {
        // We can be sure it's not degenerate because it's already being used
        //  as an adjacency of the parent.
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
    const firstCornerOnSide = Position.afterMovingTowards(startingCorner, side);

    // We do need to watch out for degeneracy, though. If the first corner
    //  on the side is degenerate, we need to move past it to the next corner.
    //  —     — —
    // |y||  |x| |
    //  —     — —
    // | ||  | |z|
    //  —     — —
    // Fortunately, if you move toward the same side twice you loop back to the
    //  same corner position as the origin.
    // E.g., RightOf(RightOf(TopLeft)) = RightOf(TopRight) = TopLeft.
    const secondCornerOnSide = startingCorner;

    return parentAdjacency[firstCornerOnSide].variant !== "degenerate"
        ? parentAdjacency[firstCornerOnSide]
        : parentAdjacency[secondCornerOnSide];
}

export function sanityCheckAdjacencies<T>(
    tree: QuadTree<T>,
    adjacencyMap: TreeAdjacencyMap<T>,
    imageWidth: number,
    imageHeight: number,
) {
    adjacencyMap.forEach((adjacencies, from) => {
        if (from.variant !== "homogeneous") {
            throw new Error(
                `invalid (${from.variant}) tree in adj map: ${JSON.stringify(
                    from.region,
                )}`,
            );
        }
        const region = from.region;

        const top = adjacencies[Position.Top];
        if (top === SpecialAdjacency.None) {
            if (region.y !== 0) {
                throw new Error(
                    "None adj at top of: " + JSON.stringify(region),
                );
            }
        } else if (top.variant === "degenerate") {
            throw new Error(
                "Degenerate adjacency to top of: " +
                    JSON.stringify(region) +
                    " which is " +
                    JSON.stringify(top.region),
            );
        } else {
            if (
                region.width > top.region.width ||
                region.x < top.region.x ||
                region.x + region.width > top.region.x + top.region.width ||
                region.y !== top.region.y + top.region.height
            ) {
                throw new Error(
                    "Adj mismatch to top of: " +
                        JSON.stringify(region) +
                        " which is " +
                        JSON.stringify(top.region),
                );
            }
        }
        const left = adjacencies[Position.Left];
        if (left === SpecialAdjacency.None) {
            if (region.x !== 0) {
                throw new Error(
                    "None adj at left of: " + JSON.stringify(region),
                );
            }
        } else if (left.variant === "degenerate") {
            throw new Error(
                "Degenerate adjacency to left of: " +
                    JSON.stringify(region) +
                    " which is " +
                    JSON.stringify(left.region),
            );
        } else {
            if (
                region.height > left.region.height ||
                region.y < left.region.y ||
                region.y + region.height > left.region.y + left.region.height ||
                region.x !== left.region.x + left.region.width
            ) {
                throw new Error(
                    "Adj mismatch to left of: " +
                        JSON.stringify(region) +
                        " which is " +
                        JSON.stringify(left.region),
                );
            }
        }
        const bottom = adjacencies[Position.Bottom];
        if (bottom === SpecialAdjacency.None) {
            if (region.y + region.height !== imageHeight) {
                throw new Error(
                    "None adj at bottom of: " + JSON.stringify(region),
                );
            }
        } else if (bottom.variant === "degenerate") {
            throw new Error(
                "Degenerate adjacency to bottom of: " +
                    JSON.stringify(region) +
                    " which is " +
                    JSON.stringify(bottom.region),
            );
        } else {
            if (
                region.width > bottom.region.width ||
                region.x < bottom.region.x ||
                region.x + region.width >
                    bottom.region.x + bottom.region.width ||
                region.y + region.height !== bottom.region.y
            ) {
                throw new Error(
                    "Adj mismatch to bottom of: " +
                        JSON.stringify(region) +
                        " which is " +
                        JSON.stringify(bottom.region),
                );
            }
        }
        const right = adjacencies[Position.Right];
        if (right === SpecialAdjacency.None) {
            if (region.x + region.width !== imageWidth) {
                throw new Error(
                    "None adj at right of: " + JSON.stringify(region),
                );
            }
        } else if (right.variant === "degenerate") {
            throw new Error(
                "Degenerate adjacency to right of: " +
                    JSON.stringify(region) +
                    " which is " +
                    JSON.stringify(right.region),
            );
        } else {
            if (
                region.height > right.region.height ||
                region.y < right.region.y ||
                region.y + region.height >
                    right.region.y + right.region.height ||
                region.x + region.width !== right.region.x
            ) {
                throw new Error(
                    "Adj mismatch to right of: " +
                        JSON.stringify(region) +
                        " which is " +
                        JSON.stringify(right.region),
                );
            }
        }
    });
    flattenToHomogeneous(tree).forEach(homogeneousRegion => {
        if (!adjacencyMap.has(homogeneousRegion)) {
            throw new Error(
                "hom. tree missing from adj map: " +
                    JSON.stringify(homogeneousRegion.region),
            );
        }
    });
}

function flattenToHomogeneous<T>(
    tree: QuadTree<T>,
): Array<HomogeneousRegion<T>> {
    const homogeneousRegions: Array<HomogeneousRegion<T>> = [];
    traversePreOrder(
        tree,
        () => undefined,
        homogeneousRegion => {
            homogeneousRegions.push(homogeneousRegion);
        },
        () => undefined,
    );
    return homogeneousRegions;
}

export interface TreeAdjacencyPair<T> {
    from: HomogeneousRegion<T>;
    to: HomogeneousRegion<T>;
    on: SidePosition;
}
export function flattenAdjacencies<T>(
    adjacencyMap: TreeAdjacencyMap<T>,
): Array<TreeAdjacencyPair<T>> {
    // this simplifies some type stuff later.
    const badTree = (null as any) as TreeAdjacencyPair<T>;
    return (
        _
            .flatMap(
                Array.from(adjacencyMap.entries()),
                ([tree, adjacencies]) => {
                    return Position.sides.map(side => {
                        const adjacency = adjacencies[side];
                        // only pay attention to homogeneous adjacencies.
                        if (
                            tree.variant !== "homogeneous" ||
                            adjacency === SpecialAdjacency.None ||
                            adjacency.variant !== "homogeneous"
                        ) {
                            return badTree;
                        }
                        // to "standardize", always go "from" the smaller region.
                        if (
                            tree.region.height > adjacency.region.height ||
                            tree.region.width > adjacency.region.width
                        ) {
                            return badTree;
                        }
                        // in the case of equal-sized regions, only go right or down.
                        if (
                            side !== Position.Right &&
                            side !== Position.Bottom &&
                            (tree.region.height === adjacency.region.height ||
                                tree.region.width === adjacency.region.width)
                        ) {
                            return badTree;
                        }

                        // now all that's left is the correct values.
                        const adjacencyPair: TreeAdjacencyPair<T> = {
                            from: tree,
                            to: adjacency,
                            on: side,
                        };
                        return adjacencyPair;
                    });
                },
            )
            // get rid of all the bad trees
            .filter(_.identity)
    );
}
