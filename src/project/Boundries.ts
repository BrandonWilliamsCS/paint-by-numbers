import { BoundryPiece } from "../boundries/BoundryPiece";
import { BoundrySegment } from "../boundries/BoundrySegment";
import { computeBoundryChains } from "../boundries/computeBoundryPieces";
import { computeSortedBoundries } from "../boundries/computeSortedBoundries";
import {
    computeFromBoundrySegments,
    PointGraph,
} from "../boundries/PointGraph";
import { Image } from "./Image";

export interface Boundries {
    boundrySegments: BoundrySegment[];
    boundryGraph: PointGraph;
    boundryPieces: BoundryPiece[];
}

export namespace Boundries {
    export function create(image: Image) {
        const boundrySegments = computeSortedBoundries(image.adjacencies);
        const boundryGraph = computeFromBoundrySegments(boundrySegments);
        const boundryPieces = computeBoundryChains(boundryGraph);
        return {
            boundrySegments,
            boundryGraph,
            boundryPieces,
        };
    }
}
