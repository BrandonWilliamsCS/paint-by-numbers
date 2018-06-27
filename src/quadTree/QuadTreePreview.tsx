import * as React from "react";

import { Position } from "../Position";
import { HeterogeneousRegion, HomogeneousRegion, QuadTree } from "./QuadTree";

export interface QuadTreePreviewProps<T> {
    tree: QuadTree<T>;
    contentRenderer: (properties: T) => JSX.Element;
    scale?: number;
    gap?: number;
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
                        gap={this.props.gap}
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
    gap?: number;
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
                    gap={this.props.gap}
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
                    gridGap: `${this.props.gap || 0}px`,
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

export interface HomogeneousRegionPreviewProps<T> {
    region: HomogeneousRegion<T>;
    contentRenderer: (properties: T) => JSX.Element;
    scale?: number;
}

export class HomogeneousRegionPreview<T> extends React.Component<
    HomogeneousRegionPreviewProps<T>
> {
    public render() {
        const scale = this.props.scale || 1;
        const region = this.props.region;
        return (
            <div
                style={{
                    width: region.region.width * scale,
                    height: region.region.height * scale,
                    display: "flex",
                }}
            >
                {this.props.contentRenderer(region.regionProperties)}
            </div>
        );
    }
}
