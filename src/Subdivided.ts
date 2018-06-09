import { Position } from "./Position";

export interface Subdivided<T> {
    readonly [Position.TopLeft]: T;
    readonly [Position.TopRight]: T;
    readonly [Position.BottomLeft]: T;
    readonly [Position.BottomRight]: T;
}
