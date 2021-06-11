---
to: packages/<%=name%>/.eslintrc.js
---
module.exports = {
  extends: ['../../.eslintrc.base.js', 'standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json'
  }
}
