import { esc } from "./utils.js";

const CONFIG_KEY = "opc-os-v2-paywall";
const ENTITLEMENT_KEY = "opc-os-v2-entitlement";
const USAGE_KEY = "opc-os-v2-usage";

export const DEFAULT_PAYWALL = {
  enabled: true,
  brand: "OPC OS PRO",
  title: "把公司交给系统，不交给记忆",
  subtitle: "解锁 AI 老板助手、出海GEO + 中国市场GEO、全部行业模板和数据库导出。",
  features: [
    "AI 助手每月 100 次对话",
    "出海GEO + 中国市场GEO",
    "全部行业模板与数据库视图",
    "一键导出 Markdown / CSV",
    "多主体档案与高级权限（规划中）",
    "优先获得新功能与模板更新",
  ],
  seoFeature: {
    enabled: true,
    badge: "NEW",
    title: "出海GEO + 中国市场GEO",
    note: "包含在 Pro",
    description: "把公开页面做成搜索引擎和生成式引擎都能读懂的资产：页面体检、AI 可引用答案、4 平台矩阵、平台 Brief 与资产导出。",
    features: [
      "SEO 页面体检与 SERP 预览",
      "GEO Answer-first / FAQ / 来源",
      "豆包 / 千问 / DeepSeek / GLM 矩阵",
      "JSON-LD、sitemap.xml、llms.txt",
      "平台 Brief 与一键导出",
    ],
  },
  plans: [
    { id: "monthly", name: "月付", price: "¥39", period: "/ 月", note: "随时取消" },
    { id: "yearly", name: "年付", price: "¥299", period: "/ 年", note: "约 ¥24.9/月 · 省 36%" },
  ],
  freeAiLimit: 5,
  freePages: 2,
  unlockCode: "OPC-PRO-2026",
  contact: "微信：liran-opc",
  wechatName: "微信支付",
  alipayName: "支付宝",
  wechatQR: "",
  alipayQR: "",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getPaywallConfig() {
  const stored = read(CONFIG_KEY, null);
  return {
    ...DEFAULT_PAYWALL,
    ...(stored || {}),
    plans: stored?.plans?.length ? stored.plans : DEFAULT_PAYWALL.plans,
    features: stored?.features?.length ? stored.features : DEFAULT_PAYWALL.features,
    seoFeature: { ...DEFAULT_PAYWALL.seoFeature, ...(stored?.seoFeature || {}) },
  };
}

export function savePaywallConfig(config) {
  write(CONFIG_KEY, config);
}

export function resetPaywallConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

export function getEntitlement() {
  return read(ENTITLEMENT_KEY, { pro: false, plan: null, at: null });
}

export function isPro() {
  return Boolean(getEntitlement().pro);
}

export function activatePro(plan = "manual") {
  write(ENTITLEMENT_KEY, { pro: true, plan, at: new Date().toISOString() });
}

export function resetPro() {
  localStorage.removeItem(ENTITLEMENT_KEY);
}

export function hasProAccess() {
  const config = getPaywallConfig();
  return !config.enabled || isPro();
}

export function getUsage() {
  const month = new Date().toISOString().slice(0, 7);
  const stored = read(USAGE_KEY, { month, ai: 0, pages: 0 });
  if (stored.month !== month) {
    const fresh = { month, ai: 0, pages: 0 };
    write(USAGE_KEY, fresh);
    return fresh;
  }
  return { ai: 0, pages: 0, ...stored };
}

export function incrementAIUsage() {
  const usage = getUsage();
  usage.ai += 1;
  write(USAGE_KEY, usage);
}

export function incrementPageUsage() {
  const usage = getUsage();
  usage.pages += 1;
  write(USAGE_KEY, usage);
}

export function canUseAI() {
  if (hasProAccess()) return true;
  return getUsage().ai < getPaywallConfig().freeAiLimit;
}

export function canCreatePage() {
  if (hasProAccess()) return true;
  return getUsage().pages < getPaywallConfig().freePages;
}

export function checkUnlockCode(input) {
  const config = getPaywallConfig();
  return String(input || "").trim().toUpperCase() === String(config.unlockCode || "").trim().toUpperCase();
}

export function renderPaywallModal(ui) {
  const config = getPaywallConfig();
  const state = ui.paywall || {};
  const selectedPlan = config.plans.find((plan) => plan.id === state.plan) || config.plans[1] || config.plans[0];
  const channel = state.channel || "wechat";
  const channelName = channel === "wechat" ? config.wechatName : config.alipayName;
  const qr = channel === "wechat" ? config.wechatQR : config.alipayQR;
  const pro = isPro();
  const reasonText = {
    ai: "免费 AI 额度已用完，升级后每月 100 次。",
    pages: "免费新建页面额度已用完。",
    templates: "这是一个 Pro 模板。",
    export: "导出需要 Pro。",
    seo: "出海GEO 是 Pro 功能。解锁后可做页面体检、AI 可引用内容与资产导出。",
    geo: "中国市场GEO 是 Pro 功能。解锁后可看豆包、千问、DeepSeek、GLM 的矩阵与平台 Brief。",
  }[state.reason] || "";

  return `<div class="paywall-overlay" data-action="close-paywall">
    <div class="paywall" data-paywall-panel>
      <button type="button" class="paywall-close" data-action="close-paywall" aria-label="关闭">×</button>
      <div class="paywall-head">
        <div class="paywall-brand">${esc(config.brand)}</div>
        <h2>${esc(config.title)}</h2>
        <p>${esc(config.subtitle)}</p>
        ${reasonText ? `<div class="paywall-reason">${esc(reasonText)}</div>` : ""}
      </div>
      <div class="paywall-body">
        <div class="paywall-features">
          <div class="paywall-section-label">升级后获得</div>
          ${config.features.map((feature) => `<div class="paywall-feature"><span>✓</span><p>${esc(feature)}</p></div>`).join("")}
          ${config.seoFeature?.enabled ? `<div class="paywall-seo-card">
            <div class="paywall-seo-card__head"><span>${esc(config.seoFeature.badge || "NEW")}</span><strong>${esc(config.seoFeature.title)}</strong><em>${esc(config.seoFeature.note || "包含在 Pro")}</em></div>
            <p>${esc(config.seoFeature.description)}</p>
            <div class="paywall-seo-card__features">${(config.seoFeature.features || []).map((feature) => `<span>${esc(feature)}</span>`).join("")}</div>
          </div>` : ""}
          ${pro ? `<div class="paywall-already">当前浏览器已解锁 Pro。</div>` : ""}
        </div>
        <div class="paywall-buy">
          <div class="paywall-plans">
            ${config.plans
              .map(
                (plan) => `<button type="button" class="paywall-plan ${selectedPlan?.id === plan.id ? "is-active" : ""}" data-action="paywall-plan" data-plan="${esc(plan.id)}">
                  <span class="paywall-plan__name">${esc(plan.name)}</span>
                  <strong>${esc(plan.price)}<small>${esc(plan.period)}</small></strong>
                  <span class="paywall-plan__note">${esc(plan.note)}</span>
                </button>`
              )
              .join("")}
          </div>

          <div class="paywall-section-label">选择支付方式</div>
          <div class="paywall-channels">
            <button type="button" class="paywall-channel ${channel === "wechat" ? "is-active" : ""}" data-action="paywall-channel" data-channel="wechat">
              <span class="paywall-channel__dot paywall-channel__dot--wechat"></span>${esc(config.wechatName)}
            </button>
            <button type="button" class="paywall-channel ${channel === "alipay" ? "is-active" : ""}" data-action="paywall-channel" data-channel="alipay">
              <span class="paywall-channel__dot paywall-channel__dot--alipay"></span>${esc(config.alipayName)}
            </button>
          </div>

          <div class="paywall-paybox">
            <div class="paywall-qr">
              ${qr ? `<img src="${esc(qr)}" alt="${esc(channelName)}收款码"/>` : `<div class="paywall-qr__empty"><strong>收款码未配置</strong><span>打开「付费墙设置」上传${esc(channelName)}收款码</span></div>`}
            </div>
            <div class="paywall-payinfo">
              <div class="paywall-amount">${esc(selectedPlan?.price || "")}<small>${esc(selectedPlan?.period || "")}</small></div>
              <p>扫码支付后，联系主理人获取解锁码。解锁码只在本浏览器生效，适合内测与手动收款。</p>
              ${config.contact ? renderContact(config.contact) : ""}
            </div>
          </div>

          <div class="paywall-unlock">
            <label for="paywall-code">已有解锁码？</label>
            <div class="paywall-code-row">
              <input id="paywall-code" data-paywall-code value="${esc(state.code || "")}" placeholder="输入主理人发给你的解锁码" autocomplete="off"/>
              <button type="button" class="btn btn--primary btn--sm" data-action="paywall-unlock">解锁</button>
            </div>
            ${state.error ? `<div class="paywall-error">${esc(state.error)}</div>` : ""}
          </div>

          <div class="paywall-foot">
            <button type="button" class="paywall-link" data-action="paywall-restore">恢复购买</button>
            <span>·</span>
            <button type="button" class="paywall-link" data-action="open-paywall-settings">付费墙设置</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderContact(contact) {
  const value = String(contact || "");
  const href = /^https?:\/\//.test(value)
    ? value
    : /@/.test(value) && !value.startsWith("微信")
      ? `mailto:${value}`
      : "";
  if (!href) return `<span class="paywall-contact">${esc(value)}</span>`;
  return `<a class="paywall-contact" href="${esc(href)}" target="_blank" rel="noreferrer">${esc(value)}</a>`;
}

export function renderPaywallSettings(config, pro) {
  return `<div class="settings-page">
    <div class="settings-head">
      <div class="special-eyebrow">${esc("PAYWALL SETTINGS")}</div>
      <h1>付费墙设置</h1>
      <p>这里填写的标题、卖点、价格、收款码和解锁码，会直接显示在「升级 Pro」弹窗里。修改后点保存。</p>
      <div class="settings-note">仅主理人使用。正式上线前，请把本页放到登录/权限之后，收款与解锁改为服务端校验。</div>
    </div>

    <div class="settings-layout">
      <section class="settings-card">
        <div class="settings-card__head"><h2>展示内容</h2><span>用户第一眼看到的文案</span></div>
        <label class="settings-field"><span>品牌标签</span><input data-pw="brand" value="${esc(config.brand)}" placeholder="OPC OS PRO"/></label>
        <label class="settings-field"><span>标题</span><input data-pw="title" value="${esc(config.title)}" placeholder="把公司交给系统，不交给记忆"/></label>
        <label class="settings-field"><span>副标题</span><textarea data-pw="subtitle" rows="2">${esc(config.subtitle)}</textarea></label>
        <label class="settings-field"><span>卖点（每行一条）</span><textarea data-pw="features" rows="6">${esc(config.features.join("\n"))}</textarea></label>
      </section>

      <section class="settings-card settings-card--seo">
        <div class="settings-card__head"><h2>出海GEO权益卡</h2><span>付费墙上的重点产品</span></div>
        <label class="settings-check"><input type="checkbox" data-pw="seoFeature.enabled" ${config.seoFeature?.enabled ? "checked" : ""}/> 在付费墙显示出海GEO权益卡</label>
        <div class="settings-grid">
          <label class="settings-field"><span>角标</span><input data-pw="seoFeature.badge" value="${esc(config.seoFeature?.badge || "NEW")}" placeholder="NEW"/></label>
          <label class="settings-field"><span>价格说明</span><input data-pw="seoFeature.note" value="${esc(config.seoFeature?.note || "包含在 Pro")}" placeholder="包含在 Pro"/></label>
        </div>
        <label class="settings-field"><span>标题</span><input data-pw="seoFeature.title" value="${esc(config.seoFeature?.title || "")}" placeholder="出海GEO + 中国市场GEO"/></label>
        <label class="settings-field"><span>描述</span><textarea data-pw="seoFeature.description" rows="2">${esc(config.seoFeature?.description || "")}</textarea></label>
        <label class="settings-field"><span>权益点（每行一条）</span><textarea data-pw="seoFeature.features" rows="5">${esc((config.seoFeature?.features || []).join("\n"))}</textarea></label>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><h2>价格</h2><span>直接显示在付费墙上</span></div>
        ${config.plans
          .map(
            (plan) => `<div class="settings-plan">
              <div class="settings-plan__title">${esc(plan.name)}</div>
              <div class="settings-plan__grid">
                <label class="settings-field"><span>名称</span><input data-pw="plan.${esc(plan.id)}.name" value="${esc(plan.name)}"/></label>
                <label class="settings-field"><span>价格</span><input data-pw="plan.${esc(plan.id)}.price" value="${esc(plan.price)}"/></label>
                <label class="settings-field"><span>周期</span><input data-pw="plan.${esc(plan.id)}.period" value="${esc(plan.period)}"/></label>
                <label class="settings-field"><span>备注</span><input data-pw="plan.${esc(plan.id)}.note" value="${esc(plan.note)}"/></label>
              </div>
            </div>`
          )
          .join("")}
        <div class="settings-grid">
          <label class="settings-field"><span>免费 AI 次数 / 月</span><input type="number" min="0" data-pw="freeAiLimit" value="${Number(config.freeAiLimit)}"/></label>
          <label class="settings-field"><span>免费新建页面数</span><input type="number" min="0" data-pw="freePages" value="${Number(config.freePages)}"/></label>
        </div>
        <label class="settings-check"><input type="checkbox" data-pw="enabled" ${config.enabled ? "checked" : ""}/> 启用付费墙（关闭后全部功能免费）</label>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><h2>收款方式</h2><span>上传你的微信 / 支付宝收款码</span></div>
        <div class="settings-qr-grid">
          ${[
            ["wechat", "微信支付", config.wechatQR],
            ["alipay", "支付宝", config.alipayQR],
          ]
            .map(
              ([key, label, qr]) => `<div class="settings-qr">
                <div class="settings-qr__preview" data-qr-preview-box="${key}">
                  ${qr ? `<img data-qr-preview="${key}" src="${esc(qr)}" alt="${esc(label)}收款码"/>` : `<span data-qr-preview="${key}" class="settings-qr__empty">未上传</span>`}
                </div>
                <strong>${esc(label)}</strong>
                <input type="hidden" data-pw="${key}QR" value="${esc(qr)}"/>
                <div class="settings-qr__actions">
                  <label class="btn btn--ghost btn--sm">上传图片<input type="file" accept="image/*" data-qr-upload="${key}" hidden/></label>
                  <button type="button" class="paywall-link" data-action="remove-qr" data-channel="${key}">移除</button>
                </div>
              </div>`
            )
            .join("")}
        </div>
        <div class="settings-grid">
          <label class="settings-field"><span>微信显示名</span><input data-pw="wechatName" value="${esc(config.wechatName)}"/></label>
          <label class="settings-field"><span>支付宝显示名</span><input data-pw="alipayName" value="${esc(config.alipayName)}"/></label>
        </div>
        <label class="settings-field"><span>联系方式（显示在付费墙）</span><input data-pw="contact" value="${esc(config.contact)}" placeholder="微信：liran-opc 或邮箱"/></label>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><h2>解锁与测试</h2><span>手动收款后发给用户</span></div>
        <label class="settings-field"><span>解锁码</span><input data-pw="unlockCode" value="${esc(config.unlockCode)}"/></label>
        <div class="settings-inline">
          <button type="button" class="btn btn--ghost btn--sm" data-action="copy-unlock-code">复制解锁码</button>
          <button type="button" class="btn btn--ai btn--sm" data-action="manual-unlock">手动解锁此浏览器</button>
          ${pro ? `<button type="button" class="btn btn--danger btn--sm" data-action="reset-pro">取消本机 Pro</button>` : ""}
        </div>
        <div class="settings-hint">当前状态：<strong>${pro ? "Pro 已解锁" : "Free"}</strong>。解锁码存在本机，适合内测；正式环境应由服务端订单状态决定。</div>
      </section>
    </div>

    <div class="settings-actions">
      <button type="button" class="btn btn--primary" data-action="save-paywall">保存设置</button>
      <button type="button" class="btn btn--ghost" data-action="preview-paywall">预览付费墙</button>
      <button type="button" class="btn btn--ghost" data-action="reset-paywall">恢复默认文案</button>
      <span>修改只影响当前浏览器。</span>
    </div>
  </div>`;
}

export function readPaywallForm() {
  const value = (name) => document.querySelector(`[data-pw="${name}"]`)?.value ?? "";
  const checked = (name) => Boolean(document.querySelector(`[data-pw="${name}"]`)?.checked);
  const plans = ["monthly", "yearly"].map((id, index) => ({
    id,
    name: value(`plan.${id}.name`) || (index === 0 ? "月付" : "年付"),
    price: value(`plan.${id}.price`) || (index === 0 ? "¥39" : "¥299"),
    period: value(`plan.${id}.period`) || (index === 0 ? "/ 月" : "/ 年"),
    note: value(`plan.${id}.note`) || "",
  }));
  return {
    enabled: checked("enabled"),
    brand: value("brand") || "OPC OS PRO",
    title: value("title") || "把公司交给系统，不交给记忆",
    subtitle: value("subtitle") || "",
    features: value("features").split("\n").map((item) => item.trim()).filter(Boolean),
    plans,
    freeAiLimit: Math.max(0, Number(value("freeAiLimit")) || 0),
    freePages: Math.max(0, Number(value("freePages")) || 0),
    unlockCode: value("unlockCode") || "OPC-PRO-2026",
    contact: value("contact"),
    wechatName: value("wechatName") || "微信支付",
    alipayName: value("alipayName") || "支付宝",
    wechatQR: value("wechatQR"),
    alipayQR: value("alipayQR"),
    seoFeature: {
      enabled: checked("seoFeature.enabled"),
      badge: value("seoFeature.badge") || "NEW",
      title: value("seoFeature.title") || "出海GEO + 中国市场GEO",
      note: value("seoFeature.note") || "包含在 Pro",
      description: value("seoFeature.description"),
      features: value("seoFeature.features").split("\n").map((item) => item.trim()).filter(Boolean),
    },
  };
}

export function compressQR(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("图片读取失败"));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}
