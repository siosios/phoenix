const path = require('path')
const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    },
    symlinks: false
  },
  devServer: {
    contentBase: path.resolve(__dirname),
    historyApiFallback: true,
    publicPath: '/',
    filename: 'dist/core/core.bundle.js',
    watchContentBase: true,
    https: false,
    compress: true,
    host: '0.0.0.0',
    port: 8300,
    disableHostCheck: true,
    watchOptions: {
      ignored: [
        path.resolve(__dirname, '.*'),
        path.resolve(__dirname, 'tests'),
        path.resolve(__dirname, 'build'),
        path.resolve(__dirname, 'changelog'),
        path.resolve(__dirname, 'dist'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'apps') + '/*/node_modules'
      ]
    }
  }
})
