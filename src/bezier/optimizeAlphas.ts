import math from "mathjs";

import { Vector } from "../Vector";
import { dimensions, GivenData, MemoizedA } from "./GivenData";

// Variables will be named in a somewhat mathematically standard way.
// tslint:disable:variable-name

interface LinearSystem {
    x: {
        D1: Vector;
        D2: Vector;
        X: Vector;
    };
    y: {
        D1: Vector;
        D2: Vector;
        X: Vector;
    };
}

export function computeInitialAlphas(given: GivenData): number[][] {
    // initialize everything to 0, for simplicity
    return new Array(given.n - 1).fill(0).map(_ => [0, 0]);
}

export function optimizeAlphas(
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    t: number[][],
): Array<Array<number | undefined>> {
    return new Array(given.sections.length)
        .fill(0)
        .map((_, i) => buildVectors(i, given, A, t̂, t))
        .map(solveSystem);
}

export function clampAlphas(
    rawValues: number[][],
    minValue: number,
): number[][] {
    return rawValues.map(rawPair =>
        rawPair.map(rawAlpha => Math.max(minValue, rawAlpha)),
    );
}

export function revertUnknownAlphas(
    newAlphas: Array<Array<number | undefined>>,
    previousAlphas: number[][],
): number[][] {
    return newAlphas.map((pair, i) =>
        pair.map(
            (value, h) => (value !== undefined ? value : previousAlphas[i][h]),
        ),
    );
}

function buildVectors(
    i: number,
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    t: number[][],
): LinearSystem {
    // Initialize to 0s so we can add to it
    const workingSystem: LinearSystem = {
        x: {
            D1: { x: 0, y: 0 },
            D2: { x: 0, y: 0 },
            X: { x: 0, y: 0 },
        },
        y: {
            D1: { x: 0, y: 0 },
            D2: { x: 0, y: 0 },
            X: { x: 0, y: 0 },
        },
    };

    // Start by summing up the j-dependent parts
    addInnerSums(workingSystem, i, given, A, t);

    // if (i === 1) {
    //     console.log("inner sum system ", JSON.stringify(workingSystem));
    // }

    // Now multiply by the vector factors.
    multiplyByTangents(workingSystem, i, t̂);

    // if (i === 1) { //!!
    //     console.log("final system ", JSON.stringify(workingSystem));
    // }

    if (i === 84) {
        console.log("section: ", given.sections[i]);
        console.log("t: ", t[i]);
    }

    return workingSystem;
}

function addInnerSums(
    workingSystem: LinearSystem,
    i: number,
    given: GivenData,
    A: MemoizedA,
    t: number[][],
) {
    const m_i = given.m(i);
    for (let j = 0; j < m_i; j++) {
        const t_ij = t[i][j];
        const A_ij = A(i, j);
        const B_23_t_ij = given.B(2, 3, t_ij);
        const B_33_t_ij = given.B(3, 3, t_ij);
        // Remember, A maps to points. We need to repeat for both x and y.
        // But don't confuse this with the D/X vector's dimensions.
        dimensions.forEach(dimension => {
            const d_i1 = B_23_t_ij * B_23_t_ij;
            const d_i2 = B_23_t_ij * B_33_t_ij;
            const x_i1 = B_23_t_ij * A_ij[dimension];
            workingSystem[dimension].D1.x += d_i1;
            workingSystem[dimension].D2.x += d_i2;
            workingSystem[dimension].X.x += x_i1;

            const d_i3 = B_23_t_ij * B_33_t_ij;
            const d_i4 = B_33_t_ij * B_33_t_ij;
            const x_i2 = B_33_t_ij * A_ij[dimension];
            workingSystem[dimension].D1.y += d_i3;
            workingSystem[dimension].D2.y += d_i4;
            workingSystem[dimension].X.y += x_i2;
        });
    }
}

function multiplyByTangents(
    workingSystem: LinearSystem,
    i: number,
    t̂: Vector[],
) {
    const t̂_i = t̂[i];
    const t̂_ip1 = t̂[i + 1];
    dimensions.forEach(dimension => {
        const t̂_i_part = t̂_i[dimension];
        const t̂_ip1_part = t̂_ip1[dimension];

        const d_i1 = t̂_i_part * t̂_i_part;
        const d_i2 = -t̂_i_part * t̂_ip1_part;
        const x_i1 = -t̂_i_part;
        workingSystem[dimension].D1.x *= d_i1;
        workingSystem[dimension].D2.x *= d_i2;
        workingSystem[dimension].X.x *= x_i1;

        const d_i3 = -t̂_i_part * t̂_ip1_part;
        const d_i4 = -t̂_ip1_part * t̂_ip1_part;
        const x_i2 = -t̂_ip1_part;
        workingSystem[dimension].D1.y *= d_i3;
        workingSystem[dimension].D2.y *= d_i4;
        workingSystem[dimension].X.y *= x_i2;
        //!!
        // if (i === 84) {
        //     console.log(d_i1, d_i2, x_i1);
        //     console.log(d_i3, d_i4, x_i2);
        // }
    });
}

function solveSystem(system: LinearSystem, i: number) {
    // Due to the way the derivative of the sum of squares of vector magnitudes
    //  works out, we can just add all of the system.x stuff to the
    //  corresponding system.y stuff and use that in the linear system.
    const A = [
        [system.x.D1.x + system.y.D1.x, system.x.D2.x + system.y.D2.x],
        [system.x.D1.y + system.y.D1.y, system.x.D2.y + system.y.D2.y],
    ];
    const b = [system.x.X.x + system.y.X.x, system.x.X.y + system.x.X.y];
    // mathjs returns an array of rows, so just turn it into an array.
    try {
        const x = math.lusolve(A, b) as number[][];
        return [x[0][0], x[1][0]];
    } catch (e) {
        // In some cases, a singluar A is okay. Try to recover.
        if (!e.message || e.message.indexOf("is singular") === -1) {
            throw e;
        }
        //!!
        console.error("Singular system");
        console.error(A);
        console.error(b);
        console.log(math.lup(A).U);
        console.log(math.lsolve(math.lup(A).L, b));
        const possibleRecovery = recoverSingularSystem(A, b);
        if (possibleRecovery) {
            return possibleRecovery;
        }
        throw e;
    }
}

const epsilon = 1e-8;
function recoverSingularSystem(A: number[][], b: number[]) {
    const { L, U } = math.lup(A);
    const d = math.lsolve(L, b) as number[][];
    // We can only recover if one of the dimensions here is effectively zero.
    // Because U is upper triangular, but also singular, the bottom row is 0, 0.
    // So now just verify that the modified constant piece has 0 below.
    if (d[1][0] > epsilon) {
        return undefined;
    }

    // The goal here is to obtain any α values that are dictated by the system,
    //  but preserve original α values when it could otherwise be arbitrary.
    // Signal that case with `undefined`. Start by assuming both values are that
    //  way, and only replace if we can get a specific value.
    const α: Array<number | undefined> = [undefined, undefined];
    const upperRow = (U as number[][])[0];
    let rowSum = 0;
    if (upperRow[0] > epsilon) {
        rowSum += upperRow[0];
    }
    if (upperRow[1] > epsilon) {
        rowSum += upperRow[1];
    }
    // if the upper row is all 0, the α values can't matter.
    if (rowSum === 0) {
        return α;
    }

    // Now replace any meaningful position with the appropriate value.
    // In the case that both values are meaninful, this causes them to be equal.
    const dictatedAlpha = d[0][0] / rowSum;
    if (upperRow[0] > epsilon) {
        α[0] = dictatedAlpha;
    }
    if (upperRow[1] > epsilon) {
        α[1] = dictatedAlpha;
    }
    return α;
}
