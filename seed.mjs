// Run once: node seed.mjs
// Imports people and facts from Microsoft Forms Excel exports into Firestore.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const firebaseConfig = {
  apiKey: "AIzaSyAF0qZiYituBKejRuKS_yOpMGCKHW1AyoE",
  authDomain: "standup-buddy-f0af4.firebaseapp.com",
  projectId: "standup-buddy-f0af4",
  storageBucket: "standup-buddy-f0af4.firebasestorage.app",
  messagingSenderId: "477162565305",
  appId: "1:477162565305:web:90f0addd4779a72cb13568",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const REG_FILE   = "/Users/farahcadet/Downloads/Mystery Fact Code Registration(1-13).xlsx";
const FACTS_FILE = "/Users/farahcadet/Downloads/One Thing You'd Never Guess About Me(1-15).xlsx";

function padCode(code) {
  return String(code).trim().padStart(4, "0");
}

function readSheet(path) {
  const wb = XLSX.readFile(path);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
}

// Normalize column keys: collapse non-breaking spaces and extra whitespace
function norm(s) {
  return s.replace(/[ \s]+/g, " ").trim().toLowerCase();
}

function findCol(rows, prefix) {
  return Object.keys(rows[0]).find(k => norm(k).startsWith(prefix.toLowerCase()));
}

function parsePeople(rows) {
  const nameCol = findCol(rows, "first name");
  const codeCol = findCol(rows, "random 4-digit code");
  const seen = new Set();
  const people = [];
  for (const row of rows) {
    const name = row[nameCol]?.toString().trim();
    const raw  = row[codeCol];
    if (!name || raw == null) continue;
    const code = padCode(raw);
    const key  = `${code}|${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    people.push({ code, name });
  }
  return people;
}

function parseFacts(rows) {
  const factCol = findCol(rows, "share one surprising");
  const proCol  = findCol(rows, "share a professional");
  const codeCol = findCol(rows, "pick any random 4-digit");

  const facts = [];
  for (const row of rows) {
    const fact = row[factCol]?.toString().trim() || "";
    const pro  = row[proCol]?.toString().trim()  || "";
    const raw  = row[codeCol];
    if (!fact && !pro) continue;
    if (raw == null) continue;
    const code = padCode(raw);
    facts.push({ code, fact, pro });
  }
  return facts;
}

async function upsertPeople(people) {
  const existing = await getDocs(collection(db, "people"));
  const existingCodes = new Set(existing.docs.map(d => d.data().code));
  const newPeople = people.filter(p => !existingCodes.has(p.code));
  await Promise.all(newPeople.map(p => addDoc(collection(db, "people"), p)));
  return { added: newPeople.length, skipped: people.length - newPeople.length };
}

async function upsertFacts(facts) {
  const existing = await getDocs(collection(db, "facts"));
  // Match on code + fact text to avoid duplicates while preserving shownAt
  const existingKeys = new Set(existing.docs.map(d => `${d.data().code}|${d.data().fact}`));
  const newFacts = facts.filter(f => !existingKeys.has(`${f.code}|${f.fact}`));
  await Promise.all(newFacts.map(f => addDoc(collection(db, "facts"), f)));
  return { added: newFacts.length, skipped: facts.length - newFacts.length };
}

async function seed() {
  const peopleRows = readSheet(REG_FILE);
  const factsRows  = readSheet(FACTS_FILE);

  const people = parsePeople(peopleRows);
  const facts  = parseFacts(factsRows);

  console.log(`Parsed ${people.length} people and ${facts.length} facts from files.`);

  console.log("\nUpserting people (skips existing codes)...");
  const pResult = await upsertPeople(people);
  console.log(`  Added: ${pResult.added}, Skipped: ${pResult.skipped}`);

  console.log("Upserting facts (skips existing, preserves shownAt)...");
  const fResult = await upsertFacts(facts);
  console.log(`  Added: ${fResult.added}, Skipped: ${fResult.skipped}`);

  console.log("\nDone!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
