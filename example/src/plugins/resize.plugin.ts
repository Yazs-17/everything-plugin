import { definePlugin } from "../../../src";
export default definePlugin("resize", () => ({

    initialize: (env) => {
        const info = document.createElement("div");
        info.style.color = "#fff";
        info.innerText = "loading...";
        env.state.root.appendChild(info);

        env.state.resize = { info };
    },

    renderBefore: (env) => {
        const width = env.state.root.clientWidth;

        if (env.state.resize.preWidth !== width) {
            env.state.resize.preWidth = width;
            env.state.resize.info.innerText =
                `当前宽度：${width}`;
        }
    },
}));