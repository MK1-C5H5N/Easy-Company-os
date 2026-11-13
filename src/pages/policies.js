import { icon } from "../icons.js";
import { badge, shortDate } from "../ui.js";

const ui = { city: "全部", query: "" };

export const policiesPage = {
  title: "政策与补贴",
  eyebrow: "POLICY / 政策匹配",
  subtitle: "把“能拿的钱”变成可执行的任务：按主体、行业、区域匹配，截止日自动进入合规日历。",

  render(state) {
    const cities = ["全部", ...new Set(state.policies.map((policy) => policy.city))];
    const policies = state.policies
      .filter((policy) => (ui.city === "全部" ? true : policy.city === ui.city))
      .filter((policy) => {
        if (!ui.query) return true;
        return `${policy.title} ${policy.issuer} ${policy.tags.join(" ")}`.toLowerCase().includes(ui.query.toLowerCase());
      })
      .sort((a, b) => b.match - a.match);

    const highMatch = state.policies.filter((policy) => policy.match >= 90).length;
    const applied = state.tasks.filter((task) => task.category === "补贴" && task.status !== "done").length;

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="refresh-policies">${icon("refresh", 15)} 重新匹配</button>
          <button class="btn btn--primary" data-action="policy-brief">${icon("sparkles", 15)} 生成申报清单</button>
        </div>
      </div>

      <div class="summary-strip">
        <div class="summary-item">
          <span class="summary-item__icon tone-teal">${icon("target", 17)}</span>
          <div><strong>${state.policies.length}</strong><span>项政策可匹配</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon tone-amber">${icon("star", 17)}</span>
          <div><strong>${highMatch}</strong><span>项匹配度 ≥ 90%</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon">${icon("calendar", 17)}</span>
          <div><strong>${applied}</strong><span>项已加入日历</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon tone-teal">${icon("wallet", 17)}</span>
          <div><strong>¥1,000 万</strong><span>单笔最高额度</span></div>
        </div>
      </div>

      <div class="policy-toolbar">
        <div class="tabs">
          ${cities
            .map(
              (city) => `<button class="tab ${ui.city === city ? "is-active" : ""}" data-policy-city="${city}">${city}</button>`
            )
            .join("")}
        </div>
        <div class="policy-search">
          ${icon("search", 14, "icon")}
          <input class="input" data-policy-search placeholder="搜索政策、标签" value="${ui.query}" aria-label="搜索政策"/>
        </div>
      </div>

      <div class="policy-grid">
        ${policies
          .map(
            (policy) => `<article class="policy-card">
              <div class="policy-card__top">
                <span class="policy-card__icon">${icon("star", 17)}</span>
                <div class="policy-card__title">
                  <h3>${policy.title}</h3>
                  <p>${policy.issuer}</p>
                </div>
                <div class="policy-card__match"><strong>${policy.match}<span style="font-size:9px">%</span></strong><span>匹配度</span></div>
              </div>
              <p class="policy-card__desc">${policy.desc}</p>
              <div class="policy-card__meta">
                <span>额度 <strong>${policy.amount}</strong></span>
                <span>截止 <strong>${policy.deadline === "常年受理" ? "常年受理" : shortDate(policy.deadline)}</strong></span>
                <span>${policy.city}</span>
              </div>
              <div class="policy-card__tags">${policy.tags.map((tag) => badge(tag, "neutral")).join("")}</div>
              <div class="policy-card__foot">
                <div class="match-bar">
                  <div class="progress"><div class="progress__bar" style="width:${policy.match}%"></div></div>
                  <span>匹配 ${policy.match}%</span>
                </div>
                <button class="btn btn--sm" data-action="policy-detail" data-id="${policy.id}">详情</button>
                <button class="btn btn--primary btn--sm" data-action="add-policy" data-id="${policy.id}">${icon("plus", 13)} 加入日历</button>
              </div>
            </article>`
          )
          .join("")}
      </div>

      ${
        policies.length === 0
          ? `<div class="card" style="margin-top:14px"><div class="empty"><div class="empty__mark">○</div><h3>没有匹配的政策</h3><p>试试切换城市，或清空搜索关键词。</p></div></div>`
          : ""
      }

      <div class="card" style="margin-top:16px;padding:16px;display:flex;gap:12px;align-items:flex-start;background:linear-gradient(120deg,#f7fbfa,#fff)">
        <span class="summary-item__icon tone-teal">${icon("sparkles", 17)}</span>
        <div style="flex:1">
          <strong style="font-size:12px">政策不是“薅羊毛”，而是公司档案的延伸</strong>
          <p style="margin-top:3px;color:var(--muted);font-size:10.5px;line-height:1.6">AI 会基于你的注册地、行业、开票与社保记录判断匹配度；点击“加入日历”后，截止日会进入合规日历，并自动生成材料清单。</p>
        </div>
        <button class="btn btn--sm" data-action="policy-brief">生成材料清单</button>
      </div>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll("[data-policy-city]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.city = button.dataset.policyCity;
        ctx.rerender();
      });
    });
    const search = root.querySelector("[data-policy-search]");
    if (search) {
      let timer = null;
      search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          ui.query = search.value.trim();
          ctx.rerender();
          const next = document.querySelector("[data-policy-search]");
          next?.focus();
          next?.setSelectionRange(next.value.length, next.value.length);
        }, 180);
      });
    }
  },
};
