import Bezier from "bezier-js";

import { Point } from "../Geometry";
import { Vector } from "../Vector";

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

type DimensionKey = keyof Point;
type MemoizedA = (i: number, j: number) => Point;

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

function optimizeAlphas(
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    t: number[][],
): number[][] {
    //!!
}

function optimizeTangents(
    given: GivenData,
    A: MemoizedA,
    α: number[][],
    t: number[][],
): Vector[] {
    //!!
}

function computeError(
    given: GivenData,
    A: MemoizedA,
    t̂: Vector[],
    α: number[][],
): number {
    //!!
}

function generateMemoizedA(given: GivenData, t: number[][]): MemoizedA {
    const cache = new Map<string, Point>();
    return (i: number, j: number) => {
        const key = `${i}/${j}`;
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const value = given.A(i, j, t[i][j]);
        cache.set(key, value);
        return value;
    };
}

// This class packages up all of the functions/data available from the
//  "given" initial set of points, not relying on bezier control point values.
// Note: indexes are 0-based, even though they're 1-based in the paper.
class GivenData {
    constructor(public readonly sections: Point[][]) {}

    /**
     * The quantity of critical points in the piecewise curve.
     */
    public get n(): number {
        return this.sections.length + 1;
    }

    /**
     * The quantity of data points in a given section.
     * @param i the section index
     */
    public m(i: number): number {
        if (i < 0 || i >= this.sections.length) {
            throw new Error(`Invalid section number "${i}"`);
        }
        return this.sections[i].length;
    }

    /**
     * The critical point at index i.
     * @param i the index for the critical point
     */
    public P(i: number): Point {
        if (i < 0 || i >= this.n) {
            throw new Error(`Invalid point number "${i}"`);
        } else if (i === this.n) {
            // The last critical point is at the end of the last section.
            const lastSection = this.sections[this.sections.length - 1];
            return lastSection[lastSection.length - 1];
        }
        // Otherwise just take the first point of the i-th section.
        return this.sections[i][0];
    }

    /**
     * The j-th data point in section i.
     * @param i the section index
     * @param j the data point index within section i
     */
    public C(i: number, j: number): Point {
        if (i < 0 || i >= this.sections.length) {
            throw new Error(`Invalid section number "${i}"`);
        }
        const m_i = this.m(i);
        if (j < 0 || j >= m_i) {
            throw new Error(
                `Invalid section index "${j}" for section number "${i}"`,
            );
        }
        return this.sections[i][j];
    }

    /**
     * A convenience expression used often in fitting computations.
     * It represents the "constant" part, w.r.t. inner control points.
     * @param i the section index
     * @param j the section index
     * @param t_ij the bezier curve paramater
     */
    public A(i: number, j: number, t_ij: number): Point {
        return {
            x: this.dimensionalA(i, j, t_ij, "x"),
            y: this.dimensionalA(i, j, t_ij, "y"),
        };
    }

    /**
     * An individual term of a Bernstein polynomial.
     * Really this is "static" and unrelated to the data points.
     * @param bernsteinTerm the position of the term to compute (1-indexed)
     * @param bernsteinDegree must be 3; included for consistency with the paper
     * @param t the bezier curve paramater
     */
    public B(
        bernsteinTerm: number,
        bernsteinDegree: number,
        t: number,
    ): number {
        if (bernsteinDegree !== 3) {
            throw new Error("Non-cubic curves not supported.");
        }
        const multiplier = bernsteinTerm === 1 || bernsteinTerm === 4 ? 1 : 3;
        const inverseFactor = Math.pow(1 - t, 4 - bernsteinTerm);
        const simpleFactor = Math.pow(t, bernsteinTerm - 1);
        return multiplier * inverseFactor * simpleFactor;
    }

    private dimensionalA(
        i: number,
        j: number,
        t_ij: number,
        dimension: DimensionKey,
    ): number {
        // P_i*B_13(t_ij)
        // + P_i*B_23(t_ij)
        // + P_i+1*B_33(t_ij)
        // + P_i+1*B_43(t_ij)
        // - C_i(j)
        const B = this.B;
        const P_i = this.P(i)[dimension];
        const P_ip1 = this.P(i + 1)[dimension];
        const C_ij = this.C(i, j)[dimension];
        return (
            P_i * B(1, 3, t_ij) +
            P_i * B(2, 3, t_ij) +
            P_ip1 * B(3, 3, t_ij) +
            P_ip1 * B(4, 3, t_ij) -
            C_ij
        );
    }

    public static forPoints(
        dataPoints: Point[],
        criticalPoints: Point[],
    ): GivenData {
        if (
            dataPoints[0] !== criticalPoints[0] ||
            dataPoints[dataPoints.length - 1] !==
                criticalPoints[criticalPoints.length - 1]
        ) {
            throw new Error(
                "Critical Points must be a subsequence of data points",
            );
        }
        // Start with the known beginning point, then add to the first section
        //  until its end is reached. Then advance to the next section.
        const sections: Point[][] = [];
        let currentDataIndex = 1;
        let currentCriticalIndex = 1;
        let currentCriticalPoint = criticalPoints[currentCriticalIndex];
        let buildingSection = [dataPoints[0]];
        while (currentDataIndex < dataPoints.length) {
            const currentDataPoint = dataPoints[currentDataIndex];
            buildingSection.push(currentDataPoint);
            if (currentDataPoint === currentCriticalPoint) {
                sections.push(buildingSection);
                buildingSection = [currentDataPoint];
                currentCriticalIndex += 1;
                currentCriticalPoint = criticalPoints[currentCriticalIndex];
            }
            currentDataIndex += 1;
        }
        return new GivenData(sections);
    }
}
