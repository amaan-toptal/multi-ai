// Every record carries the same three forms of one instant so it can be joined
// across the master ledger, per-run files, variant repos and git commit messages.
export function stamp(d = new Date()) {
  return {
    unix: Math.floor(d.getTime() / 1000),
    iso: d.toISOString(),
    human: d.toUTCString().replace(/ GMT$/, " UTC"),
  };
}

/** Git trailer appended to every commit message. */
export function stampTrailer(s = stamp()) {
  return `Timestamp: ${s.unix} (${s.iso})`;
}
