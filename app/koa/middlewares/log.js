const log4js = require('log4js')
const Log = log4js.getLogger()
exports = module.exports = async function (ctx, next) {
  const t = Date.now()
  ctx.res.on('finish', function () {
    const dt = Date.now() - t
    const {ip, method, originalUrl, response} = ctx
    const msg = `${ip} - ${method} ${originalUrl} ${response.status} time: ${dt}`
    Log.info(msg)
  })
  return next()
}
