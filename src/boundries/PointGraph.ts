import { Point, Segment } from "../Geometry";
import { BoundrySegment } from "./BoundrySegment";

type AdjacencyMap = Map<string, string[]>;

export class PointGraph {
    private static canonicalPoints = new Map<string, Point>();
    private adjacencyMap: AdjacencyMap = new Map<string, string[]>();

    public get isEmpty(): boolean {
        return this.adjacencyMap.size === 0;
    }

    public get points(): Point[] {
        return Array.from(this.adjacencyMap.keys()).map(pointString =>
            PointGraph.getCanonicalPoint(pointString),
        );
    }

    public getSinglePoint(): Point {
        const pointString = this.adjacencyMap.keys().next().value;
        return PointGraph.getCanonicalPoint(pointString);
    }

    public hasPoint(point: Point): boolean {
        return this.adjacencyMap.has(Point.toString(point));
    }

    public getAdjacentPoints(point: Point): Point[] {
        const pointString = Point.toString(point);
        return (
            this.adjacencyMap
                // Trust that the point is actually present.
                .get(pointString)!
                .map(adjacentPointString =>
                    PointGraph.getCanonicalPoint(adjacentPointString),
                )
        );
    }

    public getAdjacentPoint(point: Point): Point {
        const pointString = Point.toString(point);
        return PointGraph.getCanonicalPoint(
            this.adjacencyMap
                // Trust that the point is actually present, and that we've
                //  properly kept the adjacencies clean.
                .get(pointString)![0],
        );
    }

    public addEdge(from: Point, to: Point): void {
        const fromString = Point.toString(from);
        const toString = Point.toString(to);
        this.addToMap(fromString, toString);
        this.addToMap(toString, fromString);
    }

    public removeEdge(from: Point, to: Point): void {
        const fromString = Point.toString(from);
        const toString = Point.toString(to);
        if (!this.adjacencyMap.has(fromString)) {
            return;
        }

        this.removeDirectedEdge(fromString, toString);
        this.removeDirectedEdge(toString, fromString);
    }

    public addSegmentsAsEdges(segments: Segment[]) {
        segments.forEach(segment => {
            this.addEdge(segment.start, segment.end);
        });
    }

    public clone(): PointGraph {
        const clone = new PointGraph();
        clone.adjacencyMap = new Map(this.adjacencyMap);
        return clone;
    }

    public sanityCheck(): void {
        this.adjacencyMap.forEach((adjacencies, point) => {
            if (adjacencies.length === 0) {
                throw new Error(`Missing adjacencies for ${point}`);
            }
            if (adjacencies.length !== new Set(adjacencies).size) {
                throw new Error(`Duplicate adjacencies for ${point}`);
            }
            adjacencies.forEach(otherPoint => {
                const otherAdjacencies = this.adjacencyMap.get(otherPoint)!;
                if (otherAdjacencies.indexOf(point) === -1) {
                    throw new Error(
                        `No reverse adjacency between ${point} and ${otherPoint}`,
                    );
                }
            });
        });
    }

    private addToMap(from: string, to: string) {
        let adjacentPoints: string[];
        if (this.adjacencyMap.has(from)) {
            adjacentPoints = this.adjacencyMap.get(from)!;
        } else {
            adjacentPoints = [];
            this.adjacencyMap.set(from, adjacentPoints);
        }
        adjacentPoints.push(to);
    }

    private removeDirectedEdge(fromString: string, toString: string): void {
        const adjacencies = this.adjacencyMap.get(fromString)!;
        const location = adjacencies.indexOf(toString);
        adjacencies.splice(location, 1);
        // keep the adjacencies clean by deleting empty arrays.
        if (!adjacencies.length) {
            this.adjacencyMap.delete(fromString);
        }
    }

    public static getCanonicalPoint(pointString: string): Point {
        if (PointGraph.canonicalPoints.has(pointString)) {
            return PointGraph.canonicalPoints.get(pointString)!;
        }

        const point = Point.fromString(pointString);
        PointGraph.canonicalPoints.set(pointString, point);
        return point;
    }
}

export function computeFromBoundrySegments(
    boundrySegments: BoundrySegment[],
): PointGraph {
    const segments = boundrySegments.map(bs => bs.segment);
    const graph = new PointGraph();
    graph.addSegmentsAsEdges(segments);
    graph.sanityCheck();
    return graph;
}
