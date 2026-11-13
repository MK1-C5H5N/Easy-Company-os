import { seed } from "./data.js";

const KEY = "opc-os-demo-v1";
const listeners = new Set();

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(seed);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== seed.version) return clone(seed);
    return parsed;
  } catch {
    return clone(seed);
  }
}

let state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private mode; the demo still works in memory.
  }
}

export const store = {
  get state() {
    return state;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  set(mutator) {
    const next = clone(state);
    mutator(next);
    state = next;
    persist();
    listeners.forEach((fn) => fn(state));
  },

  reset() {
    state = clone(seed);
    persist();
    listeners.forEach((fn) => fn(state));
  },
};
