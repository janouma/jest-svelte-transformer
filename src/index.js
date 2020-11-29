'use strict'

const { statSync } = require('fs')
const uuid = require('uuid/v4')
const { compile } = require('svelte/compiler')
const log = require('loglevel')
const { execSync } = require('child_process')
const { join } = require('path')
const { transform } = require('@babel/core')
const loadConfig = require('./config_loader')

log.setLevel(process.env.LOG_LEVEL || 'info')

const convertToCliArg = src => src
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$')

function preprocessSync (src, filename) {
  const preprocessorPath = join(__dirname, 'preprocessor')
  const code = execSync(`node ${preprocessorPath} "${convertToCliArg(src)}" "${filename}"`)

  return String(code)
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
    const processedCode = preprocessSync(src, filename)

    const { js, warnings } = compile(
      processedCode,
      {
        ...(config && config.compileOptions),
        filename,
        sveltePath: 'svelte',
        customElement: false
      }
    )

    if (warnings && warnings.length && (!config || config.showWarnings)) {
      log.warn(
        warnings.map(({ message, frame }) => `${message}\n${frame}`)
          .join('\n\n')
      )
    }

    const transformedCode = transform(js.code, {
      filename,
      inputSourceMap: js.map
    })

    return transformedCode || js
  }
}
