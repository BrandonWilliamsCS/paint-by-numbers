import { BoundrySegment } from "../boundries/BoundrySegment";
import { computeSortedBoundries } from "../boundries/computeSortedBoundries";
import { Image } from "./Image";

export interface Boundries {
    boundrySegments: BoundrySegment[];
}

export namespace Boundries {
    export function create(image: Image) {
        const boundrySegments = computeSortedBoundries(image.adjacencies);
        return {
            boundrySegments,
        };
    }
}
