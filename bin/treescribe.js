#!/usr/bin/env node
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { generateTree } from '../lib/generateTree.js';

const HELP_MESSAGE = `
treescribe - Generates a tree of a current directory.

Usage:
  treescribe [options]

Options:
  --output <file>, -o <file>    Save the tree to the specified file.
                                (e.g., "tree.txt", "my folder/output.log")
  --ignore <paths>, -i <paths>  Ignores specified paths (no wildcards).
                                Paths are pipe-separated.
                                (e.g., "node_modules | .git")
  --level <depth>, -l <depth>   Specifies the maximum depth of the tree.
                                (e.g., 3)
  --help, -h                    Show this help message.

Examples:
  treescribe
  treescribe --output "tree.txt"
  treescribe --level 2 --ignore "node_modules | dist"
  treescribe -l 3 -i ".env | README.md" -o "tree.txt"
`;

main();

async function main() {
    try {
        const { values, positionals } = parseArgs({
            options: {
                output: {
                    type: 'string',
                    short: 'o',
                },
                ignore: {
                    type: 'string',
                    short: 'i',
                },
                level: {
                    type: 'string',
                    short: 'l',
                },
                help: {
                    type: 'boolean',
                    short: 'h',
                },
            },
            allowPositionals: true,
            strict: true
        });

        if (values.help) {
            console.log(HELP_MESSAGE);
            process.exit(0);
        }

        const treeOptions = {};
        const targetPath = process.cwd();

        if (values.level !== undefined) {
            const levelNum = parseInt(values.level, 10);
            if (isNaN(levelNum) || levelNum < 0) {
                console.error('Error: --level must be a non-negative integer.');
                process.exit(1);
            }
            treeOptions.maxDepth = levelNum;
        } else {
            treeOptions.maxDepth = Infinity;
        }

        if (values.ignore) {
            treeOptions.ignore = values.ignore.split('|').map(p => p.trim()).filter(p => p.length > 0);
        } else {
            treeOptions.ignore = [];
        }

        const treeString = generateTree(targetPath, treeOptions);

        if (values.output) {
            const outputPath = path.resolve(values.output);
            try {
                const outputDir = path.dirname(outputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                fs.writeFileSync(outputPath, treeString);
                console.log(`File created: ${outputPath}`);
            } catch (err) {
                console.error(`Error writing to file ${outputPath}:`, err.message);
                process.exit(1);
            }
        } else {
            console.log(treeString);
        }

    } catch (error) {
        if (error.code && error.code.startsWith('ERR_PARSE_ARGS_')) {
            console.error(error.message);
            console.log('\nRun `treescribe --help` for usage information.');
        } else {
            console.error('An unexpected error occurred:', error.message);
            if (error.stack) console.error(error.stack);
        }
        process.exit(1);
    }
}