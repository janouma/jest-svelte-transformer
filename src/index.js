'use strict'

const cosmiconfig = require('cosmiconfig')
const { statSync } = require('fs')
const uuid = require('uuid/v4')
const { compile, preprocess } = require('svelte/compiler')
const log = require('loglevel')
const { loopWhile } = require('deasync')
const { transform } = require('@babel/core')
const packageName = require('../package.json').name

log.setLevel(process.env.LOG_LEVEL || 'info')

function preprocessSync (...args) {
  let done = false
  let output

  preprocess(...args)
    .then(result => (output = result))
    .finally(() => (done = true))

  loopWhile(() => !done)

  return output
}

function loadConfig () {
  const explorer = cosmiconfig(packageName)
  let config

  try {
    ({ config } = explorer.searchSync())
  } catch (error) {
    log.trace(error)
  }

  return config
}

const cache = {}

module.exports = {
  canInstrument: false,

  getCacheKey (fileData, filename) {
    const stat = statSync(filename)
    let cached = cache[filename]

    if (!cached) {
      cached = cache[filename] = {
        lastModified: stat.atimeMs,
        hash: uuid()
      }
    }

    if (stat.atimeMs > cached.lastModified) {
      cache[filename] = {
        ...cached,
        lastModified: stat.atimeMs,
        hash: uuid()
      }
    }

    return cached.hash
  },

  process (src, filename) {
    const config = loadConfig()

    const { code: processedCode } = preprocessSync(
      src,
      config && config.preprocessors
    )

    const { js, warnings } = compile(
      processedCode,
      {
        ...(config && config.compileOptions),
        filename,
        sveltePath: 'svelte',
        customElement: false
      }
    )

    if (warnings && warnings.length) {
      log.warn(
        warnings.map(({ message, frame }) => `${message}\n${frame}`)
          .join('\n\n')
      )
    }

    const transformedCode = transform(js.code, {
      filename,
      inputSourceMap: js.map
    })

    return transformedCode || src
  }
}
