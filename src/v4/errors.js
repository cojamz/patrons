// Errors shown to players are plain sentences. Network, load and code-chunk failures all read the same way.
export const OFFLINE = 'Can’t reach the server. Check your connection.';
const NETWORK = /failed to fetch|dynamically imported module|importing a module script failed|loading (css )?chunk|networkerror|network request failed|load failed|timeout|err_internet|offline/i;

export const isNetworkError = e => NETWORK.test(String((e && e.message) || e || ''));

/** A message a player can act on. Engine/session messages are already written for people; network noise isn't. */
export function friendlyError(e) {
  const m = String((e && e.message) || e || '');
  if (!m || isNetworkError(m)) return OFFLINE;
  if (/room not found/i.test(m)) return 'No room with that code.';
  return m;
}
