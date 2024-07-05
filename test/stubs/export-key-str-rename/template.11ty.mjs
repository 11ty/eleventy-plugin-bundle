export const js = "/* JS */";
export const css = "/* CSS */";

export function render(data) {
	return `<style>${this.getBundle("css")}</style><script>${this.getBundle("js")}</script>`;
}