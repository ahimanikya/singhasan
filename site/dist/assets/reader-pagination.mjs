/** Pack a reading collection into pages without stranding a new poem's opening. */
export function packReadingPages(units, fits) {
  const pages = [];
  let page = [];
  const flush = () => { if (page.length) pages.push(page); page = []; };
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (unit.type === 'title' && page.length) {
      // Reserve the title/byline plus three verse lines (or the whole short poem).
      const opening = [unit];
      for (let j = i + 1; j < units.length && units[j].type !== 'title' && opening.length < 4; j++) opening.push(units[j]);
      if (!fits([...page, ...opening])) flush();
    }
    if (page.length && !fits([...page, unit])) {
      // An unusually tall title and first line stay together, with scroll fallback.
      if (!(page.length === 1 && page[0].type === 'title' && unit.type === 'line' && page[0].poemIndex === unit.poemIndex)) flush();
    }
    page.push(unit);
  }
  flush();
  return pages;
}
