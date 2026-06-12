#!/usr/bin/env bash
# Собирает весь сайт в один самодостаточный index-standalone.html
# (инлайнит CSS, ui.js и бандл 3D-сцены вместе с three.js).
set -euo pipefail
cd "$(dirname "$0")"

npx esbuild js/scene.js --bundle --minify --format=iife \
  --alias:three=./js/vendor/three.module.min.js --outfile=/tmp/blnr-scene.bundle.js

python3 - <<'PY'
import re
html = open('index.html').read()
html = html.replace('<link rel="stylesheet" href="css/style.css" />',
                    '<style>\n' + open('css/style.css').read() + '\n</style>')
html = html.replace('<script src="js/ui.js" defer></script>',
                    '<script>\n' + open('js/ui.js').read() + '\n</script>')
html = re.sub(r'<script type="importmap">.*?</script>\s*', '', html, flags=re.S)
html = html.replace('<script type="module" src="js/scene.js"></script>',
                    '<script>\n' + open('/tmp/blnr-scene.bundle.js').read() + '\n</script>')
open('index-standalone.html', 'w').write(html)
print('OK -> index-standalone.html')
PY
