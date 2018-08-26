import Bezier from "bezier-js";

import { Point } from "../Geometry";
import { Vector } from "../Vector";
import { GivenData } from "./GivenData";

// Variables will be named in a somewhat mathematically standard way.
// tslint:disable:variable-name

//!!!! try just projecting onto P_iP_ip1
// find theta from P_i to P_ip1 vector
// rotate each individual point plus the curve itself to cancel this out
// find t values that correspond with the x location of each point
export function computeTValues(
    given: GivenData,
    Q: Bezier[],
    previousValues: number[][] | undefined,
): number[][] {
    //!!
    const debug = {
        error: 0,
        derivativeError: 0,
        count: 0,
        totalPoints: 0,
        fallbackCount: 0,
    };
    // Use Newton-Ralphson to approximate each t value for minimal distance.
    // For each curve section...
    const x = given.sections.map((_1, i) => {
        const Q_i = Q[i];
        const Qʹ_i = deriveCurve(Q_i);
        const Qʺ_i = deriveCurve(Qʹ_i);
        // Define for notational convenience
        const K_i = getCumulativeChordLengths(given, i);
        // ...map each data point in the section to its point on the curve.
        //!! revert to previous estimates if values are bad
        const new_t_i = new Array(given.m(i)).fill(0).map((_2, j) => {
            const new_t_ij = approximateNewtonRalphson(
                given,
                i,
                j,
                previousValues ? previousValues[i][j] : undefined,
                Q_i,
                Qʹ_i,
                Qʺ_i,
                K_i,
                debug,
            );
            if (
                new_t_ij !== (previousValues ? previousValues[i][j] : undefined)
            ) {
                debug.totalPoints += 1;
            }
            return new_t_ij;
        });
        // If the values end up causing trouble, revert to the last good values.
        // TODO: better answer //!! there are a lot.
        if (!isGoodValue(new_t_i)) {
            return previousValues![i];
        }
        return new_t_i;
    });
    // console.log(
    //     `T after avg. of ${debug.count / debug.totalPoints} iterations:
    //     T Error: ${debug.error}
    //     T Derivative error: ${debug.derivativeError}
    //     T Fallback count: ${debug.fallbackCount}`,
    // );
    return x;
}

function deriveCurve(bezier: Bezier): Bezier {
    if (bezier.order === 1) {
        throw new Error("Derivative of linear curve is a vector (unsupported)");
    }
    const newPoints = bezier.points.reduce(
        (acc, point, i) => {
            if (i === 0) {
                return acc;
            }
            // Fortunately, it's pretty simple to compute the derivative of a curve
            //  as a pure function of its set of points.
            // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-der.html
            const diff = Vector.between(bezier.point(i - 1), point);
            const newControlPoint = Vector.scale(diff, bezier.order);
            acc.push(newControlPoint);
            return acc;
        },
        [] as Point[],
    );
    return new Bezier(newPoints);
}

function getCumulativeChordLengths(given: GivenData, i: number): number[] {
    const section = given.sections[i];
    let accumulatedLength = 0;
    let prevPoint = section[0];
    const chordLengths: number[] = [];
    section.forEach(currentPoint => {
        accumulatedLength += Vector.length(prevPoint, currentPoint);
        chordLengths.push(accumulatedLength);
        prevPoint = currentPoint;
    });
    return chordLengths;
}

const acceptableErrorThreshold = 0.00001;
const maxIterationCount = 40;
function approximateNewtonRalphson(
    given: GivenData,
    i: number,
    j: number,
    previousValue: number | undefined,
    Q_i: Bezier,
    Qʹ_i: Bezier,
    Qʺ_i: Bezier,
    K_i: number[],
    debug: any, //!!
) {
    // Just do chord length first,
    //  then tweak once a reasonable estimate has been made.
    if (previousValue === undefined) {
        return K_i[j] / K_i[K_i.length - 1];
    }
    const C_ij = given.C(i, j);

    // Use chord length to choose initial estimate, or start from previous.
    let t_ij = previousValue;
    let actualError = Number.MAX_VALUE;
    let derivativeError = Number.MAX_VALUE;
    let iterationCount = 0;
    while (
        actualError >= acceptableErrorThreshold &&
        derivativeError >= acceptableErrorThreshold &&
        iterationCount < maxIterationCount
    ) {
        const Q_ij = Q_i.get(t_ij);
        const Qʹ_ij = Qʹ_i.get(t_ij);
        const Qʺ_ij = Qʺ_i.get(t_ij);
        // Define for notational convenience.
        const D_ij = Vector.between(C_ij, Q_ij);
        if (D_ij.x === 0 && D_ij.y === 0) {
            // Quit early if the points match. Save some looping,
            //  but also avoid division by 0 below.
            return t_ij;
        }
        //!!
        // if (i === 25 && j === 9) {
        //     console.log("problem area:");
        //     console.log("\tt_ij: " + t_ij);
        //     console.log("\tC_ij: ", C_ij);
        //     console.log("\tQ_ij: ", Q_ij);
        //     console.log("\tD_ij: ", D_ij);
        //     console.log("\tnumerator: " + Vector.dot(D_ij, Qʹ_ij));
        //     console.log(
        //         "\tdenominator: " +
        //             (Vector.dot(Qʹ_ij, Qʹ_ij) + Vector.dot(D_ij, Qʺ_ij)),
        //     );
        //     console.log(
        //         "\tadjustment: " +
        //             -(
        //                 Vector.dot(D_ij, Qʹ_ij) /
        //                 (Vector.dot(Qʹ_ij, Qʹ_ij) + Vector.dot(D_ij, Qʺ_ij))
        //             ),
        //     );
        // }
        // This transforms and simplifies N-R's method for solving:
        //  (M_ij²)′ = 0
        // prettier-ignore
        t_ij = t_ij - (
            Vector.dot(D_ij, Qʹ_ij)
            / (Vector.dot(Qʹ_ij, Qʹ_ij) + Vector.dot(D_ij, Qʺ_ij))
        );
        // If the value ever goes out of bounds, stick with the previous one.
        if (t_ij < 0 || t_ij > 1) {
            debug.fallbackCount++;
            return previousValue;
        }
        //!!
        const prevErr = actualError;
        const prevDerivErr = derivativeError;
        ({ actualError, derivativeError } = computeError(
            C_ij,
            Q_i,
            Qʹ_i,
            t_ij,
        ));
        if (prevErr < actualError && prevErr > actualError) {
            //!!!!
            throw new Error(
                `error for (${i},${j}) got worse: ${prevErr} to ${actualError}.
    After ${iterationCount + 1} iterations,
    Deriv error: ${prevDerivErr}
    Initial guess: ${previousValue}
    Current guess: ${t_ij}
    Data Points: ${JSON.stringify(given.sections[i])}
    Curve Points: ${JSON.stringify(Q_i.points)}
    Deriv. Points: ${JSON.stringify(Qʹ_i.points)}`,
            );
        }
        iterationCount++;
    }
    debug.error += actualError;
    debug.derivativeError += derivativeError;
    debug.count += iterationCount;
    return t_ij;
}

function computeError(C_ij: Point, Q_i: Bezier, Qʹ_i: Bezier, t_ij: number) {
    const newMagnitude = Vector.magnitude(Vector.between(C_ij, Q_i.get(t_ij)));
    const Q_ij = Q_i.get(t_ij);
    const Qʹ_ij = Qʹ_i.get(t_ij);
    const D_ij = Vector.between(C_ij, Q_ij);
    return {
        actualError: newMagnitude * newMagnitude,
        derivativeError: Math.abs(Vector.dot(D_ij, Qʹ_ij)),
    };
}

function isGoodValue(t_i: number[]): boolean {
    // basically, just check if the values are strictly increasing.
    let goodValue = true;
    let lowerBound = -1;
    t_i.forEach(t_ij => {
        if (t_ij <= lowerBound) {
            goodValue = false;
        }
        lowerBound = t_ij;
    });
    return goodValue;
}
