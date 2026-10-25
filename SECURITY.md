# Security Policy

`@phun-ky/defaults-deep` has one runtime dependency, `@phun-ky/typeof`, by the
same maintainer. It is declared in `dependencies` and installed from npm, never
bundled into the builds. How dependencies are chosen, tracked and kept clear of
known vulnerabilities is described under [Dependencies](#dependencies).

## Supported Versions

Support follows the major version:

| Release                  | Supported |
| ------------------------ | --------- |
| `2.x`, the current major | ✅        |
| `1.x`                    | ❌        |

- **The current major is supported as a whole.** Fixes are released as a new
  patch or minor of it, and upgrading within a major never breaks your code.
- **From the next major on, the previous major gets fixes for high and critical
  vulnerabilities for 6 months** after the next major is released, as a patch on
  its latest release.
- **Security comes before the deprecation grace period.** If a vulnerability
  can't be fixed without breaking an API, the fix may change or remove it in a
  patch or minor release instead of waiting for a major. The change is kept as
  small as possible, and the advisory and the release notes say what changed and
  why.

To get a fix, upgrade to the newest release of your major.

### Known vulnerable releases

[GHSA-mj3g-7xcc-x4vh](https://github.com/phun-ky/defaults-deep/security/advisories/GHSA-mj3g-7xcc-x4vh)
(CVE-2026-54737, high, prototype pollution) affects every release before 2.0.5,
including all
of `1.x`. It is fixed in 2.0.5. There is no `1.x` fix: `1.x` ended when this
policy was written, and its releases, and 2.0.0 to 2.0.4, are deprecated on
npm. Upgrade to the latest `2.x`.

## Reporting a Vulnerability

Report vulnerabilities privately, either with GitHub's
[private vulnerability reporting](https://github.com/phun-ky/defaults-deep/security/advisories/new)
or by email to <security@phun-ky.net>. Please don't open a public issue for a
security problem.

## How Reports Are Handled

1. **Acknowledgement:** you'll get a reply within 7 days confirming the report
   was received.
2. **Assessment:** the maintainer reproduces the issue and judges its severity,
   and may ask you for details.
3. **Fix:** a fix is developed in a private GitHub security advisory and
   released as a new version. The aim is a fix within 30 days for serious
   issues.
4. **Disclosure:** the advisory is published when the fix is released, with a
   CVE where one applies. Please keep the issue private until then.
5. **Credit:** reporters are credited in the advisory and the release notes,
   unless they ask to stay anonymous.

## Security Expectations

`defaultsDeep()` takes any number of arguments, merges the ones that are
objects into a new object (earlier arguments win), and returns it.

What you can rely on:

- **Arguments are not changed.** The result is a new object, and nested plain
  objects in it are new objects too; the arguments are only read.
- **No prototype pollution.** Keys named `__proto__`, `constructor` and
  `prototype` are skipped at every level, so input such as parsed JSON can't
  change `Object.prototype`.
- **Cycles end.** A source object that refers back to itself is merged without
  looping forever.
- **No side effects of its own.** It reads nothing and writes nothing outside
  its arguments and its result: no network, no file system, no globals, no data
  collection.
- **No dynamic code.** No `eval`, `new Function` or loading of code.
- **Non-objects are ignored.** Arguments that aren't objects (such as `null`,
  strings and numbers) are skipped, not rejected; it doesn't throw for them.
- **Releases are traceable.** Every release is built and published from GitHub
  Actions, with signed provenance (see below).

What you can't rely on:

- **A deep copy of everything.** Only plain objects are copied. Arrays, dates,
  maps, sets, class instances and functions are assigned by reference, so the
  result shares them with the arguments: changing an array in the result changes
  it in the argument it came from.
- **Getters are not avoided.** Each own enumerable property of an argument is
  read once, so a getter on an argument runs. Symbol keys are copied;
  non-enumerable properties are skipped.
- **Unlimited depth.** The merge is recursive. Input nested about 10,000 levels
  deep throws `RangeError: Maximum call stack size exceeded` (measured on
  Node.js 24); 5,000 levels merge. It throws, it never hangs. Limit the depth
  of untrusted input before passing it in
  ([#120](https://github.com/phun-ky/defaults-deep/issues/120)).

## Verifying Releases

Every release is published from GitHub Actions with npm trusted publishing, and
carries a signed provenance attestation (Sigstore) that links it to the commit
and workflow run that built it. To verify the package you've installed:

```sh
npm audit signatures
```

The provenance must name the repository `phun-ky/defaults-deep` and the
workflow `.github/workflows/publish.yml`. The package's page on npm shows this
under "Provenance", and
`npm view @phun-ky/defaults-deep@<version> dist.attestations` lists the
attestations.

Each GitHub release also has a software bill of materials attached, in CycloneDX
format (`defaults-deep-<version>.cdx.json`), listing the runtime dependencies.

## Dependencies

**Choosing them.** As few runtime dependencies as possible, and a new one is
discussed in an issue first. Runtime dependencies are declared in `dependencies`
and kept external in the builds, never bundled into them; `npm run check:pack`
fails a build that breaks this rule. They use caret ranges, so you get their
fixes without a new release of this package. A runtime dependency must be widely
used, actively maintained and under an OSI-approved licence compatible with MIT;
strong copyleft licences (GPL, AGPL) are not accepted. Development dependencies
follow the same rules, judged more loosely.

**Obtaining them.** Packages come only from the npm registry, with exact
versions locked in `package-lock.json` and installed with `npm ci` in CI. GitHub
Actions are pinned to commit SHAs.

**Tracking them.** Dependabot proposes version updates weekly, only for versions
published at least 14 days earlier, and security updates as soon as an advisory
is published. Every pull request runs
[dependency review](https://github.com/phun-ky/defaults-deep/blob/main/.github/workflows/dependency-review.yml),
and every release runs `npm audit` on runtime dependencies first.

**Fixing known vulnerabilities.** Findings are checked against the GitHub
Advisory Database:

| Finding                    | Where                  | What happens                                                                                     |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| Critical or high           | Runtime dependency     | Blocks merging (dependency review) and releasing (`npm audit`); fixed and released within 7 days |
| Critical or high           | Development dependency | Blocks merging when introduced; an existing one is fixed within 30 days                          |
| Moderate or low            | Any dependency         | Fixed with the next update, within 90 days                                                       |
| Licence outside the policy | New runtime dependency | Not merged                                                                                       |

**Accepted exceptions.** A vulnerability that can't be fixed yet and can't be
exploited through this project is allowed in dependency review and listed here,
with why it is accepted and when to remove it. There are none at the moment.

## Code Scanning

CodeQL (GitHub's default setup) analyses every pull request, every push to
`main` and the code weekly, for JavaScript, TypeScript and the GitHub Actions
workflows. The ruleset on `main` blocks merging while CodeQL reports an error,
or a security alert of high or critical severity. Other CodeQL alerts are fixed
within 90 days, or dismissed with the reason when they are false positives.
OpenSSF Scorecard runs on every push to `main` and weekly, with results at
<https://scorecard.dev/viewer/?uri=github.com/phun-ky/defaults-deep>.

## Secrets

The project keeps as few secrets as possible:

| Secret          | Used by       | For                                                   |
| --------------- | ------------- | ----------------------------------------------------- |
| `GH_TOKEN`      | `publish.yml` | Pushing release commits and tags, and GitHub releases |
| `CODECOV_TOKEN` | `check.yml`   | Uploading coverage reports                            |

Publishing to npm needs no secret: it uses short-lived OIDC tokens from GitHub.

- **Storage:** secrets are kept only as encrypted GitHub Actions secrets, never
  in the repository. Secret scanning with push protection blocks commits that
  contain one.
- **Access:** only the maintainer can view or change them, and they are not
  available to workflows run from forks or by Dependabot.
- **Rotation:** at least once a year, and immediately if one may have been
  exposed.
