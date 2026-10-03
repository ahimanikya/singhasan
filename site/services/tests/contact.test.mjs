import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const {code}=await transform(readFileSync(new URL('../src/feedback.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'});
async function submit(values,search='?poem=poem-1.html'){
 const status={textContent:''},button={},poemField={value:''};let handler;
 const form={querySelector:s=>s.includes('role=')?status:s.includes('name=poem')?poemField:s.includes('button')?button:{textContent:''},reportValidity:()=>true,addEventListener:(_,fn)=>handler=fn};
 const location={origin:'https://singhasan.poemwithoutborders.org',protocol:'https:',hostname:'singhasan.poemwithoutborders.org',search,href:''};
 runInNewContext(code,{document:{querySelector:()=>form},location,URL,URLSearchParams,fetch:async()=>({ok:true,json:async()=>({firebase:{enabled:false}})}),FormData:class{get(key){return key==='poem'?poemField.value:values[key]}},encodeURIComponent});
 await handler({preventDefault(){}});return{status,location};
}
test('private email fallback contains the selected poem and never claims delivery',async()=>{
 const {status,location}=await submit({name:'Reader',email:'reader@example.test',message:'A personal reading note.',reason:'note'});
 const url=new URL(location.href);assert.equal(url.protocol,'mailto:');assert.equal(decodeURIComponent(url.pathname),'ahimanikya@gmail.com');assert.match(url.searchParams.get('body'),/https:\/\/singhasan.poemwithoutborders.org\/poem-1.html/);assert.match(status.textContent,/draft/);assert.doesNotMatch(status.textContent,/saved|sent successfully/);
});
test('external poem parameter cannot be inserted into private feedback',async()=>{
 const {location}=await submit({name:'Reader',email:'reader@example.test',message:'A note',reason:'note'},'?poem=https://untrusted.example');assert.doesNotMatch(decodeURIComponent(location.href),/untrusted/);
});
test('whitespace-only messages are rejected without opening email',async()=>{
 const {status,location}=await submit({name:'Reader',email:'reader@example.test',message:'   ',reason:'note'});assert.equal(location.href,'');assert.match(status.textContent,/Please/);
});
