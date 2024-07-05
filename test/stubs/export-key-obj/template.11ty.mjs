export const bundle = {
	css: "/* CSS */",
	js: "/* JS */"
};

export function render(data) {
	return `<style>${this.getBundle("css")}</style><script>${this.getBundle("js")}</script>`;
}