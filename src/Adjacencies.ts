import { Position, SidePosition } from "./Position";

export enum SpecialAdjacency {
    None,
    // CLEANUP: instead of this, easier to just use the Heterogenous subtree?
    // Multiple,
}

export type Adjacency<T> = T | SpecialAdjacency;
export type AdjacencyEntry<T> = [SidePosition, Adjacency<T>];

export interface Adjacencies<T> {
    readonly [Position.Top]: Adjacency<T>;
    readonly [Position.Right]: Adjacency<T>;
    readonly [Position.Bottom]: Adjacency<T>;
    readonly [Position.Left]: Adjacency<T>;
}
type WriteableAdjacencies<T> = {
    -readonly [P in keyof Adjacencies<T>]: Adjacencies<T>[P]
};

export const trivialAdjacencies = {
    [Position.Top]: SpecialAdjacency.None,
    [Position.Right]: SpecialAdjacency.None,
    [Position.Bottom]: SpecialAdjacency.None,
    [Position.Left]: SpecialAdjacency.None,
};

export namespace Adjacencies {
    export function fromEntries<T>(entries: Array<AdjacencyEntry<T>>) {
        const adjacencies: WriteableAdjacencies<T> = {} as any;
        let validityCheck = 0;
        entries.forEach(entry => {
            adjacencies[entry[0]] = entry[1];
            // tslint:disable-next-line:no-bitwise
            validityCheck |= 1 << entry[0];
        });
        if (validityCheck !== 170) {
            throw new Error(
                `Invalid or missing Position in entries: ${JSON.stringify(
                    entries.map(entry => entry[0]),
                )}`,
            );
        }
        return adjacencies;
    }
}
