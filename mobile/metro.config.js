const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

/**
 * Keep the native build output out of Metro's file map.
 *
 * Metro watches the whole project root. A Gradle build writes well over a gigabyte into
 * `android/` — CMake object files, merged resources, intermediates — and recursively
 * watching all of it is enough to blow the file watcher's four-minute startup deadline.
 * Metro then logs "Failed to start watch mode", serves every bundle request as a 500
 * (`Cannot read properties of undefined` out of DependencyGraph, because the file map was
 * never populated), and the dev client crashes on launch with no hint that the build
 * output was the cause.
 *
 * None of it is ever imported by the app, so none of it needs to be watched. The default
 * blockList is kept: Metro combines an array of patterns, so the Expo defaults survive.
 */
const defaultBlockList = config.resolver.blockList

config.resolver.blockList = [
  // Spread rather than nest: the default is already an array, and Metro combines a flat
  // list of patterns — a nested one fails with "Cannot combine blockList patterns".
  ...(Array.isArray(defaultBlockList) ? defaultBlockList : [defaultBlockList]),
  /android[\\/]\.gradle[\\/].*/,
  /android[\\/]build[\\/].*/,
  /android[\\/][^\\/]+[\\/]build[\\/].*/,
  /android[\\/][^\\/]+[\\/]\.cxx[\\/].*/,
]

module.exports = config
