// Refresh public JSON-LD ratings; no API credentials are needed or stored.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const films = vm.runInNewContext(read('src/movies.js') + ';movieLists.flat()');
// Legacy application IDs are retained to preserve history and exclusions.
const ids = {79443:79433,11823:15566,'local:you-are-my-only-one-1993':83614,'local:feedback-2020':598354};
async function update() {
  const data = {source:'https://www.themoviedb.org', fetchedAt:new Date().toISOString(), movies:{}};
  for (const film of films) {
    const id = ids[film.id] || film.id;
    const source = 'https://www.themoviedb.org/movie/' + id;
    const response = await fetch(source, {signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw Error(`${film.title}: HTTP ${response.status}`);
    const html = await response.text();
    const match = html.match(/"aggregateRating"\s*:\s*(\{[^}]+\})/);
    if (!match) throw Error(`${film.title}: no structured rating`);
    const value = JSON.parse(match[1]);
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    if (!title?.includes('(' + film.year + ')')) throw Error(`${film.title}: year mismatch: ${title}`);
    const voteAverage = Number(value.ratingValue), voteCount = Number(value.ratingCount);
    if (!Number.isFinite(voteAverage) || voteAverage<0 || voteAverage>10 || !Number.isInteger(voteCount) || voteCount<0) throw Error(`${film.title}: invalid rating`);
    data.movies[film.id] = {tmdbId:id,voteAverage,voteCount,title,source};
    console.log(`${film.title}: ${voteAverage} (${voteCount})`);
  }
  // Write only after every film succeeds, preserving the last good snapshot on errors.
  fs.writeFileSync(path.join(root,'src/tmdb-ratings.js'), '// Public TMDB rating snapshot. Refresh with scripts/update-tmdb-ratings.cjs.\nconst tmdbRatings = '+JSON.stringify(data,null,2)+';\n');
}
update().catch(error=>{console.error(error.message);process.exitCode=1;});
