import { clone, seed, uid } from "./data.js";

const KEY = "opc-os-v0.0.5-state";
const LEGACY_KEYS = ["opc-os-v0.0.4-state", "opc-os-v0.0.3-state"];

function load() {
  try {
    const raw = localStorage.getItem(KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return clone(seed);
    const parsed = JSON.parse(raw);
    if (!parsed) return clone(seed);
    if ((parsed.version || 0) < 6) {
      parsed.version = 6;
      parsed.seo = parsed.seo || clone(seed.seo);
      parsed.geo = parsed.geo || { seeded: false, runs: [], briefs: [] };
      parsed.org = parsed.org || { seeded: false };
      localStorage.setItem(KEY, JSON.stringify(parsed));
      return parsed;
    }
    if (parsed.version !== 6) return clone(seed);
    return parsed;
  } catch {
    return clone(seed);
  }
}

class Store {
  constructor() {
    this.state = load();
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  save() {
    localStorage.setItem(KEY, JSON.stringify(this.state));
  }

  commit(mutator, { silent = false } = {}) {
    mutator(this.state);
    this.save();
    if (!silent) this.emit();
  }

  emit() {
    this.listeners.forEach((fn) => fn());
  }

  reset() {
    this.state = clone(seed);
    this.save();
    this.emit();
  }

  getPage(id) {
    return this.state.pages.find((page) => page.id === id) || null;
  }

  getDatabase(id) {
    return this.state.databases[id] || null;
  }

  addPage({ title = "未命名页面", icon = "📄", kind = "doc", parentId = null, blocks = [], dbId = null, cover = "paper" } = {}) {
    const page = {
      id: uid("page"),
      title,
      icon,
      kind,
      parentId,
      favorite: false,
      cover,
      description: "",
      updated: "刚刚",
      blocks: clone(blocks),
      comments: [],
      dbId,
    };
    this.commit((state) => {
      state.pages.push(page);
    });
    return page;
  }

  addDatabasePage({ title = "未命名数据库", icon = "🗂️", db }) {
    const id = uid("db");
    const pageId = uid("page");
    const database = {
      ...clone(db),
      id,
      title,
      icon,
      rows: clone(db.rows || []),
    };
    const page = {
      id: pageId,
      title,
      icon,
      kind: "database",
      dbId: id,
      parentId: null,
      favorite: false,
      cover: "mint",
      description: db.description || "",
      updated: "刚刚",
      comments: [],
    };
    this.commit((state) => {
      state.databases[id] = database;
      state.pages.push(page);
    });
    return page;
  }

  deletePage(pageId) {
    this.commit((state) => {
      const index = state.pages.findIndex((page) => page.id === pageId);
      if (index < 0) return;
      const [page] = state.pages.splice(index, 1);
      page.trashed = true;
      page.previousParentId = page.parentId;
      page.parentId = null;
      state.trash.unshift(page);
    });
  }

  restorePage(pageId) {
    this.commit((state) => {
      const index = state.trash.findIndex((page) => page.id === pageId);
      if (index < 0) return;
      const [page] = state.trash.splice(index, 1);
      page.trashed = false;
      page.parentId = page.previousParentId || null;
      state.pages.push(page);
    });
  }

  purgePage(pageId) {
    this.commit((state) => {
      state.trash = state.trash.filter((page) => page.id !== pageId);
    });
  }

  updatePage(pageId, patch) {
    this.commit((state) => {
      const page = state.pages.find((item) => item.id === pageId);
      if (page) Object.assign(page, patch, { updated: "刚刚" });
    }, { silent: true });
  }

  updateDatabase(dbId, patch) {
    this.commit((state) => {
      const db = state.databases[dbId];
      if (db) Object.assign(db, patch);
    }, { silent: true });
  }

  updateRow(dbId, rowId, patch) {
    this.commit((state) => {
      const db = state.databases[dbId];
      if (!db) return;
      const row = db.rows.find((item) => item.id === rowId);
      if (row) Object.assign(row, patch);
    }, { silent: true });
  }

  addRow(dbId, row) {
    this.commit((state) => {
      const db = state.databases[dbId];
      if (!db) return;
      db.rows.push(row);
    });
  }

  deleteRow(dbId, rowId) {
    this.commit((state) => {
      const db = state.databases[dbId];
      if (!db) return;
      db.rows = db.rows.filter((row) => row.id !== rowId);
    });
  }
}

export const store = new Store();
