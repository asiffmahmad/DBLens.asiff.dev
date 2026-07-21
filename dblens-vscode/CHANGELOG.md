# Changelog

All notable changes to the **DBLens Companion** extension will be documented in this file.

## [0.2.0] - 2026-07-21

### Added
- Extension icon on VS Code Marketplace.
- Comprehensive README with badges, usage guide, and feature list.
- CHANGELOG.md for release tracking.
- Unit test scaffolding for extension command verification.
- `.vscodeignore` to keep the VSIX package size minimal.
- Robust error handling and terminal cleanup in `extension.ts`.

## [0.1.0] - 2026-07-21

### Added
- Initial release of DBLens Companion.
- `DBLens: Start Local Server` command to launch the DBLens Next.js app from within VS Code.
- Reuses existing terminal session if the server is already running.
- Opens dashboard at `http://localhost:3000/dashboard` via a one-click notification button.
