import { Point } from "../Geometry";

// Variables will be named in a somewhat mathematically standard way.
// tslint:disable:variable-name

export const dimensions: [DimensionKey, DimensionKey] = ["x", "y"];
export type DimensionKey = keyof Point;
export type MemoizedA = (i: number, j: number) => Point;

// This class packages up all of the functions/data available from the
//  "given" initial set of points, not relying on bezier control point values.
// Note: indexes are 0-based, even though they're 1-based in the paper.
export class GivenData {
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

export function generateMemoizedA(given: GivenData, t: number[][]): MemoizedA {
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
