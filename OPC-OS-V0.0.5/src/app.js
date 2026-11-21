import { icon } from "./icons.js";
import {
  DEMO_DATE_LABEL,
  clone,
  daysUntil,
  dueLabel,
  formatCompact,
  formatDate,
  formatMoney,
  getDatabase,
  getPage,
  metrics,
  pagePath,
  rowTitle,
  shortDate,
  uid,
} from "./data.js";
import { store } from "./store.js";
import { esc, copyText, debounce, download, initials } from "./utils.js";
import { renderBlockMenu, renderDocContent, insertBlockType } from "./blocks.js";
import { renderDatabaseContent, renderDatabaseHeader } from "./database.js";
import { aiMarkup, aiReply, aiSuggestions } from "./ai.js";
import {
  approveWorkflow,
  auditBundle,
  ensureGovernanceState,
  getWorkflow,
  modifyWorkflowAction,
  pendingWorkflows,
  rejectWorkflow,
  renderAIGovernance,
  renderApprovalInbox,
  renderApprovalModal,
  renderGovernancePanel,
  renderGovernanceStrip,
  verifyEvidence,
} from "./governance.js";
import {
  applyPageSEO,
  applySiteSEO,
  assetFilename,
  ensureSEOState,
  generateAsset,
  getSEOPage,
  readPageSEOForm,
  readSiteSEOForm,
  renderSEOLocked,
  renderSEOStudio,
} from "./seo.js";
import {
  briefText,
  buildBrief,
  ensureGeoState,
  getGeoQuery,
  getPlatform,
  renderGEOLocked,
  renderGeoStudio,
  runProbes,
} from "./geo.js";
import {
  addOrgEvidence,
  advanceOrgTask,
  ensureOrgState,
  extractOrgSkill,
  renderOrgStudio,
  runOrgLoop,
  useOrgSkill,
  verifyOrgChain,
} from "./org.js";
import {
  activatePro,
  canCreatePage,
  canUseAI,
  checkUnlockCode,
  compressQR,
  getPaywallConfig,
  hasProAccess,
  incrementAIUsage,
  incrementPageUsage,
  isPro,
  readPaywallForm,
  renderPaywallModal,
  renderPaywallSettings,
  resetPaywallConfig,
  resetPro,
  savePaywallConfig,
} from "./paywall.js";

const app = document.getElementById("app");

const ui = {
  route: "page",
  currentPageId: "home",
  sidebarOpen: window.innerWidth > 980,
  rightPanel: null,
  viewByDb: {},
  dbSearch: {},
  sortBy: {},
  sortDir: {},
  calendarCursor: "2026-11",
  selectedRow: null,
  blockMenu: null,
  paletteOpen: false,
  paletteQuery: "",
  shareOpen: false,
  pageMenuOpen: false,
  approvalFilter: "pending",
  approvalModal: null,
  seoTab: "page",
  seoPageId: "home",
  seoAsset: "meta",
  geoView: "matrix",
  geoPlatform: "doubao",
  geoPageId: "home",
  geoQueryId: "q1",
  orgTab: "network",
  orgTaskId: "t1",
  orgLoopId: "product",
  orgSkillFilter: "all",
  paywall: {
    open: false,
    reason: "",
    plan: "yearly",
    channel: "wechat",
    code: "",
    error: "",
  },
  toast: "",
  focusBlock: null,
  focusSearch: null,
  aiInput: "",
  commentDraft: "",
  aiMessages: [
    {
      role: "assistant",
      text: "早上好，周子博。我读完了你的合规日历、资金台账、客户合同和政策雷达。今天最值得先处理的是**注册地址续费**和**蓝岸尾款**。你可以问我：今天先做什么、这个月要交哪些税、帮我写周报。",
    },
  ],
};

let toastTimer = null;

function syncRoute() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  if (raw === "templates") {
    ui.route = "templates";
    return;
  }
  if (raw === "trash") {
    ui.route = "trash";
    return;
  }
  if (raw === "paywall-settings") {
    ui.route = "paywall-settings";
    return;
  }
  if (raw === "approvals") {
    ui.route = "approvals";
    return;
  }
  if (raw === "seo") {
    ui.route = "seo";
    return;
  }
  if (raw === "geo") {
    ui.route = "geo";
    return;
  }
  if (raw === "org") {
    ui.route = "org";
    return;
  }
  if (raw.startsWith("p/")) {
    const id = raw.slice(2);
    if (getPage(store.state, id) && !getPage(store.state, id).trashed) {
      ui.route = "page";
      ui.currentPageId = id;
      return;
    }
  }
  ui.route = "page";
  ui.currentPageId = "home";
}

function currentPage() {
  return getPage(store.state, ui.currentPageId) || getPage(store.state, "home");
}

function navigate(pageId) {
  const next = `#/p/${pageId}`;
  if (location.hash === next) render();
  else location.hash = next;
}

function openRoute(route) {
  if (["templates", "trash", "paywall-settings", "approvals", "seo", "geo", "org"].includes(route)) {
    if (location.hash === `#/${route}`) render();
    else location.hash = `#/${route}`;
  }
}

window.addEventListener("hashchange", render);

function render() {
  ensureGovernanceState(store.state);
  ensureSEOState(store.state);
  ensureGeoState(store.state);
  ensureOrgState(store.state);
  syncRoute();
  const page = currentPage();
  app.innerHTML = shell(page);
  if (ui.focusBlock) {
    requestAnimationFrame(() => {
      const el = app.querySelector(`[data-block-id="${ui.focusBlock}"] [data-block-text]`);
      if (el) {
        el.focus();
        placeCaretEnd(el);
      }
      ui.focusBlock = null;
    });
  }
  if (ui.focusSearch) {
    requestAnimationFrame(() => {
      const el = app.querySelector(`[data-db-search="${ui.focusSearch}"]`);
      if (el) {
        el.focus();
        el.setSelectionRange?.(el.value.length, el.value.length);
      }
      ui.focusSearch = null;
    });
  }
  if (ui.paletteOpen) {
    requestAnimationFrame(() => app.querySelector("#palette-input")?.focus());
  }
}

function shell(page) {
  const state = store.state;
  return `<div class="app-shell ${ui.sidebarOpen ? "" : "is-sidebar-collapsed"} ${ui.rightPanel ? "has-panel" : ""}">
    ${renderSidebar(state)}
    <main class="workspace">
      ${renderTopbar(page)}
      <div class="page-scroll">
        ${renderRoute(page)}
      </div>
    </main>
    ${ui.rightPanel ? renderRightPanel(page) : ""}
  </div>
  ${ui.paletteOpen ? renderPalette(state) : ""}
  ${ui.shareOpen ? renderShareModal(page) : ""}
  ${ui.pageMenuOpen ? renderPageMenu(page) : ""}
  ${renderBlockMenu(ui)}
  ${ui.approvalModal ? renderApprovalModal(store.state, ui) : ""}
  ${ui.paywall.open ? renderPaywallModal(ui) : ""}
  ${ui.toast ? `<div class="toast">${icon("check", 14)}<span>${esc(ui.toast)}</span></div>` : ""}`;
}

// ---------------------------------------------------------------- sidebar

function renderSidebar(state) {
  const pages = state.pages.filter((page) => !page.trashed);
  const roots = pages.filter((page) => !page.parentId);
  const favorites = pages.filter((page) => page.favorite);

  return `<aside class="sidebar">
    <div class="sidebar__top">
      <button type="button" class="workspace-switch" data-action="workspace">
        <span class="workspace-avatar">${esc(state.workspace.icon)}</span>
        <span class="workspace-name">${esc(state.workspace.name)}</span>
        <span class="workspace-plan ${isPro() ? "is-pro" : ""}">${isPro() ? "Pro" : "Free"}</span>
        ${icon("chevronDown", 14)}
      </button>
      <button type="button" class="icon-btn sidebar-collapse" data-action="toggle-sidebar" aria-label="收起侧栏">${icon("panel", 16)}</button>
    </div>

    <div class="sidebar__scroll">
      <button type="button" class="search-trigger" data-action="open-palette">
        ${icon("search", 15)}<span>搜索或跳转</span><kbd>⌘ K</kbd>
      </button>

      <nav class="side-nav">
        <button type="button" class="side-nav__item ${ui.route === "page" && ui.currentPageId === "home" ? "is-active" : ""}" data-action="open-page" data-page="home">
          ${icon("home", 17)}<span>今日驾驶舱</span>
        </button>
        <button type="button" class="side-nav__item ${ui.route === "approvals" ? "is-active" : ""}" data-action="open-approvals">
          ${icon("shield", 17)}<span>审批箱</span>${pendingWorkflows(store.state).length ? `<span class="side-badge">${pendingWorkflows(store.state).length}</span>` : ""}
        </button>
        <button type="button" class="side-nav__item ${ui.rightPanel === "ai" ? "is-active" : ""}" data-action="panel" data-panel="ai">
          ${icon("sparkles", 17)}<span>AI 助手</span><span class="side-kbd">⌘ J</span>
        </button>
        <button type="button" class="side-nav__item ${ui.route === "seo" ? "is-active" : ""}" data-action="open-seo">
          ${icon("search", 17)}<span>出海GEO</span>${hasProAccess() ? `<span class="side-kbd">GEO</span>` : `<span class="side-badge side-badge--pro">PRO</span>`}
        </button>
        <button type="button" class="side-nav__item ${ui.route === "geo" ? "is-active" : ""}" data-action="open-geo">
          ${icon("target", 17)}<span>中国市场GEO</span>${hasProAccess() ? `<span class="side-kbd">4</span>` : `<span class="side-badge side-badge--pro">PRO</span>`}
        </button>
        <button type="button" class="side-nav__item ${ui.route === "org" ? "is-active" : ""}" data-action="open-org">
          ${icon("layers", 17)}<span>智能组织</span><span class="side-kbd">BETA</span>
        </button>
      </nav>

      ${favorites.length ? `<div class="side-section">
        <div class="side-section__head"><span>收藏</span></div>
        ${favorites.map((page) => sidePageRow(page, 0)).join("")}
      </div>` : ""}

      <div class="side-section">
        <div class="side-section__head">
          <span>工作区</span>
          <button type="button" class="icon-btn icon-btn--xs" data-action="new-page" aria-label="新建页面">${icon("plus", 13)}</button>
        </div>
        ${roots.map((page) => sidePageRow(page, 0)).join("")}
        <button type="button" class="side-add" data-action="new-page">${icon("plus", 14)} 新建页面</button>
      </div>

      <div class="side-section side-section--lower">
        <button type="button" class="side-nav__item ${ui.route === "templates" ? "is-active" : ""}" data-action="open-templates">
          ${icon("template", 16)}<span>模板库</span>
        </button>
        <button type="button" class="side-nav__item ${ui.route === "trash" ? "is-active" : ""}" data-action="open-trash">
          ${icon("trash", 16)}<span>回收站</span>
        </button>
        <button type="button" class="side-nav__item ${ui.route === "paywall-settings" ? "is-active" : ""}" data-action="open-paywall-settings">
          ${icon("lock", 16)}<span>付费墙设置</span>
        </button>
      </div>
    </div>

    <div class="sidebar__bottom">
      <button type="button" class="account-row" data-action="account">
        <span class="account-avatar">李</span>
        <span class="account-name">${esc(state.workspace.owner)}</span>
        <span class="account-role">${esc(state.workspace.role)}</span>
        ${icon("more", 14)}
      </button>
    </div>
  </aside>`;
}

function sidePageRow(page, depth = 0) {
  const children = store.state.pages.filter((item) => !item.trashed && item.parentId === page.id);
  const isActive = ui.route === "page" && ui.currentPageId === page.id;
  return `<div class="side-page-wrap" style="--depth:${depth}">
    <div class="side-page ${isActive ? "is-active" : ""}" style="padding-left:${12 + depth * 15}px">
      <button type="button" class="side-page__main" data-action="open-page" data-page="${page.id}">
        <span class="side-page__icon">${esc(page.icon)}</span>
        <span class="side-page__title">${esc(page.title)}</span>
        ${page.kind === "database" ? `<span class="side-page__kind">${icon("database", 11)}</span>` : ""}
      </button>
      <button type="button" class="side-page__add" data-action="new-child-page" data-page="${page.id}" aria-label="新建子页面">${icon("plus", 12)}</button>
    </div>
    ${children.map((child) => sidePageRow(child, depth + 1)).join("")}
  </div>`;
}

// ---------------------------------------------------------------- topbar

function renderTopbar(page) {
  const crumbs = ui.route === "templates"
    ? [{ label: "工作区", page: null }, { label: "模板库", page: null }]
    : ui.route === "trash"
      ? [{ label: "工作区", page: null }, { label: "回收站", page: null }]
      : ui.route === "paywall-settings"
        ? [{ label: "工作区", page: null }, { label: "付费墙设置", page: null }]
        : ui.route === "approvals"
          ? [{ label: "工作区", page: null }, { label: "审批箱", page: null }]
          : ui.route === "seo"
            ? [{ label: "工作区", page: null }, { label: "出海GEO", page: null }]
            : ui.route === "geo"
              ? [{ label: "工作区", page: null }, { label: "中国市场GEO", page: null }]
              : ui.route === "org"
                ? [{ label: "工作区", page: null }, { label: "智能组织", page: null }]
                : [{ label: store.state.workspace.name, page: null }, ...pagePath(store.state, page.id).map((item) => ({ label: item.title, page: item.id }))];

  return `<header class="topbar">
    <div class="topbar__left">
      <button type="button" class="icon-btn topbar-menu" data-action="toggle-sidebar" aria-label="侧栏">${icon("menu", 17)}</button>
      <div class="breadcrumbs">
        ${crumbs.map((crumb, index) => `${index ? `<span class="crumb-sep">${icon("chevronRight", 12)}</span>` : ""}
          ${crumb.page && index < crumbs.length - 1
            ? `<button type="button" class="crumb crumb--link" data-action="open-page" data-page="${crumb.page}">${esc(crumb.label)}</button>`
            : `<span class="crumb ${index === crumbs.length - 1 ? "crumb--current" : ""}">${esc(crumb.label)}</span>`}`).join("")}
      </div>
    </div>
    <div class="topbar__right">
      ${!hasProAccess() ? `<button type="button" class="btn btn--upgrade btn--sm" data-action="open-paywall" data-reason="manual">${icon("sparkles", 14)} 升级 Pro</button>` : `<span class="topbar-pro">${icon("check", 12)} Pro</span>`}
      ${ui.route !== "approvals" ? `<button type="button" class="topbar-icon topbar-governance ${ui.rightPanel === "governance" ? "is-active" : ""}" data-action="panel" data-panel="governance" aria-label="治理面板">${icon("shield", 16)}${pendingWorkflows(store.state).length ? `<span class="topbar-dot">${pendingWorkflows(store.state).length}</span>` : ""}</button>` : ""}
      ${ui.route !== "seo" ? `<button type="button" class="topbar-icon" data-action="open-seo" aria-label="出海GEO">${icon("search", 16)}</button>` : ""}
      ${ui.route !== "geo" ? `<button type="button" class="topbar-icon" data-action="open-geo" aria-label="中国市场GEO">${icon("target", 16)}</button>` : ""}
      ${ui.route !== "org" ? `<button type="button" class="topbar-icon" data-action="open-org" aria-label="智能组织">${icon("layers", 16)}</button>` : ""}
      ${ui.route === "page" ? `<button type="button" class="btn btn--ghost btn--sm" data-action="share">${icon("share", 14)} 分享</button>` : ""}
      ${ui.route === "page" ? `<button type="button" class="topbar-icon ${ui.rightPanel === "comments" ? "is-active" : ""}" data-action="panel" data-panel="comments" aria-label="评论">${icon("comment", 16)}${page.comments?.length ? `<span class="topbar-dot">${page.comments.length}</span>` : ""}</button>` : ""}
      ${ui.route === "page" ? `<button type="button" class="topbar-icon ${ui.rightPanel === "ai" ? "is-active" : ""}" data-action="panel" data-panel="ai" aria-label="AI 助手">${icon("sparkles", 16)}</button>` : ""}
      ${ui.route === "page" ? `<button type="button" class="topbar-icon ${page.favorite ? "is-starred" : ""}" data-action="favorite" aria-label="收藏">${icon("star", 16)}</button>` : ""}
      ${ui.route === "page" ? `<button type="button" class="topbar-icon" data-action="page-menu" aria-label="更多">${icon("more", 17)}</button>` : ""}
    </div>
  </header>`;
}

// ---------------------------------------------------------------- route pages

function renderRoute(page) {
  if (ui.route === "templates") return renderTemplateGallery();
  if (ui.route === "trash") return renderTrash();
  if (ui.route === "paywall-settings") return `<div class="page-body">${renderPaywallSettings(getPaywallConfig(), isPro())}</div>`;
  if (ui.route === "approvals") return renderApprovalInbox(store.state, ui);
  if (ui.route === "seo") return hasProAccess() ? renderSEOStudio(store.state, ui) : renderSEOLocked(store.state);
  if (ui.route === "geo") return hasProAccess() ? renderGeoStudio(store.state, ui) : renderGEOLocked(store.state);
  if (ui.route === "org") return renderOrgStudio(store.state, ui);
  return renderPage(page);
}

function renderPage(page) {
  if (!page) return `<div class="empty-state">页面不存在</div>`;
  return `<div class="page page--${page.kind}">
    <div class="page-cover page-cover--${esc(page.cover || "paper")}">
      <div class="cover-grid"></div>
      <button type="button" class="cover-action" data-action="change-cover">${icon("image", 13)} 更换封面</button>
    </div>
    <div class="page-head">
      <button type="button" class="page-icon" data-action="change-icon" aria-label="更换图标">${esc(page.icon)}</button>
      <div class="page-head__meta">${page.kind === "database" ? "数据库" : page.kind === "dashboard" ? "工作区首页" : "页面"} · ${esc(page.updated || "刚刚")}</div>
      <h1 class="page-title" contenteditable="true" data-page-title>${esc(page.title)}</h1>
      <p class="page-description" contenteditable="true" data-page-description data-placeholder="添加描述…">${esc(page.description || "")}</p>
      <div class="page-head__actions">
        ${page.kind === "doc" ? `<button type="button" class="btn btn--ghost btn--sm" data-action="insert-block" data-page="${page.id}" data-after="${page.blocks?.at(-1)?.id || ""}">${icon("plus", 14)} 添加块</button>` : ""}
        ${page.kind === "database" ? `<button type="button" class="btn btn--ghost btn--sm" data-action="add-row" data-db="${page.dbId}">${icon("plus", 14)} 新建记录</button>` : ""}
        <button type="button" class="btn btn--ai btn--sm" data-action="ask-ai">${icon("sparkles", 14)} AI 帮我写</button>
        <span class="page-head__hint">${icon("lock", 12)} 仅工作区可见</span>
      </div>
    </div>
    ${page.kind === "dashboard" ? renderDashboard(page) : page.kind === "database" ? `<div class="page-body page-body--database">${renderDatabaseHeader(store.state, page)}${renderDatabaseContent(store.state, page, ui)}</div>` : `<div class="page-body">${renderDocContent(store.state, page, ui)}</div>`}
  </div>`;
}

// ---------------------------------------------------------------- dashboard

function renderDashboard(page) {
  const state = store.state;
  const m = metrics(state);
  const nextTasks = m.pending.slice(0, 4);
  const policies = m.topPolicies;
  return `<div class="page-body page-body--dashboard">
    <section class="dash-hero">
      <div class="dash-hero__copy">
        <div class="dash-eyebrow">${icon("shield", 13)} OPC OS 0.0.5 · INTELLIGENT ORG · 工作日 ${esc(DEMO_DATE_LABEL)}</div>
        <h2>早上好，周子博。<br/><span>今天先做三件事。</span></h2>
        <p>合规有 ${m.overdue.length} 项逾期、${m.dueSoon.length} 项临期；现金可支撑 ${m.runway} 个月；有一笔 ${formatMoney(m.topReceivables[0]?.amount - m.topReceivables[0]?.received || 0)} 的尾款值得今天跟进。</p>
        <div class="dash-hero__actions">
          <button type="button" class="btn btn--primary" data-action="panel" data-panel="ai">${icon("sparkles", 15)} 让 AI 排今天</button>
          <button type="button" class="btn btn--ghost" data-action="open-page" data-page="compliance">${icon("calendar", 15)} 打开合规日历</button>
        </div>
      </div>
      <div class="dash-hero__score">
        <div class="ring ring--hero" style="--score:${m.health}%">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="ring__track"/><circle cx="50" cy="50" r="42" class="ring__fill"/></svg>
          <div class="ring__label"><strong>${m.health}</strong><span>合规健康分</span></div>
        </div>
        <div class="dash-score-note">${m.overdue.length ? `${m.overdue.length} 项逾期 · 建议今天处理` : "无逾期 · 保持节奏"}</div>
      </div>
    </section>

    ${renderGovernanceStrip(state)}

    <section class="dash-kpis">
      <div class="kpi"><span class="kpi__label">可支配现金</span><strong>${formatCompact(m.cash)}</strong><small>可支撑 ${m.runway} 个月</small><span class="kpi__bar kpi__bar--teal"></span></div>
      <div class="kpi"><span class="kpi__label">90 天应收</span><strong>${formatCompact(m.receivable)}</strong><small>${m.contracted.length} 个进行中合同</small><span class="kpi__bar kpi__bar--blue"></span></div>
      <div class="kpi"><span class="kpi__label">本月待办</span><strong>${m.pending.length} 项</strong><small>${m.dueSoon.length} 项 7 天内到期</small><span class="kpi__bar kpi__bar--amber"></span></div>
      <div class="kpi"><span class="kpi__label">本月净现金流</span><strong>${formatCompact(m.netCash)}</strong><small>收入 ${formatCompact(m.monthIncome)}</small><span class="kpi__bar kpi__bar--purple"></span></div>
    </section>

    <div class="dash-grid">
      <div class="dash-main">
        <section class="panel-card">
          <div class="panel-head">
            <div><h3>今日重点</h3><p>只放需要你亲自决定的事</p></div>
            <button type="button" class="link-btn" data-action="open-page" data-page="compliance">全部 ${icon("arrowRight", 12)}</button>
          </div>
          <div class="focus-list">
            ${nextTasks.map((task, index) => `<div class="focus-row">
              <span class="focus-index">${String(index + 1).padStart(2, "0")}</span>
              <button type="button" class="focus-check" data-action="toggle-task" data-row="${task.id}" aria-label="完成">${icon("check", 12)}</button>
              <button type="button" class="focus-body" data-action="open-row" data-db="db_tasks" data-row="${task.id}">
                <span class="focus-title">${esc(task.title)}</span>
                <span class="focus-meta">${esc(task.category)} · ${esc(dueLabel(task.due))} · ${esc(task.owner)}</span>
              </button>
              <span class="pill pill--${task.priority === "高" ? "red" : task.priority === "中" ? "amber" : "slate"}">${esc(task.priority)}</span>
            </div>`).join("")}
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-head"><div><h3>现金流</h3><p>近 6 个月 · 收入与支出</p></div><span class="panel-tag">${formatCompact(m.netCash)} 本月净流入</span></div>
          <div class="chart" aria-label="现金流柱状图">
            ${[
              { month: "6月", income: 22000, expense: 14000 },
              { month: "7月", income: 28000, expense: 16500 },
              { month: "8月", income: 31000, expense: 18200 },
              { month: "9月", income: 36000, expense: 21000 },
              { month: "10月", income: 40200, expense: 19800 },
              { month: "11月", income: 38000, expense: 21360 },
            ].map((point) => `<div class="chart-col">
              <div class="chart-bars"><span class="bar bar--income" style="height:${Math.round(point.income / 430)}px"></span><span class="bar bar--expense" style="height:${Math.round(point.expense / 430)}px"></span></div>
              <span class="chart-label">${point.month}</span>
            </div>`).join("")}
          </div>
          <div class="chart-legend"><span><i class="dot dot--teal"></i>收入</span><span><i class="dot dot--slate"></i>支出</span><span class="chart-note">数据来自「资金台账」数据库</span></div>
        </section>
      </div>

      <aside class="dash-side">
        <section class="ai-brief">
          <div class="ai-brief__head">${icon("sparkles", 14)}<span>AI 今日简报</span><em>09:02</em></div>
          <h3>${m.overdue.length ? "先处理逾期，再谈增长。" : "合规回到正轨，把时间留给增长。"}</h3>
          <div class="ai-brief__line"><span></span><p>${m.overdue[0] ? `${m.overdue[0].title} 已逾期 ${Math.abs(daysUntil(m.overdue[0].due))} 天，先确认地址续费。` : "今天没有逾期事项，检查下周截止日。"}</p></div>
          <div class="ai-brief__line"><span></span><p>${m.topReceivables[0] ? `${m.topReceivables[0].name} 待回款 ${formatMoney(m.topReceivables[0].amount - m.topReceivables[0].received)}，建议今天发一条催款消息。` : "本月回款完成，现金流为正。"}</p></div>
          <div class="ai-brief__line"><span></span><p>${policies[0] ? `${policies[0].title} 匹配度 ${policies[0].match}%，截止 ${policies[0].deadline}。` : "本周没有新增政策。"}</p></div>
          <button type="button" class="btn btn--dark btn--sm" data-action="panel" data-panel="ai">继续对话 ${icon("arrowRight", 13)}</button>
        </section>

        <section class="panel-card panel-card--tight">
          <div class="panel-head"><div><h3>快速入口</h3><p>把常用数据库钉在这里</p></div></div>
          <div class="quick-grid">
            ${[
              ["compliance", "🗓️", "合规日历", `${m.pending.length} 项待办`],
              ["finance", "💰", "资金台账", `${formatCompact(m.cash)} 现金`],
              ["clients", "🤝", "客户合同", `${formatCompact(m.receivable)} 应收`],
              ["policies", "📡", "政策雷达", `${policies.length} 项匹配`],
            ].map(([id, emoji, title, note]) => `<button type="button" class="quick-card" data-action="open-page" data-page="${id}">
              <span class="quick-card__icon">${emoji}</span>
              <span class="quick-card__title">${title}</span>
              <span class="quick-card__note">${note}</span>
            </button>`).join("")}
          </div>
        </section>

        <section class="panel-card panel-card--tight">
          <div class="panel-head"><div><h3>政策雷达</h3><p>按匹配度排序</p></div><button type="button" class="link-btn" data-action="open-page" data-page="policies">全部</button></div>
          <div class="policy-list">
            ${policies.map((policy) => `<button type="button" class="policy-row" data-action="open-db-row" data-db="db_policies" data-row="${policy.id}">
              <span class="policy-row__icon">${icon("star", 13)}</span>
              <span class="policy-row__body"><strong>${esc(policy.title)}</strong><small>${esc(policy.amount)} · ${esc(policy.deadline)}</small></span>
              <span class="policy-row__match">${policy.match}%</span>
            </button>`).join("")}
          </div>
        </section>
      </aside>
    </div>
    <div class="dash-footer">${icon("sparkles", 13)} 这个页面由 4 个数据库和 1 个 AI 助手驱动 · <button type="button" class="link-btn" data-action="open-templates">用模板搭一个自己的首页</button></div>
  </div>`;
}

// ---------------------------------------------------------------- templates / trash

function renderTemplateGallery() {
  const categories = [...new Set(store.state.templates.map((template) => template.category))];
  const pro = hasProAccess();
  return `<div class="special-page">
    <div class="special-head">
      <div class="special-eyebrow">${icon("template", 14)} TEMPLATE GALLERY</div>
      <h1>从模板开始，不从空白开始。</h1>
      <p>把 Notion 的模板思路，接到一人公司的真实流程上：合规、资金、客户、政策、周报、融资。</p>
      <div class="special-stats"><span>${store.state.templates.length} 个模板</span><span>页面与数据库都可复用</span><span>全部本地保存</span></div>
    </div>
    <div class="template-categories">${categories.map((category) => `<span class="tag tag--lg">${esc(category)}</span>`).join("")}</div>
    <div class="template-grid">
      ${store.state.templates.map((template) => `<article class="template-card ${template.pro && !pro ? "is-locked" : ""}">
        <div class="template-card__top"><span class="template-icon">${esc(template.icon)}</span><span class="tag">${esc(template.category)}</span>${template.pro && !pro ? `<span class="tag tag--pro">PRO</span>` : ""}</div>
        <h3>${esc(template.title)}</h3>
        <p>${esc(template.desc)}</p>
        <div class="template-card__foot">
          <span>${template.kind === "database" ? "数据库模板" : "页面模板"}</span>
          <button type="button" class="btn btn--primary btn--sm" data-action="use-template" data-template="${template.id}">${template.pro && !pro ? `${icon("lock", 12)} Pro 解锁` : `使用模板 ${icon("arrowRight", 13)}`}</button>
        </div>
      </article>`).join("")}
    </div>
  </div>`;
}

function renderTrash() {
  return `<div class="special-page">
    <div class="special-head">
      <div class="special-eyebrow">${icon("trash", 14)} TRASH</div>
      <h1>回收站</h1>
      <p>删除的页面会先放在这里。恢复后回到原来的位置。</p>
    </div>
    <div class="trash-list">
      ${store.state.trash.length ? store.state.trash.map((page) => `<div class="trash-row">
        <span class="trash-icon">${esc(page.icon)}</span>
        <span class="trash-title">${esc(page.title)}</span>
        <span class="trash-meta">${page.kind === "database" ? "数据库" : "页面"} · 已删除</span>
        <button type="button" class="btn btn--ghost btn--sm" data-action="restore-page" data-page="${page.id}">恢复</button>
        <button type="button" class="btn btn--danger btn--sm" data-action="purge-page" data-page="${page.id}">彻底删除</button>
      </div>`).join("") : `<div class="empty-state">回收站是空的。</div>`}
    </div>
  </div>`;
}

// ---------------------------------------------------------------- right panel

function renderRightPanel(page) {
  const panel = ui.rightPanel;
  return `<aside class="right-panel">
    <div class="right-panel__head">
      <div class="right-tabs">
        <button type="button" class="right-tab ${panel === "properties" ? "is-active" : ""}" data-action="panel" data-panel="properties">属性</button>
        <button type="button" class="right-tab ${panel === "comments" ? "is-active" : ""}" data-action="panel" data-panel="comments">评论</button>
        <button type="button" class="right-tab ${panel === "ai" ? "is-active" : ""}" data-action="panel" data-panel="ai">AI</button>
        <button type="button" class="right-tab ${panel === "governance" ? "is-active" : ""}" data-action="panel" data-panel="governance">${icon("shield", 12)} 治理</button>
      </div>
      <button type="button" class="icon-btn icon-btn--sm" data-action="close-panel" aria-label="关闭">${icon("x", 14)}</button>
    </div>
    <div class="right-panel__body">
      ${panel === "properties" ? renderProperties(page) : panel === "comments" ? renderComments(page) : panel === "governance" ? renderGovernancePanel(store.state, page) : renderAIPanel(page)}
    </div>
  </aside>`;
}

function renderProperties(page) {
  const state = store.state;
  const db = page.kind === "database" ? getDatabase(state, page.dbId) : null;
  const backlinks = state.pages.filter((item) => item.id !== page.id && item.parentId === page.id);
  return `<div class="panel-section">
    <h4>页面信息</h4>
    <div class="prop-row"><span>类型</span><strong>${page.kind === "database" ? "数据库" : page.kind === "dashboard" ? "驾驶舱" : "文档"}</strong></div>
    <div class="prop-row"><span>所有者</span><strong>${esc(state.workspace.owner)}</strong></div>
    <div class="prop-row"><span>最后编辑</span><strong>${esc(page.updated || "刚刚")}</strong></div>
    ${db ? `<div class="prop-row"><span>记录</span><strong>${db.rows.length} 条</strong></div><div class="prop-row"><span>属性</span><strong>${db.properties.length} 个</strong></div>` : `<div class="prop-row"><span>块</span><strong>${page.blocks?.length || 0} 个</strong></div>`}
  </div>
  <div class="panel-section">
    <h4>标签</h4>
    <div class="tag-row"><span class="tag tag--teal">一人公司</span><span class="tag">OPC</span><span class="tag">2026</span><button type="button" class="tag tag--add" data-action="add-tag">＋</button></div>
  </div>
  ${backlinks.length ? `<div class="panel-section"><h4>子页面</h4>${backlinks.map((child) => `<button type="button" class="backlink" data-action="open-page" data-page="${child.id}">${esc(child.icon)} ${esc(child.title)} ${icon("chevronRight", 12)}</button>`).join("")}</div>` : ""}
  <div class="panel-section">
    <h4>导出</h4>
    <button type="button" class="panel-action" data-action="export-page">${icon("download", 15)} 导出 ${db ? "CSV" : "Markdown"}</button>
    <button type="button" class="panel-action" data-action="copy-link">${icon("link", 15)} 复制页面链接</button>
  </div>`;
}

function renderComments(page) {
  const comments = page.comments || [];
  return `<div class="comment-list">
    ${comments.length ? comments.map((comment) => `<div class="comment">
      <div class="comment__head"><span class="avatar avatar--sm">${esc(initials(comment.author))}</span><strong>${esc(comment.author)}</strong><span>${esc(comment.time)}</span></div>
      <p>${esc(comment.text)}</p>
    </div>`).join("") : `<div class="empty-state empty-state--sm">还没有评论。把问题留在页面上，而不是留在微信里。</div>`}
  </div>
  <div class="comment-compose">
    <textarea id="comment-input" data-comment-draft placeholder="写一条评论…">${esc(ui.commentDraft)}</textarea>
    <button type="button" class="btn btn--primary btn--sm" data-action="add-comment">${icon("send", 13)} 发送</button>
  </div>`;
}

function renderAIPanel(page) {
  return `<div class="ai-context">${icon("sparkles", 13)} 当前页面：<strong>${esc(page.title)}</strong><span>演示 AI</span></div>
    ${renderAIGovernance(store.state, page)}
    <div class="ai-messages">
      ${ui.aiMessages.map((message) => `<div class="ai-msg ai-msg--${message.role}">
        ${message.role === "assistant" ? `<span class="ai-avatar">AI</span>` : ""}
        <div class="ai-bubble">${aiMarkup(message.text)}</div>
      </div>`).join("")}
    </div>
    <div class="ai-suggestions">
      ${aiSuggestions(store.state, page).map((suggestion) => `<button type="button" class="ai-suggestion" data-action="ai-suggestion" data-prompt="${esc(suggestion.prompt)}">${suggestion.icon} ${esc(suggestion.label)}</button>`).join("")}
    </div>
    <div class="ai-compose">
      <textarea id="ai-input" data-ai-input placeholder="问点什么，例如：帮我写本周周报…">${esc(ui.aiInput)}</textarea>
      <button type="button" class="btn btn--primary btn--sm" data-action="ai-send">${icon("send", 13)} 发送</button>
    </div>
    <div class="ai-disclaimer">AI 只做建议与起草；发送、付款、申报仍由你确认。</div>`;
}

// ---------------------------------------------------------------- palette / modals

function paletteItems(state) {
  const pages = state.pages.filter((page) => !page.trashed).map((page) => ({
    kind: "page",
    id: page.id,
    icon: page.icon,
    title: page.title,
    hint: page.kind === "database" ? "数据库" : "页面",
  }));
  const templates = state.templates.map((template) => ({
    kind: "template",
    id: template.id,
    icon: template.icon,
    title: template.title,
    hint: `模板 · ${template.category}`,
  }));
  const actions = [
    { kind: "action", id: "new-page", icon: "＋", title: "新建页面", hint: "操作" },
    { kind: "action", id: "open-templates", icon: "▦", title: "打开模板库", hint: "操作" },
    { kind: "action", id: "open-approvals", icon: "◎", title: "打开审批箱", hint: "治理" },
    { kind: "action", id: "open-seo", icon: "⌕", title: "打开出海GEO", hint: "增长" },
    { kind: "action", id: "open-geo", icon: "◎", title: "打开中国市场GEO", hint: "4 平台" },
    { kind: "action", id: "open-org", icon: "▤", title: "打开智能组织", hint: "V0.0.5" },
    { kind: "action", id: "open-trash", icon: "♲", title: "打开回收站", hint: "操作" },
    { kind: "action", id: "export-page", icon: "↓", title: "导出当前页面", hint: "操作" },
    { kind: "action", id: "reset-demo", icon: "↺", title: "重置演示数据", hint: "操作" },
  ];
  return [...pages, ...templates, ...actions];
}

function renderPalette(state) {
  const items = paletteItems(state);
  return `<div class="palette-overlay" data-action="close-palette">
    <div class="palette" data-palette-panel>
      <div class="palette__search">${icon("search", 17)}<input id="palette-input" value="${esc(ui.paletteQuery)}" placeholder="搜索页面、模板或操作…" autocomplete="off"/><kbd>ESC</kbd></div>
      <div class="palette__list" id="palette-list">${paletteList(items)}</div>
    </div>
  </div>`;
}

function paletteList(items) {
  const query = ui.paletteQuery.trim().toLowerCase();
  const filtered = items.filter((item) => `${item.title} ${item.hint}`.toLowerCase().includes(query));
  return filtered.length
    ? filtered.map((item) => `<button type="button" class="palette-item" data-action="pick-palette" data-kind="${item.kind}" data-id="${item.id}">
        <span class="palette-item__icon">${item.icon}</span>
        <span class="palette-item__title">${esc(item.title)}</span>
        <span class="palette-item__hint">${esc(item.hint)}</span>
      </button>`).join("")
    : `<div class="empty-state empty-state--sm">没有匹配项</div>`;
}

function renderShareModal(page) {
  const link = `${location.origin}${location.pathname}#/p/${page.id}`;
  return `<div class="modal-overlay" data-action="close-share">
    <div class="modal modal--sm" data-modal-panel>
      <div class="modal__head"><h3>分享「${esc(page.title)}」</h3><button type="button" class="icon-btn icon-btn--sm" data-action="close-share">${icon("x", 14)}</button></div>
      <p class="modal__desc">这是演示工作区。复制链接后，任何打开本页面的人都能看到同一份本地数据。</p>
      <div class="share-link"><input value="${esc(link)}" readonly id="share-link-input"/><button type="button" class="btn btn--primary btn--sm" data-action="copy-link">复制链接</button></div>
      <div class="share-permission">${icon("lock", 13)} 仅拥有链接的人可查看 · 不会上传到服务器</div>
    </div>
  </div>`;
}

function renderPageMenu(page) {
  return `<div class="popover-shade" data-action="close-page-menu">
    <div class="page-menu" data-menu-panel>
      <button type="button" class="page-menu__item" data-action="export-page">${icon("download", 15)} 导出 ${page.kind === "database" ? "CSV" : "Markdown"}</button>
      <button type="button" class="page-menu__item" data-action="copy-link">${icon("link", 15)} 复制链接</button>
      <button type="button" class="page-menu__item" data-action="open-seo-page">${icon("search", 15)} 出海GEO设置</button>
      <button type="button" class="page-menu__item" data-action="ask-ai">${icon("sparkles", 15)} 用 AI 总结</button>
      <div class="page-menu__sep"></div>
      <button type="button" class="page-menu__item page-menu__item--danger" data-action="delete-page">${icon("trash", 15)} 移到回收站</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- events

app.addEventListener("click", (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "close-row") {
    if (event.target.closest("[data-drawer]") && !event.target.closest('button[data-action="close-row"]')) return;
  }
  if (action === "close-block-menu" && event.target.closest("[data-menu-panel]")) return;
  if (action === "close-page-menu" && event.target.closest("[data-menu-panel]")) return;
  if (action === "close-palette" && event.target.closest("[data-palette-panel]")) return;
  if (action === "close-share" && event.target.closest("[data-modal-panel]") && !event.target.closest('button[data-action="close-share"]')) return;
  if (action === "close-paywall" && event.target.closest("[data-paywall-panel]") && !event.target.closest('button[data-action="close-paywall"]')) return;
  if (action === "close-approval-modal" && event.target.closest("[data-approval-panel]") && !event.target.closest('button[data-action="close-approval-modal"]')) return;

  switch (action) {
    case "toggle-sidebar":
      ui.sidebarOpen = !ui.sidebarOpen;
      render();
      break;
    case "open-page":
      navigate(actionEl.dataset.page);
      break;
    case "open-templates":
      openRoute("templates");
      break;
    case "open-trash":
      openRoute("trash");
      break;
    case "open-approvals":
      openRoute("approvals");
      break;
    case "open-seo":
      ui.rightPanel = null;
      openRoute("seo");
      break;
    case "open-seo-page":
      ui.seoPageId = currentPage().id;
      ui.seoTab = "page";
      ui.pageMenuOpen = false;
      ui.rightPanel = null;
      openRoute("seo");
      break;
    case "open-geo":
      ui.rightPanel = null;
      openRoute("geo");
      break;
    case "open-org":
      ui.rightPanel = null;
      openRoute("org");
      break;
    case "org-tab":
      ui.orgTab = actionEl.dataset.tab || "network";
      render();
      break;
    case "org-task":
      ui.orgTaskId = actionEl.dataset.task || "t1";
      ui.orgTab = "network";
      render();
      break;
    case "org-loop":
      ui.orgLoopId = actionEl.dataset.loop || "product";
      render();
      break;
    case "org-skill-filter":
      ui.orgSkillFilter = actionEl.dataset.filter || "all";
      render();
      break;
    case "org-advance-task": {
      if (advanceOrgTask(store.state, actionEl.dataset.task || ui.orgTaskId)) {
        store.save();
        render();
        showToast("任务已推进，证据链新增一条记录");
      } else {
        showToast("该任务已经完成");
      }
      break;
    }
    case "org-extract-skill": {
      const result = extractOrgSkill(store.state, actionEl.dataset.task || ui.orgTaskId);
      if (result.added) {
        store.save();
        render();
        showToast("已沉淀为组织 Skill");
      } else {
        showToast(result.duplicate ? "这个任务已经沉淀过" : "没有可沉淀的任务");
      }
      break;
    }
    case "org-use-skill":
      if (useOrgSkill(store.state, actionEl.dataset.skill)) {
        store.save();
        render();
        showToast("Skill 复用 +1");
      }
      break;
    case "org-run-loop":
      if (runOrgLoop(store.state, actionEl.dataset.loop || ui.orgLoopId)) {
        store.save();
        render();
        showToast("Loop 已跑完一轮，指标已更新");
      }
      break;
    case "org-verify-chain": {
      const valid = verifyOrgChain(store.state);
      store.save();
      render();
      showToast(valid ? "证据链验证通过" : "证据链校验失败：存在断链");
      break;
    }
    case "org-add-evidence":
      if (addOrgEvidence(store.state, actionEl.dataset.task || ui.orgTaskId)) {
        store.save();
        render();
        showToast("已补录一条证据，待重新验证");
      }
      break;
    case "geo-view":
      ui.geoView = actionEl.dataset.view || "matrix";
      render();
      break;
    case "geo-platform":
      ui.geoPlatform = actionEl.dataset.platform || "doubao";
      render();
      break;
    case "geo-page":
      ui.geoPageId = actionEl.dataset.page;
      render();
      break;
    case "geo-query":
      ui.geoQueryId = actionEl.dataset.query || "q1";
      render();
      break;
    case "geo-cell":
      ui.geoPlatform = actionEl.dataset.platform;
      ui.geoQueryId = actionEl.dataset.query;
      ui.geoPageId = getGeoQuery(actionEl.dataset.query).pageId;
      ui.geoView = "optimize";
      render();
      break;
    case "geo-probe":
      if (!hasProAccess()) {
        openPaywall("geo");
        break;
      }
      runProbes(store.state);
      store.save();
      render();
      showToast("已运行 4 平台探针（演示）");
      break;
    case "geo-save-brief": {
      if (!hasProAccess()) {
        openPaywall("geo");
        break;
      }
      const page = getPage(store.state, ui.geoPageId) || getPage(store.state, "home");
      const brief = buildBrief(store.state, page, ui.geoPlatform, ui.geoQueryId);
      store.state.geo.briefs.push({ ...brief, id: uid("brief") });
      store.save();
      render();
      showToast("平台 Brief 已保存");
      break;
    }
    case "geo-copy-brief": {
      if (!hasProAccess()) {
        openPaywall("geo");
        break;
      }
      const briefId = actionEl.dataset.brief;
      let brief = briefId ? store.state.geo.briefs.find((item) => item.id === briefId) : null;
      if (!brief) {
        const page = getPage(store.state, ui.geoPageId) || getPage(store.state, "home");
        brief = buildBrief(store.state, page, ui.geoPlatform, ui.geoQueryId);
      }
      copyText(briefText(brief)).then(() => showToast("平台 Brief 已复制"));
      break;
    }
    case "geo-delete-brief": {
      store.state.geo.briefs = store.state.geo.briefs.filter((item) => item.id !== actionEl.dataset.brief);
      store.save();
      render();
      showToast("Brief 已删除");
      break;
    }
    case "seo-page":
      ui.seoPageId = actionEl.dataset.page;
      ui.seoTab = "page";
      render();
      break;
    case "seo-tab":
      ui.seoTab = actionEl.dataset.tab || "page";
      render();
      break;
    case "seo-asset":
      ui.seoAsset = actionEl.dataset.asset || "meta";
      render();
      break;
    case "save-seo-page": {
      if (!hasProAccess()) {
        openPaywall("seo");
        break;
      }
      const page = getPage(store.state, actionEl.dataset.page);
      if (!page) break;
      const data = readPageSEOForm();
      applyPageSEO(store.state, page, data);
      store.save();
      render();
      showToast("页面出海GEO已保存");
      break;
    }
    case "save-seo-site":
      if (!hasProAccess()) {
        openPaywall("seo");
        break;
      }
      applySiteSEO(store.state, readSiteSEOForm());
      store.save();
      render();
      showToast("站点 SEO 设置已保存");
      break;
    case "copy-seo": {
      if (!hasProAccess()) {
        openPaywall("seo");
        break;
      }
      const page = getSEOPage(store.state, actionEl.dataset.page || ui.seoPageId);
      const code = generateAsset(store.state, page, actionEl.dataset.type || "meta");
      copyText(code).then(() => showToast("已复制 SEO 资产"));
      break;
    }
    case "download-seo": {
      if (!hasProAccess()) {
        openPaywall("seo");
        break;
      }
      const page = getSEOPage(store.state, actionEl.dataset.page || ui.seoPageId);
      const type = actionEl.dataset.type || "meta";
      download(assetFilename(type, page), generateAsset(store.state, page, type), type === "sitemap" ? "application/xml;charset=utf-8" : "text/plain;charset=utf-8");
      showToast("SEO 资产已下载");
      break;
    }
    case "approval-filter":
      ui.approvalFilter = actionEl.dataset.filter || "pending";
      render();
      break;
    case "open-workflow":
      openWorkflow(actionEl.dataset.workflow);
      break;
    case "approve-workflow": {
      let outcome = null;
      store.commit((state) => {
        outcome = approveWorkflow(state, actionEl.dataset.workflow, "证据齐全，批准执行");
      });
      render();
      showToast(outcome?.ok ? "已批准并执行（演示）" : outcome?.error || "无法批准");
      break;
    }
    case "modify-workflow": {
      const workflow = getWorkflow(store.state, actionEl.dataset.workflow);
      if (!workflow) break;
      ui.approvalModal = { mode: "modify", workflowId: workflow.id, text: workflow.action.summary };
      render();
      break;
    }
    case "reject-workflow":
      ui.approvalModal = { mode: "reject", workflowId: actionEl.dataset.workflow, text: "" };
      render();
      break;
    case "close-approval-modal":
      ui.approvalModal = null;
      render();
      break;
    case "save-modification": {
      const text = document.querySelector("[data-approval-note]")?.value || "";
      let outcome = null;
      store.commit((state) => {
        outcome = modifyWorkflowAction(state, actionEl.dataset.workflow, text);
      });
      if (!outcome?.ok) {
        showToast(outcome?.error || "修改失败");
        break;
      }
      ui.approvalModal = null;
      render();
      showToast("提案已修改，仍需重新批准");
      break;
    }
    case "confirm-reject": {
      const text = document.querySelector("[data-approval-note]")?.value || "";
      if (!text.trim()) {
        showToast("请写清驳回原因");
        break;
      }
      let outcome = null;
      store.commit((state) => {
        outcome = rejectWorkflow(state, actionEl.dataset.workflow, text);
      });
      ui.approvalModal = null;
      render();
      showToast(outcome?.ok ? "提案已驳回，原因已写入审计日志" : outcome?.error || "驳回失败");
      break;
    }
    case "verify-evidence": {
      let outcome = null;
      store.commit((state) => {
        outcome = verifyEvidence(state, actionEl.dataset.workflow, actionEl.dataset.evidence);
      });
      render();
      showToast(outcome?.ok ? "证据已核验（演示），现在可以批准" : outcome?.error || "核验失败");
      break;
    }
    case "export-audit": {
      const bundle = auditBundle(store.state);
      download(`OPC-OS-audit-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(bundle, null, 2), "application/json;charset=utf-8");
      showToast("审计包已导出");
      break;
    }
    case "new-page":
      createPage();
      break;
    case "new-child-page":
      createPage(actionEl.dataset.page);
      break;
    case "open-palette":
      ui.paletteOpen = true;
      ui.paletteQuery = "";
      render();
      break;
    case "close-palette":
      ui.paletteOpen = false;
      render();
      break;
    case "pick-palette":
      pickPalette(actionEl.dataset.kind, actionEl.dataset.id);
      break;
    case "panel":
      ui.rightPanel = actionEl.dataset.panel;
      render();
      break;
    case "close-panel":
      ui.rightPanel = null;
      render();
      break;
    case "favorite":
      toggleFavorite();
      break;
    case "share":
      ui.shareOpen = true;
      render();
      break;
    case "close-share":
      ui.shareOpen = false;
      render();
      break;
    case "copy-link":
      copyText(`${location.origin}${location.pathname}#/p/${currentPage().id}`).then(() => showToast("链接已复制"));
      break;
    case "page-menu":
      ui.pageMenuOpen = true;
      render();
      break;
    case "close-page-menu":
      ui.pageMenuOpen = false;
      render();
      break;
    case "open-paywall":
      openPaywall(actionEl.dataset.reason || "manual");
      break;
    case "close-paywall":
      ui.paywall.open = false;
      render();
      break;
    case "paywall-plan":
      ui.paywall.plan = actionEl.dataset.plan;
      ui.paywall.error = "";
      render();
      break;
    case "paywall-channel":
      ui.paywall.channel = actionEl.dataset.channel;
      ui.paywall.error = "";
      render();
      break;
    case "paywall-unlock":
      unlockPaywall();
      break;
    case "paywall-restore":
      if (isPro()) {
        ui.paywall.open = false;
        render();
        showToast("当前浏览器已解锁 Pro");
      } else {
        ui.paywall.error = "没有找到已恢复的 Pro，请使用解锁码或联系主理人。";
        render();
      }
      break;
    case "open-paywall-settings":
      ui.paywall.open = false;
      openRoute("paywall-settings");
      break;
    case "save-paywall":
      savePaywallConfig(readPaywallForm());
      render();
      showToast("付费墙设置已保存");
      break;
    case "preview-paywall":
      openPaywall("preview");
      break;
    case "reset-paywall":
      if (confirm("恢复默认付费墙文案和价格？")) {
        resetPaywallConfig();
        render();
        showToast("已恢复默认设置");
      }
      break;
    case "remove-qr": {
      const channel = actionEl.dataset.channel;
      const input = document.querySelector(`[data-pw="${channel}QR"]`);
      if (input) input.value = "";
      const box = document.querySelector(`[data-qr-preview-box="${channel}"]`);
      if (box) box.innerHTML = `<span data-qr-preview="${channel}" class="settings-qr__empty">未上传</span>`;
      showToast("已移除，点击保存生效");
      break;
    }
    case "manual-unlock":
      activatePro("manual");
      render();
      showToast("已手动解锁 Pro");
      break;
    case "reset-pro":
      resetPro();
      render();
      showToast("已取消本机 Pro");
      break;
    case "copy-unlock-code":
      copyText(readPaywallForm().unlockCode).then(() => showToast("解锁码已复制"));
      break;
    case "delete-page":
      if (confirm(`把「${currentPage().title}」移到回收站？`)) {
        const id = currentPage().id;
        store.deletePage(id);
        ui.pageMenuOpen = false;
        location.hash = "#/p/home";
        render();
        showToast("已移到回收站");
      }
      break;
    case "restore-page":
      store.restorePage(actionEl.dataset.page);
      render();
      showToast("页面已恢复");
      break;
    case "purge-page":
      if (confirm("彻底删除后不可恢复，继续？")) {
        store.purgePage(actionEl.dataset.page);
        render();
        showToast("已彻底删除");
      }
      break;
    case "use-template":
      useTemplate(actionEl.dataset.template);
      break;
    case "db-view":
      ui.viewByDb[actionEl.dataset.db] = actionEl.dataset.view;
      render();
      break;
    case "db-sort": {
      const dbId = actionEl.dataset.db;
      const key = actionEl.dataset.key;
      if (ui.sortBy[dbId] === key) ui.sortDir[dbId] = ui.sortDir[dbId] === "desc" ? "asc" : "desc";
      else {
        ui.sortBy[dbId] = key;
        ui.sortDir[dbId] = "asc";
      }
      render();
      break;
    }
    case "add-row":
      addRow(actionEl.dataset.db, actionEl.dataset.group);
      break;
    case "open-row":
      openRow(actionEl.dataset.db, actionEl.dataset.row);
      break;
    case "open-db-row":
      openRow(actionEl.dataset.db, actionEl.dataset.row);
      break;
    case "close-row":
      ui.selectedRow = null;
      render();
      break;
    case "delete-row":
      if (confirm("删除这条记录？")) {
        store.deleteRow(actionEl.dataset.db, actionEl.dataset.row);
        ui.selectedRow = null;
        render();
        showToast("记录已删除");
      }
      break;
    case "cal-prev":
    case "cal-next": {
      const [year, month] = ui.calendarCursor.split("-").map(Number);
      const date = new Date(year, month - 1 + (action === "cal-next" ? 1 : -1), 1);
      ui.calendarCursor = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      render();
      break;
    }
    case "toggle-task":
      toggleTask(actionEl.dataset.row);
      break;
    case "insert-block":
      ui.blockMenu = { mode: "insert", pageId: actionEl.dataset.page, afterId: actionEl.dataset.after || null };
      render();
      break;
    case "block-menu":
      ui.blockMenu = { mode: "actions", pageId: actionEl.dataset.page, blockId: actionEl.dataset.block };
      render();
      break;
    case "close-block-menu":
      ui.blockMenu = null;
      render();
      break;
    case "insert-type":
      insertType(actionEl.dataset.type, actionEl.dataset.page, actionEl.dataset.after, actionEl.dataset.replace || null);
      break;
    case "duplicate-block":
      duplicateBlock(actionEl.dataset.block);
      break;
    case "delete-block":
      deleteBlock(actionEl.dataset.block);
      break;
    case "turn-block":
      ui.blockMenu = { mode: "insert", pageId: currentPage().id, afterId: actionEl.dataset.block, replaceId: actionEl.dataset.block };
      render();
      break;
    case "toggle-todo":
      toggleTodo(actionEl.dataset.block);
      break;
    case "ai-send":
      sendAI();
      break;
    case "ai-suggestion":
      sendAI(actionEl.dataset.prompt);
      break;
    case "ask-ai":
      ui.rightPanel = "ai";
      ui.aiInput = `请基于「${currentPage().title}」的上下文，总结现在最值得处理的三件事，并给出下一步。`;
      render();
      break;
    case "add-comment":
      addComment();
      break;
    case "export-page":
      exportCurrentPage();
      break;
    case "add-tag":
      showToast("标签编辑在演示版中暂未开放");
      break;
    case "change-cover":
      cycleCover();
      break;
    case "change-icon":
      cycleIcon();
      break;
    case "inbox":
      showToast("收件箱：3 条待处理通知（演示）");
      break;
    case "workspace":
    case "account":
      showToast("工作区设置：演示版");
      break;
    case "reset-demo":
      if (confirm("重置所有演示数据？")) {
        store.reset();
        location.hash = "#/p/home";
        ui.aiMessages = [{ role: "assistant", text: "工作区已重置。需要我先帮你过一遍 11 月的合规待办吗？" }];
        render();
        showToast("演示数据已重置");
      }
      break;
    default:
      break;
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-page-title]")) {
    const page = currentPage();
    page.title = target.innerText.trim() || "未命名";
    if (page.kind === "database") {
      const db = getDatabase(store.state, page.dbId);
      if (db) db.title = page.title;
    }
    store.save();
    return;
  }
  if (target.matches("[data-page-description]")) {
    currentPage().description = target.innerText.trim();
    store.save();
    return;
  }
  if (target.matches("[data-block-text]")) {
    const page = currentPage();
    const block = page.blocks?.find((item) => item.id === target.dataset.block);
    if (!block) return;
    const text = target.innerText.replace(/\n$/, "");
    block.text = text;
    store.save();
    maybeTransformBlock(block, text);
    return;
  }
  if (target.matches("[data-cell-input]")) {
    const db = getDatabase(store.state, target.dataset.db);
    const row = db?.rows.find((item) => item.id === target.dataset.row);
    if (!row) return;
    const type = target.dataset.type;
    let value = target.innerText;
    if (type === "money" || type === "number") value = Number(value.replace(/[^\d.-]/g, "")) || 0;
    row[target.dataset.key] = value;
    store.save();
    return;
  }
  if (target.matches("[data-db-search]")) {
    ui.dbSearch[target.dataset.dbSearch] = target.value;
    ui.focusSearch = target.dataset.dbSearch;
    debouncedDbRender();
    return;
  }
  if (target.matches("[data-paywall-code]")) {
    ui.paywall.code = target.value;
    return;
  }
  if (target.matches("[data-approval-note]")) {
    if (ui.approvalModal) ui.approvalModal.text = target.value;
    return;
  }
  if (target.matches("[data-ai-input]")) {
    ui.aiInput = target.value;
    return;
  }
  if (target.matches("[data-comment-draft]")) {
    ui.commentDraft = target.value;
    return;
  }
  if (target.id === "palette-input") {
    ui.paletteQuery = target.value;
    const list = document.getElementById("palette-list");
    if (list) list.innerHTML = paletteList(paletteItems(store.state));
    return;
  }
  if (target.id === "block-menu-search") {
    const query = target.value.trim().toLowerCase();
    document.querySelectorAll(".block-menu__grid .block-menu__item").forEach((item) => {
      item.style.display = item.innerText.toLowerCase().includes(query) ? "" : "none";
    });
    return;
  }
  if (target.matches("[data-row-title]")) {
    const db = getDatabase(store.state, target.dataset.db);
    const row = db?.rows.find((item) => item.id === target.dataset.row);
    if (row) {
      row[db.titleKey] = target.innerText.trim() || "未命名";
      store.save();
    }
    return;
  }
  if (target.matches("[data-row-note]")) {
    const db = getDatabase(store.state, target.dataset.db);
    const row = db?.rows.find((item) => item.id === target.dataset.row);
    if (row) {
      row.note = target.value;
      store.save();
    }
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-cell-select]") || target.matches("[data-cell-input][data-type='date']")) {
    const db = getDatabase(store.state, target.dataset.db);
    const row = db?.rows.find((item) => item.id === target.dataset.row);
    if (!row) return;
    row[target.dataset.key] = target.value;
    store.save();
    render();
    return;
  }
  if (target.matches("[data-row-field]")) {
    const db = getDatabase(store.state, target.dataset.db);
    const row = db?.rows.find((item) => item.id === target.dataset.row);
    if (!row) return;
    const type = target.dataset.type;
    row[target.dataset.key] = type === "money" || type === "number" ? Number(target.value) || 0 : target.value;
    store.save();
    render();
    return;
  }
  if (target.matches("[data-geo-page-select]")) {
    ui.geoPageId = target.value;
    render();
    return;
  }
  if (target.matches("[data-geo-platform-select]")) {
    ui.geoPlatform = target.value;
    render();
    return;
  }
  if (target.matches("[data-geo-query-select]")) {
    ui.geoQueryId = target.value;
    render();
    return;
  }
  if (target.matches("[data-qr-upload]")) {
    const file = target.files?.[0];
    if (!file) return;
    const channel = target.dataset.qrUpload;
    compressQR(file)
      .then((dataUrl) => {
        const hidden = document.querySelector(`[data-pw="${channel}QR"]`);
        if (hidden) hidden.value = dataUrl;
        const box = document.querySelector(`[data-qr-preview-box="${channel}"]`);
        if (box) box.innerHTML = `<img data-qr-preview="${channel}" src="${dataUrl}" alt="收款码"/>`;
        showToast("收款码已载入，点击保存生效");
      })
      .catch(() => showToast("图片读取失败，请换一张"));
  }
});

app.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target.matches("[data-page-title]") && event.key === "Enter") {
    event.preventDefault();
    target.blur();
    return;
  }
  if (target.matches("[data-block-text]") && event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    const page = currentPage();
    const block = page.blocks?.find((item) => item.id === target.dataset.block);
    if (!block || block.type === "code") return;
    event.preventDefault();
    const index = page.blocks.findIndex((item) => item.id === block.id);
    const next = { id: uid("b"), type: "paragraph", text: "" };
    page.blocks.splice(index + 1, 0, next);
    store.save();
    ui.focusBlock = next.id;
    render();
    return;
  }
  if (target.matches("[data-block-text]") && event.key === "Backspace") {
    const page = currentPage();
    const block = page.blocks?.find((item) => item.id === target.dataset.block);
    if (block && target.innerText.trim() === "" && page.blocks.length > 1) {
      event.preventDefault();
      const index = page.blocks.findIndex((item) => item.id === block.id);
      page.blocks.splice(index, 1);
      store.save();
      ui.focusBlock = page.blocks[Math.max(0, index - 1)].id;
      render();
    }
    return;
  }
  if (target.matches("[data-ai-input]") && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendAI();
    return;
  }
  if (target.id === "palette-input") {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = document.querySelector(".palette-item");
      if (first) first.click();
    }
    return;
  }
  if (event.key === "Escape") {
    if (ui.approvalModal) {
      ui.approvalModal = null;
      render();
    } else if (ui.blockMenu) {
      ui.blockMenu = null;
      render();
    } else if (ui.paletteOpen) {
      ui.paletteOpen = false;
      render();
    } else if (ui.shareOpen) {
      ui.shareOpen = false;
      render();
    } else if (ui.pageMenuOpen) {
      ui.pageMenuOpen = false;
      render();
    } else if (ui.paywall.open) {
      ui.paywall.open = false;
      render();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    ui.paletteOpen = true;
    ui.paletteQuery = "";
    render();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
    event.preventDefault();
    ui.rightPanel = "ai";
    render();
  }
});

const debouncedDbRender = debounce(() => {
  render();
}, 280);

// ---------------------------------------------------------------- actions

function showToast(message) {
  ui.toast = message;
  clearTimeout(toastTimer);
  render();
  toastTimer = setTimeout(() => {
    ui.toast = "";
    render();
  }, 2600);
}

function openPaywall(reason = "") {
  const config = getPaywallConfig();
  if (!config.enabled && reason !== "preview") {
    showToast("付费墙当前未启用");
    return;
  }
  ui.pageMenuOpen = false;
  ui.shareOpen = false;
  ui.paywall = {
    ...ui.paywall,
    open: true,
    reason,
    code: "",
    error: "",
    plan: ui.paywall.plan || "yearly",
    channel: ui.paywall.channel || "wechat",
  };
  render();
}

function unlockPaywall() {
  const code = document.querySelector("[data-paywall-code]")?.value || ui.paywall.code;
  if (!checkUnlockCode(code)) {
    ui.paywall.error = "解锁码不正确，请检查大小写或联系主理人。";
    render();
    return;
  }
  activatePro(ui.paywall.plan || "manual");
  ui.paywall.open = false;
  render();
  showToast("Pro 已解锁");
}

function createPage(parentId = null) {
  if (!canCreatePage()) {
    openPaywall("pages");
    return;
  }
  if (!hasProAccess()) incrementPageUsage();
  const page = store.addPage({
    title: "未命名页面",
    icon: "📄",
    parentId,
    cover: "paper",
  });
  navigate(page.id);
  showToast("页面已创建");
}

function useTemplate(templateId) {
  const template = store.state.templates.find((item) => item.id === templateId);
  if (!template) return;
  if (template.pro && !hasProAccess()) {
    openPaywall("templates");
    return;
  }
  if (!hasProAccess() && !canCreatePage()) {
    openPaywall("pages");
    return;
  }
  if (!hasProAccess()) incrementPageUsage();
  let page;
  if (template.kind === "database") {
    page = store.addDatabasePage({
      title: template.db.title,
      icon: template.icon,
      db: template.db,
    });
  } else {
    page = store.addPage({
      title: template.title,
      icon: template.icon,
      blocks: template.blocks,
      cover: "paper",
      description: template.desc,
    });
  }
  navigate(page.id);
  showToast("模板已应用");
}

function pickPalette(kind, id) {
  ui.paletteOpen = false;
  if (kind === "page") {
    navigate(id);
    return;
  }
  if (kind === "template") {
    useTemplate(id);
    return;
  }
  if (kind === "action") {
    if (id === "new-page") createPage();
    else if (id === "open-templates") openRoute("templates");
    else if (id === "open-approvals") openRoute("approvals");
    else if (id === "open-seo") openRoute("seo");
    else if (id === "open-geo") openRoute("geo");
    else if (id === "open-org") openRoute("org");
    else if (id === "open-trash") openRoute("trash");
    else if (id === "export-page") exportCurrentPage();
    else if (id === "reset-demo") {
      store.reset();
      location.hash = "#/p/home";
      render();
      showToast("演示数据已重置");
    }
  }
}

function toggleFavorite() {
  const page = currentPage();
  page.favorite = !page.favorite;
  store.save();
  render();
  showToast(page.favorite ? "已收藏" : "已取消收藏");
}

function openRow(dbId, rowId) {
  ui.selectedRow = { dbId, rowId };
  render();
}

function openWorkflow(workflowId) {
  const workflow = getWorkflow(store.state, workflowId);
  if (!workflow) return;
  ui.rightPanel = "governance";
  ui.selectedRow = workflow.dbId && workflow.rowId ? { dbId: workflow.dbId, rowId: workflow.rowId } : null;
  ui.approvalModal = null;
  if (location.hash === `#/p/${workflow.pageId}`) render();
  else location.hash = `#/p/${workflow.pageId}`;
}

function addRow(dbId, group) {
  const db = getDatabase(store.state, dbId);
  if (!db) return;
  const id = uid("row");
  let row = { id };
  if (dbId === "db_tasks") {
    row = { ...row, title: "新合规事项", category: "税务", due: "2026-11-30", owner: "创始人", priority: "中", status: "待办", note: "补充材料、对接人、注意事项。" };
  } else if (dbId === "db_finance") {
    row = { ...row, title: "新交易", date: "2026-11-05", type: "支出", category: "财税服务", amount: 0, account: "网商银行", status: "已支付", invoice: "待取票" };
  } else if (dbId === "db_clients") {
    row = { ...row, name: "新客户", project: "待补充", amount: 0, received: 0, stage: "线索", due: "2026-12-31", nextAction: "补充下一步", contact: "待补充" };
  } else if (dbId === "db_policies") {
    row = { ...row, title: "新政策", city: "杭州", amount: "待确认", deadline: "2026-12-31", match: 0, issuer: "待补充", tags: "", desc: "" };
  } else {
    row[db.titleKey] = "未命名";
    db.properties.forEach((prop) => {
      if (prop.key !== db.titleKey) row[prop.key] = prop.type === "money" || prop.type === "number" ? 0 : prop.options?.[0] || "";
    });
  }
  if (group && db.groupBy) row[db.groupBy] = group;
  store.addRow(dbId, row);
  ui.selectedRow = { dbId, rowId: id };
  render();
  showToast("记录已创建");
}

function toggleTask(rowId) {
  const db = getDatabase(store.state, "db_tasks");
  const row = db.rows.find((item) => item.id === rowId);
  if (!row) return;
  row.status = row.status === "已完成" ? "待办" : "已完成";
  store.save();
  render();
  showToast(row.status === "已完成" ? "已完成，健康分已更新" : "已恢复为待办");
}

function toggleTodo(blockId) {
  const page = currentPage();
  const block = page.blocks?.find((item) => item.id === blockId);
  if (!block) return;
  block.checked = !block.checked;
  store.save();
  render();
}

function maybeTransformBlock(block, text) {
  const patterns = [
    [/^#\s+/, "heading1", (value) => value.replace(/^#\s+/, "")],
    [/^##\s+/, "heading2", (value) => value.replace(/^##\s+/, "")],
    [/^###\s+/, "heading3", (value) => value.replace(/^###\s+/, "")],
    [/^[-*]\s+\[\s?\]\s+/, "todo", (value) => value.replace(/^[-*]\s+\[\s?\]\s+/, "")],
    [/^[-*]\s+/, "bulleted", (value) => value.replace(/^[-*]\s+/, "")],
    [/^\d+\.\s+/, "numbered", (value) => value.replace(/^\d+\.\s+/, "")],
    [/^>\s+/, "quote", (value) => value.replace(/^>\s+/, "")],
  ];
  if (text === "/") {
    block.text = "";
    store.save();
    ui.blockMenu = { mode: "insert", pageId: currentPage().id, afterId: block.id };
    render();
    return;
  }
  const match = patterns.find(([pattern]) => pattern.test(text));
  if (!match) return;
  const [, type, transform] = match;
  block.type = type;
  block.text = transform(text);
  if (type === "todo") block.checked = false;
  store.save();
  ui.focusBlock = block.id;
  render();
}

function insertType(type, pageId, afterId, replaceId) {
  const page = getPage(store.state, pageId);
  if (!page || !Array.isArray(page.blocks)) return;
  const block = type === "database"
    ? { id: uid("b"), type: "database", dbId: "db_tasks", text: "" }
    : { id: uid("b"), ...insertBlockType(type) };
  if (replaceId) {
    const index = page.blocks.findIndex((item) => item.id === replaceId);
    if (index >= 0) page.blocks[index] = { ...block, id: replaceId };
  } else {
    const index = afterId ? page.blocks.findIndex((item) => item.id === afterId) : page.blocks.length - 1;
    page.blocks.splice(index + 1, 0, block);
  }
  store.save();
  ui.blockMenu = null;
  ui.focusBlock = replaceId || block.id;
  render();
}

function duplicateBlock(blockId) {
  const page = currentPage();
  const block = page.blocks?.find((item) => item.id === blockId);
  if (!block) return;
  const index = page.blocks.findIndex((item) => item.id === blockId);
  const copy = { ...clone(block), id: uid("b") };
  page.blocks.splice(index + 1, 0, copy);
  store.save();
  ui.blockMenu = null;
  render();
  showToast("块已复制");
}

function deleteBlock(blockId) {
  const page = currentPage();
  if (!page.blocks?.length) return;
  page.blocks = page.blocks.filter((item) => item.id !== blockId);
  store.save();
  ui.blockMenu = null;
  render();
  showToast("块已删除");
}

function sendAI(promptOverride) {
  const prompt = (promptOverride ?? document.getElementById("ai-input")?.value ?? ui.aiInput).trim();
  if (!prompt) return;
  if (!canUseAI()) {
    openPaywall("ai");
    return;
  }
  if (!hasProAccess()) incrementAIUsage();
  const page = currentPage();
  ui.aiMessages.push({ role: "user", text: prompt });
  ui.aiMessages.push({ role: "assistant", text: aiReply(store.state, page, prompt) });
  ui.aiInput = "";
  ui.rightPanel = "ai";
  render();
}

function addComment() {
  const value = (document.getElementById("comment-input")?.value || ui.commentDraft).trim();
  if (!value) return;
  const page = currentPage();
  page.comments = page.comments || [];
  page.comments.push({ id: uid("c"), author: store.state.workspace.owner, text: value, time: "刚刚" });
  ui.commentDraft = "";
  store.save();
  render();
  showToast("评论已添加");
}

function exportCurrentPage() {
  if (!hasProAccess()) {
    openPaywall("export");
    return;
  }
  const page = currentPage();
  if (page.kind === "database") {
    const db = getDatabase(store.state, page.dbId);
    if (!db) return;
    const header = db.properties.map((prop) => prop.label).join(",");
    const rows = db.rows.map((row) => db.properties.map((prop) => `"${String(row[prop.key] ?? "").replaceAll('"', '""')}"`).join(","));
    download(`${page.title}.csv`, [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  } else {
    const markdown = `# ${page.title}\n\n${(page.blocks || []).map((block) => blockToMarkdown(block)).join("\n\n")}`;
    download(`${page.title}.md`, markdown, "text/markdown;charset=utf-8");
  }
  ui.pageMenuOpen = false;
  render();
  showToast("已导出");
}

function blockToMarkdown(block) {
  if (block.type === "heading1") return `# ${block.text}`;
  if (block.type === "heading2") return `## ${block.text}`;
  if (block.type === "heading3") return `### ${block.text}`;
  if (block.type === "bulleted") return `- ${block.text}`;
  if (block.type === "numbered") return `1. ${block.text}`;
  if (block.type === "todo") return `- [${block.checked ? "x" : " "}] ${block.text}`;
  if (block.type === "quote") return `> ${block.text}`;
  if (block.type === "callout") return `> ${block.icon || "💡"} ${block.text}`;
  if (block.type === "divider") return "---";
  if (block.type === "code") return `\`\`\`\n${block.text}\n\`\`\``;
  return block.text || "";
}

function cycleCover() {
  const covers = ["aurora", "mint", "sand", "rose", "violet", "navy", "paper", "sunset"];
  const page = currentPage();
  page.cover = covers[(covers.indexOf(page.cover) + 1) % covers.length];
  store.save();
  render();
}

function cycleIcon() {
  const icons = ["📄", "🗂️", "📌", "💡", "🎯", "🧭", "📊", "🏛️", "🤝", "🗓️", "💰", "📡"];
  const page = currentPage();
  page.icon = icons[(icons.indexOf(page.icon) + 1) % icons.length];
  store.save();
  render();
}

function placeCaretEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

syncRoute();
render();
