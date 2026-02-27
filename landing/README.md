# Qurt Landing Page

Static marketing landing page for the Qurt desktop app.

## Local preview

From the project root:

```bash
npx serve landing
```

Or open `landing/index.html` directly in a browser (relative asset paths work when served from the `landing/` directory).

## Deploy

The `landing/` folder is self-contained. Deploy its contents to any static host:

- **GitHub Pages**: Enable Pages from a branch, set the source to a branch that contains `landing/` as the root, or copy `landing/` contents into `docs/` and enable Pages from the `docs/` folder.
- **Netlify / Vercel**: Point the build output or publish directory to `landing/`.
- **Any static host**: Upload the contents of `landing/` (index.html, styles.css, assets/).

## Refresh assets

If you update `public/logo.horiz.png`, `public/logo.vert.png`, or `public/icon.png`, copy them to `landing/assets/`:

```bash
copy public\logo.horiz.png landing\assets\
copy public\logo.vert.png landing\assets\
copy public\icon.png landing\assets\
```

On macOS/Linux:

```bash
cp public/logo.horiz.png public/logo.vert.png public/icon.png landing/assets/
```
