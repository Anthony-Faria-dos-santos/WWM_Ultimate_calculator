# Contributing to WWM_Ultimate_calculator

First of all, thank you for your interest in contributing!
This project aims to provide the Where Winds Meet community with reliable theorycrafting tools and data.

Please take a moment to read this guide before opening an issue or submitting a pull request.

## Ways to contribute

You can help this project by:
- Reporting bugs or incorrect calculations
- Proposing new features or QoL improvements
- Improving formulas or data based on verified community research
- Improving documentation, examples and UI/UX

## Before you start

- Make sure there is an existing issue for the bug/feature you are working on, or create one first.
- Check open issues labeled `good first issue` or `help wanted` if you're new to the project.
- Be respectful and follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development setup

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/WWM_Ultimate_calculator.git
   cd WWM_Ultimate_calculator
   ```

2. Create a new branch for your work:
   ```bash
   git checkout -b feature/my-awesome-change
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start the dev server:
   ```bash
   pnpm dev
   ```

5. Make sure tests and linting pass:
   ```bash
   pnpm test
   pnpm lint
   ```

## Coding guidelines

- Keep the codebase consistent with the existing style (formatting, naming, file structure).
- Prefer small, focused pull requests instead of large, multi-purpose ones.
- Add or update documentation when you introduce new features or change existing behavior.
- When changing formulas or data:
  - Provide a clear explanation and references (patch notes, in-game testing, community sheets, etc.).
  - Add comments where necessary to document non-obvious behavior.

## Submitting a pull request

1. Commit your changes with clear and descriptive messages:
   ```bash
   git commit -m "fix: correct damage formula for XYZ weapon"
   ```

2. Push your branch:
   ```bash
   git push origin feature/my-awesome-change
   ```

3. Open a pull request from your branch to the `dev` branch of this repository.
   - Describe the problem and how your change solves it.
   - Link related issues (e.g. `Closes #42`).
   - Mention any breaking changes or required migrations.

## Reporting bugs

When opening a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots or videos if relevant
- Your browser, OS and project version/commit hash

Bug reports with a minimal reproduction are much easier and faster to handle.

## Security issues

Please **do not** report security vulnerabilities in public issues.
Instead, follow the instructions in our [Security Policy](./SECURITY.md).

---

Thanks again for helping improve WWM_Ultimate_calculator for the Where Winds Meet community!
