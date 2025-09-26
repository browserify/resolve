# lazy-import-heavy-js-deps: Lazily load heavy, optional JS/TS dependencies only inside the code paths that need them to reduce cold-start time, memory footprint, and energy use

## Qualify

Applies to TypeScript/JavaScript application (non-generated, non-third-party) source files.

Glob patterns:
- **/*.ts
- **/*.tsx
- **/*.js
- **/*.jsx
- !**/node_modules/**
- !**/dist/**
- !**/build/**
- !**/.next/**
- !**/.turbo/**
- !**/coverage/**
- !**/vendor/**
- !**/third_party/**
- !**/third-parties/**
- !**/external/**

Most impactful for CLI entrypoints, serverless handlers, and feature-modular libraries.

## Detect

Script: `detect.ts`

Identify files where a heavy module is imported at module scope (via `import … from 'pkg'` or `const … = require('pkg')`) but is only used inside functions/methods/blocks (i.e., no top-level usage). Prefer precise AST-based checks using the TypeScript compiler API.

## Resolve

Script: `resolve.ts`

When safe, remove the top-level heavy import and insert a function-local `require('pkg')` statement at the beginning of each function/method that uses it. Preserve identifiers and aliases for namespace and named imports. Skip transforms that are unsafe for ESM-only semantics (e.g., default imports that cannot be accurately emulated with `require`) or when usages occur in top-level initializers.
