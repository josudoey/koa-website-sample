exports = module.exports = function (app) {
  class Controller extends app.Controller {
    async index (ctx) {
      ctx.status = 200
      await ctx.render('home', {})
    }
  }

  return Controller
}
