import { Point } from "./Geometry";

export type Vector = Point;

export namespace Vector {
    export function directionTo(startPoint: Point, endPoint: Point): Vector {
        const rawDirection = between(startPoint, endPoint);
        return normalize(rawDirection);
    }

    export function between(startPoint: Point, endPoint: Point): Vector {
        return {
            x: endPoint.x - startPoint.x,
            y: endPoint.y - startPoint.y,
        };
    }

    export function normalize(vector: Vector): Vector {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude,
        };
    }

    export function scale(vector: Vector, scalar: number): Vector {
        return {
            x: scalar * vector.x,
            y: scalar * vector.y,
        };
    }
}
