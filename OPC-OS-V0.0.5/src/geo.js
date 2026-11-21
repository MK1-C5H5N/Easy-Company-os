import { icon } from "./icons.js";
import { getPage, uid } from "./data.js";
import { contentText } from "./seo.js";
import { esc } from "./utils.js";

export const GEO_PLATFORMS = [
  {
    id: "doubao",
    name: "豆包",
    company: "字节跳动",
    badge: "D",
    color: "#4B6BFB",
    soft: "#EEF2FF",
    access: "火山方舟联网搜索 / 豆包搜索",
    mode: "API + App 抽查",
    citation: "搜索结果 / 来源卡片",
    style: "对话式、步骤化、例子具体",
    focus: "结论 + 3 步 + 案例",
    checks: ["直接答案", "步骤清晰", "案例可执行"],
  },
  {
    id: "qwen",
    name: "千问",
    company: "阿里云",
    badge: "Q",
    color: "#6D4BD8",
    soft: "#F3EEFF",
    access: "百炼 enable_search / DashScope / Responses",
    mode: "API + App 抽查",
    citation: "search_results / sources",
    style: "结构化、事实表、本地信息",
    focus: "事实表 + FAQ + 本地实体",
    checks: ["结构化事实", "本地信号", "来源可核验"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    company: "DeepSeek",
    badge: "DS",
    color: "#2F5FD0",
    soft: "#EEF4FF",
    access: "deepseek_web_search（V4.1-Flash）",
    mode: "API + App 抽查",
    citation: "联网搜索 + 引用作答",
    style: "技术深度、方法、代码、评测",
    focus: "架构 + 代码 + 评测",
    checks: ["技术深度", "方法可复现", "来源三角"],
  },
  {
    id: "glm",
    name: "GLM",
    company: "智谱 AI",
    badge: "GLM",
    color: "#0E7C6B",
    soft: "#E8F4F0",
    access: "Managed Agents web_search / web_fetch",
    mode: "API + App 抽查",
    citation: "来源与摘要",
    style: "治理、对比、企业决策",
    focus: "对比矩阵 + 合规边界",
    checks: ["治理视角", "对比矩阵", "来源权威"],
  },
];

export const GEO_QUERIES = [
  { id: "q1", query: "杭州一人公司 AI 内容服务", pageId: "home", intent: "商业" },
  { id: "q2", query: "OPC 一人公司是什么", pageId: "company", intent: "认知" },
  { id: "q3", query: "杭州 AI 创业补贴怎么申请", pageId: "policies", intent: "本地" },
  { id: "q4", query: "AI 内容工作流怎么搭", pageId: "home", intent: "技术" },
  { id: "q5", query: "一人公司需要哪些合规事项", pageId: "company", intent: "合规" },
];

const MENTION_MAP = {
  doubao: [true, true, true, true, false],
  qwen: [true, true, true, true, true],
  deepseek: [false, true, false, true, true],
  glm: [true, true, true, true, true],
};

const CITATION_MAP = {
  doubao: [true, false, true, false, false],
  qwen: [true, true, true, true, false],
  deepseek: [false, true, false, true, false],
  glm: [true, false, true, false, true],
};

const FIRST_MAP = {
  doubao: [true, false, false, true, false],
  qwen: [true, true, false, false, true],
  deepseek: [false, false, false, true, false],
  glm: [false, true, true, false, true],
};

export function getPlatform(id) {
  return GEO_PLATFORMS.find((platform) => platform.id === id) || GEO_PLATFORMS[0];
}

export function getGeoQuery(id) {
  return GEO_QUERIES.find((query) => query.id === id) || GEO_QUERIES[0];
}

export function ensureGeoState(state) {
  if (!state.geo) state.geo = { seeded: false, runs: [], briefs: [] };
  state.geo.runs ||= [];
  state.geo.briefs ||= [];
  if (!state.geo.seeded) {
    state.geo.runs = createDemoRuns(state);
    state.geo.seeded = true;
  }
}

function createDemoRuns(state) {
  const runs = [];
  for (const platform of GEO_PLATFORMS) {
    GEO_QUERIES.forEach((query, index) => {
      const page = getPage(state, query.pageId) || getPage(state, "home");
      const cited = CITATION_MAP[platform.id][index];
      const mention = MENTION_MAP[platform.id][index];
      runs.push({
        id: `geo_${platform.id}_${query.id}`,
        platform: platform.id,
        queryId: query.id,
        pageId: query.pageId,
        answer: demoAnswer(state, page, platform),
        citations: cited && page?.seo?.canonical ? [{ url: page.seo.canonical, title: page.title }] : [],
        mention,
        first: FIRST_MAP[platform.id][index],
        accuracy: 0.86 + ((index + platform.id.length) % 3) * 0.04,
        at: "2026-11-17T09:00:00+08:00",
        mode: "demo",
      });
    });
  }
  return runs;
}

function demoAnswer(state, page, platform) {
  const answer = page?.seo?.answer || page?.description || "";
  if (platform.id === "doubao") {
    return `先说结论：${answer}\n\n可以按 3 步走：1）先确认你的服务和城市；2）把公开页面写成可核验的事实；3）用内容 Brief 做一次复测。`;
  }
  if (platform.id === "qwen") {
    return `结论：${answer}\n\n关键事实：• 服务范围以官网为准；• 价格与交付物需要表格化；• 本地实体信息保持一致。`;
  }
  if (platform.id === "deepseek") {
    return `结论：${answer}\n\n方法：先把工作流、审批与证据链写成可复现的步骤，再用代码/配置和评测数据支撑结论。`;
  }
  return `从治理和落地两个维度看：${answer}\n\n建议先做对比矩阵，再确认审批、证据与责任边界。`;
}

export function runsFor(state, platform, queryId) {
  return state.geo.runs.filter((run) => run.platform === platform && (!queryId || run.queryId === queryId));
}

export function runFor(state, platform, queryId) {
  return runsFor(state, platform, queryId).at(-1) || null;
}

export function runProbes(state) {
  const at = new Date().toISOString();
  const start = state.geo.runs.length;
  GEO_PLATFORMS.forEach((platform, platformIndex) => {
    GEO_QUERIES.forEach((query, queryIndex) => {
      const page = getPage(state, query.pageId) || getPage(state, "home");
      const variant = start + platformIndex * GEO_QUERIES.length + queryIndex + 1;
      const mention = variant % 4 !== 0;
      const cited = mention && variant % 2 === 0;
      const first = mention && variant % 5 === 0;
      state.geo.runs.push({
        id: uid("geo_run"),
        platform: platform.id,
        queryId: query.id,
        pageId: query.pageId,
        answer: demoAnswer(state, page, platform),
        citations: cited && page?.seo?.canonical ? [{ url: page.seo.canonical, title: page.title }] : [],
        mention,
        first,
        accuracy: 0.82 + ((variant + platformIndex) % 5) * 0.035,
        at,
        mode: "demo",
      });
    });
  });
  state.geo.seeded = true;
  return state.geo.runs.length - start;
}

export function statusOf(run) {
  if (!run) return { label: "未测", tone: "slate" };
  if (!run.mention) return { label: "缺失", tone: "red" };
  if (run.first) return { label: "首推", tone: "green" };
  if (run.citations?.length) return { label: "引用", tone: "teal" };
  return { label: "提及", tone: "amber" };
}

export function platformStats(state, platform) {
  const runs = GEO_QUERIES.map((query) => runFor(state, platform, query.id)).filter(Boolean);
  const mention = runs.filter((run) => run.mention).length;
  const citations = runs.filter((run) => run.citations?.length).length;
  const first = runs.filter((run) => run.first).length;
  const score = runs.length ? Math.round(((mention * 0.45 + citations * 0.35 + first * 0.2) / runs.length) * 100) : 0;
  return { runs: runs.length, mention, citations, first, score };
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function analyzePlatform(state, page, platformId) {
  const platform = getPlatform(platformId);
  const seo = page.seo || {};
  const text = `${contentText(state, page)} ${seo.answer || ""}`;
  const answer = seo.answer || "";
  const faqs = seo.faqs || [];
  const sources = seo.sources || [];
  const numbers = (text.match(/\d/g) || []).length;
  const entity = text.includes(state.seo?.site?.name || "易康科技") || answer.includes(state.seo?.site?.name || "易康科技");
  const base = [
    { id: "answer", label: "直接答案 40–180 字", pass: [...answer].length >= 40 && [...answer].length <= 180, detail: `${[...answer].length} 字`, weight: 18 },
    { id: "faq", label: "至少 1 条 FAQ", pass: faqs.length > 0, detail: `${faqs.length} 条`, weight: 12 },
    { id: "sources", label: "至少 1 个来源", pass: sources.length > 0, detail: `${sources.length} 个`, weight: 12 },
    { id: "numbers", label: "有数字或事实", pass: numbers >= 2, detail: `${numbers} 个数字`, weight: 8 },
    { id: "entity", label: "实体名称清晰", pass: entity, detail: entity ? "已出现" : "未出现", weight: 10 },
    { id: "public", label: "公开页面可引用", pass: seo.visibility === "public", detail: seo.visibility === "public" ? "公开" : "内部页", weight: 10 },
    { id: "fresh", label: "180 天内更新", pass: recent(seo.updated), detail: seo.updated || "未设置", weight: 10 },
  ];
  const specific = {
    doubao: [
      { id: "conversation", label: "对话式答案", pass: hasAny(answer, ["结论", "先说", "可以"]), detail: "结论/步骤", weight: 10 },
      { id: "steps", label: "有可执行步骤", pass: hasAny(text, ["步骤", "1）", "1.", "先做"]), detail: "步骤", weight: 10 },
    ],
    qwen: [
      { id: "structured", label: "结构化事实/表格", pass: faqs.length > 0 || hasAny(text, ["表格", "价格", "范围"]), detail: "事实表/FAQ", weight: 10 },
      { id: "local", label: "本地实体", pass: Boolean(state.seo?.site?.addressLocality) && hasAny(text, [state.seo.site.addressLocality, "杭州"]), detail: state.seo?.site?.addressLocality || "未设置", weight: 10 },
    ],
    deepseek: [
      { id: "technical", label: "技术深度", pass: hasAny(text, ["架构", "API", "工作流", "代码", "评测"]), detail: "技术词", weight: 10 },
      { id: "method", label: "方法可复现", pass: hasAny(text, ["方法", "步骤", "配置", "评测"]), detail: "方法", weight: 10 },
    ],
    glm: [
      { id: "governance", label: "治理/合规视角", pass: hasAny(text, ["治理", "审批", "证据", "合规"]), detail: "治理词", weight: 10 },
      { id: "comparison", label: "对比/决策信息", pass: faqs.length > 0 || hasAny(text, ["对比", "选型", "风险"]), detail: "对比/FAQ", weight: 10 },
    ],
  }[platform.id] || [];
  const checks = [...base, ...specific];
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const score = Math.round((checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0) / total) * 100);
  return { platform, checks, score, missing: checks.filter((check) => !check.pass) };
}

function recent(date) {
  if (!date) return false;
  const at = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(at.getTime())) return false;
  return (Date.now() - at.getTime()) / 86400000 <= 180;
}

export function buildBrief(state, page, platformId, queryId) {
  const platform = getPlatform(platformId);
  const query = getGeoQuery(queryId);
  const seo = page.seo;
  const analysis = analyzePlatform(state, page, platform.id);
  const answer = seo.answer || page.description || "";
  const title = `${page.title} · ${platform.name} GEO Brief`;
  const outline = {
    doubao: ["一句话结论（40–80 字）", "3 步行动建议", "1 个可验证案例", "边界条件与来源"],
    qwen: ["结论 + 关键事实表", "价格/周期/交付物", "本地信息与联系方式", "FAQ 3 条"],
    deepseek: ["问题定义与约束", "架构/方法/代码", "评测与数据", "局限与复现步骤"],
    glm: ["治理与风险边界", "方案对比矩阵", "审批/证据要求", "适用规模与结论"],
  }[platform.id];
  return {
    id: `brief_${platform.id}_${page.id}_${query.id}`,
    platform: platform.id,
    pageId: page.id,
    queryId: query.id,
    title,
    targetQuery: query.query,
    answer,
    outline,
    faqs: (seo.faqs || []).slice(0, 3),
    sources: seo.sources || [],
    schema: seo.schemaType,
    checks: analysis.checks,
    createdAt: new Date().toISOString(),
  };
}

export function briefText(brief) {
  const platform = getPlatform(brief.platform);
  return `# ${brief.title}

## 目标问题
${brief.targetQuery}

## 可直接引用的答案
${brief.answer}

## 建议结构
${brief.outline.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## FAQ
${brief.faqs.map((faq) => `Q：${faq.q}\nA：${faq.a}`).join("\n\n")}

## 来源
${brief.sources.map((source) => `- ${source}`).join("\n")}

## 平台注意
- 平台：${platform.name}（${platform.company}）
- 风格：${platform.style}
- 抓手：${platform.focus}
- 引用形态：${platform.citation}
- 发布前必须经过人工审批，并保留来源证据。
`;
}

export function renderGEOLocked(state) {
  const publicPages = state.pages.filter((page) => !page.trashed && page.seo?.visibility === "public");
  return `<div class="seo-page seo-page--locked geo-locked-page">
    <header class="seo-locked-hero">
      <div class="seo-locked-hero__copy">
        <div class="special-eyebrow">${icon("target", 14)} CHINA MARKET GEO</div>
        <div class="seo-locked-title"><h1>中国市场GEO</h1><span class="seo-pro-chip">${icon("lock", 11)} PRO</span></div>
        <p>同一个问题，在豆包、千问、DeepSeek、GLM 里可能得到四个不同答案。这里管理“答案可见性”：谁提到你、谁引用你、谁该被优化。</p>
        <div class="geo-locked-platforms">${GEO_PLATFORMS.map((platform) => `<span style="--platform-color:${platform.color};--platform-soft:${platform.soft}"><b>${platform.badge}</b>${platform.name}</span>`).join("")}</div>
        <div class="seo-locked-actions">
          <button type="button" class="btn btn--primary" data-action="open-paywall" data-reason="geo">${icon("sparkles", 15)} 解锁中国市场GEO</button>
          <button type="button" class="btn btn--ghost" data-action="open-seo">先看出海GEO</button>
        </div>
        <div class="seo-locked-meta"><span>${publicPages.length} 个公开页面</span><span>4 个平台</span><span>5 个基线问题</span></div>
      </div>
      <div class="geo-locked-score">
        <div class="seo-locked-score__ring"><strong>81</strong><span>SEO</span></div>
        <div class="seo-locked-score__ring seo-locked-score__ring--geo"><strong>94</strong><span>GEO</span></div>
        <small>示例分数 · 解锁后查看你的真实平台矩阵</small>
      </div>
    </header>
    <div class="seo-locked-preview" aria-hidden="true">
      <div class="seo-locked-preview__head"><span>${icon("grid", 13)} 4 平台答案矩阵</span><span class="seo-locked-preview__blur">预览已锁定</span></div>
      <div class="geo-locked-matrix">
        ${GEO_PLATFORMS.map((platform) => `<div class="geo-locked-cell"><b>${platform.name}</b><i></i><i></i><i></i></div>`).join("")}
      </div>
      <div class="seo-locked-lock">${icon("lock", 20)}<strong>解锁后查看平台矩阵与内容 Brief</strong><span>提及 / 引用 / 首推 / 缺失，一眼看清</span></div>
    </div>
    <section class="seo-locked-features">
      ${[
        ["grid", "4 平台矩阵", "同一问题在豆包、千问、DeepSeek、GLM 的提及/引用状态。"],
        ["target", "平台专属 Brief", "按平台改写答案、FAQ、来源与结构，不再一份内容全平台复制。"],
        ["shield", "治理联动", "Brief 先进入审批与证据链，再发布。"],
        ["download", "可复制资产", "平台 Brief 可复制到内容系统或 OPC OS 的审批流程。"],
      ].map(([ic, title, desc]) => `<div class="seo-locked-feature"><span>${icon(ic, 17)}</span><div><strong>${title}</strong><p>${desc}</p></div></div>`).join("")}
    </section>
    <section class="seo-locked-bottom">
      <div><span class="special-eyebrow">INCLUDED IN PRO</span><h2>四个平台，四种答案，一套优化方法。</h2><p>不追求“保证被推荐”，只追求可测量、可解释、可审批的答案可见性。</p></div>
      <button type="button" class="btn btn--primary" data-action="open-paywall" data-reason="geo">${icon("arrowRight", 14)} 查看 Pro 权益</button>
    </section>
  </div>`;
}

export function renderGeoStudio(state, ui) {
  const page = getPage(state, ui.geoPageId) || getPage(state, "home");
  const platform = getPlatform(ui.geoPlatform);
  const query = getGeoQuery(ui.geoQueryId);
  const view = ui.geoView || "matrix";
  const analysis = analyzePlatform(state, page, platform.id);
  const brief = buildBrief(state, page, platform.id, query.id);
  const stats = GEO_PLATFORMS.map((item) => ({ ...item, stats: platformStats(state, item.id) }));
  const totalRuns = state.geo.runs.length;
  const citations = state.geo.runs.filter((run) => run.citations?.length).length;

  return `<div class="geo-page">
    <header class="geo-hero">
      <div class="geo-hero__copy">
        <div class="special-eyebrow">${icon("target", 14)} CHINA MARKET GENERATIVE ENGINE OPTIMIZATION</div>
        <h1>中国市场GEO</h1>
        <p>同一问题，四个答案入口。管理豆包、千问、DeepSeek、GLM 的提及、引用、首推与内容差异。</p>
        <div class="geo-hero__actions">
          <button type="button" class="btn btn--primary btn--sm" data-action="geo-view" data-view="optimize">${icon("edit", 13)} 做平台优化</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="geo-probe">${icon("refresh", 13)} 运行探针（演示）</button>
        </div>
      </div>
      <div class="geo-hero__stats">
        <div><strong>${stats.length}</strong><span>平台</span></div>
        <div><strong>${GEO_QUERIES.length}</strong><span>基线问题</span></div>
        <div><strong>${citations}</strong><span>自有引用</span></div>
        <div><strong>${totalRuns}</strong><span>探针记录</span></div>
      </div>
    </header>

    <div class="geo-tabs">
      ${[
        ["matrix", "平台矩阵", "grid"],
        ["optimize", "内容优化", "edit"],
        ["lab", "Query Lab", "search"],
        ["briefs", "Brief 库", "file"],
      ].map(([key, label, ic]) => `<button type="button" class="geo-tab ${view === key ? "is-active" : ""}" data-action="geo-view" data-view="${key}">${icon(ic, 13)} ${label}</button>`).join("")}
    </div>

    ${view === "optimize" ? renderOptimize(state, page, platform, query, analysis, brief) : view === "lab" ? renderLab(state, page, query) : view === "briefs" ? renderBriefs(state) : renderMatrix(state, stats, platform, query)}
  </div>`;
}

function renderMatrix(state, stats, selectedPlatform) {
  return `<section class="geo-section">
    <div class="geo-section__head"><div><h2>平台矩阵</h2><p>每一格是一次演示探针；点格子进入该问题的内容优化。</p></div><span class="geo-demo-chip">演示数据 · 可接 BFF</span></div>
    <div class="geo-platform-cards">
      ${stats.map((platform) => `<button type="button" class="geo-platform-card ${selectedPlatform.id === platform.id ? "is-active" : ""}" data-action="geo-platform" data-platform="${platform.id}" style="--platform-color:${platform.color};--platform-soft:${platform.soft}">
        <span class="geo-platform-card__badge">${platform.badge}</span>
        <span class="geo-platform-card__body"><strong>${platform.name}</strong><small>${platform.company}</small></span>
        <span class="geo-platform-card__score">${platform.stats.score}</span>
        <span class="geo-platform-card__meta">${platform.stats.mention}/${platform.stats.runs} 提及 · ${platform.stats.citations} 引用</span>
      </button>`).join("")}
    </div>
    <div class="geo-matrix-wrap">
      <table class="geo-matrix">
        <thead><tr><th>问题</th>${GEO_PLATFORMS.map((platform) => `<th>${platform.name}</th>`).join("")}</tr></thead>
        <tbody>
          ${GEO_QUERIES.map((query) => `<tr>
            <td><strong>${esc(query.query)}</strong><small>${esc(query.intent)} · ${esc(getPage(state, query.pageId)?.title || "")}</small></td>
            ${GEO_PLATFORMS.map((platform) => {
              const status = statusOf(runFor(state, platform.id, query.id));
              return `<td><button type="button" class="geo-status geo-status--${status.tone}" data-action="geo-cell" data-platform="${platform.id}" data-query="${query.id}">${status.label}</button></td>`;
            }).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="geo-note">${icon("alert", 13)} “提及/引用/首推”是演示探针结果，不是实时排名。真实接入需要服务端 BFF 与平台 API/人工抽样。</div>
  </section>`;
}

function renderOptimize(state, page, platform, query, analysis, brief) {
  return `<section class="geo-section geo-optimize">
    <div class="geo-controls">
      <label class="geo-select"><span>页面</span><select data-geo-page-select>${state.pages.filter((item) => !item.trashed).map((item) => `<option value="${item.id}" ${item.id === page.id ? "selected" : ""}>${esc(item.title)}</option>`).join("")}</select></label>
      <label class="geo-select"><span>平台</span><select data-geo-platform-select>${GEO_PLATFORMS.map((item) => `<option value="${item.id}" ${item.id === platform.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
      <label class="geo-select"><span>目标问题</span><select data-geo-query-select>${GEO_QUERIES.map((item) => `<option value="${item.id}" ${item.id === query.id ? "selected" : ""}>${esc(item.query)}</option>`).join("")}</select></label>
    </div>
    <div class="geo-opt-grid">
      <div class="geo-opt-main">
        <div class="geo-opt-head"><div><span class="geo-opt-kicker">${icon("sparkles", 12)} ${platform.name} / ${page.title}</span><h2>平台优化诊断</h2></div><div class="geo-score-ring" style="--score:${analysis.score};--platform-color:${platform.color}"><strong>${analysis.score}</strong><span>平台分</span></div></div>
        <div class="geo-checks">
          ${analysis.checks.map((check) => `<div class="geo-check ${check.pass ? "is-pass" : "is-fail"}"><span>${check.pass ? icon("check", 11) : icon("x", 11)}</span><div><strong>${check.label}</strong><small>${check.detail}</small></div></div>`).join("")}
        </div>
        <div class="geo-brief-preview">
          <div class="geo-section__head"><div><h2>平台 Brief</h2><p>${platform.focus} · ${platform.citation}</p></div><span class="geo-demo-chip">可直接复制</span></div>
          <div class="geo-brief-block"><span>目标问题</span><strong>${esc(brief.targetQuery)}</strong></div>
          <div class="geo-brief-block"><span>可直接引用的答案</span><p>${esc(brief.answer)}</p></div>
          <div class="geo-brief-block"><span>建议结构</span><ol>${brief.outline.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></div>
          <div class="geo-brief-grid">
            <div class="geo-brief-block"><span>FAQ</span>${brief.faqs.length ? brief.faqs.map((faq) => `<p><strong>Q：</strong>${esc(faq.q)}<br/><strong>A：</strong>${esc(faq.a)}</p>`).join("") : "<p>还没有 FAQ。</p>"}</div>
            <div class="geo-brief-block"><span>来源</span>${brief.sources.length ? brief.sources.map((source) => `<p>• ${esc(source)}</p>`).join("") : "<p>还没有来源。</p>"}</div>
          </div>
          <div class="geo-brief-actions">
            <button type="button" class="btn btn--primary btn--sm" data-action="geo-save-brief">${icon("plus", 13)} 保存 Brief</button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="geo-copy-brief">${icon("copy", 13)} 复制 Brief</button>
          </div>
        </div>
      </div>
      <aside class="geo-opt-side">
        <div class="geo-section__head"><div><h2>平台打法</h2><p>${platform.company}</p></div></div>
        <div class="geo-platform-badge" style="--platform-color:${platform.color};--platform-soft:${platform.soft}"><b>${platform.badge}</b><strong>${platform.name}</strong></div>
        <div class="geo-side-row"><span>接入</span><strong>${esc(platform.access)}</strong></div>
        <div class="geo-side-row"><span>引用</span><strong>${esc(platform.citation)}</strong></div>
        <div class="geo-side-row"><span>风格</span><strong>${esc(platform.style)}</strong></div>
        <div class="geo-side-row"><span>抓手</span><strong>${esc(platform.focus)}</strong></div>
        <div class="geo-side-note">${icon("lock", 11)} 发布前进入 OPC OS 审批；不要让 AI 自动发布。</div>
        <button type="button" class="btn btn--ghost btn--sm" data-action="geo-view" data-view="lab">看看同问题的四个答案 ${icon("arrowRight", 12)}</button>
      </aside>
    </div>
  </section>`;
}

function renderLab(state, page, query) {
  return `<section class="geo-section">
    <div class="geo-section__head"><div><h2>Query Lab</h2><p>同一个问题，四个平台的演示答案与引用。</p></div><button type="button" class="btn btn--ghost btn--sm" data-action="geo-probe">${icon("refresh", 13)} 重跑探针</button></div>
    <div class="geo-query-bar">${GEO_QUERIES.map((item) => `<button type="button" class="geo-query-btn ${item.id === query.id ? "is-active" : ""}" data-action="geo-query" data-query="${item.id}">${esc(item.query)}</button>`).join("")}</div>
    <div class="geo-answer-grid">
      ${GEO_PLATFORMS.map((platform) => {
        const run = runFor(state, platform.id, query.id);
        const status = statusOf(run);
        return `<article class="geo-answer-card" style="--platform-color:${platform.color};--platform-soft:${platform.soft}">
          <div class="geo-answer-card__head"><span class="geo-platform-card__badge">${platform.badge}</span><strong>${platform.name}</strong><span class="geo-status geo-status--${status.tone}">${status.label}</span></div>
          <p>${esc(run?.answer || "还没有探针记录。")}</p>
          <div class="geo-answer-card__cites">${run?.citations?.length ? run.citations.map((cite) => `<span>${icon("link", 10)} ${esc(cite.title || cite.url)}</span>`).join("") : "<span>无来源引用</span>"}</div>
          <div class="geo-answer-card__foot">${run ? `${run.mode === "demo" ? "演示" : "真实"} · ${Math.round(run.accuracy * 100)}% 准确` : "—"}</div>
        </article>`;
      }).join("")}
    </div>
    <div class="geo-note">${icon("alert", 13)} 这里是演示答案，用于验证矩阵/评分/Brief 的产品体验；真实答案必须走平台 API 或人工抽样。</div>
  </section>`;
}

function renderBriefs(state) {
  const briefs = [...(state.geo.briefs || [])].reverse();
  return `<section class="geo-section">
    <div class="geo-section__head"><div><h2>Brief 库</h2><p>已保存的平台化内容 Brief。</p></div><span class="geo-demo-chip">${briefs.length} 条</span></div>
    ${briefs.length ? `<div class="geo-brief-list">${briefs.map((brief) => {
      const page = getPage(state, brief.pageId);
      const platform = getPlatform(brief.platform);
      return `<article class="geo-brief-row"><span class="geo-platform-card__badge" style="--platform-color:${platform.color};--platform-soft:${platform.soft}">${platform.badge}</span><div><strong>${esc(brief.title)}</strong><small>${esc(page?.title || "")} · ${esc(brief.targetQuery)} · ${esc(platform.name)}</small></div><button type="button" class="btn btn--ghost btn--sm" data-action="geo-copy-brief" data-brief="${brief.id}">复制</button><button type="button" class="link-btn" data-action="geo-delete-brief" data-brief="${brief.id}">删除</button></article>`;
    }).join("")}</div>` : `<div class="geo-empty">${icon("file", 20)}<strong>还没有保存的 Brief</strong><span>到「内容优化」生成一条，保存后会出现在这里。</span></div>`}
  </section>`;
}
