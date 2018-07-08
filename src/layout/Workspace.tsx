import * as React from "react";

import { Color } from "../Color";
import { QuadTree } from "../quadTree/QuadTree";

import { ColorRegion } from "../ColorRegion";
import { TreeAdjacencyMap } from "../quadTree/Adjacencies";
import { DrawAdjacencies } from "../quadTree/DrawAdjacencies";
import { QuadTreePreview } from "../quadTree/QuadTreePreview";

export interface WorkspaceProps {
    tree: QuadTree<Color> | undefined;
    adjacencies: TreeAdjacencyMap<Color> | undefined;
}

export class Workspace extends React.Component<WorkspaceProps> {
    constructor(props: WorkspaceProps) {
        super(props);
    }
    public render() {
        return (
            <div className="Canvas">
                {this.props.tree && (
                    <div
                        style={{
                            position: "relative",
                            display: "inline-block",
                        }}
                    >
                        <QuadTreePreview
                            tree={this.props.tree}
                            contentRenderer={this.renderColor}
                        />
                        {this.props.adjacencies && (
                            <DrawAdjacencies
                                adjacencies={this.props.adjacencies}
                                color={"black"}
                                thickness={2}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }

    public renderColor(color: Color): JSX.Element {
        return <ColorRegion color={color} />;
    }
}
