import { BoundryPiece } from "../boundries/BoundryPiece";
import { BoundrySegment } from "../boundries/BoundrySegment";
import {
    computeBoundryPieces,
    computeIntersectionPoints,
} from "../boundries/computeBoundryPieces";
import { computeSortedBoundries } from "../boundries/computeSortedBoundries";
import {
    computeFromBoundrySegments,
    PointGraph,
} from "../boundries/PointGraph";
import { Point } from "../Geometry";
import { Image } from "./Image";

export interface Boundries {
    boundrySegments: BoundrySegment[];
    boundryGraph: PointGraph;
    intersectionPoints: Point[];
    boundryPieces: BoundryPiece[];
}

export namespace Boundries {
    export function create(image: Image) {
        const boundrySegments = computeSortedBoundries(image.adjacencies);
        const boundryGraph = computeFromBoundrySegments(boundrySegments);
        const intersectionPoints = computeIntersectionPoints(boundryGraph);
        const boundryPieces = computeBoundryPieces(
            boundryGraph,
            intersectionPoints,
        );
        return {
            boundrySegments,
            boundryGraph,
            intersectionPoints,
            boundryPieces,
        };
    }
}
