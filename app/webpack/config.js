const path = require('path')
const webpackOutputPublicPath = '/bundle/'
const projectPath = path.resolve(__dirname, '../..')
const contentBase = path.join(projectPath, './build/public')
const webpackEntryOutputPath = path.join(contentBase, webpackOutputPublicPath)

const env = process.env.NODE_ENV
const mode = (env === 'production') ? 'production' : 'development'
const devMode = env !== 'production'

const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const globby = require('globby')
const camelCase = require('camelcase')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const config = module.exports = {
  contentBase: contentBase
}

const entry = require('./entry')

const plugins = [
  new CleanWebpackPlugin([contentBase], {
    root: projectPath,
    verbose: true,
    dry: false,
    beforeEmit: true
  }),
  new MiniCssExtractPlugin({
    filename: 'css/[name].css?[hash:4]',
    chunkFilename: 'css/[id].css?[hash:4]'
  }),
  new webpack.ProvidePlugin({

  }),
  new webpack.DefinePlugin({

  })
]

config.webpack = {
  mode: mode,
  entry: entry,
  output: {
    path: webpackEntryOutputPath,
    publicPath: webpackOutputPublicPath,
    filename: '[name].js?[hash:4]',
    chunkFilename: '[name].js?[hash:4]'
  },
  resolve: {
    alias: {}
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: 'file-loader',
      options: {
        outputPath: 'img',
        publicPath: '../img',
        useRelativePath: false,
        name: '[name].[ext]?[hash:4]'
      }
    }, {
      test: /\.(woff2?|eot|ttf|otf)$/,
      loader: 'file-loader',
      options: {
        outputPath: 'fonts',
        publicPath: '../fonts',
        useRelativePath: false,
        name: '[name].[ext]?[hash:4]'
      }
    }, {
      test: /\.html$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }]
    }, {
      test: /.pug$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }, {
        loader: 'pug-html-loader',
        options: {
          data: {
            webpack: {
              publicPath: webpackOutputPublicPath
            }
          }
        }
      }]
    }, {
      test: /\.css$/,
      use: [{
        loader: MiniCssExtractPlugin.loader,
        options: {
          publicPath: ''
        }
      },
      {
        loader: 'css-loader',
        options: {}
      }]
    }, {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      include: [],
      loader: 'babel-loader',
      options: {
        plugins: [
          require('babel-plugin-syntax-dynamic-import')
        ]
      }
    }]
  },
  plugins: plugins,
  devtool: (devMode) ? 'source-map' : false
}

config['webpack-dev-server'] = {
  contentBase: contentBase,
  hot: false,
  inline: false,
  quiet: false,
  noInfo: false,
  publicPath: path.resolve('/', path.relative(contentBase, webpackEntryOutputPath)),
  stats: {
    colors: true
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
}
