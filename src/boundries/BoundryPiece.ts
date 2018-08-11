import Bezier from "bezier-js";
import Deque from "denque";
import { Point } from "../Geometry";

export interface BoundryPiece {
    isLoop: boolean;
    chain: Deque<Point>;
    simplifiedChain: Deque<Point>;
    piecewiseBezier: Bezier[];
}
