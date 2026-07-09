'use strict'

/**
 * One-off: regenerate responsive image formats (thumbnail/small/medium/large/xlarge)
 * for every existing upload, so files uploaded before a breakpoint change pick up
 * the new sizes (e.g. the 2000px `xlarge` used by the photo viewer).
 *
 * Boots its own Strapi instance and reuses the upload plugin's own image pipeline,
 * so output matches what a fresh upload would produce. The dev server MUST be
 * stopped first — two processes on one SQLite file will lock.
 *
 *   node scripts/regenerate-formats.js
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createStrapi, compileStrapi } = require('@strapi/strapi')

/** Keep only the serializable fields Strapi persists for a format entry. */
function toFormatEntry(f) {
  return {
    name: f.name,
    hash: f.hash,
    ext: f.ext,
    mime: f.mime,
    path: f.path ?? null,
    width: f.width,
    height: f.height,
    size: f.size,
    sizeInBytes: f.sizeInBytes,
    url: f.url,
  }
}

async function main() {
  const app = await createStrapi(await compileStrapi()).load()

  const imageManip = app.plugin('upload').service('image-manipulation')
  const provider = app.plugin('upload').service('provider')
  const query = app.db.query('plugin::upload.file')

  const publicDir = app.dirs?.static?.public ?? path.join(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, 'uploads')

  const files = await query.findMany({ where: {}, limit: -1 })
  let done = 0
  let skipped = 0
  let failed = 0

  for (const entry of files) {
    if (!entry.mime || !entry.mime.startsWith('image/')) {
      skipped++
      continue
    }

    const originalPath = path.join(uploadsDir, `${entry.hash}${entry.ext}`)
    if (!fs.existsSync(originalPath)) {
      console.warn(`  ! missing original on disk: ${entry.hash}${entry.ext} — skipped`)
      skipped++
      continue
    }

    const tmpWorkingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'regen-formats-'))
    const fileData = {
      name: entry.name,
      hash: entry.hash,
      ext: entry.ext,
      mime: entry.mime,
      width: entry.width,
      height: entry.height,
      path: null,
      filepath: originalPath,
      tmpWorkingDirectory,
      getStream: () => fs.createReadStream(originalPath),
    }

    try {
      if (!(await imageManip.isResizableImage(fileData))) {
        skipped++
        continue
      }

      const formats = {}

      const thumbnail = await imageManip.generateThumbnail(fileData)
      if (thumbnail) {
        await provider.upload(thumbnail)
        formats.thumbnail = toFormatEntry(thumbnail)
      }

      const responsive = await imageManip.generateResponsiveFormats(fileData)
      for (const format of responsive) {
        if (!format || !format.file) continue
        await provider.upload(format.file)
        formats[format.key] = toFormatEntry(format.file)
      }

      await query.update({ where: { id: entry.id }, data: { formats } })
      done++
      console.log(`  ✓ ${entry.name} → ${Object.keys(formats).sort().join(', ') || '(none)'}`)
    } catch (err) {
      failed++
      console.error(`  ✗ ${entry.name}:`, err.message)
    } finally {
      fs.rmSync(tmpWorkingDirectory, { recursive: true, force: true })
    }
  }

  console.log(`\nregenerated ${done}, skipped ${skipped}, failed ${failed} (of ${files.length})`)
  await app.destroy()
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
