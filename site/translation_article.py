"""The translation essay uses the shared site shell; no private package is published."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'articles/thirty-languages'
ROUTE='thirty-languages-and-the-journey-of-a-poem.html'
TITLE='Thirty languages and the journey of a poem'
HERO='assets/articles/thirty-languages/poetry-across-languages-hero-ff3dea84bf3d-1672.webp'
DESCRIPTION='How population, literary traditions and thoughtful translation can guide a multilingual poetry collection.'
ALT='Two readers comparing a book and a sheet of writing at a shared table.'
def render_article():
    (ROOT/'dist/assets/translation-article.css').write_text((SOURCE/'article.css').read_text())
    return (SOURCE/'body.html').read_text()
def article_feature():
    return (SOURCE/'feature.html').read_text()
