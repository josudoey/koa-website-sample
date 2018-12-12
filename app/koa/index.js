const path = require('path')
const Koa = require('koa')
const camelCase = require('camelcase')
const globby = require('globby')
const logger = require('log4js').getLogger('app')
const staticCache = require('koa-static-cache')

exports = module.exports = function (opts) {
  const log4js = require('log4js')
  log4js.configure({
    appenders: {
      file: {
        type: 'file',
        filename: './log/server.log',
        maxLogSize: 100 * 1024 * 1024,
        numBackups: 3,
        compress: true
      },
      stdout: {
        type: 'stdout'
      }
    },
    categories: {
      default: {
        appenders: ['stdout', 'file'],
        level: 'debug'
      }
    }
  })

  const app = new Koa()
  const Controller = require('./controller')
  Controller.assemble(app, path.resolve(__dirname, '../interface'))
  const Middleware = require('./middleware')
  Middleware.assemble(app, path.resolve(__dirname, './middlewares'))

  Object.defineProperty(app.context, 'logger', {
    get: function () {
      return logger
    }
  })
  const stats = require('../../build/stats') || {hash: ''}
  const hash = stats.hash.slice(0, 8)
  app.use(async function (ctx, next) {
    const webpack = {
      publicPath: path.relative(path.dirname(ctx.originalUrl), '/bundle'),
      hash: hash
    }
    ctx.state.webpack = webpack
    await next()
  })

  const basedir = path.resolve(__dirname, '../interface')
  const consolidate = require('consolidate')

  Object.defineProperty(app.context, 'render', {
    get: function () {
      const ctx = this
      return function (templateName, content) {
        const filepath = path.resolve(basedir, templateName, './template.pug')
        const locals = Object.assign({}, ctx.state, content)
        return consolidate.pug(filepath, locals).then(html => {
          ctx.body = html
        })
      }
    }
  })

  const publicStaticPath = path.resolve(__dirname, '../../build/public')
  const publicStaticCache = staticCache(publicStaticPath, {
    dynamic: true,
    maxAge: 60 * 60
  })
  app.use(publicStaticCache)
  const router = require('./router')(app)
  app.use(router.routes())
  return app
}
