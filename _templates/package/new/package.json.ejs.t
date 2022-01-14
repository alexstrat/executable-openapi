---
to: packages/<%=name%>/package.json
---
{
  "name": "<%=name%>",
  "version": "0.0.0",
  "description": "<%=description%>",
  "keywords": [
    "openapi",
    "executable-openapi"
  ],
  "homepage": "https://github.com/alexstrat/executable-openapi",
  "author": "Alexandre Lachèze <alexandre.lacheze@gmail.com>",
  "license": "ISC",
  "main": "dist/index.js",
  "types": "./dist/index.d.ts",
  "directories": {
    "test": "src/__tests__"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "npm run clean && npm run compile",
    "compile": "tsc -p tsconfig.build.json",
    "clean": "rm -rf ./dist",
    "prepare": "npm run build",
    "test": "jest",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@types/jest": "^26.0.23",
    "@typescript-eslint/eslint-plugin": "^4.26.0",
    "eslint": "^7.27.0",
    "eslint-config-standard-with-typescript": "^20.0.0",
    "eslint-plugin-import": "^2.23.4",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-promise": "^4.3.1",
    "jest": "^27.0.4",
    "ts-jest": "^27.0.2",
    "typescript": "^4.3.2"
  },
  "dependencies": {
  }
}
