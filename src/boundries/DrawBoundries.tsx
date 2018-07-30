import * as React from "react";

import { BoundrySegment } from "./BoundrySegment";

export interface DrawBoundriesProps {
    boundries: BoundrySegment[];
    color?: string;
    thickness?: number;
}

export class DrawBoundries extends React.PureComponent<DrawBoundriesProps> {
    public render(): JSX.Element | null {
        const thickness = this.props.thickness || 1;
        const expand = Math.ceil(thickness / 2);
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                }}
            >
                {this.props.boundries.map((boundry, i) => {
                    return (
                        <div
                            key={i}
                            style={{
                                boxSizing: "border-box",
                                position: "absolute",
                                top: boundry.segment.start.y - expand,
                                left: boundry.segment.start.x - expand,
                                width:
                                    boundry.segment.end.x -
                                    boundry.segment.start.x +
                                    2 * expand,
                                height:
                                    boundry.segment.end.y -
                                    boundry.segment.start.y +
                                    2 * expand,
                                backgroundColor: `${this.props.color ||
                                    "black"}`,
                            }}
                        />
                    );
                })}
            </div>
        );
    }
}
