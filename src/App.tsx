import * as React from "react";

import { Bitmap } from "./Bitmap";
import { Color } from "./Color";
import { buildTree } from "./quadTree/build";
import { QuadTree } from "./quadTree/QuadTree";
import { Region } from "./Region";

import "./App.css";
import { ColorRegion } from "./ColorRegion";
import { QuadTreePreview } from "./quadTree/QuadTreePreview";
import sampleImage from "./sample.bmp";

interface AppState {
    image: Bitmap | undefined;
    tree: QuadTree<Color> | undefined;
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            image: undefined,
            tree: undefined,
        };
        this.loadImage = this.loadImage.bind(this);
        this.createTree = this.createTree.bind(this);
    }
    public render() {
        return (
            <div className="App">
                <button type="button" onClick={this.loadImage}>
                    Load
                </button>
                {this.state.image && (
                    <button type="button" onClick={this.createTree}>
                        Tree
                    </button>
                )}
                {this.state.tree && (
                    <QuadTreePreview
                        tree={this.state.tree}
                        contentRenderer={this.renderColor}
                    />
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

    private async createTree() {
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
}

export default App;
