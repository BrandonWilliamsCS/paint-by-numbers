import { css, StyleSheet } from "aphrodite";
import * as React from "react";

import { MenuPanel } from "./MenuPanel";

export interface MainMenuProps {
    isProjectLoaded: boolean;
    onFileUpload: (file: File) => void;
    onBrowserSave: () => void;
    onFileSave: () => void;
    //!! DEBUG
    onDebug: () => void;
}

interface MainMenuState {
    selectedFile: File | undefined;
}

export class MainMenu extends React.Component<MainMenuProps, MainMenuState> {
    constructor(props: MainMenuProps) {
        super(props);
        this.state = { selectedFile: undefined };
        this.handleFileLoad = this.handleFileLoad.bind(this);
        this.handleFileConfirm = this.handleFileConfirm.bind(this);
    }

    public render() {
        // TODO: better save/load
        return (
            <div className={css(style.mainMenu)}>
                {this.props.isProjectLoaded && (
                    <MenuPanel title="Save">
                        <button onClick={this.props.onBrowserSave}>
                            Save in Browser
                        </button>
                        <button onClick={this.props.onFileSave}>
                            Save to File
                        </button>
                    </MenuPanel>
                )}
                {!this.props.isProjectLoaded && (
                    <MenuPanel title="Upload Image or Project File">
                        <input
                            type="file"
                            onChange={this.handleFileLoad}
                            accept=".bmp,.pbn"
                        />
                        <button
                            onClick={this.handleFileConfirm}
                            disabled={!this.state.selectedFile}
                        >
                            Start
                        </button>
                        <button onClick={this.props.onDebug}>DEBUG</button>
                    </MenuPanel>
                )}
            </div>
        );
    }

    public handleFileLoad(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile =
            event.target.files && event.target.files.length
                ? event.target.files[0]
                : undefined;
        this.setState({ selectedFile });
    }

    public handleFileConfirm() {
        if (!this.state.selectedFile) {
            throw new Error("Cannot proceed without file");
        }
        this.props.onFileUpload(this.state.selectedFile);
    }
}

const style = StyleSheet.create({
    mainMenu: {
        width: "100%",
        height: "100%",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
    },
    menuPanel: {
        padding: "8px",
        backgroundColor: "rgba(0,0,0,0.1)",
    },
});
