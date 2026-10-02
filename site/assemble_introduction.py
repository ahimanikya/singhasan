"""Preserve selected source takes and combine the prose introduction in order."""
from pathlib import Path
import argparse, hashlib, json, re, shutil, subprocess, tempfile, wave

parser=argparse.ArgumentParser()
parser.add_argument('run',type=Path)
parser.add_argument('downloads',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parent
run=json.loads(args.run.read_text())
book=json.loads((root/'dist/book.js').read_text().removeprefix('window.BOOK = ').strip().removesuffix(';'))
source='\n\n'.join(p['text'] for p in book['chapters'][0]['pages'])
assert source==run['source_text']=='\n\n'.join(p['text'] for p in run['parts'])
assert hashlib.sha256(source.encode()).hexdigest()==run['source_sha256']
assert [p['part'] for p in run['parts']]==[1,2,3,4]
archive=root/'production/audio'
archive.mkdir(exist_ok=True)
boundaries=[]
with tempfile.TemporaryDirectory(prefix='singhasan-introduction-') as temp:
    temp=Path(temp)
    combined=temp/'introduction.wav'
    frames=0
    with wave.open(str(combined),'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(48000)
        for part in run['parts']:
            take=next(t for t in part['candidates'] if t['url']==part['selected'])
            assert take.get('duration'), 'Generation has not completed'
            downloaded=args.downloads/(part['title']+'.mp3')
            assert downloaded.is_file(), f'Missing part {part["part"]}'
            digest=hashlib.sha256(downloaded.read_bytes()).hexdigest()
            ident=part['selected'].rsplit('/',1)[1][:8]
            saved=archive/f'introduction-part-{part["part"]:02}-{ident}.mp3'
            if saved.exists():
                assert hashlib.sha256(saved.read_bytes()).hexdigest()==digest
            else:
                shutil.copyfile(downloaded,saved)
            decoded=temp/f'part-{part["part"]}.wav'
            subprocess.run(['afconvert','-f','WAVE','-d','LEI16@48000','-c','2',str(saved),str(decoded)],check=True)
            with wave.open(str(decoded),'rb') as audio:
                assert (audio.getnchannels(),audio.getsampwidth(),audio.getframerate())==(2,2,48000)
                seconds=audio.getnframes()/48000
                minutes,remainder=map(int,take['duration'].split(':'))
                assert abs(seconds-(60*minutes+remainder))<2, 'Take duration mismatch'
                boundaries.append({'part':part['part'],'start_seconds':frames/48000,'duration_seconds':seconds,'source_url':part['selected']})
                while data:=audio.readframes(48000):output.writeframesraw(data)
                frames+=audio.getnframes()
            part.update(status='imported',media_path='site/'+str(saved.relative_to(root)),audio_sha256=digest,duration_seconds=seconds)
    fingerprint=hashlib.sha256(''.join(p['audio_sha256'] for p in run['parts']).encode()).hexdigest()[:12]
    destination=root/f'dist/assets/audio/introduction-{fingerprint}.m4a'
    encoded=destination if destination.exists() else temp/'encoded.m4a'
    if not destination.exists():
        subprocess.run(['afconvert','-f','m4af','-d','aac','-b','192000','-q','127',str(combined),str(encoded)],check=True)
    verified=temp/'verified.wav'
    subprocess.run(['afconvert','-f','WAVE','-d','LEI16@48000','-c','2',str(encoded),str(verified)],check=True)
    with wave.open(str(verified),'rb') as audio:
        duration=audio.getnframes()/audio.getframerate()
        assert abs(duration-frames/48000)<0.2, 'Combined track was truncated'
    if not destination.exists():shutil.copyfile(encoded,destination)

duration_label=f'{int(duration)//60}:{int(duration)%60:02}'
entry={'id':'introduction','poem':None,'label':run['title'],'language':'or',
       'src':str(destination.relative_to(root/'dist')),'duration_label':duration_label,
       'duration_seconds':duration,'source_urls':[p['selected'] for p in run['parts']],
       'review':'first-take-review','sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}
(root/'introduction-audio.json').write_text(json.dumps(entry,ensure_ascii=False,indent=2)+'\n')
catalog=json.loads((root/'audio-edition.json').read_text())
catalog['tracks']=[t for t in catalog['tracks'] if t['id']!='introduction']
assert catalog['tracks'][0]['id']=='welcome'
catalog['tracks'].insert(1,entry)
(root/'audio-edition.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
run.update(status='assembled-for-review',audio=entry,part_boundaries=boundaries,
           assembly='All four selected takes concatenated in source order, retaining their complete audio. No trimming, overlap, speed or pitch changes. Decoded to stereo 48 kHz PCM, then encoded once to AAC at 192 kbps.',
           listening_review='Pronunciation, word completeness and vocal continuity remain for human review; file checks do not establish spoken accuracy.')
args.run.write_text(json.dumps(run,ensure_ascii=False,indent=2)+'\n')
(root/'production/prose-introduction-run.json').write_text(json.dumps(run,ensure_ascii=False,indent=2)+'\n')
print(f'Preserved four source MP3s; combined and decoded introduction: {duration_label}.')
