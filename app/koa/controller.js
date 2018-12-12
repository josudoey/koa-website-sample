const path = require('path')

class Controller {
  constructor (opts) {
    this.name = opts.name
    this.html = async function (ctx) {
      ctx.status = 200
      await ctx.render(opts.name, {})
    }
  }
}

Controller.assemble = function (app, cwd, opts) {
  const once = require('lodash/once')
  const globby = require('globby')
  const camelCase = require('camelcase')
  const paths = globby.sync('*', {
    cwd: cwd,
    absolute: false,
    onlyDirectories: true
  })
  app.Controller = Controller
  const controllers = app.controllers = {}
  paths.forEach(function (fn) {
    const name = camelCase(fn)
    const modulePath = path.join(cwd, fn, 'controller.js')
    Object.defineProperty(controllers, name, {
      configurable: false,
      enumerable: true,
      get: once(function () {
        const Controller = require(modulePath)(app)
        return new Controller(Object.assign({}, opts, {
          name: name
        }))
      })
    })
  })
  return controllers
}

exports = module.exports = Controller
