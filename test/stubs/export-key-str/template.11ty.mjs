export const bundle = "/* Hello */";

export function render(data) {
	return `<style>${this.getBundle("css")}</style><script>${this.getBundle("js")}</script>`;
}