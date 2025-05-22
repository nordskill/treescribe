import fs from 'node:fs';
import path from 'node:path';

/**
 * Determines if an entry should be ignored based on a list of ignore paths.
 * An entry is ignored if its relative path starts with any of the provided ignore paths.
 *
 * @param {string} relativePath - The path of the entry relative to the scan root.
 * @param {Array<string>} ignorePaths - An array of path strings to ignore.
 *   These should be relative to the scan root. (e.g., "node_modules", ".git", "_backup/js").
 * @returns {boolean} True if the entry should be ignored, false otherwise.
 */
function shouldIgnore(relativePath, ignorePaths) {
    if (!ignorePaths || ignorePaths.length === 0) {
        return false;
    }

    // Normalize relativePath to use forward slashes for consistent comparison
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');

    return ignorePaths.some(ignorePath => {
        // Normalize ignorePath for comparison
        const normalizedIgnorePath = ignorePath.replace(/\\/g, '/');

        // Check if the normalized relative path is exactly the ignore path (for files or exact dirs)
        // OR if the normalized relative path starts with the ignore path + '/' (for directories and their contents)
        return normalizedRelativePath === normalizedIgnorePath ||
            normalizedRelativePath.startsWith(normalizedIgnorePath + '/');
    });
}

/**
 * Formats a directory entry with appropriate tree branch characters.
 * 
 * @param {string} name - The name of the file or directory.
 * @param {string} prefix - The string prefix to prepend (for tree indentation).
 * @param {boolean} isLast - Whether this is the last item in its containing directory.
 * @returns {string} The formatted entry string with tree characters.
 */
function formatEntry(name, prefix, isLast) {
    return `${prefix}${isLast ? '└── ' : '├── '}${name}`;
}

/**
 * Sorts directory entries with directories first, then files, both in alphabetical order.
 * 
 * @param {fs.Dirent} a - First directory entry to compare.
 * @param {fs.Dirent} b - Second directory entry to compare.
 * @returns {number} -1 if a comes before b, 1 if a comes after b, 0 if they are equal.
 */
function sortDirectoryEntries(a, b) {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
}

/**
 * Recursively builds a tree structure of directories and files.
 * 
 * @param {string} dir - The current directory path being processed.
 * @param {number} currentDepth - The current depth in the directory hierarchy.
 * @param {number} maxDepth - The maximum depth to traverse.
 * @param {string} prefix - The prefix string for the current level (for tree formatting).
 * @param {Array<string>} ignorePathsNormalized - Array of normalized paths to ignore.
 * @param {string} rootDir - The root directory of the tree (for relative path calculation).
 * @returns {Array<string>} Array of formatted tree lines for this directory branch.
 */
function buildTreeRecursively(dir, currentDepth, maxDepth, prefix, ignorePathsNormalized, rootDir) {
    let treeLines = [];
    if (currentDepth > maxDepth) {
        return treeLines;
    }

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        treeLines.push(`${prefix}└── [Error reading directory: ${path.basename(dir)} (${error.code})]`);
        return treeLines;
    }

    entries.sort(sortDirectoryEntries);

    const filteredEntries = entries.filter(entry => {
        const entryFullPath = path.join(dir, entry.name);
        const entryRelativePath = path.relative(rootDir, entryFullPath);
        return !shouldIgnore(entryRelativePath, ignorePathsNormalized);
    });

    filteredEntries.forEach((entry, index) => {
        const isLast = index === filteredEntries.length - 1;
        const entryFullPath = path.join(dir, entry.name);

        treeLines.push(formatEntry(entry.name, prefix, isLast));

        if (entry.isDirectory()) {
            const newPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
            treeLines = treeLines.concat(
                buildTreeRecursively(entryFullPath, currentDepth + 1, maxDepth, newPrefix, ignorePathsNormalized, rootDir)
            );
        }
    });

    return treeLines;
}

/**
 * Generates a tree representation of a directory structure.
 * 
 * @param {string} startPath - The path to start generating the tree from.
 * @param {Object} options - Options for tree generation.
 * @param {number} [options.maxDepth=Infinity] - Maximum depth to traverse.
 * @param {Array<string>} [options.ignore=[]] - Array of paths to ignore.
 * @returns {string} The formatted tree as a string.
 * @throws {Error} If the path doesn't exist or isn't a directory.
 */
export function generateTree(startPath, options = {}) {
    const {
        maxDepth = Infinity,
        ignore = [] // Expects an array of path strings (e.g., "node_modules", ".git", "some_folder/sub_folder")
    } = options;

    const resolvedPath = path.resolve(startPath);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
        throw new Error(`Path not found or is not a directory: ${resolvedPath}`);
    }

    // Normalize ignore paths once to use forward slashes
    const ignorePathsNormalized = (ignore || []).map(p => p.replace(/\\/g, '/'));

    const rootName = path.basename(resolvedPath);
    const tree = [rootName];
    const subTree = buildTreeRecursively(resolvedPath, 1, maxDepth, '', ignorePathsNormalized, resolvedPath);

    return tree.concat(subTree).join('\n');
}