module.exports = (app) => {
  const controllers = app.controllers
  const page = controllers.page
  const middlewares = app.middlewares
  const log = middlewares.log

  const router = require('koa-router')()
  router.use(log)

  router.get('/(.*)', page.index)
  return router
}
