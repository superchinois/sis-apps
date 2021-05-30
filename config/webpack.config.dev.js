const path = require('path')
const config = require('./webpack.config.js')

/*config.devServer = {
  historyApiFallback: true,
  contentBase: path.join(__dirname, '../build'),
  port: 8081
}*/

config.devtool = 'inline-source-map'

module.exports = env => {
  config.devServer = {
    historyApiFallback: true,
    contentBase: path.join(__dirname, '../build'),
    port: 8081
  }
  return config;
};
