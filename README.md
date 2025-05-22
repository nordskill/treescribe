# Treescribe

A simple utility to generate directory tree from your file system which just works.

## What is Treescribe?

Treescribe creates a visual representation of your folders and files in a tree-like structure, making it easy to:
- Document your project structure
- Share your folder organization with others
- Understand complex directory hierarchies at a glance

### Example Output

```
my-project
├── index.js
├── package.json
├── README.md
├── src
│   ├── components
│   │   ├── Button.js
│   │   └── Header.js
│   └── utils
│       └── helpers.js
└── tests
    └── unit
        └── helpers.test.js
```

## Advantages

- **Simple to use**: Run it in any directory to get a well-formatted tree of that directory
- **Customizable**: Ignore specific folders or limit the depth of traversal
- **Cross-platform**: Works on Windows, macOS, and Linux with consistent output
- **Organized output**: Directories are listed first, followed by files in alphabetical order

## Installation

```bash
npm install -g treescribe
```

## Basic Usage

Generate a tree for the current directory:

```bash
treescribe
```

## Options

Ignore specific directories (separated with `|`):

```bash
treescribe --ignore 'node_modules | .git | dist'
```

Limit the depth of directories to traverse:

```bash
treescribe --level 3
```

Save the output to a file:

```bash
treescribe --output 'tree.txt'
```

You also can use multiple options in any combinations:

```bash
treescribe --level 2 --ignore 'node_modules' --output 'tree.txt'
```

And a compact way to write options:

```bash
treescribe -l 2 -i 'node_modules' -i 'tree.txt'
```
