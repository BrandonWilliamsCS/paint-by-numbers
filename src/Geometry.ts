export interface Point {
    x: number;
    y: number;
}

export interface Segment {
    start: Point;
    end: Point;
}

export namespace Point {
    export function equals(
        a: Point | undefined,
        b: Point | undefined,
    ): boolean {
        return !!(a && b) && a.x === b.x && a.y === b.y;
    }

    export function toString(point: Point): string {
        return `(${point.x},${point.y})`;
    }

    const pointStringPattern = /\((\d+),(\d+)\)/;
    export function fromString(pointString: string): Point {
        const results = pointStringPattern.exec(pointString);
        if (!results || results.length !== 3) {
            throw new Error(`Invalid point string "${pointString}"`);
        }
        return {
            x: parseInt(results[1], 10),
            y: parseInt(results[2], 10),
        };
    }

    export function from(x: number, y: number) {
        return { x, y };
    }

    export function lexSort(a: Point, b: Point) {
        return a.x !== b.x ? a.x - b.x : a.y - b.y;
    }
}
