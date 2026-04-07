import esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isWatch = process.argv.includes('--watch');

// Process CSS with tailwind via postcss CLI
function buildCSS() {
  try {
    execSync('npx tailwindcss -i src/index.css -o dist/index.css --minify', {
      cwd: path.dirname(new URL(import.meta.url).pathname),
      stdio: 'pipe'
    });
    console.log('CSS built');
  } catch (e) {
    console.error('CSS build failed:', e.stderr?.toString());
  }
}

// Copy index.html with script/css tags
function copyHTML() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vestora Dashboard</title>
  <link rel="stylesheet" href="/dashboard/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234a6cf7'/><text x='16' y='22' text-anchor='middle' fill='white' font-size='18' font-weight='bold' font-family='sans-serif'>V</text></svg>">
</head>
<body>
  <div id="root"></div>
  <script src="/dashboard/app.js"></script>
</body>
</html>`;
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('dist/index.html', html);
}

// Build JS bundle
async function buildJS() {
  const opts = {
    entryPoints: ['src/main.jsx'],
    bundle: true,
    outfile: 'dist/app.js',
    format: 'esm',
    jsx: 'automatic',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    define: {
      'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    },
    minify: !isWatch,
    sourcemap: isWatch,
    target: 'es2020',
  };

  if (isWatch) {
    const ctx = await esbuild.context(opts);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(opts);
    console.log('JS built');
  }
}

copyHTML();
buildCSS();
await buildJS();
console.log('Dashboard build complete!');
