import * as React from "react";

import { Color } from "../Color";
import { Position } from "../Position";
import { flattenAdjacencies, TreeAdjacencyMap } from "./findAdjacencies";

export interface DrawAdjacenciesProps<T> {
    adjacencies: TreeAdjacencyMap<Color>;
    color?: string;
    thickness?: number;
    debugMode?: boolean;
}

export class DrawAdjacencies<T> extends React.PureComponent<
    DrawAdjacenciesProps<T>
> {
    public render(): JSX.Element | null {
        let borderString = `${this.props.thickness || 1}px solid ${this.props
            .color || "black"}`;
        const flatAdjacencies = flattenAdjacencies(this.props.adjacencies);
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
                {flatAdjacencies.map((adjacencyPair, i) => {
                    const sameColor =
                        adjacencyPair.from.regionProperties ===
                        adjacencyPair.to.regionProperties;
                    if (this.props.debugMode) {
                        borderString = `1px solid ${
                            sameColor ? "white" : "black"
                        }`;
                    } else if (sameColor) {
                        return null;
                    }
                    const borderKey =
                        adjacencyPair.on === Position.Top
                            ? "borderTop"
                            : adjacencyPair.on === Position.Bottom
                                ? "borderBottom"
                                : adjacencyPair.on === Position.Left
                                    ? "borderLeft"
                                    : adjacencyPair.on === Position.Right
                                        ? "borderRight"
                                        : "border";
                    return (
                        <div
                            key={i}
                            style={{
                                boxSizing: "border-box",
                                position: "absolute",
                                top: adjacencyPair.from.region.y,
                                left: adjacencyPair.from.region.x,
                                width: adjacencyPair.from.region.width,
                                height: adjacencyPair.from.region.height,
                                [borderKey]: borderString,
                            }}
                        />
                    );
                })}
            </div>
        );
    }
}
