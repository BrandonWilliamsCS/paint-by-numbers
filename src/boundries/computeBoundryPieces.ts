import Deque from "denque";
import simplifyChainArray from "simplify-js";

import { Point } from "../Geometry";
import { BoundryPiece } from "./BoundryPiece";
import { PointGraph } from "./PointGraph";

export function computeCornerPoints(graph: PointGraph): Point[] {
    // By definition, points with 3+ connected are corners.
    // But points with a single adjacency are dead-end corners, too.
    return graph.points.filter(
        point => graph.getAdjacentPoints(point).length !== 2,
    );
}

export function computeBoundryPieces(
    fullGraph: PointGraph,
    cornerPoints: Point[],
): BoundryPiece[] {
    const chains = computeBoundryChains(fullGraph, cornerPoints);
    return convertToBoundryPieces(chains);
}

export function computeBoundryChains(
    fullGraph: PointGraph,
    cornerPoints: Point[],
): Array<Deque<Point>> {
    // Work with a clone since we'll be modifying this one.
    const graph = fullGraph.clone();

    // Work through the list of corner points.
    // Start at one, working through 0+ non-corner points, eventually reaching
    //  another (or looping to the same).
    // Along the way, clear the graph to simplify everything.
    const completeChains: Array<Deque<Point>> = [];
    cornerPoints.forEach(startingCornerPoint => {
        // Make sure to process every chain emanating from this point.
        // This also addresses corners that were reached from the other end.
        while (graph.hasPoint(startingCornerPoint)) {
            const chain = new Deque([startingCornerPoint]);
            do {
                const currentPoint = chain.peekBack()!;
                const nextPoint = extractNextPoint(currentPoint, graph);
                chain.push(nextPoint);
                // Keep going until a corner was added.
                // Interestingly, this may form a loop in some cases.
            } while (cornerPoints.indexOf(chain.peekBack()!) === -1);
            completeChains.push(chain);
        }
    });

    // At this point, all of the corners have been consumed.
    // But, there may be some no-corner closed-loops.
    while (!graph.isEmpty) {
        // This algorithm is similar, but start at an arbitrary point in each loop.
        const startingLoopPoint = graph.getSinglePoint();
        const loop = new Deque([startingLoopPoint]);
        do {
            const currentPoint = loop.peekBack()!;
            const nextPoint = extractNextPoint(currentPoint, graph);
            loop.push(nextPoint);
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

function convertToBoundryPieces(chains: Array<Deque<Point>>): BoundryPiece[] {
    return chains.map(chain => {
        // TODO: allow custom
        const simplificationTolerance = 1;
        const simplifiedChain = simplifyChain(chain, simplificationTolerance);
        console.log(
            `Chain simplified from ${chain.length} to ${
                simplifiedChain.length
            }`,
        );
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
