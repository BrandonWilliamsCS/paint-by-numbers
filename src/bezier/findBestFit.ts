import Bezier from "bezier-js";

import { Point } from "../Geometry";
import { Vector } from "../Vector";
import {
    dimensions,
    generateMemoizedA,
    GivenData,
    MemoizedA,
} from "./GivenData";
import { optimizeAlphas } from "./optimizeAlphas";
import { optimizeTangents } from "./optimizeTangents";

// This file implements the curve fitting algorithms found in:
// Shao, Lejun and Zhou, Hao. "Curve Fitting with Bezier Cubics."
// Graphical Models and Image Processing
// Vol. 58, No. 3, May, pp. 223–232, 1996
// Article no. 0019
// http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.96.5193&rep=rep1&type=pdf

// Variables will be named somewhat consistently with the paper (e.g., function
//  A_i or vector t̂) and may not follow traditional/consistent naming rules.
// However, indexing starts at 0 instead of 1.
// tslint:disable:variable-name

// TODO: configure this
const acceptableErrorThreshold = 25;
const maxIterationCount = 40;

export function findBestFit(
    criticalPoints: Point[],
    dataPoints: Point[],
): Bezier[] {
    // Compute the initial data, including the initial control point vectors.
    const given = GivenData.forPoints(criticalPoints, dataPoints);
    let t̂: Vector[] = computeInitialTangents(given);
    let α: number[][] = computeInitialAlphas(given);
    let S: number = Number.MAX_VALUE;
    let iterationCount = 0;
    // Now iteratively optimize one factor treating the other as correct.
    // In a few dozen iterations,
    while (
        S >= acceptableErrorThreshold &&
        iterationCount <= maxIterationCount
    ) {
        // First, compute some values based on the current t̂/α
        let t = computeTValues(given, t̂, α);
        let A = generateMemoizedA(given, t);
        // compute tangent vector lengths (eqs 16 and 17)
        α = optimizeAlphas(given, A, t̂, t);

        // recompute values with the new α
        t = computeTValues(given, t̂, α);
        A = generateMemoizedA(given, t);
        // compute tangent vector angles (eq 28)
        t̂ = optimizeTangents(given, A, α, t);

        // finally, update the error measurement and get ready to loop.
        t = computeTValues(given, t̂, α);
        S = computeError(given, A, t̂, α, t);
        iterationCount++;
    }

    // once the optimized values are finalized, just convert them to curves.
    return computeSectionCurves(given, t̂, α);
}

function computeInitialTangents(given: GivenData): Vector[] {
    const tangentEstimates: Vector[] = [];
    for (let i = 0; i < given.n; i++) {
        const startPoint = i === 0 ? given.P(i) : given.P(i - 1);
        const endPoint = i === given.n ? given.P(i - 1) : given.P(i);
        const vector = Vector.directionTo(startPoint, endPoint);
        tangentEstimates.push(vector);
    }
    return tangentEstimates;
}

function computeInitialAlphas(given: GivenData): number[][] {
    // initialize everything to 0, for simplicity
    return new Array(given.n - 1).fill(0).map(_ => [0, 0]);
}

function computeSectionCurves(
    given: GivenData,
    t̂: Vector[],
    α: number[][],
): Bezier[] {
    return given.sections.map((section, i) => {
        const controlPointOffset1 = Vector.scale(t̂[i], α[i][0]);
        const controlPointOffset2 = Vector.scale(t̂[i + 1], -α[i][1]);
        const P_i = given.P(i);
        const P_ip1 = given.P(i + 1);
        const P_i0 = Vector.add(P_i, controlPointOffset1);
        const P_i1 = Vector.add(P_ip1, controlPointOffset2);
        return new Bezier(P_i, P_i0, P_i1, P_ip1);
    });
}

function computeTValues(
    given: GivenData,
    t̂: Vector[],
    α: number[][],
): number[][] {
    // first find the current curve for the section
    const Q = computeSectionCurves(given, t̂, α);
    return given.sections.map((_1, i) => {
        const sectionCurve = Q[i];
        // then map each data point in the section to its point on the curve.
        return new Array(given.m(i)).fill(0).map((_2, j) => {
            const sectionPoint = given.C(i, j);
            return sectionCurve.project(sectionPoint).t!;
        });
    });
}

function computeError(
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    α: number[][],
    t: number[][],
): number {
    return new Array(given.sections.length).fill(0).reduce((acc, _1, i) => {
        const α_i0 = α[i][0];
        const α_i1 = α[i][1];
        const t̂_i = t̂[i];
        const t̂_ip1 = t̂[i + 1];
        return (
            acc +
            new Array(given.m(i)).fill(0).reduce((sectionAcc, _2, j) => {
                // We don't want to end up with a vector here.
                // For this case, since we need error distance, add the
                //  magnitude of the vector to the error sum.
                const t_ij = t[i][j];
                const A_ij = A(i, j);
                const B_23_ij = given.B(2, 3, t_ij);
                const B_33_ij = given.B(3, 3, t_ij);
                const differenceComponents = dimensions.map(dimension => {
                    const pointDifference =
                        A_ij[dimension] +
                        α_i0 * t̂_i[dimension] * B_23_ij -
                        α_i1 * t̂_ip1[dimension] * B_33_ij;
                    return pointDifference * pointDifference;
                });
                return Math.sqrt(
                    differenceComponents[0] * differenceComponents[0] +
                        differenceComponents[1] * differenceComponents[1],
                );
            }, 0)
        );
    }, 0);
}
