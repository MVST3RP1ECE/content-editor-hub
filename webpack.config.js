const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    port: 8080,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'TinyMCE Web Components Editor',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/tinymce/skins'),
          to: path.resolve(__dirname, 'docs/skins'),
        },
        {
          from: path.resolve(__dirname, 'node_modules/tinymce/themes'),
          to: path.resolve(__dirname, 'docs/themes'),
        },
        {
          from: path.resolve(__dirname, 'node_modules/tinymce/plugins'),
          to: path.resolve(__dirname, 'docs/plugins'),
        },
        {
          from: path.resolve(__dirname, 'node_modules/tinymce/models'),
          to: path.resolve(__dirname, 'docs/models'),
        },
        {
          from: path.resolve(__dirname, 'node_modules/tinymce/icons'),
          to: path.resolve(__dirname, 'docs/icons'),
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
}; 