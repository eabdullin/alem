# qurt

<p align="left">
  <img src="public/logo.horiz.png" alt="Qurt logo" width="260" />
</p>

AI Coworker and assistant with provider freedom: bring your own API keys, choose your model, and chat with files/images in one place.

[![Release](https://img.shields.io/github/v/release/eabdullin/qurt?display_name=tag&sort=semver)](https://github.com/eabdullin/qurt/releases)
[![Build Desktop](https://github.com/eabdullin/qurt/actions/workflows/build-desktop.yml/badge.svg)](https://github.com/eabdullin/qurt/actions/workflows/build-desktop.yml)
[![Downloads](https://img.shields.io/github/downloads/eabdullin/qurt/total)](https://github.com/eabdullin/qurt/releases)
[![Stars](https://img.shields.io/github/stars/eabdullin/qurt?style=social)](https://github.com/eabdullin/qurt/stargazers)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Why Qurt

- **Provider freedom first**: connect your own provider keys and avoid lock-in.
- **Desktop-native workflow**: keep your chats, files, and context in one local app.
- **Built for practical AI work**: switch models, attach files/images, and iterate quickly.

## Features

- Bring-your-own-key model access
- Multi-provider model selection
- Chat with file and image attachments
- Local-first data approach for keys and chat context
- Modern Electron + React + TypeScript stack

## Landing Page

A static marketing landing page lives in [`landing/`](landing). Preview it with `npm run landing:preview` or deploy the `landing/` folder to GitHub Pages, Netlify, or any static host.

## Install

### Option 1: Download from GitHub Releases

1. Open the [latest release](https://github.com/eabdullin/qurt/releases/latest).
2. Download the installer for your platform.
3. Install and launch `Qurt`.

### Option 2: Run from source

```bash
npm install
npm run dev
```

## Development

```bash
# install dependencies
npm install

# run desktop app in development mode
npm run dev

# build app
npm run build

# package distributables
npm run dist

# lint
npm run lint

# tests
npm run test
```

## Release And Auto-Update Strategy

Maintainer checklist:

1. Build and publish desktop artifacts on release tags.
2. Publish installers/artifacts to GitHub Releases.
3. Keep `update-electron-app` configured in the main process so packaged clients can pull updates from the GitHub release feed.

## Documentation

- Product and architecture docs live in [`docs/`](docs).
- Reliability and security notes are available in [`docs/RELIABILITY.md`](docs/RELIABILITY.md) and [`docs/SECURITY.md`](docs/SECURITY.md).

## Contributing

Issues and pull requests are welcome. If you want to help shape the open-source direction, open an issue describing the use case or improvement idea first.

## License

License will be added as part of the open-source release process.
