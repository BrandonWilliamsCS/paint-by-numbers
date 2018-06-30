# Phases

1. image selection/data loading
    1. on first open, upload an image
    1. if local storage present, load last-open
1. generation of quadtree, adjacencies
    1. happens automatically after upload
1. generation of outline corner points
    1. automatic, followed by user tweaking
1. grouping of boundries into segments
    1. results in a list of (optionally named) segments, represented by
    sets of adjacency edges
1. generation of bezier outlines
    1. will erase any existing outline approximations
1. user placement of secondary dividers
    1. single cubic curves, snap to primary outlines
1. computation of sections
1. pallette and number assignment
1. svg generation (may happen earlier, if conditions are met)

# Elements constraints

Corner Points are anywhere a sharp corner occurs, including where multiple color
boundries meet or where one meets the edge of the image. Each boundry curve must
start and end on a corner point, and each corner point must have more than one
curve attached.

Intersections between boundry curves (including self-intersections) are not
allowed (aside from endpoints), to simplify 

# UI Options

1. save content under a specific name
    1. include option of also creating file
1. reset/create new
1. undo/redo when changing curves
1. zoom
1. layers
    1. show/hide
    1. set transparency and/or add a "focus" marker that dims others
    1. select to edit (if appropriate)
    1. including:
        1. original image
        1. computed adjacencies
            1. configurable thickness
            1. by default, color boundries in black others transparent
            1. can set colors?
        1. marked corner points and segments
            1. corners are black-bordered red circles
            1. adjacencies are dulled unless selected
            1. option to highlight unused sections in red
        1. border curves
            1. adjust inner control points for generated curves
            1. indicate curves with invalid endpoints in red
1. fine-grained bezier curve editing (coordinates for each ctrl point)
1. generate svg (when appropriate)

# Links

1. [computation library](https://pomax.github.io/bezierjs/)
1. [very good math overview](https://pomax.github.io/bezierinfo/)
1. [Academic approximation paper](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.96.5193&rep=rep1&type=pdf)
1. [SO answer with leads to approachable approximation](https://stackoverflow.com/questions/14319288/bezier-curve-approximation-for-large-amount-of-points)
