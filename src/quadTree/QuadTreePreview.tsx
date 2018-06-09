import * as React from "react";

import { Position } from "../Position";
import { HeterogeneousRegion, QuadTree } from "./RegionQuadTree";

import { HomogeneousRegionPreview } from "./HomogeneousRegionPreview";

export interface QuadTreePreviewProps<T> {
    tree: QuadTree<T>;
    contentRenderer: (properties: T) => JSX.Element;
    scale?: number;
}

export class QuadTreePreview<T> extends React.PureComponent<
    QuadTreePreviewProps<T>
> {
    public render(): JSX.Element | null {
        switch (this.props.tree.variant) {
            case "heterogeneous":
                return (
                    <HeterogeneousRegionPreview
                        region={this.props.tree}
                        contentRenderer={this.props.contentRenderer}
                        scale={this.props.scale}
                    />
                );
            case "homogeneous":
                return (
                    <HomogeneousRegionPreview
                        region={this.props.tree}
                        contentRenderer={this.props.contentRenderer}
                        scale={this.props.scale}
                    />
                );
            case "degenerate":
                return null;
        }
    }
}

export interface HeterogeneousRegionPreviewProps<T> {
    region: HeterogeneousRegion<T>;
    contentRenderer: (properties: T) => JSX.Element;
    scale?: number;
}

export class HeterogeneousRegionPreview<T> extends React.Component<
    HeterogeneousRegionPreviewProps<T>
> {
    public renderSubTree(subtree: QuadTree<T>) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <QuadTreePreview
                    tree={subtree}
                    contentRenderer={this.props.contentRenderer}
                    scale={this.props.scale}
                />
            </div>
        );
    }

    public render() {
        const region = this.props.region;
        const hasDegenerateRight =
            region[Position.TopRight].variant === "degenerate";
        const hasDegenerateBottom =
            region[Position.BottomLeft].variant === "degenerate";
        const isDegenerate = hasDegenerateRight || hasDegenerateBottom;
        return (
            <div
                style={{
                    flexGrow: 1,
                    alignSelf: "stretch",
                    display: "inline-grid",
                    // if there's no right side, just render the one column.
                    gridTemplateColumns: `auto${
                        !hasDegenerateRight ? " auto" : ""
                    }`,
                    gridGap: "1px",
                    backgroundColor: "grey",
                }}
            >
                {this.renderSubTree(region[Position.TopLeft])}
                {!hasDegenerateRight &&
                    this.renderSubTree(region[Position.TopRight])}
                {!hasDegenerateBottom &&
                    this.renderSubTree(region[Position.BottomLeft])}
                {!isDegenerate &&
                    this.renderSubTree(region[Position.BottomRight])}
            </div>
        );
    }
}
