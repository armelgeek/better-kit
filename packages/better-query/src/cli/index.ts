#!/usr/bin/env node

import { program } from "commander";
import { initCommand } from "./commands/init.js";
import { generateCommand } from "./commands/generate.js";

program
	.name("better-query")
	.description("CLI for Better Query - Type-safe CRUD operations")
	.version("0.0.1");

// Add init command
program.addCommand(initCommand);

// Add generate command for type generation
program.addCommand(generateCommand);

// Parse command line arguments
program.parse();