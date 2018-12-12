module.exports = (app) => {
  const { home } = app.controllers
  const middlewares = app.middlewares
  const log = middlewares.log

  const router = require('koa-router')()
  router.use(log)
  router.get('/(.*)', home.html)
  return router
}
