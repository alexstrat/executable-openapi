# Executable OpenAPI
[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)


> Set of tools to implement a design-first API from OpenAPI specification.

![logo](https://github.com/alexstrat/executable-openapi/blob/main/website/static/img/logo.svg)

## Benefits

- **framework agnostic**: can be used with any javascript server framework. `executable-openapi` defines a common interface and adapters for framework can be found or built as independent packages.
- **modular, extensible, flexible**: `executable-openapi` is built with middlewares. You can add or remove features by adding or removing middlewares.
- **but opinionated** by default: the package `executable-openapi` comes with an opinionated preset of middlewares that'll ensure your API is conform to its specification: request and response validation, security, etc.
