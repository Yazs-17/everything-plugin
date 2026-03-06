import { definePlugin } from "../../../src";
export default definePlugin("click", () => ({

    initialize: (env) => {
        const button = document.createElement("button");
        button.innerText = "Change Color";

        button.onclick = () => {
            env.state.root.style.backgroundColor =
                `rgb(${Math.random() * 255},
                     ${Math.random() * 255},
                     ${Math.random() * 255})`;
        };

        env.state.root.appendChild(button);
        env.state.click = { button };
    },

    destroy: (env) => {
        const { button } = env.state.click ?? {};
        if (button) {
            button.onclick = null;
            button.remove();
        }
        env.state.root.style.backgroundColor = '';
        console.log('[click plugin] destroyed');
    },
}));