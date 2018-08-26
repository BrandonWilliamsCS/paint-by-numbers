import * as lodash from "lodash";
import math from "mathjs";

import { Point } from "../Geometry";
import { Vector } from "../Vector";
import { dimensions, GivenData, MemoizedA } from "./GivenData";

// Variables will be named in a somewhat mathematically standard way.
// tslint:disable:variable-name

interface LinearSystem {
    E: number[][];
    Y: {
        x: number[];
        y: number[];
    };
}

export function computeInitialTangents(given: GivenData): Vector[] {
    const tangentEstimates: Vector[] = [];
    for (let i = 0; i < given.n; i++) {
        const startPoint = i === 0 ? given.P(i) : given.P(i - 1);
        const endPoint = i === given.n - 1 ? given.P(i) : given.P(i + 1);
        const vector = Vector.directionTo(startPoint, endPoint);
        tangentEstimates.push(vector);
    }
    return tangentEstimates;
}

export function optimizeTangents(
    given: GivenData,
    A: MemoizedA,
    currentValues: Vector[],
    α: number[][],
    t: number[][],
): Vector[] {
    const workingSystem = createInitialSystem(given.n);

    // The E matrix could be described as a diagonal-of-width-three matrix.
    // To build it, the paper describes the matrix row-by-row. This yields an
    //  algorithm with a lot of unideal double-calculation and special cases:
    // Most rows have both an "i" component and an "i-1" component, but the
    //  first and last rows only have one or the other. Additionally, because
    //  the outer rows/columns of E are only two values wide instead of three,
    //  those must be treated as conditional cases.
    // To avoid conditional special cases like that, we can instead iterate
    //  along the diagonal to the (n - 1)th row/column, adding in just i's
    //  contribution to current the 2x2 box with i at the top left corner.
    new Array(given.sections.length).fill(0).forEach((_, i) => {
        const workingSubSystem = createInitialSystem(given.n);

        // Start by summing up the j-dependent parts
        addInnerSums(workingSubSystem, i, given, A, t);

        // Now multiply by the alpha factors.
        multiplyByAlphas(workingSubSystem, i, α);

        // Finally, add the subsystem into the full working system.
        addSubSystem(workingSystem, workingSubSystem, i);
    });

    cleanSystem(workingSystem, currentValues);

    return solveSystems(workingSystem, α);
}

function createInitialSystem(n: number): LinearSystem {
    const dummyArray = new Array(n).fill(0);
    return {
        E: dummyArray.map(() => dummyArray.map(() => 0)),
        Y: {
            x: dummyArray.map(() => 0),
            y: dummyArray.map(() => 0),
        },
    };
}

function addInnerSums(
    workingSubSystem: LinearSystem,
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

        const E_i_i = B_23_t_ij * B_23_t_ij;
        const E_i_ip1 = B_23_t_ij * B_33_t_ij;
        const E_ip1_i = E_i_ip1;
        const E_ip1_ip1 = B_33_t_ij * B_33_t_ij;
        workingSubSystem.E[0][0] += E_i_i;
        workingSubSystem.E[0][1] += E_i_ip1;
        workingSubSystem.E[1][0] += E_ip1_i;
        workingSubSystem.E[1][1] += E_ip1_ip1;

        // Remember, A maps to points. We need to repeat for both x and y.
        dimensions.forEach(dimension => {
            const y_i_part = B_23_t_ij * A_ij[dimension];
            const y_ip1_part = B_33_t_ij * A_ij[dimension];
            workingSubSystem.Y[dimension][i] += y_i_part;
            workingSubSystem.Y[dimension][i + 1] += y_ip1_part;
        });
    }
}

function multiplyByAlphas(
    workingSubSystem: LinearSystem,
    i: number,
    α: number[][],
) {
    const α_i0 = α[i][0];
    const α_i1 = α[i][1];

    const E_i_i = α_i0 * α_i0;
    const E_i_ip1 = -1 * α_i0 * α_i1;
    const E_ip1_i = E_i_ip1;
    const E_ip1_ip1 = α_i1 * α_i1;
    workingSubSystem.E[0][0] *= E_i_i;
    workingSubSystem.E[0][1] *= E_i_ip1;
    workingSubSystem.E[1][0] *= E_ip1_i;
    workingSubSystem.E[1][1] *= E_ip1_ip1;

    dimensions.forEach(dimension => {
        const y_i_part = -α_i0;
        const y_ip1_part = α_i1;
        workingSubSystem.Y[dimension][i] *= y_i_part;
        workingSubSystem.Y[dimension][i + 1] *= y_ip1_part;
    });
}

function addSubSystem(
    workingSystem: LinearSystem,
    currentSubSystem: LinearSystem,
    i: number,
) {
    workingSystem.E[i][i] += currentSubSystem.E[0][0];
    workingSystem.E[i][i + 1] += currentSubSystem.E[0][1];
    workingSystem.E[i + 1][i] += currentSubSystem.E[1][0];
    workingSystem.E[i + 1][i + 1] += currentSubSystem.E[1][1];

    dimensions.forEach(dimension => {
        workingSystem.Y[dimension][i] += currentSubSystem.Y[dimension][i];
        workingSystem.Y[dimension][i + 1] +=
            currentSubSystem.Y[dimension][i + 1];
    });
}

const epsilon = 1e-8;
function cleanSystem(system: LinearSystem, currentValues: Vector[]) {
    // If a row of the matrix is all 0s, the value of the associated tangent
    //  will have no effect. If an entry in the constant term is 0, the vector
    //  must be 0.
    // But we don't want 0 vectors. Instead, let the alphas be set to 0.
    // So, if some row has all 0s on either side, tweak the system to enforce
    //  that that vector stays put (and prevent a singular matrix).
    currentValues.forEach((currentValue, i) => {
        if (
            (system.Y.x[i] >= epsilon || system.Y.y[i] >= epsilon) &&
            system.E[i].every(entry => entry >= epsilon)
        ) {
            return;
        }
        // Fix it by setting the row to a 1 in the diagonal...
        system.E[i] = system.E[i].map((_, j) => (i === j ? 1 : 0));
        // ...and the constant term equal to the previous value.
        dimensions.map(dimension => {
            system.Y[dimension][i] = currentValue[dimension];
        });
    });
}

function solveSystems(system: LinearSystem, α: number[][]): Vector[] {
    const tans_x = solveSystem(system.E, system.Y.x, α);
    const tans_y = solveSystem(system.E, system.Y.y, α);
    // Math returns an array of rows.
    return lodash.zipWith(tans_x, tans_y, (tans_x_i, tans_y_i) =>
        Point.from(tans_x_i[0], tans_y_i[0]),
    );
}

//!! no alpha
function solveSystem(E: number[][], y: number[], α: number[][]): number[][] {
    try {
        return math.lusolve(E, y) as number[][];
    } catch (e) {
        console.log(α);
        // In some cases, a singluar E is okay. Try to recover.
        if (!e.message || e.message.indexOf("is singular") === -1) {
            throw e;
        }
        //!!
        console.error(E);
        console.error(y);
        console.log(math.lup(E));
        const possibleRecovery = recoverSingularSystem(E, y);
        if (possibleRecovery) {
            return possibleRecovery;
        }
        throw e;
    }
}

// const epsilon = 1e-8;
function recoverSingularSystem(E: number[][], y: number[]) {
    // const { L, U } = math.lup(E) as { L: number[][]; U: number[][] };
    // const d = math.lsolve(L, y) as number[][];
    return undefined;
    // We can only recover if all of the zero-filed rows in U are matched by
    //  zero-filled entries in d. So find where the bad rows start in U and
    //  the where the bad rows start in d and hope that d gets bad first.
    //!! const firstBadURow = U.findIndex(row => row.every(u => u < epsilon));
    // const firstBadDEntry = d.findIndex(entry => entry[0] < epsilon);
    // if (firstBadDEntry === -1 || firstBadDEntry > firstBadURow) {
    //     return undefined;
    // }

    // // if the matrix is all 0s, there's nothing we can do.
    // if (firstBadURow === 0) {
    //     return;
    // }

    // // The goal here is to obtain any α values that are dictated by the system,
    // //  but preserve original α values when it could otherwise be arbitrary.
    // // Signal that case with `undefined`. Start by assuming both values are that
    // //  way, and only replace if we can get a specific value.
    // const nonZeroCols: number[] = [];
    // const x: Array<number | undefined> = [undefined, undefined];
    // const upperRow = (U as number[][])[0];
    // let rowSum = 0;
    // if (upperRow[0] > epsilon) {
    //     rowSum += upperRow[0];
    // }
    // if (upperRow[1] > epsilon) {
    //     rowSum += upperRow[1];
    // }
    // // if the upper row is all 0, the α values can't matter.
    // if (rowSum === 0) {
    //     return α;
    // }

    // // Now replace any meaningful position with the appropriate value.
    // // In the case that both values are meaninful, this causes them to be equal.
    // const dictatedAlpha = d[0][0] / rowSum;
    // if (upperRow[0] > epsilon) {
    //     α[0] = dictatedAlpha;
    // }
    // if (upperRow[1] > epsilon) {
    //     α[1] = dictatedAlpha;
    // }
    // return α;
}
