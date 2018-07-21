import * as React from "react";

import { Color } from "../Color";
import { Project } from "../project/Project";

import { ColorRegion } from "../ColorRegion";
import { DrawAdjacencies } from "../quadTree/DrawAdjacencies";
import { QuadTreePreview } from "../quadTree/QuadTreePreview";

export interface WorkspaceProps {
    project: Project;
}

export class Workspace extends React.Component<WorkspaceProps> {
    constructor(props: WorkspaceProps) {
        super(props);
    }
    public render() {
        const project = this.props.project;
        return (
            <div className="Canvas">
                {project.image.tree && (
                    <div
                        style={{
                            position: "relative",
                            display: "inline-block",
                        }}
                    >
                        <QuadTreePreview
                            tree={project.image.tree}
                            contentRenderer={this.renderColor}
                        />
                        {project.image.adjacencies && (
                            <DrawAdjacencies
                                adjacencies={project.image.adjacencies}
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
