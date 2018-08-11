import math from "mathjs";

import { Vector } from "../Vector";
import { dimensions, GivenData, MemoizedA } from "./GivenData";

// Variables will be named in a somewhat mathematically standard way.
// tslint:disable:variable-name

interface LinearSystem {
    D1: Vector;
    D2: Vector;
    X: Vector;
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
        D1: { x: 0, y: 0 },
        D2: { x: 0, y: 0 },
        X: { x: 0, y: 0 },
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
    for (let j = 0; j <= m_i; j++) {
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
            workingSystem.D1.x += d_i1;
            workingSystem.D2.x += d_i2;
            workingSystem.X.x += x_i1;

            const d_i3 = d_i2;
            const d_i4 = B_33_t_ij * B_33_t_ij;
            const x_i2 = B_33_t_ij * A_ij[dimension];
            workingSystem.D1.y += d_i3;
            workingSystem.D2.y += d_i4;
            workingSystem.X.y += x_i2;
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
        const d_i2 = t̂_i_part * t̂_ip1_part;
        const x_i1 = -t̂_i_part;
        workingSystem.D1.x *= d_i1;
        workingSystem.D2.x *= d_i2;
        workingSystem.X.x *= x_i1;

        const d_i3 = d_i2;
        const d_i4 = t̂_ip1_part * t̂_ip1_part;
        const x_i2 = -t̂_ip1_part;
        workingSystem.D1.y *= d_i3;
        workingSystem.D2.y *= d_i4;
        workingSystem.X.y *= x_i2;
    });
}

function solveSystem(system: LinearSystem) {
    // math expects and returns an array of rows.
    const A = [[system.D1.x, system.D2.x], [system.D1.y, system.D2.y]];
    const b = [system.X.x, system.X.y];
    const x = math.lusolve(A, b) as number[][];
    return [x[0][0], x[1][0]];
}
