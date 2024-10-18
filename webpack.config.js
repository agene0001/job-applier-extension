// webpack.config.js
const path = require('path');

module.exports = {
    mode: 'development', // Change to 'production' for production builds
    entry: './js/background.js', // Path to your main JS file
    output: {
        filename: 'bundle.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
        clean: true, // Clean output directory before emit
    },
    resolve: {
        extensions: ['.js'], // Resolve .js files
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // If you're using Babel
                },
            },
        ],
    },
};
