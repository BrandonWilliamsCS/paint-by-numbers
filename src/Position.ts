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

    export function adjacentTo(
        position: CornerPosition,
    ): [SidePosition, SidePosition];
    export function adjacentTo(
        position: SidePosition,
    ): [CornerPosition, CornerPosition];
    export function adjacentTo(position: Position): [Position, Position] {
        // the next adjacent positions are just rotations a unit in each direction
        return [rotate(position, -1), rotate(position, 1)];
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
