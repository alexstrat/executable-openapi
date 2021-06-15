const splitRegexp = /\{[A-Za-z0-9_]+\}/

/**
 * Will compare 2 paths by "concretness".
 *
 * `/user/foo` will be considered more concrete than `/user/{id}`.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#path-templating-matching
 */
export function pathConcretenessCompareFunction (firstPath: string, secondPath: string): number {
  const firstParts = firstPath.split(splitRegexp).filter((p) => p.length > 0)
  const secondParts = secondPath.split(splitRegexp).filter((p) => p.length > 0)

  for (let i = 0; i < Math.max(firstParts.length, secondParts.length); i++) {
    if (firstParts[i] === undefined && secondParts[i] === undefined) return 0
    if (firstParts[i] === undefined) return -1
    if (secondParts[i] === undefined) return 1

    if (firstParts[i].length === secondParts[i].length) {
      continue
    } else {
      return (secondParts[i].length - firstParts[i].length)
    }
  }

  return 0
}
