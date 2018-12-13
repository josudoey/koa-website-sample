const globby = require('globby')
const path = require('path')
const camelCase = require('camelcase')
const entry = exports = module.exports = {}
const entryFiles = globby.sync(path.resolve(__dirname, '../interface', '*/entry.js'), {
  cwd: __dirname,
  absolute: true,
  nodir: true
})

for (const entryPath of entryFiles) {
  const basename = path.basename(path.dirname(entryPath))
  const entryName = camelCase(basename)
  entry[entryName] = [entryPath]
}
