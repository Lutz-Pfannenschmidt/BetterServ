const path = require("node:path");

module.exports = {
	entry: {
		betterfiles_webdav: "./src/betterfiles_webdav.ts",
		bettersidebar: "./src/bettersidebar.ts",
		hidelogin: "./src/hidelogin.ts",
		iservlist: "./src/iservlist.ts",
		tictactoe: "./src/betterserv_tictactoe.ts",
		dashboard: "./src/dashboard.ts",
		settings: "./src/settings.ts",
	},
	devtool: false,
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
};
