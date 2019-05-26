A way to load svelte files in tests, while allowing setup for preprocessors and compile options.
---

# Installation

```bash
npm install -D jest-svelte-transformer
```

# Usage

In your `package.json` add these lines:

```json
"jest": {
  "transform": {
    "^.+\\.svelte$": "jest-svelte-transformer"
  }
}
```

To add preprocessors you can create a config file at the root of your project named `jest-svelte-transformer.config.js`. Here is an example of what you could have in this file:

```javascript
const presetenv = require('postcss-preset-env')
const postcss = require('postcss')

module.exports = {
  preprocessors: {
    async style ({ content: code }) {
      const { css } = await postcss([presetenv({
        "stage": 0,

        "features": {
          "calc": false
        }
      })]).process(code, { from: undefined })

      return { code: css }
    }
  },

  compileOptions: {
    dev: true,
    immutable: true
  }
}
```

Preprocessors and compile options config follows the svelte api _(https://svelte.dev/docs#svelte_preprocess, https://svelte.dev/docs#svelte_compile)_

If you don't need preprocessors but only compile options, you can put the config into an `rc` file _— `.jest-svelte-transformerrc` —_ Like so:

```json
{
  "compileOptions": {
    "dev": true,
    "immutable": true
  }
}
```

> Babel is used to transpile svelte compiled code so that it could be loaded as a `commonjs` module, so any babel config set up in your project will also be used to transpile svelte compiled code.

# Debug

By setting `LOG_LEVEL` environment variable to `trace` you can see config loading errors, like so for example:
```sh
LOG_LEVEL=trace npm test -- widget.test.js
```
