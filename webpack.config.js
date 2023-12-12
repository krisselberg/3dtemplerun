const path = require('path');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath = './build/';

module.exports = {
    entry: ['./src/app.js'],
    output: {
        path: path.join(__dirname, buildPath),
        filename: '[name].[hash].js',
        publicPath: `/${pkg.repository}/`,
    },
    target: 'web',
    devtool: 'source-map',
    stats: {
        warnings: false,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: path.resolve(__dirname, './node_modules/'),
            },
            {
                test: /\.(jpe?g|png|gif|svg|tga|gltf|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg)$/i,
                use: 'file-loader',
                exclude: path.resolve(__dirname, './node_modules/'),
            },
            {
                test: /\.(vert|frag|glsl|shader|txt)$/i,
                use: 'raw-loader',
                exclude: path.resolve(__dirname, './node_modules/'),
            },
        ],
    },
    resolve: {
        alias: {
            lights$: path.resolve(__dirname, 'src/components/lights'),
            objects$: path.resolve(__dirname, 'src/components/objects'),
            scenes$: path.resolve(__dirname, 'src/components/scenes'),
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: pkg.title,
            favicon: 'src/favicon.ico',
            template: 'index.html', // Path to your index.html file
        }),
    ],
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*', // Allow all origins
            'Access-Control-Allow-Methods':
                'GET, POST, PUT, DELETE, PATCH, OPTIONS', // Allowed methods
            'Access-Control-Allow-Headers':
                'X-Requested-With, content-type, Authorization', // Allowed headers
        },
        static: {
            directory: path.join(__dirname, 'public'), // Serve static files from the 'public' directory
            publicPath: '/', // Public URL path
        },
        historyApiFallback: true, // For single-page applications
        hot: true, // Enable hot module replacement
    },
};
