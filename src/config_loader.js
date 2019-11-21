'use strict'

const log = require('loglevel')
const cosmiconfig = require('cosmiconfig')
const packageName = require('../package.json').name

log.setLevel(process.env.LOG_LEVEL || 'info')

module.exports = function loadConfig () {
  const explorer = cosmiconfig(packageName)
  let config

  try {
    ({ config } = explorer.searchSync())
  } catch (error) {
    log.trace(error)
  }

  return config
}
