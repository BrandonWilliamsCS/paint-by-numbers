import Bezier from "bezier-js";

import { Point } from "../Geometry";
import { Vector } from "../Vector";
import { generateMemoizedA, GivenData, MemoizedA } from "./GivenData";
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
        S = computeError(given, A, t̂, α);
        iterationCount++;
    }

    // once the optimized values are finalized, just convert them to curves.
    return computeSectionCurves(given, t̂, α);
}

function computeInitialTangents(given: GivenData): Vector[] {
    const tangentEstimates: Vector[] = [];
    for (let i = 0; i < given.n + 1; i++) {
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
        const controlPoint1 = Vector.scale(t̂[i], α[i][0]);
        const controlPoint2 = Vector.scale(t̂[i + 1], α[i][1]);
        return new Bezier(
            given.P(i),
            controlPoint1,
            controlPoint2,
            given.P(i + 1),
        );
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
): number {
    //!!
}
