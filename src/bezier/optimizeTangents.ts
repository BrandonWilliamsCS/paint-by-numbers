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

    new Array(given.sections.length).fill(0).forEach((_, i) => {
        // Start by summing up the j-dependent parts
        addInnerSums(workingSystem, i, given, A, t);

        // Now multiply by the alpha factors.
        multiplyByAlphas(workingSystem, i, α);
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
    workingSystem: LinearSystem,
    i: number,
    given: GivenData,
    A: MemoizedA,
    t: number[][],
) {
    const m_i = given.m(i);
    for (let j = 0; j <= m_i; j++) {
        const t_ij = t[i][j];
        const A_ij = A(i, j);
        const B_23_t_ij = given.B(2, 3, t_ij);
        const B_33_t_ij = given.B(3, 3, t_ij);

        const E_i_i = B_23_t_ij * B_23_t_ij;
        const E_i_ip1 = B_23_t_ij * B_33_t_ij;
        const E_ip1_i = E_i_ip1;
        const E_ip1_ip1 = B_33_t_ij * B_33_t_ij;
        workingSystem.E[i][i] += E_i_i;
        workingSystem.E[i][i + 1] += E_i_ip1;
        workingSystem.E[i + 1][i] += E_ip1_i;
        workingSystem.E[i + 1][i + 1] += E_ip1_ip1;

        // Remember, A maps to points. We need to repeat for both x and y.
        dimensions.forEach(dimension => {
            const y_i_part = B_23_t_ij * A_ij[dimension];
            const y_ip1_part = B_33_t_ij * A_ij[dimension];
            workingSystem.Y[dimension][i] += y_i_part;
            workingSystem.Y[dimension][i + 1] += y_ip1_part;
        });
    }
}

function multiplyByAlphas(
    workingSystem: LinearSystem,
    i: number,
    α: number[][],
) {
    const α_i0 = α[i][0];
    const α_i1 = α[i][1];

    const E_i_i = α_i0 * α_i0;
    const E_i_ip1 = -1 * α_i0 * α_i1;
    const E_ip1_i = E_i_ip1;
    const E_ip1_ip1 = α_i1 * α_i1;
    workingSystem.E[i][i] *= E_i_i;
    workingSystem.E[i][i + 1] *= E_i_ip1;
    workingSystem.E[i + 1][i] *= E_ip1_i;
    workingSystem.E[i + 1][i + 1] *= E_ip1_ip1;

    dimensions.forEach(dimension => {
        const y_i_part = α_i0;
        const y_ip1_part = -α_i1;
        workingSystem.Y[dimension][i] *= y_i_part;
        workingSystem.Y[dimension][i + 1] *= y_ip1_part;
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
