/*
 * Team "mystery fact" feature, parked for future use.
 *
 * This used to run on every page load even though nothing on screen showed the
 * facts, which pulled the whole Firebase SDK (~470 kB) into the bundle and made
 * two Firestore reads per visit. It is not imported anywhere now, so Firebase is
 * left out of the build. To bring the feature back, import this hook in
 * StandupCommandCenter and render `fact`, `revealed`, `reveal` and `next`.
 */
import { useEffect, useState } from "react";

function pickRandom(pool, excludeId = null) {
  const candidates = excludeId ? pool.filter((f) => f.id !== excludeId) : pool;
  if (candidates.length === 0) return pool[0] ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function buildDisplayFact(fact, peopleMap) {
  if (!fact) return null;
  const usePro = fact.pro && Math.random() < 0.5;
  return {
    ...fact,
    clue: usePro ? fact.pro : fact.fact,
    name: peopleMap[fact.code] ?? "???",
  };
}

export function useTeamFacts() {
  const [pool, setPool] = useState([]);
  const [peopleMap, setPeopleMap] = useState({});
  const [fact, setFact] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Loaded on demand so Firebase is only downloaded when this feature is used.
        const [{ db }, { collection, getDocs }] = await Promise.all([
          import("../firebase"),
          import("firebase/firestore"),
        ]);
        const [factsSnap, peopleSnap] = await Promise.all([
          getDocs(collection(db, "facts")),
          getDocs(collection(db, "people")),
        ]);
        if (cancelled) return;

        const allFacts = factsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const map = {};
        peopleSnap.docs.forEach((d) => {
          const { code, name } = d.data();
          map[code] = name;
        });
        const unseen = allFacts.filter((f) => !f.shownAt);
        const nextPool = unseen.length > 0 ? unseen : allFacts;

        setPeopleMap(map);
        setPool(nextPool);
        setFact(buildDisplayFact(pickRandom(nextPool), map));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function reveal() {
    if (!fact) return;
    setRevealed(true);
    const [{ db }, { doc, updateDoc, serverTimestamp }] = await Promise.all([
      import("../firebase"),
      import("firebase/firestore"),
    ]);
    await updateDoc(doc(db, "facts", fact.id), { shownAt: serverTimestamp() });
  }

  function next() {
    setRevealed(false);
    setFact(buildDisplayFact(pickRandom(pool, fact?.id), peopleMap));
  }

  return { fact, revealed, loading, error, reveal, next };
}
