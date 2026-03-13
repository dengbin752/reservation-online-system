import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [solid(), tailwindcss()],
	server: {
		port: 3000,
		host: "0.0.0.0",
		// 允许指定的主机访问
		allowedHosts: [
			'customer_ui_backend', // 放行报错提示的这个主机名
			'localhost', // 保留本地访问（可选，根据你的需求）
			'127.0.0.1'  // 保留IP访问（可选）
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
