const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  target: 'web',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    })],
    usedExports: true,
    sideEffects: true
  },
  performance: {
    maxEntrypointSize: 500000,
    maxAssetSize: 500000
  }
};
