import * as fs from 'fs'
import * as loadJsonFile from 'load-json-file'
import symlinkDir = require('symlink-dir')

async function execute() {
  const packages = fs
    .readdirSync(`${__dirname}/../packages`, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory)
    .map((dirent) => dirent.name)

  const examples = fs
    .readdirSync(`${__dirname}/../examples`, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory)
    .map((dirent) => dirent.name)

  for(const exampleDirName of examples) {
    const packageJSON = loadJsonFile.sync(
      `${__dirname}/../examples/${exampleDirName}/package.json`
    )
  
    if (typeof packageJSON !== 'object' || packageJSON === null){
      continue
    }
  
    const dependencies = [
      //@ts-ignore
      ...Object.keys(packageJSON?.['dependencies']),
      //@ts-ignore
      ...Object.keys(packageJSON?.['devDependencies']),
    ]
  
    const toLink = dependencies.filter((dep) => packages.includes(dep))
  
    console.log(`${exampleDirName}:`)
    for (const packageName of toLink) {
      console.log(`  examples/${exampleDirName}/node_modules/${packageName} -> packages/${packageName}`)
      await symlinkDir(
        `${__dirname}/../packages/${packageName}`,
        `${__dirname}/../examples/${exampleDirName}/node_modules/${packageName}`
        )
    }
    console.log('')
  }
}

execute().then(() => {
  console.log('done');
})
