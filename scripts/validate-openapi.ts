import { buildOpenApiSpec } from '../lib/openapi'

function main() {
  const spec = buildOpenApiSpec() as any

  if (!spec || typeof spec !== 'object') {
    throw new Error('Spec is not an object')
  }

  if (spec.openapi !== '3.1.0') {
    throw new Error(`Unexpected openapi version: ${spec.openapi}`)
  }

  if (!spec.info?.title) {
    throw new Error('Missing info.title')
  }

  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Missing paths')
  }

  const count = Object.keys(spec.paths).length
  if (count < 10) {
    throw new Error(`Too few paths: ${count}`)
  }

  process.stdout.write(JSON.stringify(spec, null, 2))
}

main()
