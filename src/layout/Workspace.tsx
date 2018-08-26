import * as React from "react";

import { Color } from "../Color";
import { Project } from "../project/Project";

import { DrawBoundryPieces } from "../boundries/DrawBoundryPieces";
import { ColorRegion } from "../ColorRegion";
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
                        <LayerDivider />
                        <DrawBoundryPieces
                            boundryPieces={project.boundries.boundryPieces}
                            imageWidth={project.image.width}
                            imageHeight={project.image.height}
                            thickness={2}
                            compareToExact
                            mode={"curves"}
                            showPieces
                        />
                    </div>
                )}
            </div>
        );
    }

    public renderColor(color: Color): JSX.Element {
        return <ColorRegion color={color} />;
    }
}

export function LayerDivider() {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                backgroundColor: "RGBA(255, 255, 255, 0.5)",
            }}
        />
    );
}
