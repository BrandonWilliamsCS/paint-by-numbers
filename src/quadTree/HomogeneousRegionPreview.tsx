import * as React from "react";

import { HomogeneousRegion } from "./RegionQuadTree";

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
