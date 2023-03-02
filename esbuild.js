const esbuild = require('esbuild');
// const fs = require('fs');
// const path = require('path');
 
esbuild.buildSync({
logLevel: 'info',
entryPoints: [ "src/index.js" ],
bundle: true,
sourcemap: true,
platform: 'node',
external: ['aws-sdk'],
target: ['node16'],
outfile: `build/index/bundle.js`
});

// TODO: Split up the handlers into their own files instead of having them all in index
// const handlers = fs.readdirSync('./src/handlers/', {withFileTypes: true})
//     .filter(item => !item.isDirectory())
//     .map(item => item.name);

// handlers.forEach(handler => {
//     const entryPoint = path.join('src', 'handlers', handler)
//     esbuild.buildSync({
//     logLevel: 'info',
//     entryPoints: [ entryPoint ],
//     bundle: true,
//     platform: 'node',
//     minify: true,
//     target: ['node12'],
//     outfile: `build/handlers/${path.parse(handler).name}/bundle.js`
//     });
// });