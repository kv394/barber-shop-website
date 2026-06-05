# CI/CD Pipeline Documentation

This project uses **GitHub Actions** to run continuous integration on every push and pull request to the `main` branch.

## Workflow Overview

- **Checkout** the repository.
- **Cache** `node_modules` using the built‑in npm cache.
- **Set up** Node.js (v20) and PostgreSQL (via Docker service).
- Run `npm audit fix --force` before any test steps to automatically fix known vulnerabilities.
- **Lint** with `npm run lint` (includes accessibility linting via `eslint-plugin-jsx-a11y`).
- **Unit tests** with `npm run test`.
- **Integration tests** spin up a PostgreSQL container, run migrations, and execute the `test:integration` script.
- **Build** the project with `npm run build`.

## Scripts

- `pretest` & `pretest:integration`: Run `npm audit fix --force`.
- `test:integration`: Starts PostgreSQL, runs DB push, then executes integration tests.

## Caching Headers

Static assets served by Next.js now include `Cache‑Control` headers for long‑term caching, configured in `next.config.mjs`.

## Accessibility

The ESLint configuration extends `plugin:jsx-a11y/recommended` to enforce accessibility best practices.

---
*Generated automatically by the CI automation setup.*
