import Bezier from "bezier-js";

import { Point } from "../Geometry";
import { Vector } from "../Vector";
import { computeTValues } from "./computeTValues";
import { generateMemoizedA, GivenData, MemoizedA } from "./GivenData";
import {
    clampAlphas,
    computeInitialAlphas,
    optimizeAlphas,
    revertUnknownAlphas,
} from "./optimizeAlphas";
import { computeInitialTangents, optimizeTangents } from "./optimizeTangents";

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
const maxIterationCount = 40; //!!40;

export function findBestFit(
    criticalPoints: Point[],
    dataPoints: Point[],
): Bezier[] {
    //!!
    const errors = [];
    // Compute the initial data, including the initial control point vectors.
    const given = GivenData.forPoints(criticalPoints, dataPoints);
    let t̂: Vector[] = computeInitialTangents(given);
    let α: number[][] = computeInitialAlphas(given);
    let t: number[][] = undefined!;
    let A: MemoizedA = undefined!;
    let S: number = Number.MAX_VALUE;
    let iterationCount = 0;
    //// Now iteratively optimize one factor treating the other as correct.
    //// In a few dozen iterations, we're probably about as close as we can get.
    {
        //!!
        console.log(`starting...`);
        const t2 = computeTValues(
            given,
            computeSectionCurves(given, t̂, α),
            undefined,
        );
        const A2 = generateMemoizedA(given, t2);
        // tslint:disable-next-line:no-shadowed-variable
        const S = computeError(given, A2, t̂, α, t2);
        console.log(`initial error: ${S}`);
    }
    // Pick a decent set of alphas once. Despite what the paper says, we don't
    //  need to iteratively refine the alphas.
    //!!
    // {
    //     t = computeTValues(given, computeSectionCurves(given, t̂, α), undefined);
    //     A = generateMemoizedA(given, t);
    //     α = optimizeAlphas(given, A, t̂, t);
    // }
    while (
        S >= acceptableErrorThreshold &&
        iterationCount < maxIterationCount
    ) {
        //const secnum = 1;
        //console.log(`Investigating section ${secnum}.`);
        // console.log(
        //     `Curve from `,
        //     given.P(secnum),
        //     ` to `,
        //     given.P(secnum + 1),
        // );
        //console.log(`To fit points `, given.sections[secnum]);
        //console.log(`Initial t̂ values`, t̂[secnum], t̂[secnum + 1]);
        //console.log(`Initial α values`, α[secnum]);

        // First, compute some values based on the current t̂/α
        //!! don't do this?
        if (iterationCount === 0 || iterationCount !== 0) {
            t = computeTValues(given, computeSectionCurves(given, t̂, α), t);
            //console.log(`Initial t values`, t[secnum]);
            A = generateMemoizedA(given, t);
            console.log("current problem ts: ", t[84]);
        }
        // compute tangent vector lengths (eqs 16 and 17)
        α = revertUnknownAlphas(optimizeAlphas(given, A, t̂, t), α);
        if (iterationCount === 0 || iterationCount !== 0) {
            α = clampAlphas(α, 0.1);
        }
        //console.log(`optimized alphas to:`, α[secnum]);
        // α.forEach((pair, i) => { //!!
        //     if (Math.abs(pair[0]) > 5 || Math.abs(pair[1]) > 5) {
        //         console.log(`High alphas for section ${i}:`, pair);
        //     }
        // });
        ////////!!
        console.log(`optimized alphas`);
        S = computeError(given, A, t̂, α, t);
        console.log(`new error: ${S}`);
        console.log("current problem alphas: ", α[84]);

        // recompute values with the new α
        t = computeTValues(given, computeSectionCurves(given, t̂, α), t);
        A = generateMemoizedA(given, t);
        // compute tangent vector angles (eq 28)
        t̂ = optimizeTangents(given, A, t̂, α, t);

        ////////!!
        console.log(`optimized tangents`);
        S = computeError(given, A, t̂, α, t);
        console.log(`new error: ${S}`);
        console.log("current problem ts: ", t[84]);

        // finally, update the error measurement and get ready to loop.
        S = computeError(given, A, t̂, α, t);
        iterationCount++;
        console.log(
            `Iterated ${iterationCount} times generating an error of ${S}.`,
        );
        errors.push(S);
        //!!
        α.forEach((alphaPair, i) => {
            if (i === 84) {
                console.log("current problem alphas: ", alphaPair);
                console.log("current problem tangent: ", t̂[i]);
                console.log(
                    "approx desired tangent: ",
                    Vector.directionTo(given.P(i), given.P(i + 1)),
                );
                console.log("current problem tangent2: ", t̂[i + 1]);
                console.log(
                    "approx desired tangent2: ",
                    Vector.directionTo(given.P(i + 1), given.P(i + 2)),
                );
                console.log("current problem ts: ", t[i]);
            }
            const tan0 = t̂[i];
            const alpha0 = alphaPair[0];
            if (Vector.magnitude(Vector.scale(tan0, alpha0)) > 1000) {
                throw new Error(
                    `Jumbo tangent 0 at ${i}: ${alpha0} * ${JSON.stringify(
                        tan0,
                    )}`,
                );
            }
            const tan1 = t̂[i + 1];
            const alpha1 = -alphaPair[1];
            if (Vector.magnitude(Vector.scale(tan1, alpha1)) > 1000) {
                throw new Error(
                    `Jumbo tangent 1 at ${i}: ${alpha0} * ${JSON.stringify(
                        tan0,
                    )}`,
                );
            }
        });
    }

    console.log("Error stream: ", errors);
    // once the optimized values are finalized, just convert them to curves.
    return computeSectionCurves(given, t̂, α);
}

function computeSectionCurves(
    given: GivenData,
    t̂: Vector[],
    α: number[][],
): Bezier[] {
    return given.sections.map((_, i) => {
        const controlPointOffset1 = Vector.scale(t̂[i], α[i][0]);
        const controlPointOffset2 = Vector.scale(t̂[i + 1], -α[i][1]);
        const P_i = given.P(i);
        const P_ip1 = given.P(i + 1);
        const P_i0 = Vector.add(P_i, controlPointOffset1);
        const P_i1 = Vector.add(P_ip1, controlPointOffset2);
        return new Bezier(P_i, P_i0, P_i1, P_ip1);
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
                const t_ij = t[i][j];
                const A_ij = A(i, j);
                const B_23_ij = given.B(2, 3, t_ij);
                const B_33_ij = given.B(3, 3, t_ij);
                const difference = Vector.add(
                    A_ij,
                    Vector.scale(t̂_i, α_i0 * B_23_ij),
                    Vector.scale(t̂_ip1, -α_i1 * B_33_ij),
                );
                // We don't want to end up with a vector here.
                // For this case, since we need error distance, add the
                //  squared magnitude of the vector to the error sum.
                return sectionAcc + Vector.dot(difference, difference);
            }, 0)
        );
    }, 0);
}
