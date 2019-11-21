'use strict'

const { preprocess } = require('svelte/compiler')
const loadConfig = require('./config_loader')

const source = process.argv[2]
const srcFile = process.argv[3]

async function transform (src, filename) {
  const config = loadConfig()

  const { code } = await preprocess(
    src,
    config && config.preprocessors,
    { filename }
  )

  process.stdout.write(code)
}

transform(source, srcFile)
