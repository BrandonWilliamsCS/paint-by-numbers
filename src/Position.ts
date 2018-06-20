export enum Position {
    TopLeft = 0,
    Top = 1,
    TopRight = 2,
    Right = 3,
    BottomRight = 4,
    Bottom = 5,
    BottomLeft = 6,
    Left = 7,
}

export type CornerPosition =
    | Position.TopLeft
    | Position.TopRight
    | Position.BottomRight
    | Position.BottomLeft;

export type SidePosition =
    | Position.Top
    | Position.Right
    | Position.Bottom
    | Position.Left;

export namespace Position {
    export function rotate(position: Position, count: number): Position {
        // make sure this is positive so that we can simplify the next mod operation
        const adjustment = (count % 8) + 8;
        // and then just do modulo addition
        return (position + adjustment) % 8;
    }

    export function oppositeOf(position: CornerPosition): CornerPosition;
    export function oppositeOf(position: SidePosition): SidePosition;
    export function oppositeOf(position: Position): Position {
        return rotate(position, 4);
    }

    export function rotationallyAdjacentTo(
        position: CornerPosition,
    ): [SidePosition, SidePosition];
    export function rotationallyAdjacentTo(
        position: SidePosition,
    ): [CornerPosition, CornerPosition];
    export function rotationallyAdjacentTo(
        position: Position,
    ): [Position, Position] {
        // the next adjacent positions are just rotations a unit in each direction
        return [rotate(position, -1), rotate(position, 1)];
    }

    export function isRotationallyAdjacentTo(
        first: CornerPosition,
        second: SidePosition,
    ): boolean;
    export function isRotationallyAdjacentTo(
        first: SidePosition,
        second: CornerPosition,
    ): boolean;
    export function isRotationallyAdjacentTo(
        first: Position,
        second: Position,
    ): boolean {
        // the next adjacent positions are just rotations a unit in each direction
        return second === rotate(first, 1) || second === rotate(first, -1);
    }

    export function between(
        first: CornerPosition,
        second: CornerPosition,
    ): SidePosition;
    export function between(
        first: SidePosition,
        second: SidePosition,
    ): CornerPosition;
    export function between(first: Position, second: Position): Position {
        if ((8 + second - first) % 8 === 2) {
            // In this case, the first is just ccw of the second.
            // The space between them is just one cw of the first.
            return rotate(first, 1);
        } else if ((8 + first - second) % 8 === 2) {
            // This is the mirror case - just rotate the other way
            return rotate(second, 1);
        } else {
            // if one is not exactly two from the other, we can't figure out the one in between.
            throw new Error(
                `Cannot find position between ${first} and ${second}`,
            );
        }
    }

    /**
     * Compute the Position obtained after moving toward a given side.
     * Note that this has a "looping" effect; moving towards the Top from the TopLeft yields BottomLeft.
     * @param from The origin Position
     * @param toward a Position toward which to move
     */
    export function afterMovingTowards(
        from: SidePosition,
        toward: CornerPosition,
    ): SidePosition;
    export function afterMovingTowards(
        from: CornerPosition,
        toward: SidePosition,
    ): CornerPosition;
    export function afterMovingTowards(
        from: Position,
        toward: Position,
    ): Position {
        // Miraculously, the outcome is the sum of `toward` and its opposite, adjusted by `-from`.
        // For example, from `BottomLeft` (6) toward Right (3) is
        //  `Right` + `Left` - `BottomLeft` = 3 + 7 - 6 = 4 = `BottomRight.
        // Now since the opposite is just +4, this simplifies to 4 + 2*toward - from.
        // To simplify the mod math, add an additional 8.
        return 2 * toward + 12 - from;
    }

    export const corners: CornerPosition[] = [
        Position.TopLeft,
        Position.TopRight,
        Position.BottomRight,
        Position.BottomLeft,
    ];
    export const sides: SidePosition[] = [
        Position.Top,
        Position.Right,
        Position.Bottom,
        Position.Left,
    ];
}
