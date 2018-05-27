import * as React from "react";

import { BMPBitmap } from "bitmap-manipulation";

import "./App.css";
import sampleImage from "./sample.bmp";

interface AppState {
    image: BMPBitmap | undefined;
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
            </div>
        );
    }

    private loadImage() {
        this.setState({ image: BMPBitmap.fromFile(sampleImage) });
    }
}

export default App;
