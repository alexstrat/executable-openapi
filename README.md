# Executale OpenAPI

Executable OpenAPI is a set of tools to implement a design-first API from OpenAPI specification.

![logo](https://github.com/alexstrat/executable-openapi/blob/95dc9a68046a96921c336799d98eeb4da07409a2/website/static/img/logo.svg)

## Benefits

- **framework agnostic**: can be used with any javascript server framework. `executable-openapi` defines a common interface and adapters for framework can be found or built as independent packages.
- **modular, extensible, flexible**: `executable-openapi` is built with middlewares. You can add or remove features by adding or removing middlewares.
- **but opinionated** by default: the package `executable-openapi` comes with an opinionated preset of middlewares that'll ensure your API is conform to its specification: request and response validation, security, etc.
