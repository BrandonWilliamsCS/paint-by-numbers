import * as React from "react";

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
    public render() {
        //!! padding around children.
        const region = this.props.region;
        const degenerateRight = region.topRight.variant === "degenerate";
        const degenerateBottom = region.bottomLeft.variant === "degenerate";
        const isDegenerate = degenerateRight || degenerateBottom;
        return (
            <div
                style={{
                    display: "inline-grid",
                    // if there's no right side, just render the one column.
                    gridTemplateColumns: `auto${
                        !degenerateRight ? " auto" : ""
                    }`,
                    backgroundColor: "grey",
                }}
            >
                <QuadTreePreview
                    tree={region.topLeft}
                    contentRenderer={this.props.contentRenderer}
                    scale={this.props.scale}
                />
                {!degenerateRight && (
                    <QuadTreePreview
                        tree={region.topRight}
                        contentRenderer={this.props.contentRenderer}
                        scale={this.props.scale}
                    />
                )}
                {!degenerateBottom && (
                    <QuadTreePreview
                        tree={region.bottomLeft}
                        contentRenderer={this.props.contentRenderer}
                        scale={this.props.scale}
                    />
                )}
                {!isDegenerate && (
                    <QuadTreePreview
                        tree={region.bottomRight}
                        contentRenderer={this.props.contentRenderer}
                        scale={this.props.scale}
                    />
                )}
            </div>
        );
    }
}
