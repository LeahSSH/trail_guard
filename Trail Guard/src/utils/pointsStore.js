import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, "..", "..", "data");
const pointsFile = join(dataDir, "points.json");

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(pointsFile)) writeFileSync(pointsFile, JSON.stringify({}, null, 2));
}

export function readPoints() {
  ensureStore();
  try {
    const raw = readFileSync(pointsFile, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}

export function writePoints(map) {
  ensureStore();
  writeFileSync(pointsFile, JSON.stringify(map, null, 2));
}

export function getPoints(userId) {
  const map = readPoints();
  return map[userId] || 0;
}

export function setPoints(userId, value) {
  const map = readPoints();
  map[userId] = value;
  writePoints(map);
  return map[userId];
}

export function addPoints(userId, delta) {
  const current = getPoints(userId);
  return setPoints(userId, current + delta);
}
