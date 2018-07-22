import { css, StyleSheet } from "aphrodite";
import * as React from "react";

import * as Storage from "./data/Storage";
import { Project } from "./project/Project";

import "./App.css";
import { MainMenu } from "./layout/menu/MainMenu";
import { Workspace } from "./layout/Workspace";
import sampleImage from "./sample-large.bmp";

interface AppState {
    project: Project | undefined;
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            project: undefined,
        };
        this.handleFileLoad = this.handleFileLoad.bind(this);
        this.handleBrowserSave = this.handleBrowserSave.bind(this);
        this.handleFileSave = this.handleFileSave.bind(this);
        this.shortcut = this.shortcut.bind(this);
    }
    public render() {
        return (
            <div className={css(style.page)}>
                <div className={css(style.actionPanel)}>
                    <MainMenu
                        isProjectLoaded={!!this.state.project}
                        onFileUpload={this.handleFileLoad}
                        onBrowserSave={this.handleBrowserSave}
                        onFileSave={this.handleFileSave}
                        // DEBUG
                        onDebug={this.shortcut}
                    />
                </div>
                <div className={css(style.contentPanel)}>
                    {this.state.project && (
                        <Workspace project={this.state.project} />
                    )}
                </div>
                <div className={css(style.contextPanel)} />
            </div>
        );
    }

    private async handleFileLoad(file: File) {
        // TODO: loading indicator
        const project = await Storage.processFile(file);
        this.setState({ project });
    }

    private handleBrowserSave() {
        //!!
        console.log("saved");
    }
    private handleFileSave() {
        //!!
        console.log("saved");
    }

    private async shortcut() {
        const project = await Storage.generateProjectFromUrl(sampleImage);
        this.setState({ project });
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
        flexShrink: 0,
        width: 300,
        borderRight: "1px solid #A0A0A0",
        backgroundColor: "#EEEEEE",
    },
    contentPanel: {
        flexGrow: 1,
        overflow: "scroll",
    },
    contextPanel: {
        flexShrink: 0,
        width: 200,
        borderLeft: "1px solid #A0A0A0",
        backgroundColor: "#EEEEEE",
    },
});

export default App;
