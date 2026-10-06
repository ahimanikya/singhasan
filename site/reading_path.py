"""An optional thematic route through the book; never changes chapter order."""
from html import escape as e

ROUTE = 'contents.html#reading-path'
PATH_ID = 'power-and-people'
TITLE = 'Five poems on power and the people'
DESCRIPTION = 'A guided reading of five poems from Singhasan: how power begins, creates distance, and meets the questions of ordinary people.'
STOPS = [
    (1, 'Where a ruler begins', 'A pasture, a quarrel, a voice giving orders. Start in an ordinary field and watch the relationship between the young man and his companions change.', 'When does someone begin to look like a ruler?'),
    (24, 'The distance power creates', 'A cowherd becomes a king. Familiar names give way to grand titles, and the palace gate becomes a barrier.', 'What changes when the person you knew becomes someone you cannot reach?'),
    (6, 'What power refuses to see', 'Dhritarashtra listens to reports of his sons’ deaths and still dreams of the throne. The poem brings the Mahabharata’s blind king into a question that outlives him.', 'What does he hear—and what does he refuse to face?'),
    (38, 'The people waiting outside', 'The scene widens from a ruler to a country in the grip of an election. Public display fills the sky; fear and hunger remain below.', 'Whose experience is lost in the struggle to win?'),
    (62, 'The child who asks', 'A child watches a frightened king in a musical drama. The fear reaches beyond the stage, and the child’s question follows it.', 'Where does the performance end, and the world outside begin?'),
]

def poem_link(n):
    return f'poem-{n}.html?path={PATH_ID}'

def invitation(home=False):
    if home:
        return f'''<aside class="path-invitation path-invitation-home" id="reading-path-invitation" lang="en"><div><h2>Not sure where to begin?</h2><p>Try five poems on power and the people.</p></div><a class="path-text-link" href="{ROUTE}">Find your starting point <span aria-hidden="true">→</span></a></aside>'''
    stops=''.join(f'''<li id="path-stop-{n}"><a href="{poem_link(n)}"><span class="path-step-number" aria-hidden="true">{order}</span><span><small>Poem {n}</small><span class="path-stop-label">{e(title)}</span></span></a></li>''' for order,(n,title,*_) in enumerate(STOPS,1))
    return f'''<section class="reading-path" id="reading-path" aria-labelledby="reading-path-title" lang="en"><header><p class="eyebrow">Five poems · A reading path</p><h2 id="reading-path-title">Power and the people</h2><p>Follow power from an ordinary field to a child’s question.</p><a class="path-start" href="{poem_link(1)}">Start reading <span aria-hidden="true">→</span></a></header><ol class="path-stops">{stops}</ol></section>'''

def path_panel(n):
    numbers=[s[0] for s in STOPS]
    if n not in numbers:return ''
    index=numbers.index(n)
    if index<len(numbers)-1:
        next_number,next_title,*_=STOPS[index+1]
        action=f'<a data-path-link href="{poem_link(next_number)}">Continue to poem {next_number}<span aria-hidden="true"> →</span></a><p class="path-panel-next">{e(next_title)}</p>'
    else:
        action=f'<p>You’ve reached the last poem in this path.</p><a data-path-link href="{ROUTE}">Return to the reading path <span aria-hidden="true">→</span></a>'
    return f'''<section class="reading-path-context" data-reading-path="{PATH_ID}" aria-labelledby="path-context-title" lang="en" hidden><p class="eyebrow">Reading path · {index+1} of {len(STOPS)}</p><h2 id="path-context-title">{TITLE}</h2>{action}<a class="path-panel-overview" data-path-link href="{ROUTE}">See all five stops</a></section>'''
