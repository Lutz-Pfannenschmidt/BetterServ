const path = require("node:path");

module.exports = {
	entry: {
		betterfiles: "./src/betterfiles.ts",
		bettersidebar: "./src/bettersidebar.ts",
		hidelogin: "./src/hidelogin.ts",
		iservlist: "./src/iservlist.ts",
		tictactoe: "./src/tictactoe.ts",
	},
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
