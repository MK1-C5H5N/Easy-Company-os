import { icon } from "./icons.js";
import {
  daysUntil,
  dueLabel,
  formatDate,
  formatMoney,
  getDatabase,
  getPage,
  pagePath,
  property,
  rowTitle,
  shortDate,
} from "./data.js";
import { esc, toneFor } from "./utils.js";

const viewNames = { table: "表格", board: "看板", calendar: "日历" };

export function renderDatabaseContent(state, page, ui) {
  const db = getDatabase(state, page.dbId);
  if (!db) return `<div class="empty-state">数据库不存在</div>`;
  const view = ui.viewByDb[db.id] || "table";
  const rows = filteredRows(db, ui);

  return `<section class="database" data-db-root data-db="${db.id}">
    <div class="db-toolbar">
      <div class="db-views" role="tablist" aria-label="数据库视图">
        ${Object.entries(viewNames)
          .map(
            ([key, label]) => `<button type="button" class="db-view ${view === key ? "is-active" : ""}" data-action="db-view" data-db="${db.id}" data-view="${key}">
              ${icon(key === "table" ? "table" : key === "board" ? "board" : "calendar", 14)}<span>${label}</span>
            </button>`
          )
          .join("")}
      </div>
      <div class="db-tools">
        <label class="db-search">
          ${icon("search", 14)}
          <input type="search" placeholder="搜索 ${esc(db.title)}…" value="${esc(ui.dbSearch[db.id] || "")}" data-db-search="${db.id}" aria-label="搜索数据库"/>
        </label>
        <button type="button" class="btn btn--ghost btn--sm" data-action="db-filter" data-db="${db.id}">${icon("filter", 14)} 筛选</button>
        <button type="button" class="btn btn--primary btn--sm" data-action="add-row" data-db="${db.id}">${icon("plus", 14)} 新建</button>
      </div>
    </div>
    ${view === "table" ? renderTable(db, rows, ui) : view === "board" ? renderBoard(db, rows, ui) : renderCalendar(db, rows, ui)}
    <div class="db-footer">
      <span>${rows.length} 条记录</span>
      <span class="db-footer__hint">${icon("sparkles", 13)} 点击行打开页面，单元格可直接编辑</span>
    </div>
    ${ui.selectedRow?.dbId === db.id ? renderRowDrawer(state, db, ui) : ""}
  </section>`;
}

function filteredRows(db, ui) {
  const query = (ui.dbSearch[db.id] || "").trim().toLowerCase();
  let rows = [...db.rows];
  if (query) {
    rows = rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)));
  }
  if (ui.sortBy?.[db.id]) {
    const key = ui.sortBy[db.id];
    const dir = ui.sortDir?.[db.id] === "desc" ? -1 : 1;
    rows.sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "zh-CN") * dir);
  }
  return rows;
}

function cellValue(db, row, prop) {
  if (prop.type === "title") return rowTitle(db, row);
  return row[prop.key] ?? "";
}

function renderTable(db, rows, ui) {
  const visible = db.properties.slice(0, 7);
  return `<div class="db-table-wrap">
    <table class="db-table">
      <thead>
        <tr>
          ${visible
            .map(
              (prop) => `<th style="min-width:${prop.width || 120}px">
                <button type="button" class="th-sort" data-action="db-sort" data-db="${db.id}" data-key="${prop.key}">
                  <span>${esc(prop.label)}</span>${icon("sort", 12)}
                </button>
              </th>`
            )
            .join("")}
          <th class="th-actions"></th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr data-row-id="${row.id}">
              ${visible
                .map((prop) => `<td data-key="${prop.key}">${renderCell(db, row, prop)}</td>`)
                .join("")}
              <td class="td-actions">
                <button type="button" class="icon-btn icon-btn--sm" data-action="open-row" data-db="${db.id}" data-row="${row.id}" aria-label="打开">${icon("arrowUpRight", 13)}</button>
              </td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${rows.length === 0 ? `<div class="empty-state empty-state--sm">没有匹配记录。换个关键词，或新建一条。</div>` : ""}
  </div>`;
}

function renderCell(db, row, prop) {
  const value = cellValue(db, row, prop);
  if (prop.type === "title") {
    return `<button type="button" class="db-title" data-action="open-row" data-db="${db.id}" data-row="${row.id}">
      <span class="db-title__icon">${esc((row.title || row.name || "·").slice(0, 1))}</span>
      <span>${esc(value || "未命名")}</span>
    </button>`;
  }
  if (prop.type === "select" || prop.type === "status") {
    return `<select class="cell-select cell-select--${prop.type} cell-select--tone-${toneFor(value)}" data-cell-select data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}">
      ${(prop.options || []).map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
    </select>`;
  }
  if (prop.type === "date") {
    return `<input class="cell-date" type="date" value="${esc(value)}" data-cell-input data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}" data-type="date"/>`;
  }
  if (prop.type === "money") {
    return `<span class="cell-money ${Number(value) >= 0 ? "" : "is-negative"}" contenteditable="true" data-cell-input data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}" data-type="money">${esc(Number(value || 0).toLocaleString("zh-CN"))}</span>`;
  }
  if (prop.type === "number") {
    return `<span class="cell-number" contenteditable="true" data-cell-input data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}" data-type="number">${esc(value)}</span>`;
  }
  if (prop.type === "tags") {
    return `<span class="cell-tags">${String(value || "")
      .split(/[,，]/)
      .filter(Boolean)
      .map((tag) => `<span class="tag">${esc(tag.trim())}</span>`)
      .join("")}</span>`;
  }
  return `<span class="cell-text" contenteditable="true" data-cell-input data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}" data-type="text">${esc(value)}</span>`;
}

function renderBoard(db, rows, ui) {
  const groupProp = property(db, db.groupBy) || db.properties.find((prop) => prop.type === "status" || prop.type === "select");
  const options = groupProp?.options?.length ? groupProp.options : ["未分组"];
  const groups = options.map((option) => ({
    option,
    rows: rows.filter((row) => (row[groupProp?.key] || "未分组") === option),
  }));
  const ungrouped = rows.filter((row) => !options.includes(row[groupProp?.key]));
  if (ungrouped.length) groups.push({ option: "未分组", rows: ungrouped });

  return `<div class="db-board">
    ${groups
      .map(
        (group) => `<div class="board-column" data-group="${esc(group.option)}">
          <div class="board-column__head">
            <span class="board-dot board-dot--${toneFor(group.option)}"></span>
            <strong>${esc(group.option)}</strong>
            <span class="board-count">${group.rows.length}</span>
            <button type="button" class="icon-btn icon-btn--xs" data-action="add-row" data-db="${db.id}" data-group="${esc(group.option)}" aria-label="新建">${icon("plus", 13)}</button>
          </div>
          <div class="board-cards">
            ${group.rows
              .map(
                (row) => `<button type="button" class="board-card" data-action="open-row" data-db="${db.id}" data-row="${row.id}">
                  <span class="board-card__title">${esc(rowTitle(db, row))}</span>
                  <span class="board-card__meta">
                    ${row.due || row.deadline || row.date ? `<span>${icon("clock", 12)} ${esc(row.status === "已完成" ? "已完成" : db.id === "db_finance" ? shortDate(row.date) : dueLabel(row.due || row.deadline || row.date))}</span>` : ""}
                    ${row.amount ? `<span>${formatMoney(row.amount)}</span>` : ""}
                    ${row.received ? `<span>${formatMoney(row.received)} 已回</span>` : ""}
                    ${row.owner ? `<span>${esc(row.owner)}</span>` : ""}
                  </span>
                  ${row.tags ? `<span class="board-card__tags">${String(row.tags).split(/[,，]/).filter(Boolean).slice(0, 3).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</span>` : ""}
                </button>`
              )
              .join("")}
            ${group.rows.length === 0 ? `<div class="board-empty">暂无</div>` : ""}
          </div>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderCalendar(db, rows, ui) {
  const cursor = ui.calendarCursor || "2026-11";
  const [year, month] = cursor.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const key = db.calendarKey || "due";
  const events = rows.filter((row) => String(row[key] || "").startsWith(cursor));
  const today = "2026-11-05";

  return `<div class="db-calendar">
    <div class="calendar-head">
      <button type="button" class="icon-btn icon-btn--sm" data-action="cal-prev" aria-label="上个月">${icon("chevronLeft", 16)}</button>
      <strong>${year} 年 ${month} 月</strong>
      <button type="button" class="icon-btn icon-btn--sm" data-action="cal-next" aria-label="下个月">${icon("chevronRight", 16)}</button>
      <span class="calendar-hint">${events.length} 个节点</span>
    </div>
    <div class="calendar-grid">
      ${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
      ${cells
        .map((day) => {
          if (!day) return `<div class="calendar-day is-empty"></div>`;
          const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = events.filter((row) => row[key] === iso);
          return `<div class="calendar-day ${iso === today ? "is-today" : ""}">
            <span class="calendar-daynum">${day}</span>
            ${dayEvents
              .slice(0, 3)
              .map(
                (row) => `<button type="button" class="calendar-event calendar-event--${toneFor(row.status || row.type || row.stage)}" data-action="open-row" data-db="${db.id}" data-row="${row.id}" title="${esc(rowTitle(db, row))}">
                  ${esc(rowTitle(db, row))}
                </button>`
              )
              .join("")}
            ${dayEvents.length > 3 ? `<span class="calendar-more">+${dayEvents.length - 3}</span>` : ""}
          </div>`;
        })
        .join("")}
    </div>
  </div>`;
}

function renderRowDrawer(state, db, ui) {
  const row = db.rows.find((item) => item.id === ui.selectedRow.rowId);
  if (!row) return "";
  const title = rowTitle(db, row);
  return `<div class="drawer-overlay" data-action="close-row">
    <aside class="row-drawer" role="dialog" aria-modal="true" data-drawer>
      <div class="row-drawer__top">
        <span class="row-drawer__eyebrow">${esc(db.title)} / 记录</span>
        <button type="button" class="icon-btn icon-btn--sm" data-action="close-row" aria-label="关闭">${icon("x", 15)}</button>
      </div>
      <div class="row-drawer__title">
        <span class="row-drawer__icon">${esc((row.title || row.name || "·").slice(0, 1))}</span>
        <h2 contenteditable="true" data-row-title data-db="${db.id}" data-row="${row.id}">${esc(title)}</h2>
      </div>
      <div class="row-properties">
        ${db.properties
          .filter((prop) => prop.type !== "title")
          .map((prop) => `<label class="row-prop">
            <span>${esc(prop.label)}</span>
            ${renderRowField(db, row, prop)}
          </label>`)
          .join("")}
      </div>
      <label class="row-note">
        <span>备注 / 页面内容</span>
        <textarea data-row-note data-db="${db.id}" data-row="${row.id}" placeholder="补充背景、判断、下一步…">${esc(row.note || "")}</textarea>
      </label>
      <div class="row-drawer__footer">
        <button type="button" class="btn btn--ghost btn--sm" data-action="delete-row" data-db="${db.id}" data-row="${row.id}">${icon("trash", 13)} 删除记录</button>
        <span class="row-drawer__hint">${icon("sparkles", 12)} AI 会读取这里的上下文</span>
      </div>
    </aside>
  </div>`;
}

function renderRowField(db, row, prop) {
  const value = row[prop.key] ?? "";
  if (prop.type === "select" || prop.type === "status") {
    return `<select data-row-field data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}">
      ${(prop.options || []).map((option) => `<option ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
    </select>`;
  }
  if (prop.type === "date") {
    return `<input type="date" value="${esc(value)}" data-row-field data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}"/>`;
  }
  if (prop.type === "money" || prop.type === "number") {
    return `<input type="number" value="${Number(value) || 0}" data-row-field data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}" data-type="${prop.type}"/>`;
  }
  return `<input type="text" value="${esc(value)}" data-row-field data-db="${db.id}" data-row="${row.id}" data-key="${prop.key}"/>`;
}

export function renderDatabaseHeader(state, page) {
  const db = getDatabase(state, page.dbId);
  if (!db) return "";
  return `<div class="db-caption">
    <span>${icon("database", 14)} 数据库</span>
    <span>${db.rows.length} 条记录</span>
    <span>${db.properties.length} 个属性</span>
    <span class="db-caption__spacer"></span>
    <span>${esc(db.description || "")}</span>
  </div>`;
}

export function renderMiniDatabase(state, dbId, pageId) {
  const db = getDatabase(state, dbId);
  const page = getPage(state, pageId);
  if (!db || !page) return "";
  const titleKey = db.titleKey;
  const dateKey = db.calendarKey || "due";
  const rows = db.rows.slice(0, 4);
  return `<div class="mini-db">
    <div class="mini-db__head">
      <span>${icon("database", 14)} ${esc(db.title)}</span>
      <button type="button" class="mini-db__open" data-action="open-page" data-page="${page.id}">打开 ${icon("arrowUpRight", 12)}</button>
    </div>
    <div class="mini-db__rows">
      ${rows
        .map(
          (row) => `<div class="mini-db__row">
            <span>${esc(row[titleKey])}</span>
            <span class="mini-db__meta">${esc(shortDate(row[dateKey]) || "")} · ${esc(row.status || row.stage || row.type || "")}</span>
          </div>`
        )
        .join("")}
    </div>
  </div>`;
}
