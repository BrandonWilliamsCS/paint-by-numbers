# Phases

1. image selection/data loading
    1. on first open, upload an image
    1. if local storage present, load last-open
    1. project file can also be uploaded (same format as local storage)
1. generation of quadtree, adjacencies
    1. happens automatically after upload
1. generation of boundry intersection points
    1. automatic, followed by user tweaking
1. grouping of boundries into pieces
    1. results in a list of (optionally named) pieces, represented by
    sets of adjacency edge chains
1. selection of sharp corners within pieces
    1. automatic, followed by user tweaking
1. generation of bezier outlines
1. user placement of secondary dividers
    1. single cubic curves, snap to primary outlines
1. computation of sections
1. pallette and number assignment
1. svg export
    1. this is realistically just saving the svg produced in rendering.

## Dependency order

1. boundry segments (image)
1. intersections (boundry segments, user input)
1. boundry pieces
    1. chains (boundry segments, intersections)
    1. simplified chains (boundry piece chains, user-specified tolerance?)
    1. curve approximation (simplified chains, user-tweaked control points)
1. Additional curves (purely user-based but with some kind of snap to existing curve feature)

# Elements/terminology

Intesection Points are where multiple color boundries meet or where one meets
the edge of the image. Each boundry curve must start and end on a Intersection
Point, and each Intersection Point must have more than one curve attached (which
may include edges).

Boundry Pieces are the chain of color boundry segments between Intersection
Points, plus the various computed data around them (such as the simplified
boundry curve points and corner points).

# Curve fitting notes (unofficial errata)

The paper has an outrageous amount of typos. Some in particular:
1. ignore any j=0 in sums - should just be j = 1.
1. in equation 10, the definition of A is wrong; P_i0 and P_i1 should be
    replaced by P_i and P_i+1, respectively
1. in equation 17 (computing a_i1), swap D_i1 and X_i
1. in equation 20, t_n+1 is actually t_n-1
1. in equation 24:
    1. ignore leading "-"
    1. add "-" between sums in t_i term
    1. the RHS "-" applies to the whole rest of the expression (wrapp in parens)

## Rough algorithm:

```
Compute initial unit tangent vectors
compute initial t values based on distance along curve)
Loop until acceptable:
    compute t values as closest-to-curve points
    Build (memoized) A and B functions based on t values
    compute tangent vector lengths (eqs 16 and 17)

    compute t values as closest-to-curve points
    Build (memoized) A and B functions based on t values
    compute tangent vector angles (eq 28)
```

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
        1. marked intersection points and segments
            1. intersections are black-bordered red circles
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
1. [React svg example](https://www.joshwcomeau.com/posts/dynamic-bezier-curves)
1. [Paper discussing curve fitting](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.96.5193&rep=rep1&type=pdf)

# Make sure to do...
need to find cusp points
    - look at angle of simplified curve
    - smaller segments are less sensitive to a sharp angle
    - at longest, < 135 degrees is a corner. At 1/2, only <90 is.
