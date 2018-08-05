import * as _ from "lodash";

import { Color } from "../Color";
import { Point } from "../Geometry";
import { Position } from "../Position";
import {
    flattenAdjacencies,
    TreeAdjacencyMap,
    TreeAdjacencyPair,
} from "../quadTree/Adjacencies";
import { BoundrySegment } from "./BoundrySegment";

export function computeSortedBoundries(
    adjacencies: TreeAdjacencyMap<Color>,
): BoundrySegment[] {
    const flatAdjacencies = flattenAdjacencies(adjacencies);
    const boundrySegments = computeBoundriesFromPairs(flatAdjacencies);
    return consolidateBoundrySegments(boundrySegments);
}

export function computeBoundriesFromPairs(
    flatAdjacencies: Array<TreeAdjacencyPair<Color>>,
): BoundrySegment[] {
    // this simplifies some type stuff later.
    const badSegment = (null as any) as BoundrySegment;
    return flatAdjacencies
        .map((adjacencyPair, i) => {
            // We only want segments of the same color.
            if (
                adjacencyPair.from.regionProperties ===
                adjacencyPair.to.regionProperties
            ) {
                return badSegment;
            }

            // Pick out the "before" and "after" regions so we can get color.
            let beforeRegion = adjacencyPair.from;
            let afterRegion = adjacencyPair.to;

            // Since "from" may be smaller, always start with that.
            // But if we're going right or down we need the opposite side.
            const fromRegion = adjacencyPair.from.region;
            const start = Point.from(fromRegion.x, fromRegion.y);
            if (adjacencyPair.on === Position.Bottom) {
                start.y += fromRegion.height;
            } else if (adjacencyPair.on === Position.Right) {
                start.x += fromRegion.width;
            } else {
                // If we're NOT going right or down, we ARE right or down.
                // In those cases, "from" is really "after".
                const swapPlaceholder = beforeRegion;
                beforeRegion = afterRegion;
                afterRegion = swapPlaceholder;
            }

            // Find the endpoint by moving along the appropriate side by
            //  the appropriate distance.
            const end = Point.from(
                start.x +
                    (adjacencyPair.on === Position.Top ||
                    adjacencyPair.on === Position.Bottom
                        ? fromRegion.width
                        : 0),
                start.y +
                    (adjacencyPair.on === Position.Left ||
                    adjacencyPair.on === Position.Right
                        ? fromRegion.height
                        : 0),
            );

            return {
                segment: { start, end },
                beforeColor: beforeRegion.regionProperties,
                afterColor: afterRegion.regionProperties,
            };
        })
        .filter(x => x);
}

export function consolidateBoundrySegments(
    rawSegments: BoundrySegment[],
): BoundrySegment[] {
    // Split into horizontal and vertical for convenience.
    const { true: horizontalSegments, false: verticalSegments } = _.groupBy(
        rawSegments,
        rawSegment => rawSegment.segment.start.y === rawSegment.segment.end.y,
    );

    const consolidatedHorizontal = consolidateHorizontal(horizontalSegments);
    const consolidatedVertical = consolidateVertical(verticalSegments);

    return [...consolidatedHorizontal, ...consolidatedVertical];
}

function consolidateHorizontal(horizontalSegments: BoundrySegment[]) {
    // The next step is easiest when they're sorted so that "end-to-end" pieces
    //  sit adjancent in the array.
    horizontalSegments.sort((a, b) => a.segment.start.x - b.segment.start.x);
    // We want to combine end-to-end segments that have the same colors on
    //  each side... the easiest way to do that is to group by relevant fields.
    // Think of the string as a unique "hash" or key to do so.
    const groupedHorizontal = _.groupBy(
        horizontalSegments,
        boundrySegment =>
            // left-pad with 0s for sortability
            `${("00000" + boundrySegment.segment.start.y).slice(
                -5,
            )}:${boundrySegment.beforeColor.toHexString()}/${boundrySegment.afterColor.toHexString()}`,
    );
    // Now it's just a matter of seeing of there is gap or not.
    const consolidatedHorizontal: BoundrySegment[] = [];
    _.forEach(groupedHorizontal, group => {
        let lastAdded: BoundrySegment | undefined;
        group.forEach(boundrySegment => {
            if (
                lastAdded &&
                lastAdded.segment.end.x === boundrySegment.segment.start.x
            ) {
                // In other words, if this is smack-dab against the last,
                //  combine them.
                // Beware the modification of existing objects, though.
                lastAdded.segment.end.x = boundrySegment.segment.end.x;
            } else {
                consolidatedHorizontal.push(boundrySegment);
                lastAdded = boundrySegment;
            }
        });
    });

    return consolidatedHorizontal;
}

function consolidateVertical(verticalSegments: BoundrySegment[]) {
    // Vertical is basically just Horizontal with an axis flip.
    verticalSegments.sort((a, b) => a.segment.start.y - b.segment.start.y);
    const groupedVertical = _.groupBy(
        verticalSegments,
        boundrySegment =>
            // left-pad with 0s for sortability
            `${("00000" + boundrySegment.segment.start.x).slice(
                -5,
            )}:${boundrySegment.beforeColor.toHexString()}/${boundrySegment.afterColor.toHexString()}`,
    );
    const consolidatedVertical: BoundrySegment[] = [];
    _.forEach(groupedVertical, group => {
        let lastAdded: BoundrySegment | undefined;
        group.forEach(boundrySegment => {
            if (
                lastAdded &&
                lastAdded.segment.end.y === boundrySegment.segment.start.y
            ) {
                lastAdded.segment.end.y = boundrySegment.segment.end.y;
            } else {
                consolidatedVertical.push(boundrySegment);
                lastAdded = boundrySegment;
            }
        });
    });

    return consolidatedVertical;
}
