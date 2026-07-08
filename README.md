# Agent Rules 🤖

A command-line tool that allows you to manage a single **Source of Truth** markdown file for your AI coding instructions and links/syncs it to all your AI coding agents (Claude Code, Roo Code, Windsurf, Cline, Copilot, Aider, Codex, ZCode, OpenCode, Pi Agent, etc.).

## Features

- **Centralized Source of Truth**: Define your persona, coding standards, preferred libraries, and workflow configurations in one place (defaults to `~/global-rules.md`).
- **Interactive Console UI**: An easy-to-use checklist terminal interface to select which agents to target.
- **Smart Merger**: If you already have existing rule files for specific agents, you can append their contents to your Source of Truth or back them up.
- **Robust Symlink/Hardlink Fallbacks**:
    - Symlinks on Windows require Developer Mode or Administrator privileges.
    - If a symlink fails, **Agent Rules** automatically falls back to a **Hard Link** (`fs.linkSync`), which behaves identically to a symlink for file edits but requires no special privileges!
    - If both fail, it falls back to a copy.
- **Special Aider Support**: Automatically appends the Conventions file to your global `~/.aider.conf.yml` list so Aider loads it automatically.

---

## Installation & Running

Since it has zero external dependencies, you can run it directly using Node.js.

### Run directly with Node

Navigate to this directory and run:

```bash
node index.js
```

### Install globally (Optional)

To make the `agent-rules` command available anywhere on your system:

```bash
npm link
# or
npm install -g .
```

Then simply run:

```bash
agent-rules
```

---

## Supported AI Coding Agents

| Agent                          | Global Instructions Path                                                | Notes                                       |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------- |
| **Antigravity**                | `~/.gemini/GEMINI.md`                                                   | Google Antigravity global agent rules file. |
| **Claude Code**                | `~/.claude/CLAUDE.md`                                                   | Automatically loaded at startup.            |
| **Roo Code / Roo Cline**       | `~/.roo/rules/global_rules.md`                                          | Reads all markdown files in rules folder.   |
| **Windsurf (Cascade)**         | `~/.codeium/windsurf/memories/global_rules.md`                          | Central memories configuration.             |
| **Cline (Documents)**          | `~/Documents/Cline/Rules/global_rules.md`                               | Cline's central rules directory.            |
| **Cline / Common**             | `~/.agents/AGENTS.md`                                                   | Shared standard agent instructions path.    |
| **GitHub Copilot (JetBrains)** | `%LOCALAPPDATA%/github-copilot/intellij/global-copilot-instructions.md` | Local appdata path.                         |
| **GitHub Copilot (CLI)**       | `~/.copilot/copilot-instructions.md`                                    | Default CLI config.                         |
| **Aider**                      | `~/.aider.conventions.md`                                               | Handled via `~/.aider.conf.yml` read block. |
| **Z.ai ZCode**                 | `~/.zcode/AGENTS.md`                                                    | Central ZCode instructions path.            |
| **OpenCode**                   | `~/.config/opencode/AGENTS.md`                                          | Standard OpenCode path.                     |
| **Pi Agent**                   | `~/.pi/agent/AGENTS.md`                                                 | Pi Agent instructions path.                 |
| **OpenAI Codex**               | `~/.codex/AGENTS.md`                                                    | OpenAI Codex agent global rules file.       |

---

## Editor Integration Tips

For tools that store rules in Settings UI or databases instead of the filesystem:

- **Cursor**: Open **Cursor Settings > General > Rules for AI** and copy-paste your rules there.
- **VS Code Copilot**: Add your source rules folder path to the `chat.instructionsFilesLocations` setting in VS Code.
