// Check what npm would publish: pack the package, check the tarball holds the
// files package.json points at, both licences, README and CHANGELOG, and no
// tests, lint it with publint and @arethetypeswrong/cli, then install it in an
// empty project, check every source map resolves, and call defaultsDeep()
// through import, require, the dist paths and a browser bundle. It also checks
// that the builds bundle no dependencies. Set CHECK_PACK_NODE to another node
// binary (such as the oldest version engines allows) to run the calls on it
// too. Run after `npm run build`.
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';

import { deepStrictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BIN = join(ROOT, 'node_modules', '.bin');
/** Run a linter; return its output if it fails. */
const lint = (command, args) => {
  try {
    execFileSync(join(BIN, command), args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return undefined;
  } catch (error) {
    return `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
  }
};
// A bare package name after from, import( or require(
const IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"'.][^"']*)["']/g;
/** Every .map file under dir. */
const mapsIn = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((file) => file.endsWith('.map'))
    .map((file) => join(dir, file));
const npm = (args, cwd) =>
  execFileSync('npm', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
/** Every file path a package.json points at, without the leading ./ */
const entryPoints = (pkg) => {
  const paths = [];
  const collect = (value) => {
    if (typeof value === 'string') paths.push(value);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(collect);
  };

  collect(pkg.exports);
  collect(pkg.main);
  collect(pkg.module);
  collect(pkg.types);
  collect(pkg.unpkg);
  collect(pkg.jsdelivr);

  // Subpath patterns such as ./dist/* are not files
  return paths
    .filter((path) => !path.includes('*'))
    .map((path) => path.replace(/^\.\//, ''));
};
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'defaults-deep-pack-'));
const problems = [];

try {
  const output = JSON.parse(
    npm(['pack', '--json', '--pack-destination', work], ROOT)
  );
  // An array in npm 11, an object keyed by package name in npm 12
  const packed = Array.isArray(output) ? output[0] : Object.values(output)[0];
  const files = new Set(packed.files.map((file) => file.path));

  // npm adds README.md on its own; the licence files have names npm doesn't
  // pick up by itself, so they must be in "files"
  for (const path of [
    ...entryPoints(pkg),
    'LICENSE-MIT',
    'LICENSE-ISC',
    'README.md',
    'CHANGELOG.md'
  ]) {
    if (!files.has(path)) problems.push(`${path} is not in the tarball`);
  }

  for (const path of files) {
    if (/(^|\/)__tests__\/|\.tsbuildinfo$/.test(path)) {
      problems.push(`${path} should not be published`);
    }
  }

  const tarball = join(work, packed.filename);
  const types = lint('attw', [tarball]);
  const publint = lint('publint', ['--strict', tarball]);

  if (types) problems.push(`@arethetypeswrong/cli:\n${types}`);

  if (publint) problems.push(`publint:\n${publint}`);

  console.log(
    `${pkg.name}@${pkg.version}: ${files.size} files, ${packed.size} bytes`
  );

  if (problems.length === 0) {
    const app = join(work, 'app');
    const installed = join(app, 'node_modules', pkg.name);

    mkdirSync(app);
    writeFileSync(
      join(app, 'package.json'),
      '{ "name": "app", "private": true }\n'
    );
    npm(
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        // The dependencies come from the registry, preferably the cache
        '--prefer-offline',
        tarball
      ],
      app
    );

    // Runtime dependencies are declared, never bundled: the builds may not
    // contain code from node_modules, and every package they import must be a
    // dependency.
    const declared = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {})
    ]);
    const moduleBuilds = new Set(
      [
        pkg.exports?.['.']?.import?.default,
        pkg.exports?.['.']?.require?.default,
        pkg.main,
        pkg.module
      ]
        .filter(Boolean)
        .map((path) => path.replace(/^\.\//, ''))
    );

    for (const file of moduleBuilds) {
      const code = readFileSync(join(installed, file), 'utf8');
      const map = `${join(installed, file)}.map`;
      const inlined = existsSync(map)
        ? JSON.parse(readFileSync(map, 'utf8')).sources.filter((source) =>
            source.includes('node_modules/')
          )
        : [];
      const imported = [...code.matchAll(IMPORT)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !specifier.startsWith('node:'))
        .map((specifier) =>
          specifier
            .split('/')
            .slice(0, specifier.startsWith('@') ? 2 : 1)
            .join('/')
        );

      for (const source of inlined) {
        problems.push(
          `${file} inlines ${source}; declare it in dependencies and keep it external`
        );
      }

      for (const name of new Set(imported)) {
        if (!declared.has(name))
          problems.push(`${file} imports ${name}, which isn't in dependencies`);
      }
    }

    // Our own sources must be published next to the maps; bundled
    // dependencies are not installed, so their source must be embedded
    for (const map of mapsIn(installed)) {
      const { sources, sourcesContent = [] } = JSON.parse(
        readFileSync(map, 'utf8')
      );

      sources.forEach((source, index) => {
        const resolves = source.includes('node_modules/')
          ? typeof sourcesContent[index] === 'string'
          : existsSync(join(dirname(map), source));

        if (!resolves) {
          problems.push(
            `${relative(installed, map)} points at ${source}, which isn't published`
          );
        }
      });
    }

    // Earlier arguments win, nested objects merge, arrays are replaced
    const expect = `
      const check = (how, defaultsDeep) => {
        if (typeof defaultsDeep !== 'function') throw new Error(how + ': defaultsDeep is ' + typeof defaultsDeep);
        const value = defaultsDeep({ a: 1, nested: { x: 1 }, list: [1] }, { a: 2, nested: { y: 2 }, list: [2] });
        require('node:assert').deepStrictEqual(value, { a: 1, nested: { x: 1, y: 2 }, list: [1] }, how);
        console.log(how + ' (node ' + process.version + '): ' + JSON.stringify(value));
      };
    `;
    const name = JSON.stringify(pkg.name);
    const smokes = {
      'ES module import': [
        '--input-type=module',
        '-e',
        `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); ${expect} const { default: defaultsDeep } = await import(${name}); check('import', defaultsDeep);`
      ],
      // require() returns the function itself, as the README shows
      'CommonJS require': [
        '--input-type=commonjs',
        '-e',
        `${expect} check('require', require(${name}));`
      ],
      // Deep imports worked before exports existed, and must keep working
      'dist path import': [
        '--input-type=module',
        '-e',
        `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); ${expect} const { default: defaultsDeep } = await import(${JSON.stringify(`${pkg.name}/dist/defaults-deep.js`)}); check('dist path import', defaultsDeep);`
      ],
      'dist path require': [
        '--input-type=commonjs',
        '-e',
        `${expect} check('dist path require', require(${JSON.stringify(`${pkg.name}/dist/defaults-deep.cjs`)}));`
      ]
    };
    const nodes = ['node', process.env.CHECK_PACK_NODE].filter(Boolean);

    for (const node of nodes) {
      for (const [how, args] of Object.entries(smokes)) {
        try {
          execFileSync(node, args, { cwd: app, stdio: 'inherit' });
        } catch {
          problems.push(`${how} of the installed tarball failed on ${node}`);
        }
      }
    }

    // A browser bundler resolving the package from the app
    try {
      const entry = join(app, 'entry.js');

      writeFileSync(
        entry,
        `import defaultsDeep from ${name};\nglobalThis.result = JSON.stringify(defaultsDeep({ a: [1] }, { a: [2], b: { c: 1 } }));\n`
      );

      const bundle = await rollup({
        input: entry,
        plugins: [nodeResolve({ browser: true, rootDir: app })]
      });
      const { output } = await bundle.generate({ format: 'iife' });
      const sandbox = {};

      await bundle.close();
      runInNewContext(output[0].code, sandbox);

      deepStrictEqual(JSON.parse(sandbox.result), { a: [1], b: { c: 1 } });

      console.log(`browser bundle: ${sandbox.result}`);
    } catch (error) {
      problems.push(
        `a browser bundle of the installed tarball failed: ${error}`
      );
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error('\nThe package would not publish correctly:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nCheck "files" in package.json, and run npm run build first.'
  );
  process.exit(1);
}

console.log(`\n${pkg.name} packs, installs, and works from every entry point.`);
