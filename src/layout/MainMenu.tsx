import { css, StyleSheet } from "aphrodite";
import * as React from "react";

export interface MainMenuProps {
    isProjectLoaded: boolean;
    onFileUpload: (file: File) => void;
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
        return (
            <div className={css(style.mainMenu)}>
                <MenuPanel>
                    {this.props.isProjectLoaded ? (
                        <button>Save</button>
                    ) : (
                        <>
                            <h3>Upload Image or Project File</h3>
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
                        </>
                    )}
                </MenuPanel>
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
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
    },
    menuPanel: {
        padding: "8px",
        margin: "8px",
        backgroundColor: "#DDDDDD",
    },
});

function MenuPanel({ children }: { children: React.ReactNode }): JSX.Element {
    return <div className={css(style.menuPanel)}>{children}</div>;
}
