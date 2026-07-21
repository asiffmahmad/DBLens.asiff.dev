# DBLens Companion

> The official VS Code companion extension for **DBLens** — a full-stack database schema intelligence platform.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/asiffmahmad/DBLens.asiff.dev)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.80.0-007ACC.svg)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is DBLens?

DBLens is a powerful database schema monitoring and intelligence platform. It connects to your MySQL databases and provides:

- 📸 **Schema Snapshots** — Point-in-time captures of your full schema structure.
- 🔁 **Schema Diff & Compare** — Visual diff between two snapshots with rollback SQL generation.
- 🏥 **Health Scoring** — Automated grading of your schema (A–F) based on best practices.
- 🔬 **Impact Radius Analysis** — Before you alter a table, see every View, Trigger, and FK that depends on it.
- 📊 **Explorer** — Browse tables, views, routines, triggers, and events with full structural detail.

---

## Features

### `DBLens: Start Local Server`

This command does everything for you in one click:

1. Opens a new terminal named **"DBLens Server"**.
2. Runs `npm run dev` from your workspace root.
3. Shows a notification with an **"Open Dashboard"** button that launches `http://localhost:3000/dashboard` in your browser.

If the server is already running, the command will simply bring the terminal back into focus.

---

## Requirements

- **Node.js** v18 or higher installed and available in `PATH`.
- The **DBLens project** (`Schmea_Validator`) opened as your VS Code workspace folder.

---

## Usage

1. Open the DBLens workspace in VS Code.
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux).
3. Type **`DBLens: Start Local Server`** and press `Enter`.
4. Click **Open Dashboard** in the notification.

---

## Extension Settings

This extension does not contribute any configurable settings at this time.

---

## Known Issues

- The extension assumes `npm run dev` is available in the workspace root. Ensure you have run `npm install` first.

---

## Release Notes

### 0.1.0

Initial release. See [CHANGELOG.md](CHANGELOG.md) for details.

---

## Repository

[https://github.com/asiffmahmad/DBLens.asiff.dev](https://github.com/asiffmahmad/DBLens.asiff.dev)

**Enjoy!**
