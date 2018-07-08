import { css, StyleSheet } from "aphrodite";
import * as React from "react";

import { Bitmap } from "./Bitmap";
import { Color } from "./Color";
import {
    findBaseAdjacencies,
    sanityCheckAdjacencies,
    TreeAdjacencyMap,
} from "./quadTree/Adjacencies";
import { buildTree } from "./quadTree/build";
import { QuadTree } from "./quadTree/QuadTree";
import { Region } from "./Region";

import "./App.css";
import { MainMenu } from "./layout/MainMenu";
import { Workspace } from "./layout/Workspace";
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
        this.handleFileLoad = this.handleFileLoad.bind(this);
        this.shortcut = this.shortcut.bind(this);
        this.loadImage = this.loadImage.bind(this);
        this.createTree = this.createTree.bind(this);
        this.findAdjacencies = this.findAdjacencies.bind(this);
    }
    public render() {
        return (
            <div className={css(style.page)}>
                <div className={css(style.actionPanel)}>
                    <MainMenu
                        isProjectLoaded={!!this.state.tree}
                        onFileUpload={this.handleFileLoad}
                        //!! DEBUG
                        onDebug={this.shortcut}
                    />
                </div>
                <div className={css(style.contentPanel)}>
                    <Workspace
                        tree={this.state.tree}
                        adjacencies={this.state.adjacencies}
                    />
                </div>
                <div className={css(style.contextPanel)} />
            </div>
        );
    }

    private async handleFileLoad(file: File) {
        //!! extract file/storage logic
        if (file.type === "image/bmp") {
            await this.loadImage(file);
            this.createTree();
            this.findAdjacencies();
        } else {
            //!! pbn file
            throw new Error(`Unsupported file type "${file.type}"`);
        }
    }

    private async loadImage(file?: File) {
        const image = await (file
            ? Bitmap.fromFile(file)
            : Bitmap.fromUrl(sampleImage));
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

const style = StyleSheet.create({
    page: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
    },
    actionPanel: {
        width: 300,
        borderRight: "1px solid #A0A0A0",
        backgroundColor: "#EEEEEE",
    },
    contentPanel: {
        flexGrow: 1,
    },
    contextPanel: {
        width: 200,
        borderLeft: "1px solid #A0A0A0",
        backgroundColor: "#EEEEEE",
    },
});

export default App;
