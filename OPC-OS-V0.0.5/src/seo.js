import { icon } from "./icons.js";
import { getDatabase, getPage, rowTitle } from "./data.js";
import { esc } from "./utils.js";

export const SCHEMA_TYPES = [
  "WebPage",
  "AboutPage",
  "Article",
  "Service",
  "CollectionPage",
  "FAQPage",
  "LocalBusiness",
  "Product",
  "SoftwareApplication",
];

const DEFAULT_SITE = {
  name: "易康科技",
  url: "https://yikang.example",
  titleTemplate: "%s · 易康科技",
  defaultTitle: "易康科技 · 一人公司的 AI 内容与企业服务",
  defaultDescription: "易康科技是杭州的一人公司，提供 AI 内容工作流、企业培训与轻量咨询。",
  language: "zh-CN",
  logo: "/assets/favicon.svg",
  email: "1285989844@qq.com",
  phone: "",
  addressLocality: "杭州",
  addressRegion: "浙江",
  areaServed: "杭州 / 全国远程",
  sameAs: [],
  aiCrawlerPolicy: "allow",
  llmsIntro: "易康科技的公开知识库：一人公司、AI 内容工作流、企业服务与 OPC 合规。",
  facts: [],
};

const DEFAULT_PUBLIC_PAGES = new Set(["home", "company", "policies"]);

export function ensureSEOState(state) {
  if (!state.seo) state.seo = { site: {}, pages: {}, queries: [] };
  state.seo.site = { ...DEFAULT_SITE, ...(state.seo.site || {}) };
  state.seo.pages ||= {};
  state.seo.queries ||= [];
  state.seo.site.url = normalizeUrl(state.seo.site.url);

  for (const page of state.pages) {
    const defaults = buildDefaultPageSEO(state, page);
    const override = state.seo.pages[page.id] || {};
    page.seo = {
      ...defaults,
      ...override,
      ...(page.seo || {}),
    };
    page.seo.keywords = toArray(page.seo.keywords);
    page.seo.targetQueries = toArray(page.seo.targetQueries);
    page.seo.sources = toArray(page.seo.sources);
    page.seo.faqs = (page.seo.faqs || []).map((faq) => (typeof faq === "string" ? parseFaq(faq) : faq)).filter((faq) => faq?.q);
    page.seo.visibility = page.seo.visibility === "public" ? "public" : "private";
    page.seo.robots = page.seo.visibility === "public" ? "index,follow" : "noindex,nofollow";
    if (!page.seo.canonical) page.seo.canonical = pageCanonical(state, page);
  }
}

function buildDefaultPageSEO(state, page) {
  const site = state.seo?.site || DEFAULT_SITE;
  const publicPage = DEFAULT_PUBLIC_PAGES.has(page.id);
  const slug = page.id === "home" ? "" : page.id;
  return {
    visibility: publicPage ? "public" : "private",
    slug,
    title: page.id === "home" ? site.defaultTitle : `${page.title} · ${site.name}`,
    description: page.description || site.defaultDescription,
    keywords: [],
    schemaType: page.kind === "database" ? "CollectionPage" : page.id === "company" ? "AboutPage" : "WebPage",
    answer: page.description || "",
    targetQueries: [],
    faqs: [],
    sources: [],
    canonical: page.id === "home" ? `${site.url}/` : `${site.url}/${slug}`,
    updated: new Date().toISOString().slice(0, 10),
    robots: publicPage ? "index,follow" : "noindex,nofollow",
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFaq(value) {
  if (value && typeof value === "object") return value;
  const [q, ...rest] = String(value).split(/\s*[|｜]\s*/);
  return { q: q?.trim() || "", a: rest.join(" | ").trim() };
}

function normalizeUrl(value) {
  const url = String(value || "").trim().replace(/\/+$/, "");
  return url || "https://yikang.example";
}

export function pageCanonical(state, page) {
  const site = state.seo?.site || DEFAULT_SITE;
  const slug = page.seo?.slug ?? (page.id === "home" ? "" : page.id);
  if (!slug) return `${normalizeUrl(site.url)}/`;
  return `${normalizeUrl(site.url)}/${String(slug).replace(/^\/+/, "")}`;
}

export function getSEOPage(state, pageId) {
  return getPage(state, pageId) || getPage(state, "home");
}

export function contentText(state, page) {
  if (!page) return "";
  if (page.kind === "doc") {
    return [page.title, page.description, ...(page.blocks || []).map((block) => block.text || "")].join("\n");
  }
  if (page.kind === "database") {
    const db = getDatabase(state, page.dbId);
    if (!db) return `${page.title}\n${page.description || ""}`;
    return [
      page.title,
      page.description,
      db.title,
      ...db.properties.map((property) => property.label),
      ...db.rows.map((row) => `${rowTitle(db, row)} ${Object.values(row).join(" ")}`),
    ].join("\n");
  }
  return [page.title, page.description].join("\n");
}

function chars(value) {
  return [...String(value || "")].length;
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export function analyzePage(state, page) {
  const site = state.seo.site;
  const seo = page.seo;
  const content = contentText(state, page);
  const keywords = seo.keywords || [];
  const title = seo.title || "";
  const description = seo.description || "";
  const answer = seo.answer || "";
  const faqs = seo.faqs || [];
  const sources = seo.sources || [];
  const targetQueries = seo.targetQueries || [];
  const numbers = (content.match(/\d/g) || []).length;
  const hasEntity = content.includes(site.name) || answer.includes(site.name) || title.includes(site.name);
  const hasKeyword = keywords.some((keyword) => `${title} ${description} ${content}`.toLowerCase().includes(String(keyword).toLowerCase()));
  const canonical = seo.canonical || "";
  const freshness = daysSince(seo.updated) <= 180;
  const isPublic = seo.visibility === "public";
  const internalLinks = (content.match(/https?:\/\/|\[[^\]]+\]\([^)]+\)/g) || []).length;

  const checks = [
    { id: "title-length", group: "SEO", label: "Title 10–32 字", pass: chars(title) >= 10 && chars(title) <= 32, weight: 10, detail: `${chars(title)} 字` },
    { id: "description-length", group: "SEO", label: "描述 50–160 字", pass: chars(description) >= 50 && chars(description) <= 160, weight: 10, detail: `${chars(description)} 字` },
    { id: "slug", group: "SEO", label: "Slug 可用", pass: seo.slug === "" || /^[a-z0-9-]+$/.test(seo.slug), weight: 8, detail: seo.slug || "/" },
    { id: "canonical", group: "SEO", label: "Canonical 为 HTTPS", pass: canonical.startsWith("https://") && hostOf(canonical) === hostOf(site.url), weight: 8, detail: canonical || "未设置" },
    { id: "public", group: "SEO", label: "公开页面可索引", pass: isPublic, weight: 8, detail: isPublic ? "公开" : "内部页" },
    { id: "keyword", group: "SEO", label: "关键词出现在标题/描述/正文", pass: hasKeyword, weight: 8, detail: hasKeyword ? "已覆盖" : "未覆盖" },
    { id: "schema", group: "SEO", label: "Schema 类型已设置", pass: Boolean(seo.schemaType) && seo.schemaType !== "WebPage", weight: 6, detail: seo.schemaType || "未设置" },
    { id: "freshness", group: "SEO", label: "180 天内更新", pass: freshness, weight: 8, detail: seo.updated || "未设置" },
    { id: "content-length", group: "SEO", label: "正文 ≥ 300 字", pass: chars(content) >= 300, weight: 8, detail: `${chars(content)} 字` },
    { id: "internal-links", group: "SEO", label: "有内链或来源链接", pass: internalLinks > 0, weight: 6, detail: `${internalLinks} 个` },
    { id: "answer", group: "GEO", label: "直接答案 40–180 字", pass: chars(answer) >= 40 && chars(answer) <= 180, weight: 12, detail: `${chars(answer)} 字` },
    { id: "faq", group: "GEO", label: "至少 1 条 FAQ", pass: faqs.length > 0, weight: 8, detail: `${faqs.length} 条` },
    { id: "sources", group: "GEO", label: "至少 1 个来源", pass: sources.length > 0, weight: 8, detail: `${sources.length} 个` },
    { id: "numbers", group: "GEO", label: "包含数字或事实", pass: numbers >= 2, weight: 7, detail: `${numbers} 个数字` },
    { id: "entity", group: "GEO", label: "实体名称清晰", pass: hasEntity, weight: 6, detail: hasEntity ? "已出现" : "未出现" },
    { id: "queries", group: "GEO", label: "有目标问题 ≥ 2", pass: targetQueries.length >= 2, weight: 6, detail: `${targetQueries.length} 个` },
    { id: "ai-crawler", group: "GEO", label: "AI 爬虫策略已设置", pass: ["allow", "disallow"].includes(site.aiCrawlerPolicy), weight: 5, detail: site.aiCrawlerPolicy },
    { id: "faq-schema", group: "GEO", label: "使用可引用 Schema", pass: ["Article", "FAQPage", "Service", "AboutPage", "CollectionPage"].includes(seo.schemaType), weight: 5, detail: seo.schemaType },
    { id: "llms", group: "GEO", label: "llms.txt 有介绍", pass: chars(site.llmsIntro) >= 20, weight: 6, detail: `${chars(site.llmsIntro)} 字` },
    { id: "answer-first", group: "GEO", label: "答案可独立引用", pass: chars(answer) >= 40 && !/^(我们|本公司|作为)/.test(answer), weight: 6, detail: answer ? "已写" : "未写" },
  ];

  return {
    checks,
    seoScore: score(checks.filter((check) => check.group === "SEO")),
    geoScore: score(checks.filter((check) => check.group === "GEO")),
    isPublic,
    faqCount: faqs.length,
    sourceCount: sources.length,
    queryCount: targetQueries.length,
    contentLength: chars(content),
    numbers,
  };
}

function score(checks) {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  if (!total) return 0;
  const passed = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0);
  return Math.round((passed / total) * 100);
}

function daysSince(date) {
  if (!date) return 9999;
  const value = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(value.getTime())) return 9999;
  const now = new Date();
  return Math.max(0, Math.round((now - value) / 86400000));
}

export function readPageSEOForm() {
  const value = (name) => document.querySelector(`[data-seo-page-field="${name}"]`)?.value ?? "";
  return {
    visibility: value("visibility") === "public" ? "public" : "private",
    title: value("title").trim(),
    description: value("description").trim(),
    slug: value("slug").trim().replace(/^\/+/, ""),
    canonical: value("canonical").trim(),
    keywords: toArray(value("keywords")),
    schemaType: value("schemaType") || "WebPage",
    answer: value("answer").trim(),
    targetQueries: value("targetQueries").split("\n").map((item) => item.trim()).filter(Boolean),
    faqs: value("faqs").split("\n").map((line) => parseFaq(line)).filter((faq) => faq.q),
    sources: value("sources").split("\n").map((item) => item.trim()).filter(Boolean),
    updated: value("updated") || new Date().toISOString().slice(0, 10),
  };
}

export function applyPageSEO(state, page, data) {
  page.seo = {
    ...page.seo,
    ...data,
    visibility: data.visibility,
    robots: data.visibility === "public" ? "index,follow" : "noindex,nofollow",
    canonical: data.canonical || pageCanonical(state, page),
  };
  return page;
}

export function readSiteSEOForm() {
  const value = (name) => document.querySelector(`[data-seo-site-field="${name}"]`)?.value ?? "";
  return {
    name: value("name").trim(),
    url: normalizeUrl(value("url")),
    titleTemplate: value("titleTemplate").trim(),
    defaultTitle: value("defaultTitle").trim(),
    defaultDescription: value("defaultDescription").trim(),
    language: value("language").trim() || "zh-CN",
    logo: value("logo").trim(),
    email: value("email").trim(),
    phone: value("phone").trim(),
    addressLocality: value("addressLocality").trim(),
    addressRegion: value("addressRegion").trim(),
    areaServed: value("areaServed").trim(),
    aiCrawlerPolicy: value("aiCrawlerPolicy") === "disallow" ? "disallow" : "allow",
    llmsIntro: value("llmsIntro").trim(),
    facts: value("facts").split("\n").map((item) => item.trim()).filter(Boolean),
    sameAs: value("sameAs").split("\n").map((item) => item.trim()).filter(Boolean),
  };
}

export function applySiteSEO(state, data) {
  const previous = state.seo.site.url;
  state.seo.site = { ...state.seo.site, ...data };
  for (const page of state.pages) {
    if (!page.seo) continue;
    if (!page.seo.canonical || page.seo.canonical.startsWith(previous)) {
      page.seo.canonical = pageCanonical(state, page);
    }
  }
  return state.seo.site;
}

export function generateMetaTags(state, page) {
  const site = state.seo.site;
  const seo = page.seo;
  const canonical = seo.canonical || pageCanonical(state, page);
  const image = site.logo?.startsWith("http") ? site.logo : `${site.url}${site.logo || ""}`;
  return `<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.description)}"/>
<meta name="keywords" content="${esc((seo.keywords || []).join(", "))}"/>
<link rel="canonical" href="${esc(canonical)}"/>
<meta name="robots" content="${esc(seo.robots || (seo.visibility === "public" ? "index,follow" : "noindex,nofollow"))}"/>
<meta property="og:type" content="${seo.schemaType === "Article" ? "article" : "website"}"/>
<meta property="og:title" content="${esc(seo.title)}"/>
<meta property="og:description" content="${esc(seo.description)}"/>
<meta property="og:url" content="${esc(canonical)}"/>
<meta property="og:image" content="${esc(image)}"/>
<meta property="og:image:alt" content="${esc(site.name)}"/>
<meta property="og:site_name" content="${esc(site.name)}"/>
<meta property="og:locale" content="${esc(site.language.replace("-", "_"))}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(seo.title)}"/>
<meta name="twitter:description" content="${esc(seo.description)}"/>
<meta name="author" content="${esc(site.name)}"/>
<meta property="article:modified_time" content="${esc(seo.updated)}"/>`;
}

export function generateJsonLd(state, page) {
  const site = state.seo.site;
  const seo = page.seo;
  const canonical = seo.canonical || pageCanonical(state, page);
  const faqs = seo.faqs || [];
  const logo = site.logo?.startsWith("http") ? site.logo : `${site.url}${site.logo || ""}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": seo.schemaType || "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: seo.title,
    description: seo.description,
    inLanguage: site.language,
    dateModified: seo.updated,
    keywords: (seo.keywords || []).join(", "),
    author: { "@type": "Organization", name: site.name, url: site.url, logo },
    publisher: { "@type": "Organization", name: site.name, url: site.url, logo },
  };
  if (faqs.length) {
    ld.mainEntity = faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    }));
  }
  if (seo.schemaType === "LocalBusiness" || site.addressLocality) {
    ld.address = {
      "@type": "PostalAddress",
      addressLocality: site.addressLocality,
      addressRegion: site.addressRegion,
      addressCountry: "CN",
    };
    ld.areaServed = site.areaServed;
    if (site.phone) ld.telephone = site.phone;
    if (site.email) ld.email = site.email;
  }
  if (site.sameAs?.length) ld.sameAs = site.sameAs;
  return JSON.stringify(ld, null, 2);
}

export function generateSitemap(state) {
  const pages = state.pages.filter((page) => !page.trashed && page.seo?.visibility === "public");
  const urls = pages
    .map((page) => {
      const loc = page.seo.canonical || pageCanonical(state, page);
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(page.seo.updated || new Date().toISOString().slice(0, 10))}</lastmod>\n    <changefreq>${page.id === "home" ? "weekly" : "monthly"}</changefreq>\n    <priority>${page.id === "home" ? "1.0" : "0.7"}</priority>\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function generateRobots(state) {
  const site = state.seo.site;
  const privatePaths = state.pages
    .filter((page) => !page.trashed && page.seo?.visibility !== "public" && page.seo?.slug)
    .map((page) => `Disallow: /${page.seo.slug.replace(/^\/+/, "")}`);
  const lines = [
    "# Generated by OPC OS 0.0.5 GEO",
    "User-agent: *",
    "Allow: /",
    "Disallow: /workspace/",
    "Disallow: /api/",
    ...privatePaths,
    "",
  ];
  if (site.aiCrawlerPolicy === "allow") {
    lines.push("# AI / GEO crawlers");
    for (const agent of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      lines.push(`User-agent: ${agent}`, "Allow: /", "");
    }
  } else {
    lines.push("# AI crawlers disabled");
    for (const agent of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      lines.push(`User-agent: ${agent}`, "Disallow: /", "");
    }
  }
  lines.push(`Sitemap: ${site.url}/sitemap.xml`);
  return lines.join("\n");
}

export function generateLlmsTxt(state) {
  const site = state.seo.site;
  const pages = state.pages.filter((page) => !page.trashed && page.seo?.visibility === "public");
  const facts = site.facts || [];
  const queries = pages.flatMap((page) => page.seo.targetQueries || []);
  return `# ${site.name}\n\n> ${site.llmsIntro}\n\n## 关键事实\n${facts.map((fact) => `- ${fact}`).join("\n")}\n\n## 公开页面\n${pages
    .map((page) => `- [${page.seo.title}](${page.seo.canonical || pageCanonical(state, page)}): ${page.seo.description}`)
    .join("\n")}\n\n## 可引用问题\n${queries.map((query) => `- ${query}`).join("\n")}\n\n## 联系\n- 地区：${site.areaServed}\n- 邮箱：${site.email}\n\n## 引用说明\n内容可被 AI 搜索与生成式引擎引用，请注明来源：${site.name}（${site.url}）。`;
}

export function generateAsset(state, page, type) {
  if (type === "robots") return generateRobots(state);
  if (type === "sitemap") return generateSitemap(state);
  if (type === "llms") return generateLlmsTxt(state);
  if (type === "jsonld") return generateJsonLd(state, page);
  return generateMetaTags(state, page);
}

export function assetFilename(type, page) {
  if (type === "robots") return "robots.txt";
  if (type === "sitemap") return "sitemap.xml";
  if (type === "llms") return "llms.txt";
  if (type === "jsonld") return `${page.seo.slug || "home"}.jsonld`;
  return `${page.seo.slug || "home"}.meta.html`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSEOLocked(state) {
  const pages = state.pages.filter((page) => !page.trashed);
  const publicPages = pages.filter((page) => page.seo.visibility === "public");
  const queries = publicPages.reduce((sum, page) => sum + (page.seo.targetQueries || []).length, 0);
  return `<div class="seo-page seo-page--locked">
    <header class="seo-locked-hero">
      <div class="seo-locked-hero__copy">
        <div class="special-eyebrow">${icon("search", 14)} OVERSEAS GEO / SEARCH VISIBILITY</div>
        <div class="seo-locked-title"><h1>出海GEO</h1><span class="seo-pro-chip">${icon("lock", 11)} PRO</span></div>
        <p>让搜索引擎读懂公开页面，也让 ChatGPT、Perplexity、Google AI Overviews 更容易引用你的答案。页面体检、可引用内容、Schema、sitemap 和 llms.txt 都在这里。</p>
        <div class="seo-locked-actions">
          <button type="button" class="btn btn--primary" data-action="open-paywall" data-reason="seo">${icon("sparkles", 15)} 解锁出海GEO</button>
          <button type="button" class="btn btn--ghost" data-action="open-page" data-page="home">先看首页</button>
        </div>
        <div class="seo-locked-meta"><span>${publicPages.length} 个公开页面</span><span>${queries} 个目标问题</span><span>含 sitemap / llms.txt</span></div>
      </div>
      <div class="seo-locked-score">
        <div class="seo-locked-score__ring"><strong>81</strong><span>SEO</span></div>
        <div class="seo-locked-score__ring seo-locked-score__ring--geo"><strong>94</strong><span>GEO</span></div>
        <small>示例分数 · 解锁后查看你的真实诊断</small>
      </div>
    </header>

    <div class="seo-locked-preview" aria-hidden="true">
      <div class="seo-locked-preview__head"><span>${icon("shield", 13)} 页面诊断</span><span class="seo-locked-preview__blur">预览已锁定</span></div>
      <div class="seo-locked-grid">
        <div class="seo-locked-panel"><div class="seo-locked-line seo-locked-line--title"></div><div class="seo-locked-line"></div><div class="seo-locked-line seo-locked-line--short"></div><div class="seo-locked-bars"><i></i><i></i><i></i><i></i></div></div>
        <div class="seo-locked-panel"><div class="seo-locked-line seo-locked-line--title"></div><div class="seo-locked-line"></div><div class="seo-locked-line"></div><div class="seo-locked-line seo-locked-line--short"></div><div class="seo-locked-bars"><i></i><i></i><i></i><i></i></div></div>
      </div>
      <div class="seo-locked-lock">${icon("lock", 20)}<strong>解锁后查看完整出海GEO诊断</strong><span>页面分数、检查项、Schema 与导出资产</span></div>
    </div>

    <section class="seo-locked-features">
      ${[
        ["search", "SEO 体检", "Title、描述、Canonical、关键词、正文长度与内链，逐项给分。"],
        ["sparkles", "GEO 可引用内容", "Answer-first、FAQ、来源、目标问题与实体检查。"],
        ["layers", "结构化数据", "JSON-LD、Schema 类型、Organization / LocalBusiness 实体。"],
        ["download", "资产导出", "sitemap.xml、robots.txt、llms.txt、Meta 标签一键复制/下载。"],
      ].map(([ic, title, desc]) => `<div class="seo-locked-feature"><span>${icon(ic, 17)}</span><div><strong>${title}</strong><p>${desc}</p></div></div>`).join("")}
    </section>

    <section class="seo-locked-bottom">
      <div><span class="special-eyebrow">INCLUDED IN PRO</span><h2>不是多一个工具，是多一条增长路径。</h2><p>SEO 获取搜索流量，GEO 获取 AI 引用。两者都建立在同一套公开页面、实体信息和可验证内容上。</p></div>
      <button type="button" class="btn btn--primary" data-action="open-paywall" data-reason="seo">${icon("arrowRight", 14)} 查看 Pro 权益</button>
    </section>
  </div>`;
}

export function renderSEOStudio(state, ui) {
  const pages = state.pages.filter((page) => !page.trashed);
  const page = pages.find((item) => item.id === ui.seoPageId) || pages.find((item) => item.id === "home") || pages[0];
  const tab = ui.seoTab || "page";
  const analysis = analyzePage(state, page);
  const publicPages = pages.filter((item) => item.seo.visibility === "public");
  const avgSeo = publicPages.length ? Math.round(publicPages.reduce((sum, item) => sum + analyzePage(state, item).seoScore, 0) / publicPages.length) : 0;
  const avgGeo = publicPages.length ? Math.round(publicPages.reduce((sum, item) => sum + analyzePage(state, item).geoScore, 0) / publicPages.length) : 0;

  return `<div class="seo-page">
    <header class="seo-hero">
      <div class="seo-hero__copy">
        <div class="special-eyebrow">${icon("search", 14)} OVERSEAS GEO / SEARCH VISIBILITY</div>
        <h1>出海GEO</h1>
        <p>让搜索引擎读懂页面，也让 ChatGPT、Perplexity、Google AI Overviews 更容易引用你的公开内容。这里同时管理搜索元数据、结构化数据、llms.txt 与可引用答案。</p>
        <div class="seo-hero__actions">
          <button type="button" class="btn btn--primary btn--sm" data-action="seo-tab" data-tab="page">${icon("edit", 14)} 优化页面</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="seo-tab" data-tab="export">${icon("download", 14)} 导出 SEO 资产</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="open-geo">${icon("target", 14)} 中国市场GEO</button>
        </div>
      </div>
      <div class="seo-hero__scores">
        <div class="seo-hero-score"><span>公开页 SEO</span><strong>${avgSeo}</strong><small>平均分</small></div>
        <div class="seo-hero-score seo-hero-score--geo"><span>公开页 GEO</span><strong>${avgGeo}</strong><small>平均分</small></div>
        <div class="seo-hero-score seo-hero-score--muted"><span>公开页面</span><strong>${publicPages.length}</strong><small>进入 sitemap</small></div>
      </div>
    </header>

    <div class="seo-layout">
      <aside class="seo-sidebar">
        <div class="seo-sidebar__head"><span>页面</span><span>${pages.length}</span></div>
        <div class="seo-page-list">
          ${pages.map((item) => {
            const itemAnalysis = analyzePage(state, item);
            return `<button type="button" class="seo-page-item ${item.id === page.id ? "is-active" : ""}" data-action="seo-page" data-page="${item.id}">
              <span class="seo-page-item__icon">${esc(item.icon)}</span>
              <span class="seo-page-item__body"><strong>${esc(item.title)}</strong><small>${item.seo.visibility === "public" ? `/${esc(item.seo.slug || "")}` : "内部页 · noindex"}</small></span>
              <span class="seo-score-badge seo-score--${scoreTone(itemAnalysis.seoScore)}">${itemAnalysis.seoScore}</span>
            </button>`;
          }).join("")}
        </div>
        <div class="seo-sidebar__note">${icon("lock", 11)} 私有页默认 noindex，不进入 sitemap 与 llms.txt。</div>
      </aside>

      <main class="seo-main">
        <div class="seo-tabs">
          ${[
            ["page", "页面优化", "edit"],
            ["site", "站点设置", "settings"],
            ["schema", "结构化数据", "layers"],
            ["export", "导出资产", "download"],
          ].map(([key, label, ic]) => `<button type="button" class="seo-tab ${tab === key ? "is-active" : ""}" data-action="seo-tab" data-tab="${key}">${icon(ic, 13)} ${label}</button>`).join("")}
        </div>
        ${tab === "site" ? renderSiteEditor(state) : tab === "schema" ? renderSchemaTab(state, page) : tab === "export" ? renderExportTab(state, page, ui) : renderPageEditor(state, page, analysis)}
      </main>
    </div>
  </div>`;
}

function renderPageEditor(state, page, analysis) {
  const seo = page.seo;
  const canonical = seo.canonical || pageCanonical(state, page);
  return `<section class="seo-editor">
    <div class="seo-editor__head">
      <div>
        <div class="seo-editor__kicker">${icon("file", 13)} ${esc(page.kind === "database" ? "数据库页面" : "文档页面")}</div>
        <h2>${esc(page.title)}</h2>
        <div class="seo-editor__meta">
          <span class="seo-visibility ${seo.visibility === "public" ? "is-public" : "is-private"}">${seo.visibility === "public" ? "公开 · 可索引" : "内部 · noindex"}</span>
          <span>${esc(canonical)}</span>
        </div>
      </div>
      <button type="button" class="btn btn--primary btn--sm" data-action="save-seo-page" data-page="${page.id}">${icon("check", 13)} 保存页面 SEO</button>
    </div>

    <div class="seo-preview-grid">
      <div class="seo-serp">
        <div class="seo-preview-label">${icon("search", 12)} Google 搜索结果预览</div>
        <div class="seo-serp__url">${esc(canonical.replace(/^https?:\/\//, ""))}</div>
        <div class="seo-serp__title">${esc(seo.title || "页面标题")}</div>
        <div class="seo-serp__desc">${esc(seo.description || "页面描述")}</div>
      </div>
      <div class="seo-ai-preview">
        <div class="seo-preview-label">${icon("sparkles", 12)} AI 搜索摘要预览</div>
        <p>${esc(seo.answer || "写一段 40–180 字的直接答案，让生成式引擎可以独立引用。")}</p>
        <div class="seo-ai-preview__queries">${(seo.targetQueries || []).slice(0, 3).map((query) => `<span>${esc(query)}</span>`).join("") || "<span>添加目标问题</span>"}</div>
      </div>
    </div>

    <div class="seo-form-section">
      <div class="seo-form-section__head"><h3>搜索元数据</h3><span>SEO</span></div>
      <div class="seo-form-grid">
        <label class="seo-field seo-field--wide"><span>SEO 标题</span><input data-seo-page-field="title" value="${esc(seo.title)}" maxlength="80"/><small>${chars(seo.title)} 字 · 建议 10–32 字</small></label>
        <label class="seo-field seo-field--wide"><span>描述</span><textarea data-seo-page-field="description" rows="2" maxlength="200">${esc(seo.description)}</textarea><small>${chars(seo.description)} 字 · 建议 50–160 字</small></label>
        <label class="seo-field"><span>Slug</span><input data-seo-page-field="slug" value="${esc(seo.slug)}" placeholder="${page.id === "home" ? "留空表示首页" : "about"}"/></label>
        <label class="seo-field"><span>Canonical</span><input data-seo-page-field="canonical" value="${esc(canonical)}"/></label>
        <label class="seo-field"><span>关键词（逗号分隔）</span><input data-seo-page-field="keywords" value="${esc((seo.keywords || []).join(", "))}"/></label>
        <label class="seo-field"><span>Schema 类型</span><select data-seo-page-field="schemaType">${SCHEMA_TYPES.map((type) => `<option value="${type}" ${seo.schemaType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
        <label class="seo-field"><span>索引状态</span><select data-seo-page-field="visibility"><option value="public" ${seo.visibility === "public" ? "selected" : ""}>公开 · index,follow</option><option value="private" ${seo.visibility === "private" ? "selected" : ""}>内部 · noindex,nofollow</option></select></label>
        <label class="seo-field"><span>最后更新</span><input type="date" data-seo-page-field="updated" value="${esc(seo.updated)}"/></label>
      </div>
    </div>

    <div class="seo-form-section seo-form-section--geo">
      <div class="seo-form-section__head"><h3>可引用内容</h3><span>GEO</span></div>
      <div class="seo-form-grid">
        <label class="seo-field seo-field--wide"><span>直接答案（Answer-first）</span><textarea data-seo-page-field="answer" rows="3">${esc(seo.answer)}</textarea><small>40–180 字；先给结论，再给解释。AI 搜索最喜欢可直接引用的段落。</small></label>
        <label class="seo-field"><span>目标问题（每行一个）</span><textarea data-seo-page-field="targetQueries" rows="4">${esc((seo.targetQueries || []).join("\n"))}</textarea></label>
        <label class="seo-field"><span>FAQ（问题 | 答案，每行一条）</span><textarea data-seo-page-field="faqs" rows="4">${esc((seo.faqs || []).map((faq) => `${faq.q} | ${faq.a}`).join("\n"))}</textarea></label>
        <label class="seo-field seo-field--wide"><span>来源 / 证据（每行一个）</span><textarea data-seo-page-field="sources" rows="2">${esc((seo.sources || []).join("\n"))}</textarea></label>
      </div>
    </div>

    <div class="seo-analysis">
      <div class="seo-analysis__head"><h3>页面诊断</h3><div class="seo-analysis__scores"><span class="seo-score-badge seo-score--${scoreTone(analysis.seoScore)}">SEO ${analysis.seoScore}</span><span class="seo-score-badge seo-score--${scoreTone(analysis.geoScore)}">GEO ${analysis.geoScore}</span></div></div>
      <div class="seo-check-grid">
        ${["SEO", "GEO"].map((group) => `<div class="seo-check-group"><div class="seo-check-group__title">${group}</div>${analysis.checks.filter((check) => check.group === group).map((check) => `<div class="seo-check ${check.pass ? "is-pass" : "is-fail"}"><span>${check.pass ? icon("check", 11) : icon("x", 11)}</span><div><strong>${esc(check.label)}</strong><small>${esc(check.detail)}</small></div></div>`).join("")}</div>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderSiteEditor(state) {
  const site = state.seo.site;
  return `<section class="seo-editor">
    <div class="seo-editor__head">
      <div><div class="seo-editor__kicker">${icon("settings", 13)} SITE SETTINGS</div><h2>站点设置</h2><p class="seo-editor__lede">这些字段会进入 Organization / LocalBusiness JSON-LD、sitemap 与 llms.txt。</p></div>
      <button type="button" class="btn btn--primary btn--sm" data-action="save-seo-site">${icon("check", 13)} 保存站点设置</button>
    </div>
    <div class="seo-form-section">
      <div class="seo-form-section__head"><h3>品牌与域名</h3><span>基础</span></div>
      <div class="seo-form-grid">
        <label class="seo-field"><span>站点名称</span><input data-seo-site-field="name" value="${esc(site.name)}"/></label>
        <label class="seo-field"><span>站点 URL</span><input data-seo-site-field="url" value="${esc(site.url)}"/><small>当前为示例域名，请替换成真实域名</small></label>
        <label class="seo-field"><span>标题模板</span><input data-seo-site-field="titleTemplate" value="${esc(site.titleTemplate)}"/></label>
        <label class="seo-field"><span>默认语言</span><input data-seo-site-field="language" value="${esc(site.language)}"/></label>
        <label class="seo-field seo-field--wide"><span>默认标题</span><input data-seo-site-field="defaultTitle" value="${esc(site.defaultTitle)}"/></label>
        <label class="seo-field seo-field--wide"><span>默认描述</span><textarea data-seo-site-field="defaultDescription" rows="2">${esc(site.defaultDescription)}</textarea></label>
        <label class="seo-field"><span>Logo 路径</span><input data-seo-site-field="logo" value="${esc(site.logo)}"/></label>
        <label class="seo-field"><span>邮箱</span><input data-seo-site-field="email" value="${esc(site.email)}"/></label>
      </div>
    </div>
    <div class="seo-form-section">
      <div class="seo-form-section__head"><h3>本地与实体信息</h3><span>Local SEO</span></div>
      <div class="seo-form-grid">
        <label class="seo-field"><span>城市</span><input data-seo-site-field="addressLocality" value="${esc(site.addressLocality)}"/></label>
        <label class="seo-field"><span>省份</span><input data-seo-site-field="addressRegion" value="${esc(site.addressRegion)}"/></label>
        <label class="seo-field"><span>服务区域</span><input data-seo-site-field="areaServed" value="${esc(site.areaServed)}"/></label>
        <label class="seo-field"><span>电话</span><input data-seo-site-field="phone" value="${esc(site.phone)}"/></label>
        <label class="seo-field seo-field--wide"><span>SameAs（每行一个）</span><textarea data-seo-site-field="sameAs" rows="2">${esc((site.sameAs || []).join("\n"))}</textarea></label>
      </div>
    </div>
    <div class="seo-form-section seo-form-section--geo">
      <div class="seo-form-section__head"><h3>GEO 设置</h3><span>AI 搜索</span></div>
      <div class="seo-form-grid">
        <label class="seo-field"><span>AI 爬虫策略</span><select data-seo-site-field="aiCrawlerPolicy"><option value="allow" ${site.aiCrawlerPolicy === "allow" ? "selected" : ""}>允许 GPTBot / ClaudeBot / PerplexityBot</option><option value="disallow" ${site.aiCrawlerPolicy === "disallow" ? "selected" : ""}>禁止 AI 爬虫</option></select></label>
        <label class="seo-field seo-field--wide"><span>llms.txt 介绍</span><textarea data-seo-site-field="llmsIntro" rows="2">${esc(site.llmsIntro)}</textarea></label>
        <label class="seo-field seo-field--wide"><span>关键事实（每行一条，进入 llms.txt）</span><textarea data-seo-site-field="facts" rows="4">${esc((site.facts || []).join("\n"))}</textarea></label>
      </div>
    </div>
    <div class="seo-callout">${icon("alert", 13)} 当前 demo 使用 hash 路由；导出的 canonical 是目标 URL。正式上线需要把公开页面做成可访问的静态页或 SSR，否则搜索引擎无法分别索引。</div>
  </section>`;
}

function renderSchemaTab(state, page) {
  const code = generateJsonLd(state, page);
  return `<section class="seo-editor">
    <div class="seo-editor__head"><div><div class="seo-editor__kicker">${icon("layers", 13)} STRUCTURED DATA</div><h2>结构化数据</h2><p class="seo-editor__lede">${esc(page.title)} 的 JSON-LD。把这段放进页面 &lt;head&gt;，搜索引擎与 AI 更容易识别实体、FAQ 与更新时间。</p></div><button type="button" class="btn btn--ghost btn--sm" data-action="copy-seo" data-type="jsonld" data-page="${page.id}">${icon("copy", 13)} 复制 JSON-LD</button></div>
    <pre class="seo-code"><code>${esc(code)}</code></pre>
    <div class="seo-callout">${icon("check", 13)} FAQ、LocalBusiness、Service、AboutPage 会按当前页面的 Schema 类型生成。</div>
  </section>`;
}

function renderExportTab(state, page, ui) {
  const type = ui.seoAsset || "meta";
  const code = generateAsset(state, page, type);
  const labels = { meta: "Meta 标签", jsonld: "JSON-LD", robots: "robots.txt", sitemap: "sitemap.xml", llms: "llms.txt" };
  return `<section class="seo-editor">
    <div class="seo-editor__head"><div><div class="seo-editor__kicker">${icon("download", 13)} EXPORT</div><h2>导出 SEO 资产</h2><p class="seo-editor__lede">复制或下载后部署到你的公开站点。私有页面不会进入 sitemap 与 llms.txt。</p></div><button type="button" class="btn btn--primary btn--sm" data-action="download-seo" data-type="${type}" data-page="${page.id}">${icon("download", 13)} 下载 ${labels[type]}</button></div>
    <div class="seo-asset-tabs">${Object.entries(labels).map(([key, label]) => `<button type="button" class="seo-asset-tab ${type === key ? "is-active" : ""}" data-action="seo-asset" data-asset="${key}">${label}</button>`).join("")}</div>
    <pre class="seo-code"><code>${esc(code)}</code></pre>
    <div class="seo-export-actions"><button type="button" class="btn btn--ghost btn--sm" data-action="copy-seo" data-type="${type}" data-page="${page.id}">${icon("copy", 13)} 复制</button><span>${icon("lock", 11)} 只导出当前浏览器里的配置</span></div>
  </section>`;
}

function scoreTone(score) {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}
