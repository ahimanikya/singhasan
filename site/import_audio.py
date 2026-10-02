"""Import completed, normally downloaded MP3s from a saved production run."""
from pathlib import Path
import argparse, hashlib, json, re, shutil, subprocess

parser=argparse.ArgumentParser()
parser.add_argument('run',type=Path)
parser.add_argument('downloads',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parent
run=json.loads(args.run.read_text())
catalog=[]
for track in [{**run['opening'],'kind':'welcome'},*run['tracks'],{**run['closing'],'kind':'closing'}]:
    if not track.get('selected'):
        continue
    take=next(t for t in track['candidates'] if t['url']==track['selected'])
    if not take.get('duration'):
        continue
    source=args.downloads/(track['title']+'.mp3')
    if not source.exists():
        continue
    info=subprocess.run(['afinfo',str(source)],capture_output=True,text=True,check=True).stdout
    duration=float(re.search(r'estimated duration:\s*([\d.]+)',info)[1])
    minutes,seconds=map(int,take['duration'].split(':'))
    if abs(duration-(minutes*60+seconds))>2:
        raise ValueError(f'Duration mismatch for {track["title"]}')
    if source.stat().st_size<1000 or source.read_bytes()[:100].startswith(b'version https://git-lfs'):
        raise ValueError('Invalid audio file')
    number=track.get('section')
    identifier=f'poem-{number}' if number else track['kind']
    stem=f'poem-{number:02}' if number else track['kind']
    filename=f'{stem}-{take["url"].rsplit("/",1)[1][:8]}.mp3'
    dest=root/'dist/assets/audio'/filename
    dest.parent.mkdir(exist_ok=True)
    if not dest.exists():shutil.copyfile(source,dest)
    digest=hashlib.sha256(dest.read_bytes()).hexdigest()
    if digest!=hashlib.sha256(source.read_bytes()).hexdigest():
        raise ValueError('Existing recording differs; preserve it and use a new version')
    label=f'Poem {number:02}' if number else ('English welcome' if track['kind']=='welcome' else 'English closing')
    catalog.append({'id':identifier,'poem':number,'label':label,
        'src':'assets/audio/'+filename,'duration_label':take['duration'],
        'duration_seconds':duration,'source_url':take['url'],
        'review':'first-take-review','sha256':digest})
(root/'audio-edition.json').write_text(json.dumps({'tracks':catalog},ensure_ascii=False,indent=2)+'\n')
print(f'Imported and checked {len(catalog)} recordings.')
