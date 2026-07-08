#!/usr/bin/env node

const os = require("os");
const path = require("path");
const fs = require("fs");
const prompts = require("prompts");

// ANSI Color Codes
const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	bgGreen: "\x1b[42m",
	bgBlue: "\x1b[44m",
	black: "\x1b[30m",
};

// Tool Configuration
const tools = [
	{
		id: "antigravity",
		name: "Antigravity",
		path: "~/.gemini/GEMINI.md",
		desc: "Google Antigravity global agent rules file.",
	},
	{
		id: "claude",
		name: "Claude Code",
		path: "~/.claude/CLAUDE.md",
		desc: "Automatically read by Claude Code CLI at session start.",
	},
	{
		id: "roo-code",
		name: "Roo Code / Roo Cline",
		path: "~/.roo/rules/global_rules.md",
		desc: "Reads all markdown files in this rules directory.",
	},
	{
		id: "windsurf",
		name: "Windsurf (Cascade)",
		path: "~/.codeium/windsurf/memories/global_rules.md",
		desc: "Cascade's global rule memory file.",
	},
	{
		id: "cline-docs",
		name: "Cline (Documents Rules)",
		path: "~/Documents/Cline/Rules/global_rules.md",
		desc: "Cline global rules directory.",
	},
	{
		id: "cline-agents",
		name: "Common (AGENTS.md)",
		path: "~/.agents/AGENTS.md",
		desc: "Common path recognized by Cline and other agents.",
	},
	{
		id: "copilot-jetbrains",
		name: "GitHub Copilot (JetBrains)",
		path:
			process.platform === "win32"
				? "%LOCALAPPDATA%/github-copilot/intellij/global-copilot-instructions.md"
				: process.platform === "darwin"
					? "~/Library/Application Support/github-copilot/intellij/global-copilot-instructions.md"
					: "~/.config/github-copilot/intellij/global-copilot-instructions.md",
		desc: "Global copilot instructions for JetBrains IDEs.",
	},
	{
		id: "copilot-cli",
		name: "GitHub Copilot (CLI)",
		path: "~/.copilot/copilot-instructions.md",
		desc: "Default Copilot CLI instructions file.",
	},
	{
		id: "aider",
		name: "Aider",
		path: "~/.aider.conventions.md",
		desc: "Global conventions file (will optionally add to ~/.aider.conf.yml).",
	},
	{
		id: "zcode",
		name: "Z.ai ZCode",
		path: "~/.zcode/AGENTS.md",
		desc: "ZCode Agentic IDE global instructions.",
	},
	{
		id: "opencode",
		name: "OpenCode",
		path: "~/.config/opencode/AGENTS.md",
		desc: "OpenCode central instructions path.",
	},
	{
		id: "pi-agent",
		name: "Pi Agent",
		path: "~/.pi/agent/AGENTS.md",
		desc: "Pi Coding Agent global rules.",
	},
	{
		id: "openai-codex",
		name: "OpenAI Codex",
		path: "~/.codex/AGENTS.md",
		desc: "Codex agent global instructions.",
	},
	{
		id: "kimi",
		name: "Kimi Code CLI",
		path: "~/.kimi-code/AGENTS.md",
		desc: "Kimi Code CLI global instructions.",
	},
	{
		id: "vibe",
		name: "Mistral Vibe CLI",
		path: "~/.vibe/AGENTS.md",
		desc: "Mistral Vibe CLI global rules.",
	},
];

// Helper to resolve paths with env vars and tilde
function resolvePath(p) {
	if (!p) return "";
	let resolved = p;
	// Replace Windows %LOCALAPPDATA% or similar env variables
	resolved = resolved.replace(
		/%([^%]+)%/g,
		(_, name) => process.env[name] || "",
	);
	// Replace tilde with home directory
	resolved = resolved.replace(/^\~/, os.homedir());
	return path.resolve(resolved);
}

// Standard Markdown Seed Template
const defaultTemplate = `# Global AI Agent Rules & Preferences

This file serves as the single source of truth for all AI coding assistants and agents.

## Coding Style & Rules
- Keep functions small, focused, and single-purpose.
- Always use descriptive variable and function names.
- Handle errors gracefully; log errors with appropriate context.
- Keep documentation up-to-date and maintain comment/docstring integrity.

## Git & Workflow
- Use standard conventional commits (e.g., \`feat: add rules linker\`, \`fix: handle EPERM symlinks\`).
- Keep commits atomic; write clear, concise commit messages.
- Never commit secrets, credentials, or \`.env\` files.
`;

// Helper to back up files
function backupFile(filePath) {
	if (!fs.existsSync(filePath)) return null;
	const stats = fs.lstatSync(filePath);
	if (stats.isSymbolicLink()) {
		try {
			fs.unlinkSync(filePath);
			return "symlink_removed";
		} catch (e) {
			return null;
		}
	}

	const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
	const backupPath = `${filePath}.bak_${dateStr}`;
	fs.renameSync(filePath, backupPath);
	return backupPath;
}

// Helper to create link/copy
function linkFile(sourceFile, targetFile, preserveOption) {
	const targetDir = path.dirname(targetFile);
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	let stats = null;
	try {
		stats = fs.lstatSync(targetFile);
	} catch (e) {}

	if (stats) {
		if (preserveOption === "append") {
			try {
				const existingContent = fs.readFileSync(targetFile, "utf8");
				fs.appendFileSync(
					sourceFile,
					`\n\n## Imported from ${path.basename(targetFile)}\n\n${existingContent}`,
				);
			} catch (e) {
				console.log(
					`  ${colors.red}Error appending contents of ${path.basename(targetFile)}: ${e.message}${colors.reset}`,
				);
			}
			backupFile(targetFile);
		} else if (preserveOption === "backup") {
			const backupPath = backupFile(targetFile);
			if (backupPath && backupPath !== "symlink_removed") {
				console.log(
					`  ${colors.dim}Backed up existing file to ${path.basename(backupPath)}${colors.reset}`,
				);
			}
		} else if (preserveOption === "overwrite") {
			try {
				fs.unlinkSync(targetFile);
			} catch (e) {
				try {
					fs.rmSync(targetFile, { force: true });
				} catch (err) {}
			}
		} else {
			// Skip
			return { success: false, skipped: true };
		}
	}

	// Create link
	try {
		fs.symlinkSync(sourceFile, targetFile, "file");
		return { success: true, type: "symlink" };
	} catch (symlinkErr) {
		// Fall back to hard link (requires no admin privileges on Windows)
		try {
			fs.linkSync(sourceFile, targetFile);
			return { success: true, type: "hardlink" };
		} catch (hardlinkErr) {
			// Fall back to copy
			try {
				fs.copyFileSync(sourceFile, targetFile);
				return { success: true, type: "copy" };
			} catch (copyErr) {
				return { success: false, error: copyErr };
			}
		}
	}
}

// Check if a target file is linked to the source file (symlink or hardlink)
function isLinked(sourceFile, targetFile) {
	try {
		const lstats = fs.lstatSync(targetFile);

		// 1. Check if it's a symbolic link
		if (lstats.isSymbolicLink()) {
			const linkTarget = fs.readlinkSync(targetFile);
			const resolvedLinkTarget = path.resolve(
				path.dirname(targetFile),
				linkTarget,
			);
			return resolvedLinkTarget === path.resolve(sourceFile);
		}

		// 2. Check if it's a hard link (same inode and device)
		if (fs.existsSync(sourceFile)) {
			const sourceStats = fs.statSync(sourceFile);
			const targetStats = fs.statSync(targetFile);
			return (
				sourceStats.dev === targetStats.dev &&
				sourceStats.ino === targetStats.ino
			);
		}
	} catch (e) {}
	return false;
}

// Remove Aider conventions file config from ~/.aider.conf.yml
function removeAiderConfig() {
	const configPath = resolvePath("~/.aider.conf.yml");
	if (!fs.existsSync(configPath)) return;
	let content = fs.readFileSync(configPath, "utf8");

	const lines = content.split("\n");
	const filteredLines = lines.filter(
		(line) => !line.includes(".aider.conventions.md"),
	);

	fs.writeFileSync(configPath, filteredLines.join("\n"), "utf8");
}

// Update Aider config file
function updateAiderConfig() {
	const configPath = resolvePath("~/.aider.conf.yml");
	let content = "";
	if (fs.existsSync(configPath)) {
		content = fs.readFileSync(configPath, "utf8");
	}

	if (content.includes(".aider.conventions.md")) {
		return "already_configured";
	}

	const relativePath = "~/.aider.conventions.md";
	if (!content.trim()) {
		content = `# Aider Configuration\nread:\n  - ${relativePath}\n`;
	} else if (content.includes("read:")) {
		content = content.replace(/(read:\s*)/, `$1\n  - ${relativePath}`);
	} else {
		content += `\n\n# Added by Agent Rules Linker\nread:\n  - ${relativePath}\n`;
	}

	fs.writeFileSync(configPath, content, "utf8");
	return "updated";
}

// Main flow
async function main() {
	console.log(`
┌────────────────────────────────────────────────────────┐
│  ${colors.bold}${colors.cyan}AGENT RULES${colors.reset}                                           │
│  Sync your AI coding instructions centrally            │
└────────────────────────────────────────────────────────┘
  `);

	// Handle Ctrl+C gracefully for prompts
	const onCancel = (prompt) => {
		console.log("\n" + colors.red + "Cancelled by user." + colors.reset);
		process.exit(1);
	};

	// 1. Confirm Source of Truth file
	const defaultSource = "~/global-rules.md";
	const sourcePrompt = await prompts(
		{
			type: "text",
			name: "source",
			message: "Specify your global instructions file:",
			initial: defaultSource,
		},
		{ onCancel },
	);

	const sourceFile = resolvePath(sourcePrompt.source);
	console.log(
		`Global instructions path: ${colors.bold}${sourceFile}${colors.reset}\n`,
	);

	// 2. Initialize Source of Truth if missing
	if (!fs.existsSync(sourceFile)) {
		const confirmPrompt = await prompts(
			{
				type: "confirm",
				name: "create",
				message:
					"Global instructions file does not exist. Create it with a standard template?",
				initial: true,
			},
			{ onCancel },
		);

		if (confirmPrompt.create) {
			const sourceDir = path.dirname(sourceFile);
			if (!fs.existsSync(sourceDir)) {
				fs.mkdirSync(sourceDir, { recursive: true });
			}
			fs.writeFileSync(sourceFile, defaultTemplate, "utf8");
			console.log(
				`${colors.green}Created global instructions file at ${sourceFile}${colors.reset}\n`,
			);
		} else {
			console.log(
				`${colors.red}Abort: Global instructions file is required to proceed.${colors.reset}`,
			);
			process.exit(1);
		}
	}

	// 3. Detect currently linked agents and map to choices
	const choices = tools.map((t) => {
		const targetFile = resolvePath(t.path);
		const linked = isLinked(sourceFile, targetFile);
		return {
			title: t.name,
			value: t,
			description:
				`${t.path} ${linked ? colors.cyan + "(linked)" + colors.reset : ""}`.trim(),
			selected: linked,
		};
	});

	// 4. Let user select tools
	const agentsPrompt = await prompts(
		{
			type: "multiselect",
			name: "agents",
			message: "Select coding agents you want to link:",
			choices,
			hint: "- Space to toggle, Enter to confirm",
			min: 0,
		},
		{ onCancel },
	);

	const selectedTools = agentsPrompt.agents || [];
	const previouslyLinked = tools.filter((t) =>
		isLinked(sourceFile, resolvePath(t.path)),
	);

	// Tools to link: selected ones that are NOT currently linked
	const newToolsToLink = selectedTools.filter(
		(t) => !isLinked(sourceFile, resolvePath(t.path)),
	);

	// Tools to unlink: previously linked ones that are NOT selected anymore
	const toolsToUnlink = previouslyLinked.filter(
		(t) => !selectedTools.some((sel) => sel.id === t.id),
	);

	// If no changes needed
	if (newToolsToLink.length === 0 && toolsToUnlink.length === 0) {
		console.log(
			`\n${colors.yellow}No changes needed. All active links are up to date.${colors.reset}`,
		);
		process.exit(0);
	}

	// 5. Unlink deselected tools
	if (toolsToUnlink.length > 0) {
		console.log(
			`\n${colors.bold}Unlinking deselected agents:${colors.reset}`,
		);
		for (const tool of toolsToUnlink) {
			const targetFile = resolvePath(tool.path);
			console.log(
				`  Unlinking ${colors.bold}${tool.name}${colors.reset}...`,
			);
			try {
				const stats = fs.lstatSync(targetFile);
				if (stats.isSymbolicLink()) {
					fs.unlinkSync(targetFile);
				} else {
					fs.rmSync(targetFile, { force: true });
				}
				console.log(
					`    ${colors.green}Unlinked successfully.${colors.reset}`,
				);

				if (tool.id === "aider") {
					try {
						removeAiderConfig();
						console.log(
							`    ${colors.dim}Cleaned Aider conventions from ~/.aider.conf.yml.${colors.reset}`,
						);
					} catch (e) {
						console.log(
							`    ${colors.yellow}Could not clean ~/.aider.conf.yml: ${e.message}${colors.reset}`,
						);
					}
				}
			} catch (e) {
				console.log(
					`    ${colors.red}Failed to unlink: ${e.message}${colors.reset}`,
				);
			}
		}
	}

	// 6. Link new tools
	if (newToolsToLink.length > 0) {
		console.log(`\n${colors.bold}Linking new agents:${colors.reset}`);
		const preservePrompt = await prompts(
			{
				type: "select",
				name: "option",
				message:
					"If a target instructions file already exists for new agents, what should we do?",
				choices: [
					{
						title: "Append & Link",
						value: "append",
						description:
							"Append existing instructions to Source of Truth, back up the file, and link",
					},
					{
						title: "Backup & Link",
						value: "backup",
						description: "Rename existing file to .bak and link",
					},
					{
						title: "Overwrite & Link",
						value: "overwrite",
						description: "Directly delete existing file and link",
					},
					{
						title: "Skip",
						value: "skip",
						description: "Do not modify the file for this agent",
					},
				],
			},
			{ onCancel },
		);

		const preserveOption = preservePrompt.option;
		console.log();

		let aiderSelected = false;
		for (const tool of newToolsToLink) {
			const targetFile = resolvePath(tool.path);
			console.log(`Linking ${colors.bold}${tool.name}${colors.reset}...`);
			console.log(`  Target: ${colors.dim}${targetFile}${colors.reset}`);

			const result = linkFile(sourceFile, targetFile, preserveOption);

			if (result.skipped) {
				console.log(`  ${colors.yellow}Skipped.${colors.reset}`);
			} else if (result.success) {
				let typeLabel = "";
				if (result.type === "symlink")
					typeLabel = `${colors.green}Symlink created successfully.${colors.reset}`;
				if (result.type === "hardlink")
					typeLabel = `${colors.cyan}Hard link created successfully (Windows symlink fallback).${colors.reset}`;
				if (result.type === "copy")
					typeLabel = `${colors.yellow}Copy created successfully (linking not possible on this environment).${colors.reset}`;
				console.log(`  ${typeLabel}`);
			} else {
				console.log(
					`  ${colors.red}Failed: ${result.error ? result.error.message : "Unknown error"}${colors.reset}`,
				);
			}

			if (tool.id === "aider") {
				aiderSelected = true;
			}
		}

		// Aider Post-process
		if (aiderSelected) {
			console.log(`\n${colors.bold}Aider Post-Setup:${colors.reset}`);
			const configureAiderPrompt = await prompts(
				{
					type: "confirm",
					name: "configure",
					message:
						"Would you like to auto-update ~/.aider.conf.yml to load ~/.aider.conventions.md?",
					initial: true,
				},
				{ onCancel },
			);

			if (configureAiderPrompt.configure) {
				try {
					const aiderRes = updateAiderConfig();
					if (aiderRes === "updated") {
						console.log(
							`  ${colors.green}Successfully updated ~/.aider.conf.yml.${colors.reset}`,
						);
					} else if (aiderRes === "already_configured") {
						console.log(
							`  ${colors.dim}Already configured in ~/.aider.conf.yml.${colors.reset}`,
						);
					}
				} catch (e) {
					console.log(
						`  ${colors.red}Failed to update ~/.aider.conf.yml: ${e.message}${colors.reset}`,
					);
				}
			}
		}
	}

	// 7. Render tips for editors without file-based global rules
	console.log(`
┌────────────────────────────────────────────────────────┐
│  ✨  ${colors.bold}SUCCESSFULLY COMPLETED${colors.reset}                            │
│                                                        │
│  Your central rule file is now linked. Any changes to  │
│  your global instructions will automatically sync to   │
│  the active agents!                                    │
└────────────────────────────────────────────────────────┘

💡 ${colors.bold}Editor integration tips:${colors.reset}
- ${colors.bold}Cursor:${colors.reset} Copy your rules to ${colors.cyan}Cursor Settings > General > Rules for AI${colors.reset}.
- ${colors.bold}VS Code Copilot Chat:${colors.reset} In settings, configure ${colors.cyan}chat.instructionsFilesLocations${colors.reset} 
  to point to the directory containing your source rules file.
`);
}

main().catch((err) => {
	console.error(
		`${colors.red}An error occurred: ${err.message}${colors.reset}`,
	);
	process.exit(1);
});
