import * as React from "react";

import { Bitmap } from "./Bitmap";
// import { Color } from "./Color";

import "./App.css";
import sampleImage from "./sample.bmp";

interface AppState {
    image: Bitmap | undefined;
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            image: undefined,
        };
        this.loadImage = this.loadImage.bind(this);
    }
    public render() {
        return (
            <div className="App">
                <button type="button" onClick={this.loadImage}>
                    Load
                </button>
                {this.state.image &&
                    [
                        [0, 0],
                        [400, 400],
                        [600, 600],
                        [700, 300],
                        [100, 100],
                    ].map(pair => (
                        <div
                            style={{
                                width: "200px",
                                height: "20px",
                                backgroundColor: `#${this.state
                                    .image!.colorAt(pair[0], pair[1])
                                    .toHexString()}`,
                            }}
                        >
                            <span style={{ backgroundColor: "white" }}>{`(${
                                pair[0]
                            }, ${pair[1]}): #${this.state
                                .image!.colorAt(pair[0], pair[1])
                                .toHexString()}`}</span>
                        </div>
                    ))}
            </div>
        );
    }

    private async loadImage() {
        const image = await Bitmap.create(sampleImage);
        this.setState({ image });
        //!! debug
        console.log(`#${image.colorAt(0, 0).toHexString()}`);
        console.log(`#${image.colorAt(400, 400).toHexString()}`);
        console.log(`#${image.colorAt(600, 600).toHexString()}`);
        console.log(`#${image.colorAt(700, 300).toHexString()}`);
        console.log(`#${image.colorAt(100, 100).toHexString()}`);
    }
}

export default App;
