# MAKUCO.md <!--- Edit this file to provide project-specific guidance for Makuco agents -->

This file provide guidance for Makuco agents.

## What is [Project Name]?

[Project Name] is a [brief description of the project, its purpose, and its main features].
Uses [technology stack] and follows [architecture style] principles.

## Tech Stack

- TypeScript
- Node.js
- [Other relevant technologies, frameworks, libraries]

## Architecture

- Entry point: src/index.ts — the main file that initializes the application and starts the server.
- Domains: src/domains/ — contains the core business logic, organized by domain. Each domain has its own folder with services, models, and repositories.
- Shared: src/utils/ — contains shared utilities, helpers, and common code used across domains.
- Configuration: src/config/ — contains configuration files and environment variable management.

## Code Rules

- **Do NOT** use `any` type. Always strive for precise typing to ensure type safety and maintainability.

## Design System

- [Design System Name] is the design system used in this project, providing a set of reusable components, styles, and guidelines to ensure a consistent and cohesive user interface across the application.

## Key Patterns

- Path alias ~/ maps to src/ (configured in tsconfig.json paths and resolved by tsup/esbuild)
- vscode codegenerator maps to .github/ folder in target projects; claude maps to .claude/
- Starter assets use __dirname to resolve paths at runtime, which points into dist/ after build
- The project is in Portuguese (BR) — prompts, error messages, and documentation are in Portuguese
