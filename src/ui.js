import { daysUntil, today } from "./selectors.js";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function money(value, digits = 0) {
  return `¥${Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function compactMoney(value) {
  if (Math.abs(value) >= 10000) {
    return `¥${(value / 10000).toFixed(1).replace(".0", "")} 万`;
  }
  return money(value);
}

export function formatDate(iso, withYear = false) {
  const date = new Date(`${iso}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return withYear || year !== today.getFullYear()
    ? `${year} 年 ${month} 月 ${day} 日`
    : `${month} 月 ${day} 日`;
}

export function shortDate(iso) {
  const date = new Date(`${iso}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dueLabel(iso) {
  const days = daysUntil(iso);
  if (days < 0) return `逾期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天到期";
  if (days === 1) return "明天到期";
  if (days <= 30) return `${days} 天后到期`;
  return `${Math.round(days / 30)} 个月后到期`;
}

export function dueTone(iso) {
  const days = daysUntil(iso);
  if (days < 0) return "danger";
  if (days <= 7) return "warn";
  return "neutral";
}

export function initials(name) {
  const clean = String(name || "").replace(/[（(].*?[)）]/g, "").trim();
  if (!clean) return "?";
  if (/^[A-Za-z]/.test(clean)) {
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return clean.slice(0, 2);
}

export function pct(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function badge(text, tone = "neutral", dot = false) {
  return `<span class="badge badge--${tone}">${dot ? '<span class="badge__dot"></span>' : ""}${esc(text)}</span>`;
}

const categoryMap = {
  税务: "blue",
  工商: "amber",
  社保: "purple",
  知识产权: "teal",
  补贴: "green",
  银行: "slate",
  项目收入: "green",
  订阅收入: "teal",
  内容收入: "purple",
  算力与云: "blue",
  财税服务: "amber",
  场地与地址: "slate",
  外包与协作: "purple",
  差旅: "slate",
};

export function categoryBadge(name) {
  return badge(name, categoryMap[name] || "neutral");
}

export function avatar(name, color = "#0E7C6B", size = "md") {
  return `<span class="avatar avatar--${size}" style="--avatar-color:${color}">${esc(initials(name))}</span>`;
}

export function ring(value, options = {}) {
  const { size = 96, stroke = 8, color = "#0E7C6B", track = "#E7EDF3", label = true } = options;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
    ${label ? `<div class="ring__label"><strong>${value}</strong><span>分</span></div>` : ""}
  </div>`;
}

function smoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function lineChart(series, options = {}) {
  const { width = 680, height = 230, color = "#0E7C6B", secondColor = "#D97706" } = options;
  const pad = { top: 24, right: 16, bottom: 30, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const rawMax = Math.max(...series.map((d) => Math.max(d.income, d.expense))) * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax))) / 2;
  const max = Math.ceil(rawMax / magnitude) * magnitude;
  const x = (i) => pad.left + (i / Math.max(1, series.length - 1)) * innerW;
  const y = (v) => pad.top + innerH - (v / max) * innerH;
  const incomePts = series.map((d, i) => [x(i), y(d.income)]);
  const expensePts = series.map((d, i) => [x(i), y(d.expense)]);
  const incomePath = smoothPath(incomePts);
  const expensePath = smoothPath(expensePts);
  const areaPath = `${incomePath} L ${x(series.length - 1)} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const gy = pad.top + innerH * t;
      const value = Math.round(max * (1 - t));
      const label = value >= 10000 ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k` : String(value);
      return `<line x1="${pad.left}" y1="${gy}" x2="${width - pad.right}" y2="${gy}" stroke="#EDF1F5" stroke-width="1"/>
        <text x="${pad.left - 10}" y="${gy + 4}" text-anchor="end" class="chart-axis">${label}</text>`;
    })
    .join("");
  const labels = series
    .map((d, i) => `<text x="${x(i)}" y="${height - 8}" text-anchor="middle" class="chart-axis">${esc(d.month)}</text>`)
    .join("");
  const dots = incomePts
    .map(([cx, cy], i) => `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"><title>${series[i].month} 收入 ${money(series[i].income)}</title></circle>`)
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="近六个月收入与支出趋势">
    <defs>
      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".22"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${areaPath}" fill="url(#incomeFill)"/>
    <path d="${expensePath}" fill="none" stroke="${secondColor}" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>
    <path d="${incomePath}" fill="none" stroke="${color}" stroke-width="2.6"/>
    ${dots}
    ${labels}
  </svg>`;
}

export function barChart(series, options = {}) {
  const { width = 680, height = 240 } = options;
  const pad = { top: 20, right: 16, bottom: 32, left: 46 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const rawMax = Math.max(...series.map((d) => Math.max(d.income, d.expense))) * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax))) / 2;
  const max = Math.ceil(rawMax / magnitude) * magnitude;
  const groupW = innerW / series.length;
  const barW = Math.min(18, groupW * 0.26);
  const y = (v) => pad.top + innerH - (v / max) * innerH;
  const grid = [0, 0.5, 1]
    .map((t) => {
      const gy = pad.top + innerH * t;
      return `<line x1="${pad.left}" y1="${gy}" x2="${width - pad.right}" y2="${gy}" stroke="#EDF1F5"/>
        <text x="${pad.left - 10}" y="${gy + 4}" text-anchor="end" class="chart-axis">${((max * (1 - t)) / 1000).toFixed(0)}k</text>`;
    })
    .join("");
  const bars = series
    .map((d, i) => {
      const cx = pad.left + groupW * (i + 0.5);
      const incomeH = pad.top + innerH - y(d.income);
      const expenseH = pad.top + innerH - y(d.expense);
      return `<rect x="${cx - barW - 3}" y="${y(d.income)}" width="${barW}" height="${incomeH}" rx="3" fill="#0E7C6B"><title>${d.month} 收入 ${money(d.income)}</title></rect>
        <rect x="${cx + 3}" y="${y(d.expense)}" width="${barW}" height="${expenseH}" rx="3" fill="#D9E3EE"><title>${d.month} 支出 ${money(d.expense)}</title></rect>
        <text x="${cx}" y="${height - 8}" text-anchor="middle" class="chart-axis">${esc(d.month)}</text>`;
    })
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="近六个月收入与支出对比">${grid}${bars}</svg>`;
}

let toastTimer = null;
export function toast(message, tone = "success") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  root.innerHTML = `<div class="toast toast--${tone}">
    <span class="toast__icon">${tone === "success" ? "✓" : "!"}</span>
    <span>${esc(message)}</span>
  </div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    root.innerHTML = "";
  }, 3200);
}

let activeModal = null;
export function openModal({ title, description = "", body, submitText = "保存", cancelText = "取消", onSubmit, wide = false }) {
  closeModal();
  const root = document.getElementById("modal-root");
  root.innerHTML = `<div class="modal-overlay" data-modal-overlay>
    <div class="modal ${wide ? "modal--wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__head">
        <div>
          <h2 id="modal-title">${esc(title)}</h2>
          ${description ? `<p>${esc(description)}</p>` : ""}
        </div>
        <button class="icon-btn" type="button" data-modal-close aria-label="关闭">×</button>
      </div>
      <form class="modal__form">
        <div class="modal__body">${body}</div>
        <div class="modal__foot">
          <button class="btn btn--ghost" type="button" data-modal-close>${esc(cancelText)}</button>
          <button class="btn btn--primary" type="submit">${esc(submitText)}</button>
        </div>
      </form>
    </div>
  </div>`;

  const overlay = root.querySelector("[data-modal-overlay]");
  const form = root.querySelector("form");
  const close = () => closeModal();
  root.querySelectorAll("[data-modal-close]").forEach((btn) => btn.addEventListener("click", close));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    onSubmit?.(data);
    close();
  });
  const firstInput = root.querySelector("input, select, textarea, button");
  firstInput?.focus();
  activeModal = { close };
}

export function closeModal() {
  const root = document.getElementById("modal-root");
  if (root) root.innerHTML = "";
  activeModal = null;
}

export function isModalOpen() {
  return Boolean(activeModal);
}

export function emptyState(title, description, action = "") {
  return `<div class="empty">
    <div class="empty__mark">○</div>
    <h3>${esc(title)}</h3>
    <p>${esc(description)}</p>
    ${action}
  </div>`;
}
