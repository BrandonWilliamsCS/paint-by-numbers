import { Position } from "./Position";
import { Subdivided } from "./Subdivided";

export interface Region {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function subdivideRegion(region: Region): Subdivided<Region> {
    const leftWidth = Math.ceil(region.width / 2);
    const topHeight = Math.ceil(region.height / 2);
    const rightWidth = region.width - leftWidth;
    const bottomHeight = region.height - topHeight;

    return {
        [Position.TopLeft]: {
            x: region.x,
            y: region.y,
            width: leftWidth,
            height: topHeight,
        },
        [Position.TopRight]: {
            x: region.x + leftWidth,
            y: region.y,
            width: rightWidth,
            height: topHeight,
        },
        [Position.BottomLeft]: {
            x: region.x,
            y: region.y + topHeight,
            width: leftWidth,
            height: bottomHeight,
        },
        [Position.BottomRight]: {
            x: region.x + leftWidth,
            y: region.y + topHeight,
            width: rightWidth,
            height: bottomHeight,
        },
    };
}
