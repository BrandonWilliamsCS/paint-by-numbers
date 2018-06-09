import { Region } from "../Region";
import { Subdivided } from "../Subdivided";

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
