# Contributing to Lopaka

Thanks for helping improve Lopaka! Bug reports, fixes, documentation, and new ideas are welcome.

## Before you start

- Check [Issues](https://github.com/sbrin/lopaka/issues) and [Pull Requests](https://github.com/sbrin/lopaka/pulls) for existing work.
- Bug fixes, documentation changes, and small improvements can be submitted as pull requests without prior approval.
- For substantial features or architectural changes, open an issue first to discuss the problem and proposed approach. This helps avoid work that may not fit the project.
- You can also use [Discussions](https://github.com/sbrin/lopaka/discussions) for questions and ideas.

## Development setup

Lopaka uses Vue 3, TypeScript, and Vite. Use **pnpm**, not npm. The repository declares **pnpm 10.30.3** in `package.json`; the Docker build uses Node.js 22.

1. Fork the repository (or create a topic branch if you have write access).
2. Install a compatible Node.js version and pnpm.
3. From the repository root, run:

```sh
pnpm install
pnpm dev
```

The development server is configured for HTTPS on port 3000 (`https://localhost:3000`). Your browser may ask you to trust its local development certificate.

To build the documentation and application:

```sh
pnpm build
```

The [README](README.md) also describes running the project with Docker Compose.

## Tests and specifications

Tests use Vitest and usually live next to their source files (`*.test.ts`). Test program logic rather than visual canvas or DOM rendering.

```sh
pnpm test                              # Run the full test suite
pnpm test -- src/platforms/u8g2.test.ts # Run a focused test file
pnpm test-report                       # Run tests with coverage
```

- **Bug fixes:** add or update a regression test where practical.
- **New user-facing features:** write or update the relevant Gherkin `.feature` file under `specs/` **before** implementing the feature, then add tests for the logic.
- **Changes to existing user-facing behavior:** update the existing Gherkin spec after implementation to reflect the changed behavior.
- **Internal refactors or bug fixes without changed user-visible behavior:** do not change Gherkin specs just for the sake of it.
- Keep specifications organized by feature, following the `src/` structure where applicable. Extend an existing feature spec rather than creating a duplicate.
- **Documentation-only changes:** no new tests are required.
- Run `pnpm test` before submitting code changes; run `pnpm build` when changes affect the build or production output.
- Code-generation tests use snapshots. Review snapshot changes and update them only when the new output is intentional.

For additional architecture and specification conventions, see [AGENTS.md](AGENTS.md).

## Submitting a pull request

1. Create a focused branch from the current `main` and keep changes scoped to one problem.
2. Make your changes and include the appropriate tests/specifications described above.
3. Open a pull request targeting `main`; do not push changes directly to the default branch.
4. Describe **what changed**, **why**, and **how you tested it**. Link an issue if one exists. For visible UI changes, include screenshots or a short recording when helpful.
5. Check the automated GitHub Actions results, investigate failures, and respond to review feedback.

The maintainer reviews contributions and decides when to merge. Please allow time for review; submitting a pull request does not guarantee acceptance. There is no fixed minimum coverage percentage.

## Community and safety

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). Never include passwords, API keys, tokens, private customer information, or production data in issues, tests, commits, or pull requests. Use synthetic examples instead.

Contributions to the source repository are subject to its existing [Apache License 2.0](LICENSE).
