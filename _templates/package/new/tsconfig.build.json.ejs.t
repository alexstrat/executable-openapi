---
to: packages/<%=name%>/tsconfig.build.json
---
{
  "extends": "../../tsconfig.build.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
  },
}
