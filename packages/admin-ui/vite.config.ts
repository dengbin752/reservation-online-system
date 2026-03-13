import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [solid(), tailwindcss()],
	server: {
		port: 3000,
		host: "0.0.0.0",
		allowedHosts: [
			'admin_ui_backend',
			'localhost',
			'127.0.0.1'
		],
		proxy: {
			"/api": {
				target: "http://api:3000",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
	resolve: {
		alias: {
			"@shared": path.resolve(__dirname, "../../packages/shared"),
			"@api": path.resolve(__dirname, "../../packages/api/src"),
		},
	},
});
