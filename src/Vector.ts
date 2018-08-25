import { Point } from "./Geometry";

export type Vector = Point;

export namespace Vector {
    export function directionTo(startPoint: Point, endPoint: Point): Vector {
        const rawDirection = between(startPoint, endPoint);
        return normalize(rawDirection);
    }

    export function add(t: Vector, u: Vector, v?: Vector): Vector {
        return {
            x: t.x + u.x + (v ? v.x : 0),
            y: t.y + u.y + (v ? v.y : 0),
        };
    }

    export function dot(t: Vector, u: Vector): number {
        return t.x * u.x + t.y * u.y;
    }

    export function between(startPoint: Point, endPoint: Point): Vector {
        return {
            x: endPoint.x - startPoint.x,
            y: endPoint.y - startPoint.y,
        };
    }

    export function length(startPoint: Point, endPoint: Point): number {
        return magnitude(between(startPoint, endPoint));
    }

    export function magnitude(vector: Vector): number {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    export function normalize(vector: Vector): Vector {
        const m = magnitude(vector);
        return {
            x: vector.x / m,
            y: vector.y / m,
        };
    }

    export function scale(vector: Vector, scalar: number): Vector {
        return {
            x: scalar * vector.x,
            y: scalar * vector.y,
        };
    }
}
