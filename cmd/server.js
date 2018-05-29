module.exports = function (prog) {
  prog
    .command('server')
    .option('--dev', 'enable dev mode')
    .option('-p, --port <port>', 'web service listen port default:[5500]', 5500)
    .description('start a http service.')
    .action(function (opts) {
      const http = require('http')
      const app = require('../app')(opts)
      const log4js = require('log4js')
      const Log = log4js.getLogger('server')
      const server = http.createServer(app.callback()).listen(opts.port)

      app.on('error', function (err) {
        Log.error(err)
      })

      server.on('listening', async function () {
        const port = server.address().port
        Log.info(`service listein on ${port}`)
        app.emit('listening', server)
      })

      server.on('error', function (err) {
        Log.error(err)
        process.exit(1)
      })

      process.removeAllListeners('uncaughtException')
      process.on('uncaughtException', function (err) {
        Log.error(err.stack)
      })

      process.removeAllListeners('unhandledRejection')
      process.on('unhandledRejection', function (err) {
        Log.error(err.stack)
      })
    })
}
