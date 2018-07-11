import { css, StyleSheet } from "aphrodite";
import * as React from "react";

export interface MenuPanelProps {
    children: React.ReactNode;
    title: string;
}

interface MenuPanelState {
    collapsed: boolean;
}

export class MenuPanel extends React.Component<MenuPanelProps, MenuPanelState> {
    constructor(props: MenuPanelProps) {
        super(props);
        this.state = { collapsed: false };
        this.handleCollapseToggle = this.handleCollapseToggle.bind(this);
    }

    public render() {
        return (
            <div className={css(style.menuPanel)}>
                <div className={css(style.header)}>
                    <button
                        type="button"
                        className={css(style.toggle)}
                        onClick={this.handleCollapseToggle}
                    >
                        <span
                            className={css(
                                style.toggleText,
                                this.state.collapsed &&
                                    style.toggleTextCollapsed,
                            )}
                        >
                            {this.state.collapsed ? "+" : "-"}
                        </span>
                    </button>
                    <h3 className={css(style.title)}>{this.props.title}</h3>
                </div>
                <div
                    className={css(
                        style.content,
                        this.state.collapsed && style.contentCollapsed,
                    )}
                >
                    {this.props.children}
                </div>
            </div>
        );
    }

    public handleCollapseToggle() {
        this.setState(prevState => ({ collapsed: !prevState.collapsed }));
    }
}

const style = StyleSheet.create({
    menuPanel: {
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    header: {
        display: "flex",
        padding: "8px",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    toggle: {
        position: "relative",
        width: "28px",
        height: "28px",
        marginRight: "8px",
        cursor: "pointer",
    },
    toggleText: {
        position: "absolute",
        top: "-19px",
        left: 0,
        width: "100%",
        fontSize: "48px",
    },
    toggleTextCollapsed: {
        top: "-5px",
        fontSize: "30px",
    },
    title: {
        flexGrow: 1,
        margin: 0,
        fontSize: "16px",
    },
    content: {
        padding: "8px",
    },
    contentCollapsed: {
        display: "none",
    },
});
