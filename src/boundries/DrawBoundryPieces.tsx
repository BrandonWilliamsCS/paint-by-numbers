import Bezier from "bezier-js";
import Deque from "denque";
import * as React from "react";

import { Color } from "../Color";
import { Point } from "../Geometry";
import { BoundryPiece } from "./BoundryPiece";

export interface DrawBoundryPiecesProps {
    boundryPieces: BoundryPiece[];
    imageWidth: number;
    imageHeight: number;
    thickness?: number;
    showPieces?: boolean;
    compareToExact?: boolean;
    mode?: "curves" | "lines";
}

export class DrawBoundryPieces extends React.PureComponent<
    DrawBoundryPiecesProps
> {
    public renderBoundryChain(
        chain: Deque<Point>,
        thickness: number,
        color: string,
    ) {
        return (
            <g>
                {chain.toArray().map((point, i) => {
                    if (i === chain.length - 1) {
                        return null;
                    }
                    const nextPoint = chain.peekAt(i + 1)!;
                    return (
                        <line
                            x1={point.x}
                            y1={point.y}
                            x2={nextPoint.x}
                            y2={nextPoint.y}
                            stroke={color}
                            strokeWidth={thickness}
                            key={Point.toString(point)}
                        />
                    );
                })}
            </g>
        );
    }

    public renderBoundryCurve(
        piecewiseCurve: Bezier[],
        thickness: number,
        color: string,
    ) {
        return (
            <g>
                {piecewiseCurve.map(bezier => (
                    <path
                        d={this.computePathInstructions(bezier)}
                        fill="none"
                        stroke={color}
                        strokeWidth={thickness}
                        key={Point.toString(bezier.point(0))}
                    />
                ))}
            </g>
        );
    }

    public render(): JSX.Element | null {
        const thickness = this.props.thickness || 2;
        return (
            <svg
                viewBox={`0 0 ${this.props.imageWidth} ${
                    this.props.imageHeight
                }`}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                }}
                xmlns="http://www.w3.org/2000/svg"
            >
                {this.props.boundryPieces.map((boundryPiece, i) => {
                    // We can trust that this is unique because "middle" points should
                    //  appear in at most one chain.
                    const chainKey = `${Point.toString(
                        boundryPiece.chain.peekAt(0)!,
                    )}-${Point.toString(boundryPiece.chain.peekAt(1)!)}-...`;
                    let color = "#000000";
                    if (this.props.showPieces) {
                        color = "#" + Color.getSequenceColor(i).toHexString();
                    }
                    return (
                        <React.Fragment key={chainKey}>
                            {this.props.compareToExact &&
                                this.renderBoundryChain(
                                    boundryPiece.chain,
                                    thickness + 1,
                                    "#FF0000",
                                )}
                            {this.props.mode === "lines"
                                ? this.renderBoundryChain(
                                      boundryPiece.simplifiedChain,
                                      thickness,
                                      color,
                                  )
                                : this.renderBoundryCurve(
                                      boundryPiece.piecewiseBezier,
                                      thickness,
                                      color,
                                  )}
                        </React.Fragment>
                    );
                })}
            </svg>
        );
    }

    // TODO: dedicated bezier rendering
    public computePathInstructions(bezier: Bezier): string {
        return `
            M ${this.stringifyForPath(bezier.point(0))}
            C ${this.stringifyForPath(bezier.point(1))} ${this.stringifyForPath(
            bezier.point(2),
        )} ${this.stringifyForPath(bezier.point(3))}
        `;
    }

    public stringifyForPath(point: Point): string {
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }
}
