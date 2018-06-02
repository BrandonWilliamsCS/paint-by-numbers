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
            topLeft: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion.topLeft,
            ),
            topRight: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion.topRight,
            ),
            bottomLeft: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion.bottomLeft,
            ),
            bottomRight: buildTreeWithAccessor(
                atomAccessor,
                subdividedRegion.bottomRight,
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
            topLeft: {
                x: region.x,
                y: region.y,
                width: leftWidth,
                height: topHeight,
            },
            topRight: {
                x: region.x + leftWidth,
                y: region.y,
                width: rightWidth,
                height: topHeight,
            },
            bottomLeft: {
                x: region.x,
                y: region.y + topHeight,
                width: leftWidth,
                height: bottomHeight,
            },
            bottomRight: {
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
        if (
            subdividedTree.topLeft.variant !== "homogeneous" ||
            subdividedTree.topRight.variant === "heterogeneous" ||
            subdividedTree.bottomLeft.variant === "heterogeneous" ||
            subdividedTree.bottomRight.variant === "heterogeneous"
        ) {
            // If there are any heterogeneous subregions, the region as a whole must also be heterogeneous.
            // Since the top-left subregion is never degenerate, compare it to homogeneous to save some casting later.
            return undefined;
        } else if (
            (subdividedTree.topRight.variant === "degenerate" ||
                subdividedTree.topRight.regionProperties ===
                    subdividedTree.topLeft.regionProperties) &&
            (subdividedTree.bottomLeft.variant === "degenerate" ||
                subdividedTree.bottomLeft.regionProperties ===
                    subdividedTree.topLeft.regionProperties) &&
            (subdividedTree.bottomRight.variant === "degenerate" ||
                subdividedTree.bottomRight.regionProperties ===
                    subdividedTree.topLeft.regionProperties)
        ) {
            // make sure the non-degenerate regions all have the same properties; if so, this region is homogeneous.
            return subdividedTree.topLeft.regionProperties;
        }
        // In this case, not all subregions have the same properties.
        return undefined;
    }
}
