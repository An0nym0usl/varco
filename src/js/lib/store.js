// localStorage wrapper. Every access is guarded: private windows, blocked storage or a full quota
// must never break the page — the app keeps working, it just cannot remember.
import { shrinkScan, reviveScan } from './normalize.js';

const NS = 'varco:';

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function read(key, fallback) {
  try {
    const s = storage()?.getItem(NS + key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    storage()?.removeItem(NS + key);
  } catch {
    /* storage unavailable */
  }
}

export function getLastScan() {
  const s = read('lastScan', null);
  if (!s) return null;
  try {
    return reviveScan(s);
  } catch {
    return null;
  }
}

export function setLastScan(scan) {
  return write('lastScan', shrinkScan(scan, 50));
}

export function getProjects() {
  const list = read('projects', []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => p && typeof p.id === 'string' && Array.isArray(p.scans))
    .map((p) => ({
      id: p.id,
      name: String(p.name ?? 'Progetto').slice(0, 120),
      client: String(p.client ?? '').slice(0, 120),
      createdAt: p.createdAt,
      scans: p.scans.map((s) => { try { return reviveScan(s); } catch { return null; } }).filter(Boolean),
    }));
}

export function countSaved(projects = getProjects()) {
  return projects.reduce((n, p) => n + p.scans.length, 0);
}

export function saveScan(scan, { projectName = 'Il mio sito', maxSaved = Infinity } = {}) {
  const projects = getProjects();
  if (projects.some((p) => p.scans.some((s) => s.id === scan.id))) return { ok: true, already: true };
  if (countSaved(projects) >= maxSaved) return { ok: false, reason: 'limit' };
  let project = projects.find((p) => p.name === projectName);
  if (!project) {
    project = { id: `prj_${Date.now().toString(36)}`, name: projectName, client: '', createdAt: new Date().toISOString(), scans: [] };
    projects.push(project);
  }
  project.scans.push(shrinkScan(scan));
  return write('projects', projects) ? { ok: true, projectId: project.id } : { ok: false, reason: 'storage' };
}

export function deleteScan(scanId) {
  const projects = getProjects()
    .map((p) => ({ ...p, scans: p.scans.filter((s) => s.id !== scanId) }))
    .filter((p) => p.scans.length > 0);
  write('projects', projects);
  return projects;
}

export function findScan(scanId) {
  for (const p of getProjects()) {
    const s = p.scans.find((x) => x.id === scanId);
    if (s) return s;
  }
  return null;
}
