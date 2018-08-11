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

export function optimizeTangents(
    given: GivenData,
    A: MemoizedA,
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
        const workingSubSystem = createInitialSystem(2);

        // Start by summing up the j-dependent parts
        addInnerSums(workingSubSystem, i, given, A, t);

        // Now multiply by the alpha factors.
        multiplyByAlphas(workingSubSystem, i, α);

        // Finally, add the subsystem into the full working system.
        addSubSystem(workingSystem, workingSubSystem, i);
    });

    return solveSystem(workingSystem);
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
            workingSubSystem.Y[dimension][0] += y_i_part;
            workingSubSystem.Y[dimension][1] += y_ip1_part;
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
        const y_i_part = α_i0;
        const y_ip1_part = -α_i1;
        workingSubSystem.Y[dimension][0] *= y_i_part;
        workingSubSystem.Y[dimension][1] *= y_ip1_part;
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
        workingSystem.Y[dimension][i] += currentSubSystem.Y[dimension][0];
        workingSystem.Y[dimension][i + 1] += currentSubSystem.Y[dimension][1];
    });
}

function solveSystem(system: LinearSystem): Vector[] {
    const y_x = math.lusolve(system.E, system.Y.x) as number[][];
    const y_y = math.lusolve(system.E, system.Y.y) as number[][];
    // Math returns an array of rows.
    return lodash.zipWith(y_x, y_y, (y_x_i, y_y_i) =>
        Point.from(y_x_i[0], y_y_i[0]),
    );
}
