"""Render the listening edition from recordings that are available locally."""
from html import escape as e
import json

def render_audio(root, chapters, icon):
    catalog=json.loads((root/'audio-edition.json').read_text())
    tracks=catalog['tracks']
    for track in tracks:
        if not (root/'dist'/track['src']).is_file():
            raise ValueError(f"Missing audio: {track['src']}")
    rows=[]
    for track in tracks:
        number=track.get('poem')
        is_intro=track['id']=='introduction'
        label=f'Poem {number:02}' if number else ('Introduction' if is_intro else ('Opening' if track['id']=='welcome' else 'Closing'))
        title=next((line.strip() for c in chapters if c['number']==number for p in c['pages'] for line in p['text'].splitlines() if line.strip()),track['label']) if number else track['label']
        track['title']=title
        track['label']=label
        track['language']='or' if number or is_intro else 'en'
        track['reading_route']='intro.html' if is_intro else (f'poem-{number}.html' if number else 'book.html')
        rows.append(f'<li><button type="button" data-track="{e(track["id"])}"><span class="track-number">{e(label)}</span><span lang="{track["language"]}">{e(title)}</span><span class="track-duration">{e(track.get("duration_label",""))}</span></button></li>')
    data=json.dumps(tracks,ensure_ascii=False).replace('<','\\u003c')
    count=sum(bool(t.get('poem')) for t in tracks)
    progress=f'{count} of 68 poems available. More readings will follow.' if count<68 else 'All sixty-eight poems, in their original Odia.'
    if count==68 and any(t['id']=='introduction' for t in tracks):
        progress='The introduction and all sixty-eight poems, in their original Odia.'
    body=f'''<section class="listening-edition" lang="en"><header class="listening-heading"><p class="eyebrow">The listening edition</p><h1>Let the poems unfold.</h1><p>Singhasan · Pravakar Satapathy</p><p>{progress}</p></header><div class="listening-layout"><aside class="listening-cover"><img src="assets/covers/singhasan-earth-beneath-throne-v2-lettered.png" width="1024" height="1536" alt="Singhasan by Pravakar Satapathy"><a href="book.html">{icon('read')}Open the illustrated book</a></aside><div><section class="listening-player" aria-label="Book player"><p id="audio-label" class="eyebrow"></p><h2 id="audio-title"></h2><audio id="book-audio" controls preload="metadata" aria-label="Book recording"></audio><div class="audio-controls"><button id="audio-previous" type="button">← Previous</button><label>Speed <select id="audio-speed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.25">1.25×</option></select></label><button id="audio-next" type="button">Next →</button></div><div class="audio-options"><label><input id="audio-continuous" type="checkbox" checked> Continue to the next track</label><a id="audio-read" href="book.html">Read the poem</a><a id="audio-follow" href="read-along.html?track=welcome">Listen &amp; follow</a></div><p id="audio-status" role="status" aria-live="polite">Choose a reading and press play.</p></section><ol class="audio-tracks" aria-label="Book recordings">{''.join(rows)}</ol></div></div><noscript><p>Enable JavaScript to use the continuous player.</p><ul>{''.join(f'<li><a href="{e(t["src"])}">{e(t["label"])}</a></li>' for t in tracks)}</ul></noscript></section><script type="application/json" id="audio-catalog">{data}</script><script src="assets/audio-edition.js" defer></script>'''
    return body, {0 if t['id']=='introduction' else t['poem'] for t in tracks if t.get('poem') or t['id']=='introduction'}
