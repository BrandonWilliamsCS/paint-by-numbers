import { Position } from "../Position";
import { Region } from "./Region";
import { Subdivided } from "./Subdivided";

export type QuadTree<T> =
    | HomogeneousRegion<T>
    | HeterogeneousRegion<T>
    | DegenerateRegion;

interface QuadTreeRegion {
    readonly region: Region;
}

export interface HomogeneousRegion<T> extends QuadTreeRegion {
    readonly variant: "homogeneous";
    readonly regionProperties: T;
}

export interface HeterogeneousRegion<T>
    extends QuadTreeRegion,
        Subdivided<QuadTree<T>> {
    readonly variant: "heterogeneous";
}

export interface DegenerateRegion extends QuadTreeRegion {
    readonly variant: "degenerate";
}

export namespace QuadTree {
    export function homogeneousRegion<T>(
        region: Region,
        regionProperties: T,
    ): HomogeneousRegion<T> {
        return {
            variant: "homogeneous",
            region,
            regionProperties,
        };
    }

    export function heterogeneousRegion<T>(
        region: Region,
        subdividedTree: Subdivided<QuadTree<T>>,
    ): HeterogeneousRegion<T> {
        return {
            variant: "heterogeneous",
            region,
            ...subdividedTree,
        };
    }

    export function degenerateRegion(region: Region): DegenerateRegion {
        return {
            variant: "degenerate",
            region,
        };
    }

    export function buildTree<T>(
        atomsOrAccessor: T[][] | ((x: number, y: number) => T),
        region: Region,
    ): QuadTree<T> {
        const accessor =
            atomsOrAccessor instanceof Array
                ? (x: number, y: number) => atomsOrAccessor[x][y]
                : atomsOrAccessor;
        return buildTreeWithAccessor(accessor, region);
    }

    function buildTreeWithAccessor<T>(
        atomAccessor: (x: number, y: number) => T,
        region: Region,
    ): QuadTree<T> {
        if (region.width === 0 || region.height === 0) {
            // base case: a region with 0 area is degenerate.
            return degenerateRegion(region);
        }
        if (region.width === 1 && region.height === 1) {
            // base case: a single atom is obviously homogeneous.
            return homogeneousRegion(region, atomAccessor(region.x, region.y));
        }

        // recurse: get the tree for each subdivision and join if possible.
        const subdividedRegion = subdivide(region);
        const subdividedTree: Subdivided<QuadTree<T>> = {
            [Position.TopLeft]: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion[Position.TopLeft],
            ),
            [Position.TopRight]: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion[Position.TopRight],
            ),
            [Position.BottomLeft]: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion[Position.BottomLeft],
            ),
            [Position.BottomRight]: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion[Position.BottomRight],
            ),
        };

        const propertiesIfHomogeneous = getPropertiesIfHomogeneous(
            subdividedTree,
        );
        if (propertiesIfHomogeneous !== undefined) {
            return homogeneousRegion(region, propertiesIfHomogeneous);
        } else {
            return heterogeneousRegion(region, subdividedTree);
        }
    }

    export function subdivide(region: Region): Subdivided<Region> {
        const leftWidth = Math.ceil(region.width / 2);
        const topHeight = Math.ceil(region.height / 2);
        const rightWidth = region.width - leftWidth;
        const bottomHeight = region.height - topHeight;

        return {
            [Position.TopLeft]: {
                x: region.x,
                y: region.y,
                width: leftWidth,
                height: topHeight,
            },
            [Position.TopRight]: {
                x: region.x + leftWidth,
                y: region.y,
                width: rightWidth,
                height: topHeight,
            },
            [Position.BottomLeft]: {
                x: region.x,
                y: region.y + topHeight,
                width: leftWidth,
                height: bottomHeight,
            },
            [Position.BottomRight]: {
                x: region.x + leftWidth,
                y: region.y + topHeight,
                width: rightWidth,
                height: bottomHeight,
            },
        };
    }

    export function getPropertiesIfHomogeneous<T>(
        subdividedTree: Subdivided<QuadTree<T>>,
    ): T | undefined {
        const topLeft = subdividedTree[Position.TopLeft];
        const topRight = subdividedTree[Position.TopRight];
        const bottomRight = subdividedTree[Position.BottomRight];
        const bottomLeft = subdividedTree[Position.BottomLeft];
        if (
            topLeft.variant !== "homogeneous" ||
            topRight.variant === "heterogeneous" ||
            bottomLeft.variant === "heterogeneous" ||
            bottomRight.variant === "heterogeneous"
        ) {
            // If there are any heterogeneous subregions, the region as a whole must also be heterogeneous.
            // Since the top-left subregion is never degenerate, compare it to homogeneous to save some casting later.
            return undefined;
        } else if (
            (topRight.variant === "degenerate" ||
                topRight.regionProperties === topLeft.regionProperties) &&
            (bottomLeft.variant === "degenerate" ||
                bottomLeft.regionProperties === topLeft.regionProperties) &&
            (bottomRight.variant === "degenerate" ||
                bottomRight.regionProperties === topLeft.regionProperties)
        ) {
            // make sure the non-degenerate regions all have the same properties; if so, this region is homogeneous.
            return topLeft.regionProperties;
        }
        // In this case, not all subregions have the same properties.
        return undefined;
    }
}
