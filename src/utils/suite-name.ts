/**
 * A little helper to name test suites based on their file paths. Paths like this
 *
 *     core/controllers/challenge/finish.spec.ts
 *
 * end up like this
 *
 *     core / controllers / challenge / finish
 *
 * Using a pattern like this makes it easier to find the test suite you're looking for when you only know its name.
 *
 * @param dirname The name of the directory the test suite is in. Pass `__dirname`.
 * @param filename The name of the test file. Pass __filename.
 */
export const suiteName = (dirname: string, filename: string) =>
  dirname
    .replace(/^.*\/src\//, '')
    .split('/')
    .concat([filename.replace('.spec.ts', '').replace(/.*\//, '')])
    .join(' / ');
