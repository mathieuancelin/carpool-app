var webpack = require('webpack');
var secret = require('./secret');

var devOnlyPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoErrorsPlugin()
];

var plugins = [
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    '__FIREBASEURL__': '\"' + secret.firebaseUrl + '\"',
    '__DEV__': process.env.NODE_ENV === 'production' ? false : true,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
];

if (process.env.NODE_ENV === 'dev') {
  plugins = devOnlyPlugins.concat(plugins);
} else {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compressor: {
      screw_ie8: true,
      warnings: false
    }
  }));
}

module.exports = {
  output: {
    path: './dist/',
    publicPath: '/assets/',
    filename: 'carpool.js',
    library: 'CarPool',
    libraryTarget: 'umd'
  },
  entry: {
    'days': ['./src/main.js']
  },
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader?stage=0&optional=runtime'
      }
    ]
  },
  plugins: plugins
};
