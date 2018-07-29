import { BoundryPiece } from "../boundries/BoundryPiece";
import { BoundrySegment } from "../boundries/BoundrySegment";
import {
    computeBoundryPieces,
    computeCornerPoints,
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
    cornerPoints: Point[];
    boundryPieces: BoundryPiece[];
}

export namespace Boundries {
    export function create(image: Image) {
        const boundrySegments = computeSortedBoundries(image.adjacencies);
        const boundryGraph = computeFromBoundrySegments(boundrySegments);
        const cornerPoints = computeCornerPoints(boundryGraph);
        const boundryPieces = computeBoundryPieces(boundryGraph, cornerPoints);
        return {
            boundrySegments,
            boundryGraph,
            cornerPoints,
            boundryPieces,
        };
    }
}
