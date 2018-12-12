
exports = module.exports = {}
exports.assemble = function (app, cwd, opts) {
  const path = require('path')
  const once = require('lodash/once')
  const globby = require('globby')
  const camelCase = require('camelcase')
  const paths = globby.sync('**.js', {
    cwd: cwd,
    absolute: false,
    nodir: true
  })
  const middlewares = app.middlewares = {}
  paths.forEach(function (fn) {
    const key = camelCase(path.basename(fn, '.js'))
    const modulePath = path.join(cwd, fn)
    Object.defineProperty(middlewares, key, {
      configurable: false,
      enumerable: true,
      get: once(function () {
        return require(modulePath)
      })
    })
  })
  return middlewares
}
