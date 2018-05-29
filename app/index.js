const path = require('path')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const camelCase = require('camelcase')
const globby = require('globby')
const axios = require('axios').create()
const logger = require('log4js').getLogger('app')
const once = require('lodash/once')
const views = require('koa-views')
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
  app.Controller = class { }
  app.Service = class {
    constructor (ctx) {
      this.ctx = ctx
      this.app = ctx.app
    }
  }

  const assembleModule = function (ctx, cwd, resolve) {
    const paths = globby.sync('**/*.js', {
      cwd: cwd,
      absolute: false,
      nodir: true
    })
    paths.forEach(function (fn) {
      const key = camelCase(fn.replace(/.js$/, ''))
      const fpath = path.resolve(cwd, fn)
      ctx.__defineGetter__(key, once(function () {
        return resolve(ctx, key, fpath)
      }))
    })
    return ctx
  }

  const resolveController = function (ctx, key, fpath) {
    const moduleInstance = require(fpath)
    let controller = null
    if (typeof moduleInstance === 'object') {
      controller = Object.create(moduleInstance)
    }
    if (typeof moduleInstance === 'function') {
      const ModuleConstructor = moduleInstance(app)
      controller = new ModuleConstructor(app)
    }
    return controller
  }

  const resolveMiddleware = function (ctx, key, fpath) {
    return require(fpath)
  }

  app.controllers = assembleModule({}, path.resolve(__dirname, './controllers'), resolveController)
  app.middlewares = assembleModule({}, path.resolve(__dirname, './middlewares'), resolveMiddleware)

  const RequestContext = Symbol('RequestContext')
  const resolveService = function (ctx, key, fpath) {
    const moduleInstance = require(fpath)
    let service = null
    if (typeof moduleInstance === 'object') {
      service = Object.create(moduleInstance)
    }
    if (typeof moduleInstance === 'function') {
      const ModuleConstructor = moduleInstance(app)
      const requestContext = ctx[RequestContext]
      service = new ModuleConstructor(requestContext)
    }
    return service
  }
  const serviceContext = assembleModule({}, path.resolve(__dirname, './service'), resolveService)

  Object.defineProperty(app.context, 'service', {
    get: function () {
      const ctx = this
      serviceContext[RequestContext] = ctx
      return serviceContext
    }
  })

  Object.defineProperty(app.context, 'axios', {
    get: function () {
      return axios
    }
  })
  Object.defineProperty(app.context, 'logger', {
    get: function () {
      return logger
    }
  })
  const stats = require('../build/stats') || {hash: ''}
  const hash = stats.hash.slice(0, 8)
  app.use(async function (ctx, next) {
    ctx.state.publicPath = path.relative(path.dirname(ctx.originalUrl), '/bundle')
    ctx.state.hash = hash
    await next()
  })
  app.use(bodyParser({
    jsonLimit: '40mb'
  }))
  const consolidate = require('consolidate')
  const load = require('pug-load')
  app.use(views(path.resolve(__dirname, './templates'), {
    engineSource: consolidate,
    extension: 'pug',
    options: {
      basedir: path.resolve(__dirname, './templates'),
      plugins: [{
        resolve: function (filename, source, loadOptions) {
          return load.resolve(filename, source, loadOptions)
        }
      }]
    }
  }))

  const publicStaticPath = path.resolve(__dirname, '../build/public')
  const publicStaticCache = staticCache(publicStaticPath, {
    maxAge: 60 * 60
  })
  app.use(publicStaticCache)
  const router = require('./router')(app)
  app.use(router.routes())
  return app
}
