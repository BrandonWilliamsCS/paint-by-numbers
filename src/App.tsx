import * as React from "react";

import { Bitmap } from "./Bitmap";
import { Color } from "./Color";
import { buildTree } from "./quadTree/build";
import {
    findBaseAdjacencies,
    sanityCheckAdjacencies,
    TreeAdjacencyMap,
} from "./quadTree/findAdjacencies";
import { QuadTree } from "./quadTree/QuadTree";
import { Region } from "./Region";

import "./App.css";
import { ColorRegion } from "./ColorRegion";
import { DrawAdjacencies } from "./quadTree/DrawAdjacencies";
import { QuadTreePreview } from "./quadTree/QuadTreePreview";
import sampleImage from "./sample-large.bmp";

interface AppState {
    image: Bitmap | undefined;
    tree: QuadTree<Color> | undefined;
    adjacencies: TreeAdjacencyMap<Color> | undefined;
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            image: undefined,
            tree: undefined,
            adjacencies: undefined,
        };
        this.shortcut = this.shortcut.bind(this);
        this.loadImage = this.loadImage.bind(this);
        this.createTree = this.createTree.bind(this);
        this.findAdjacencies = this.findAdjacencies.bind(this);
    }
    public render() {
        return (
            <div className="App">
                <button type="button" onClick={this.shortcut}>
                    All
                </button>
                <br />
                <button type="button" onClick={this.loadImage}>
                    Load
                </button>
                {this.state.image && (
                    <button type="button" onClick={this.createTree}>
                        Tree
                    </button>
                )}
                {this.state.tree && (
                    <button type="button" onClick={this.findAdjacencies}>
                        Adjacencies
                    </button>
                )}
                {this.state.tree && (
                    <div
                        style={{
                            position: "relative",
                            display: "inline-block",
                        }}
                    >
                        <QuadTreePreview
                            tree={this.state.tree}
                            contentRenderer={this.renderColor}
                        />
                        {this.state.adjacencies && (
                            <DrawAdjacencies
                                adjacencies={this.state.adjacencies}
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

    private async loadImage() {
        const image = await Bitmap.create(sampleImage);
        this.setState({ image });
    }

    private createTree() {
        const image = this.state.image!;
        const colorAccessor = (x: number, y: number) => image.colorAt(x, y);
        const region: Region = {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        };
        const tree = buildTree(colorAccessor, region);
        this.setState({ tree });
    }

    private findAdjacencies() {
        const adjacencies = findBaseAdjacencies(this.state.tree!);
        const image = this.state.image!;
        sanityCheckAdjacencies(
            this.state.tree!,
            adjacencies,
            image.width,
            image.height,
        );
        this.setState({ adjacencies });
    }

    private async shortcut() {
        await this.loadImage();
        await Promise.resolve(this.createTree());
        await Promise.resolve(this.findAdjacencies());
    }
}

export default App;
