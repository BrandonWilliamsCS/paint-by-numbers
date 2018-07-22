export interface Point {
    x: number;
    y: number;
}

export interface Segment {
    start: Point;
    end: Point;
}

export namespace Point {
    export function from(x: number, y: number) {
        return { x, y };
    }

    export function lexSort(a: Point, b: Point) {
        return a.x !== b.x ? a.x - b.x : a.y - b.y;
    }
}
