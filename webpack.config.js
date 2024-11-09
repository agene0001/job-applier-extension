const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require('webpack'); // Add this line
const Dotenv = require('dotenv-webpack');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");



module.exports = {
    mode: 'development', // Set mode to 'development' or 'production'
    entry: {
        index: "./src/index.tsx",
        background: './js/background.ts',
        content: './js/content.ts'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "crypto": require.resolve("crypto-browserify"),
            "vm": require.resolve("vm-browserify"),
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
            "process": require.resolve("process/browser"),
            "fs": false
        }
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            filename: "index.html",
        }),
        new CopyPlugin({
            patterns: [
                { from: "./public/manifest.json", to: ""},{ from: "./js/jobApplier", to: "jobApplier"},  // Copy manifest to root of 'dist'
                // { from: "./public/static", to: "static" },  // Copy static assets if needed
            ],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser'
        }),
        new Dotenv({
            path: './.env', // Path to .env file
        }),
        new NodePolyfillPlugin(),

    ],
};