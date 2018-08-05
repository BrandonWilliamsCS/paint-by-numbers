import Deque from "denque";
import simplifyChainArray from "simplify-js";

import { Point } from "../Geometry";
import { BoundryPiece } from "./BoundryPiece";
import { PointGraph } from "./PointGraph";

export function computeIntersectionPoints(graph: PointGraph): Point[] {
    // By definition, points with 3+ connected are intersections.
    // But points with a single adjacency are dead-end intersections, too.
    return graph.points.filter(
        point => graph.getAdjacentPoints(point).length !== 2,
    );
}

export function computeBoundryPieces(
    fullGraph: PointGraph,
    intersectionPoints: Point[],
): BoundryPiece[] {
    const chains = computeBoundryChains(fullGraph, intersectionPoints);
    return convertToBoundryPieces(chains);
}

export function computeBoundryChains(
    fullGraph: PointGraph,
    intersectionPoints: Point[],
): Array<Deque<Point>> {
    // Work with a clone since we'll be modifying this one.
    const graph = fullGraph.clone();

    // Work through the list of intersection points.
    // Start at one, working through 0+ non-intersection points, eventually
    //  reaching another (or looping to the same).
    // Along the way, clear the graph to simplify everything.
    const completeChains: Array<Deque<Point>> = [];
    intersectionPoints.forEach(startingIntersectionPoint => {
        // Make sure to process every chain emanating from this point.
        // This also addresses intersections that were reached from the other end.
        while (graph.hasPoint(startingIntersectionPoint)) {
            const chain = new Deque([startingIntersectionPoint]);
            do {
                const currentPoint = chain.peekBack()!;
                const nextPoint = extractNextPoint(currentPoint, graph);
                addPointsFromSegment(chain, currentPoint, nextPoint);
                // Keep going until an intersection was added.
                // Interestingly, this may form a loop in some cases.
            } while (intersectionPoints.indexOf(chain.peekBack()!) === -1);
            completeChains.push(chain);
        }
    });

    // At this point, all of the intersections have been consumed.
    // But, there may be some no-intersection closed-loops.
    while (!graph.isEmpty) {
        // This algorithm is similar, but start at an arbitrary point in each loop.
        const startingLoopPoint = graph.getSinglePoint();
        const loop = new Deque([startingLoopPoint]);
        do {
            const currentPoint = loop.peekBack()!;
            const nextPoint = extractNextPoint(currentPoint, graph);
            addPointsFromSegment(loop, currentPoint, nextPoint);
            // but this time the end condition is when the loop completes.
        } while (loop.peekBack() !== startingLoopPoint);
        completeChains.push(loop);
    }
    return completeChains;
}

function extractNextPoint(point: Point, graph: PointGraph): Point {
    const nextPoint = graph.getAdjacentPoint(point);
    graph.removeEdge(point, nextPoint);
    return nextPoint;
}

function addPointsFromSegment(chain: Deque<Point>, start: Point, end: Point) {
    // Always add at least one point in the middle; but for long segments,
    //  subdivide into pieces of length 5 or less.
    // This allows for better curve fitting.
    const isXDimension = start.y === end.y;
    const length = isXDimension ? end.x - start.x : end.y - start.y;
    const subdivisionCount = Math.ceil(length / 5) + 1;
    const adjustment = length / subdivisionCount;

    // add any and all points along the way from start to end.
    for (let i = 1; i < subdivisionCount; i++) {
        const cumulativeAdjustment = adjustment * i;
        const nextPoint = Point.from(
            isXDimension ? start.x + cumulativeAdjustment : start.x,
            isXDimension ? start.y : start.y + cumulativeAdjustment,
        );
        chain.push(nextPoint);
    }
    // Make sure to use the exact endpoint passed in; it may be used in
    //  an identity comparison.
    chain.push(end);
}

function convertToBoundryPieces(chains: Array<Deque<Point>>): BoundryPiece[] {
    return chains.map(chain => {
        // TODO: allow custom
        const simplificationTolerance = 2;
        const simplifiedChain = simplifyChain(chain, simplificationTolerance);
        return {
            isLoop: chain.peekBack() === chain.peekFront(),
            chain,
            simplifiedChain,
        };
    });
}

function simplifyChain(
    chain: Deque<Point>,
    simplificationTolerance?: number,
): Deque<Point> {
    const chainArray = chain.toArray();
    const simplifiedChainArray = simplifyChainArray(
        chainArray,
        simplificationTolerance,
        true, // TODO: pros and cons of "high quality"
    );
    return new Deque(simplifiedChainArray);
}
