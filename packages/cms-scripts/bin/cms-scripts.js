#!/usr/bin/env node
const path = require('path')
const rollup = require('rollup')
const rollupTypescript = require('rollup-plugin-typescript2')
const rollupCommonJs = require('rollup-plugin-commonjs')
const typescript = require('typescript')

// Source https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/bin/react-scripts.js#L11-L16
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

/**
 * Commandline Parsing
 */
const program = require('commander')
const { version } = require('../package.json')

let command

program
  .version(version)
  .arguments('<cmd>')
  .action(cmd => (command = cmd))
  .parse(process.argv)

if (typeof command === 'undefined') {
  console.error('no command given!')
  process.exit(1)
}

if (command !== 'build') {
  console.error(`unrecognized command: ${command}`)
  process.exit(1)
}

build(createBuildOptions())
/**
 * Build Packages
 */
function createBuildOptions() {
  const absolutePath = process.cwd()

  const package = require(path.join(absolutePath, 'package.json'))
  console.log(`Building Package: ${package.name}@${package.version}`)

  const externalKeys = Object.keys(package.peerDependencies || {})

  const inputOptions = {
    input: path.join(absolutePath, package.main),
    external: targetId => {
      return !!externalKeys.find(extId => {
        return new RegExp(/^extId$/i).test(targetId)
      })
    },
    plugins: [
      rollupTypescript({
        typescript,
        tsconfig: path.join(absolutePath, 'tsconfig.json'),
        cacheRoot: path.join(absolutePath, '.rts2_cache'),
        include: [
          path.join(absolutePath, 'src', '*.ts+(|x)'),
          path.join(absolutePath, 'src', '**/*.ts+(|x)'),
        ],
      }),
      rollupCommonJs({
        sourceMap: true,
      }),
    ],
  }

  const outputOptions = {
    file: path.join(absolutePath, package.main),
    name: package.browserName || package.name,
    format: 'umd',
  }

  return {
    inputOptions,
    outputOptions,
  }
}

async function build({ inputOptions, outputOptions }) {
  const bundle = await rollup.rollup(inputOptions)

  await bundle.generate(outputOptions)

  await bundle.write(outputOptions)
}
