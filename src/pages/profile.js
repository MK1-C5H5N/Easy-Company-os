import { icon } from "../icons.js";
import { badge, ring } from "../ui.js";

const info = [
  ["统一社会信用代码", "creditCode"],
  ["纳税人类型", "taxType"],
  ["所属行业", "industry"],
  ["成立日期", "established"],
  ["注册资本", "registeredCapital"],
  ["注册地址", "address"],
  ["对公账户", "bank"],
  ["社保", "social"],
];

export const profilePage = {
  title: "公司档案",
  eyebrow: "COMPANY / 单一事实源",
  subtitle: "一份档案同时服务开户、申报、融资与政策申报；资料越完整，AI 的判断越准。",

  render(state) {
    const company = state.company;
    const missing = state.documents.filter((doc) => !doc.done);
    const docsDone = state.documents.length - missing.length;
    const completeness = Math.round((docsDone / state.documents.length) * 100);

    const agents = [
      { key: "agentFinance", name: "财务 Agent", desc: "记账、发票、税务测算", iconName: "wallet", on: state.settings.agentFinance },
      { key: "agentCompliance", name: "合规 Agent", desc: "申报日历、风险预警", iconName: "shield", on: state.settings.agentCompliance },
      { key: "agentGrowth", name: "获客 Agent", desc: "商机挖掘、投标分析", iconName: "target", on: state.settings.agentGrowth },
    ];

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="download-archive">${icon("download", 15)} 下载档案包</button>
          <button class="btn btn--primary" data-action="edit-company">${icon("edit", 15)} 编辑资料</button>
        </div>
      </div>

      <section class="profile-hero">
        <div class="profile-hero__mark">微</div>
        <div class="profile-hero__main">
          <h2>${company.name}</h2>
          <p>${company.founder} · ${company.role} · 成立于 ${company.established}</p>
          <div class="profile-hero__tags">
            ${badge(company.taxType, "teal", true)}
            ${badge(company.industry, "slate")}
            ${badge("杭州 · 上城区", "blue")}
            ${badge("OPC 社区入驻", "green")}
          </div>
        </div>
        <div class="profile-hero__right">
          ${ring(completeness, { size: 78, stroke: 7 })}
          <div style="font-size:10.5px;color:var(--muted);line-height:1.6">
            <strong style="display:block;color:var(--ink);font-size:12px">档案完整度</strong>
            ${docsDone} / ${state.documents.length} 份资料已归档<br>
            <span style="color:var(--amber);font-weight:650">还差 ${missing.length} 份</span>
          </div>
        </div>
      </section>

      <div class="profile-grid">
        <div style="display:grid;gap:14px">
          <section class="card">
            <header class="card__head">
              <div><h3>主体信息</h3><p>用于注册、开户、申报与合同签署</p></div>
              <button class="btn btn--sm" data-action="edit-company">${icon("edit", 13)} 编辑</button>
            </header>
            <div class="card__body" style="padding-top:12px">
              <dl class="info-list">
                ${info
                  .map(([label, key]) => {
                    let value = company[key];
                    if (key === "bank") value = `${company.bank.name} · ${company.bank.account}`;
                    return `<div class="info-item"><dt>${label}</dt><dd>${value}</dd></div>`;
                  })
                  .join("")}
              </dl>
              <div style="display:flex;align-items:center;gap:10px;margin-top:12px;padding:11px 12px;border-radius:10px;background:var(--amber-soft)">
                ${icon("alert", 16, "icon")}
                <div style="flex:1;font-size:10.5px;color:#7a3b06;line-height:1.5">一人公司需证明财产独立：建议每年做一次专项审计，并保留完整账簿、合同与银行流水。</div>
                <button class="btn btn--sm" data-action="add-audit-task">加入待办</button>
              </div>
            </div>
          </section>

          <section class="card">
            <header class="card__head">
              <div><h3>资质与文档</h3><p>证照、合同、知识产权统一归档</p></div>
              <button class="btn btn--sm" data-action="upload-doc">${icon("plus", 13)} 上传</button>
            </header>
            <div class="card__body" style="padding-top:10px">
              <div class="doc-list">
                ${state.documents
                  .map(
                    (doc) => `<div class="doc-row">
                      <span class="doc-row__icon ${doc.done ? "done" : ""}">${icon(doc.done ? "check" : "file", 14)}</span>
                      <div class="doc-row__main"><strong>${doc.name}</strong><span>${doc.type} · ${doc.done ? `更新于 ${doc.updated}` : "待补充"}</span></div>
                      ${doc.done ? badge("已归档", "teal") : badge("缺失", "amber")}
                    </div>`
                  )
                  .join("")}
              </div>
            </div>
          </section>
        </div>

        <div style="display:grid;gap:14px">
          <section class="card" style="padding:17px">
            <div class="completeness">
              ${ring(completeness, { size: 62, stroke: 6, color: "#0E7C6B", label: false })}
              <div style="flex:1">
                <strong>档案完整度 ${completeness}%</strong>
                <p>补齐年度审计与合同模板，可解锁“合规融资包”。</p>
              </div>
            </div>
            <div style="display:grid;gap:9px;margin-top:13px">
              <button class="btn btn--block" data-action="add-missing-docs">${icon("sparkles", 14)} 让 AI 帮我补齐资料</button>
              <button class="btn btn--block" data-action="download-archive">${icon("download", 14)} 下载完整档案包</button>
            </div>
          </section>

          <section class="card">
            <header class="card__head"><div><h3>AI 员工</h3><p>3 个岗位，按需启用</p></div></header>
            <div class="card__body" style="padding-top:10px">
              <div class="toggle-list">
                ${agents
                  .map(
                    (agent) => `<div class="toggle-row">
                      <span class="toggle-row__icon">${icon(agent.iconName, 15)}</span>
                      <div class="toggle-row__main"><strong>${agent.name}</strong><span>${agent.desc}</span></div>
                      <label class="switch">
                        <input type="checkbox" data-agent="${agent.key}" ${agent.on ? "checked" : ""} aria-label="启用 ${agent.name}">
                        <span></span>
                      </label>
                    </div>`
                  )
                  .join("")}
              </div>
            </div>
          </section>

          <section class="card">
            <header class="card__head"><div><h3>提醒与简报</h3><p>自动化的边界由你决定</p></div></header>
            <div class="card__body" style="padding-top:10px">
              <div class="toggle-list">
                <div class="toggle-row">
                  <span class="toggle-row__icon">${icon("bell", 15)}</span>
                  <div class="toggle-row__main"><strong>合规到期提醒</strong><span>提前 7 天，短信 + 企微</span></div>
                  <label class="switch"><input type="checkbox" data-setting="autoRemind" ${state.settings.autoRemind ? "checked" : ""} aria-label="合规到期提醒"><span></span></label>
                </div>
                <div class="toggle-row">
                  <span class="toggle-row__icon">${icon("message", 15)}</span>
                  <div class="toggle-row__main"><strong>每周经营简报</strong><span>周一 09:00，现金流与待办</span></div>
                  <label class="switch"><input type="checkbox" data-setting="weeklyBrief" ${state.settings.weeklyBrief ? "checked" : ""} aria-label="每周经营简报"><span></span></label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll("[data-agent]").forEach((input) => {
      input.addEventListener("change", () => {
        ctx.store.set((state) => {
          state.settings[input.dataset.agent] = input.checked;
        });
        ctx.toast(`${input.checked ? "已启用" : "已暂停"}该 AI 员工`);
      });
    });
    root.querySelectorAll("[data-setting]").forEach((input) => {
      input.addEventListener("change", () => {
        ctx.store.set((state) => {
          state.settings[input.dataset.setting] = input.checked;
        });
        ctx.toast("提醒设置已更新");
      });
    });
  },
};
