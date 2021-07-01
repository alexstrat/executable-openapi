import * as fs from 'fs'
import * as express from 'express'
import * as yaml from 'js-yaml'
import { createRouter } from 'executable-openapi-router';
import { OpenAPIV3 } from 'openapi-types'
import { executableOpenAPIExpressHandler } from 'executable-openapi-express-adapter';

const spec = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8')) as OpenAPIV3.Document
const app = express()
const port = 8080

const execute = createRouter(spec, {
  paths: {
    '/hello/{name}': {
      get: (req) => ({
        status: 200,
        content: {
          'application/json': {
            message: `Hello ${req.parameters?.path?.name}`
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
