#!/usr/bin/env node

import { program } from "commander";
import { addCommand } from "./commands/add.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";

program
	.name("better-admin")
	.description(
		"CLI for Better Admin - Install components with automatic shadcn/ui dependencies",
	)
	.version("0.0.1");

// Add commands
program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);

// Parse command line arguments
program.parse();
