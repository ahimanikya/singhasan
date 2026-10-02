"""Create acoustic word timings for the exact catalog audio; never estimate from duration.
Requires torch==2.8.0 torchaudio==2.8.0 uroman numpy and FFmpeg.
Model: https://docs.pytorch.org/audio/2.8/tutorials/forced_alignment_for_multilingual_data_tutorial.html
Run with --ids 19 first; omit --ids for the introduction and all poems.
Large model/emission caches belong outside the published site.
"""
import argparse, hashlib, json, os, re, subprocess, time
from pathlib import Path
import numpy as np
import torch, torchaudio, uroman

p=argparse.ArgumentParser();p.add_argument('--ids',nargs='*',type=int);p.add_argument('--ffmpeg',required=True);p.add_argument('--cache',required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[1]; cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(4)
bundle=torchaudio.pipelines.MMS_FA
model=bundle.get_model().eval(); device='mps' if torch.backends.mps.is_available() else 'cpu';model.to(device)
tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();romanizer=uroman.Uroman()
poems=json.loads((root/'dist/assets/reading-book.json').read_text())['poems']
catalog=json.loads((root/'audio-edition.json').read_text())['tracks']
out=root/'dist/assets/audio-sync';out.mkdir(exist_ok=True)
for poem in poems:
 if args.ids is not None and poem['id'] not in args.ids:continue
 track=next(t for t in catalog if t['id']==('poem-'+str(poem['id']) if poem['id'] else 'introduction'))
 result_path=out/(track['id']+'.json')
 source_text=json.dumps(poem['variants']['or']['stanzas'],ensure_ascii=False,separators=(',',':'))
 text_hash=hashlib.sha256(source_text.encode()).hexdigest()
 if result_path.exists():
  old=json.loads(result_path.read_text())
  if old['audioSha256']==track['sha256'] and old['textSha256']==text_hash:
   print(track['id'],'already aligned',flush=True);continue
 started=time.time();print(track['id'],'processing',flush=True)
 raw=subprocess.check_output([args.ffmpeg,'-v','error','-i',str(root/'dist'/track['src']),'-f','f32le','-ac','1','-ar','16000','-'])
 samples=np.frombuffer(raw,dtype=np.float32).copy();duration=len(samples)/16000
 emission_path=cache/(track['sha256']+'.npy')
 if emission_path.exists(): emission=torch.from_numpy(np.load(emission_path))
 else:
  chunks=[];hop=320;chunk_samples=20*16000;context=16000
  with torch.inference_mode():
   for start in range(0,len(samples),chunk_samples):
    end=min(len(samples),start+chunk_samples);lo=max(0,start-context);hi=min(len(samples),end+context)
    waveform=torch.from_numpy(samples[lo:hi]).unsqueeze(0).to(device)
    probs,_=model(waveform);probs=probs[0].cpu()
    first=(start-lo)//hop;last=(end-lo)//hop
    chunks.append(probs[first:min(last,len(probs))]);del waveform,probs
  emission=torch.cat(chunks);np.save(emission_path,emission.numpy())
 words=[];tokens=[];line=0
 for stanza_id,stanza in enumerate(poem['variants']['or']['stanzas']):
  for text in stanza:
   for match in re.finditer(r'\S+',text):
    normal=re.sub("[^a-z']",'',romanizer.romanize_string(match.group(),lcode='ori').lower().replace('’',"'"))
    if not normal:continue
    words.append({'line':line,'offset':match.start(),'endOffset':match.end(),'stanza':stanza_id,'text':match.group(),'romanized':normal});tokens.append(normal)
   line+=1
 # A wildcard at either end absorbs introductions, breath and musical endings.
 spans=aligner(emission,tokenizer(['*']+tokens+['*']))[1:-1]
 cues=[]
 for word,span in zip(words,spans):
  score=sum(s.score*len(s) for s in span)/sum(len(s) for s in span)
  cues.append({**word,'start':round(span[0].start*.02,3),'end':round(span[-1].end*.02,3),'score':round(score,3)})
 scores=[c['score'] for c in cues];low=sum(s<.10 for s in scores)
 # The wildcard dimension equals the best non-blank score and must be excluded
 # from greedy decoding; including it collapses the independent transcript to '*'.
 labels=bundle.get_labels();greedy=emission[:,:labels.index('*')].argmax(-1).unique_consecutive().tolist();decoded=''.join(labels[i] for i in greedy if i!=0)
 (cache/(track['id']+'-decoded.txt')).write_text(decoded)
 result={'version':1,'id':track['id'],'section':poem['id'],'language':'or','audioSha256':track['sha256'],'textSha256':text_hash,'method':'MMS_FA acoustic forced alignment, uroman ori; 20-second inference chunks with 1-second context','review':'machine-aligned; fluent listening review pending','duration':duration,'wordCount':len(cues),'meanScore':round(sum(scores)/len(scores),3),'lowScoreWords':low,'cues':cues}
 result_path.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 print(track['id'],len(cues),'words','mean',result['meanScore'],'low',low,'in',round(time.time()-started,1),'s',flush=True)
