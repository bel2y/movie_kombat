/* Repeat the full list around the entire travel path, including both endpoints. */
function buildReel(movies, selectedId, reverse, viewportWidth) {
  const travel = 44;
  // 105px is the smallest reel card. A full viewport of overscan also covers resizing.
  const padding = Math.ceil(viewportWidth / 105) + movies.length;
  const stop = padding + travel;
  const selected = movies.findIndex(movie => movie.id === selectedId);
  if (!movies.length || selected < 0) throw new Error('Selected movie is missing');
  const strip = Array.from({ length: padding * 2 + travel + 1 }, (_, index) =>
    movies[((selected + index - stop) % movies.length + movies.length) % movies.length]);
  return {
    movies: reverse ? strip.reverse() : strip,
    from: reverse ? stop : padding,
    to: reverse ? padding : stop,
  };
}
if (typeof module !== 'undefined') module.exports = { buildReel };
