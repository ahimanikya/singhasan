import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const localModules=process.env.SINGHASAN_BUILD_MODULES;
const require=createRequire(localModules?resolve(localModules,'../package.json'):import.meta.url);
const {build}=require('esbuild');
await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:{'private-feedback':'src/feedback.ts',engagement:'src/engagement.ts'},outdir:'../dist/assets/services',bundle:true,format:'esm',splitting:true,target:'es2022',minify:true,legalComments:'eof',nodePaths:localModules?[localModules]:[]});
