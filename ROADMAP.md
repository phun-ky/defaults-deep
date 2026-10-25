# Roadmap

What defaults-deep intends to do, and not do, from October 2026 to October 2027.
It's a plan, not a promise: priorities can change, and changes to this file are
made in pull requests like any other. Individual pieces of work are tracked as
[GitHub issues](https://github.com/phun-ky/defaults-deep/issues), grouped in
milestones.

## Planned

### Keeping 2.x stable

`defaultsDeep()` works in Node.js (ES modules and CommonJS), bundlers and
TypeScript, with the correct types for both since 2.0.8, and every release is
checked by installing the packed package and calling it from each entry point,
also on the oldest Node.js version it supports. From here:

- **No breaking changes in 2.x.** The current major is supported as a whole; see
  the [security policy](SECURITY.md#supported-versions).
- **Deprecations before removals:** a deprecated API keeps working through one
  full major.

### Project health

- **OpenSSF Best Practices:** the passing badge, then silver and OSPS Baseline
  ([#107](https://github.com/phun-ky/defaults-deep/issues/107)).
- **A second maintainer**, so that pull requests get a review from someone other
  than the author and access to the project doesn't rest on one person; see
  [governance](GOVERNANCE.md#continuity).

## Considered, not scheduled

Ideas that fit the project but have no date. Each would be discussed in an issue
first, and any breaking change waits for a 3.0 with an upgrading guide.

- **Very deep input without a stack overflow:** input nested about 10,000 levels
  deep throws a `RangeError` today. An iterative merge or an explicit depth
  limit
  ([#120](https://github.com/phun-ky/defaults-deep/issues/120)); see the
  [security policy](SECURITY.md#security-expectations).

## Not planned

- **Byte-for-byte lodash compatibility.** The package covers the common
  configuration defaults use case; see the
  [differences from lodash](README.md#differences-from-lodash-_defaultsdeep--_mergewith-pattern).
- **Bundling runtime dependencies.** Runtime dependencies are declared and
  installed from npm, never bundled into the builds.
- **Collecting data.** The package doesn't collect, store or send data anywhere.
