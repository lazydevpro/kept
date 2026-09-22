/**
 * Prettier for the Worker.
 *
 * ── Why this does not match `mobile/` and `web/` ──
 *
 * Those two are 120 columns, no semicolons, single quotes. This one is 80,
 * semicolons, double quotes — which looks like an oversight and is not. The
 * backend was written that way throughout: 92 of 92 imports are double-quoted,
 * a thousand statements end in a semicolon, and the 95th-percentile line is 79
 * characters long.
 *
 * So these values were measured rather than chosen. At 80 columns six files
 * need reformatting; at 120 it is twenty-two. Picking the house style of the
 * other workspaces would mean rewriting most of the Worker to settle a question
 * nobody asked, and burying the history of every route in a whitespace diff.
 *
 * If the repo ever does want one style everywhere, that is a deliberate pass of
 * its own — not something to slip in behind a config file.
 *
 * Every value below is a Prettier default except that it is written down, which
 * is the point: `format:check` cannot be a gate until the settings are pinned.
 */
export default {
  printWidth: 80,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
};
