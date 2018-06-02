import * as React from "react";

import { Color } from "./Color";

export interface ColorRegionProps {
    color: Color;
}

export class ColorRegion extends React.Component<ColorRegionProps> {
    public render() {
        return (
            <div
                style={{
                    flexGrow: 1,
                    alignSelf: "stretch",
                    backgroundColor: `#${this.props.color.toHexString()}`,
                }}
            />
        );
    }
}
