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

export function optimizeAlphas(
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    t: number[][],
): number[][] {
    return new Array(given.sections.length)
        .fill(0)
        .map((_, i) => buildVectors(i, given, A, t̂, t))
        .map(solveSystem);
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

    // Now multiply by the vector factors.
    multiplyByTangents(workingSystem, i, t̂);

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
    });
}

function solveSystem(system: LinearSystem) {
    // Due to the way the derivative of the sum of squares of vector magnitudes
    //  works out, we can just add all of the system.x stuff to the
    //  corresponding system.y stuff and use that in the linear system.
    const A = [
        [system.x.D1.x + system.y.D1.x, system.x.D2.x + system.y.D2.x],
        [system.x.D1.y + system.y.D1.y, system.x.D2.y + system.y.D2.y],
    ];
    const b = [system.x.X.x + system.y.X.x, system.x.X.y + system.x.X.y];
    // mathjs returns an array of rows, so just turn it into an array.
    const x = math.lusolve(A, b) as number[][];
    return [x[0][0], x[1][0]];
}
