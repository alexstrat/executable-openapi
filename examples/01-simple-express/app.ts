import * as fs from 'fs'
import * as express from 'express'
import * as yaml from 'js-yaml'
import { createRouter } from 'executable-openapi-router';
import { OpenAPIObject } from 'openapi3-ts'
import { executableOpenAPIExpressHandler } from 'executable-openapi-express-adapter';

const spec = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8')) as OpenAPIObject
const app = express()
const port = 8080

const execute = createRouter(spec, {
  paths: {
    '/hello/{name}': {
      get: (parameters) => ({
        status: 200,
        content: {
          'application/json': {
            message: `Hello ${parameters?.path?.name}`
          }
        }
      })
    }
  }
})

app.use('/api', executableOpenAPIExpressHandler({
  execute,
}));

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
