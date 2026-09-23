#!/usr/bin/env node
/**
 * The restricted-jurisdiction list lives twice: in the backend, which enforces it and sends it
 * to the app, and in the site, which prints it on /terms. They are separate builds with no path
 * between them, so this is what stops the terms saying one thing while the purchase sheet asks
 * the reader to confirm another. Run by CI.
 */

import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

function parse(source, file) {
  const version = source.match(/TERMS_VERSION\s*=\s*(\d+)/)?.[1]
  const block = source.match(/RESTRICTED_JURISDICTIONS\s*=\s*\[([\s\S]*?)\]/)?.[1]
  if (!version || !block) throw new Error(`${file}: could not find TERMS_VERSION and RESTRICTED_JURISDICTIONS`)
  const list = [...block.matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
  return { version: Number(version), list }
}

const backend = parse(await read('backend/src/lib/terms.ts'), 'backend/src/lib/terms.ts')
const web = parse(await read('web/lib/terms.ts'), 'web/lib/terms.ts')

const same =
  backend.version === web.version &&
  backend.list.length === web.list.length &&
  backend.list.every((entry, index) => entry === web.list[index])

if (!same) {
  console.error('Terms are out of sync between backend/src/lib/terms.ts and web/lib/terms.ts')
  console.error('backend:', backend)
  console.error('web:    ', web)
  process.exit(1)
}
console.log(`Terms in sync: version ${backend.version}, ${backend.list.length} restricted jurisdictions.`)
