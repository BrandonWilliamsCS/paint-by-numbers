import { Color } from "../Color";
import { Segment } from "../Geometry";

export interface BoundrySegment {
    segment: Segment;
    beforeColor: Color;
    afterColor: Color;
}
