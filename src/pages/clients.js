import { icon } from "../icons.js";
import { receivableTotal } from "../selectors.js";
import { avatar, badge, money, pct, shortDate } from "../ui.js";

const columns = [
  { key: "lead", label: "线索", stages: ["线索"] },
  { key: "quote", label: "已报价", stages: ["已报价"] },
  { key: "delivery", label: "交付中", stages: ["已签约", "交付中"] },
  { key: "renew", label: "续费与回款", stages: ["续费中", "已回款"] },
];

function clientCard(client) {
  const progress = pct(client.received, client.amount);
  return `<button type="button" class="client-card" data-action="client-detail" data-id="${client.id}">
    <div class="client-card__top">
      ${avatar(client.name, client.color, "sm")}
      <strong>${client.name}</strong>
    </div>
    <p class="client-card__project">${client.project}</p>
    <div class="client-card__amount">${money(client.amount)}</div>
    <div class="client-card__progress">
      <div class="progress"><div class="progress__bar" style="width:${progress}%"></div></div>
      <span>${progress}% 已回款</span>
    </div>
    <div class="client-card__next">${icon("clock", 11)}<span>${client.nextAction}</span></div>
  </button>`;
}

export const clientsPage = {
  title: "客户与合同",
  eyebrow: "REVENUE / 获客与交付",
  subtitle: "一个人也要有销售漏斗：从线索、报价、交付到回款，每一笔都看得见下一步。",

  render(state) {
    const receivable = receivableTotal(state);
    const contractedStages = new Set(["已签约", "交付中", "续费中"]);
    const contracted = state.clients.filter((client) => contractedStages.has(client.stage));
    const total = contracted.reduce((sum, client) => sum + client.amount, 0);
    const received = contracted.reduce((sum, client) => sum + client.received, 0);
    const active = contracted.length;
    const avg = Math.round(total / Math.max(1, contracted.length));

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="export-clients">${icon("download", 15)} 导出</button>
          <button class="btn btn--primary" data-action="add-client">${icon("plus", 15)} 新增客户</button>
        </div>
      </div>

      <div class="kpi-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon">${icon("briefcase", 17)}</span><span class="kpi__delta up">${active} 个进行中</span></div>
          <p class="kpi__label">合同总额</p>
          <strong class="kpi__value">${money(total)}</strong>
          <div class="kpi__foot"><span class="kpi__note">${contracted.length} 份合同 · ${state.clients.length} 个客户</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-blue">${icon("check", 17)}</span><span class="kpi__delta up">${pct(received, total)}%</span></div>
          <p class="kpi__label">已回款</p>
          <strong class="kpi__value">${money(received)}</strong>
          <div class="kpi__foot"><span class="kpi__note">含首款与尾款</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-amber">${icon("clock", 17)}</span><span class="kpi__delta flat">4 笔</span></div>
          <p class="kpi__label">待回款</p>
          <strong class="kpi__value">${money(receivable)}</strong>
          <div class="kpi__foot"><span class="kpi__note">最早 11-18 到期</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-purple">${icon("target", 17)}</span><span class="kpi__delta up">健康</span></div>
          <p class="kpi__label">平均合同金额</p>
          <strong class="kpi__value">${money(avg)}</strong>
          <div class="kpi__foot"><span class="kpi__note">目标 ¥25,000</span></div>
        </article>
      </div>

      <section class="card" style="padding:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
          <div>
            <h3 style="font-size:13px;font-weight:700">销售漏斗</h3>
            <p style="color:var(--muted);font-size:10.5px;margin-top:2px">点击卡片可查看客户详情与下一步动作。</p>
          </div>
          <span class="badge badge--teal">${state.clients.length} 个客户</span>
        </div>
        <div class="kanban">
          ${columns
            .map((column) => {
              const items = state.clients.filter((client) => column.stages.includes(client.stage));
              return `<div class="kanban__col">
                <div class="kanban__head">${column.label}<span>${items.length}</span></div>
                <div class="kanban__cards">
                  ${items.length ? items.map(clientCard).join("") : `<div style="padding:18px 8px;color:var(--muted-2);font-size:10px;text-align:center">暂无客户</div>`}
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </section>

      <section class="card client-table">
        <header class="card__head">
          <div><h3>客户与项目明细</h3><p>按合同金额排序 · 数据来自合同与银行流水</p></div>
          <button class="btn btn--sm" data-action="add-client">${icon("plus", 13)} 新增</button>
        </header>
        <div class="table-wrap" style="padding:0 8px 8px">
          <table class="data-table">
            <thead><tr><th>客户 / 项目</th><th>阶段</th><th>合同金额</th><th>已回款</th><th>进度</th><th>下一步</th><th></th></tr></thead>
            <tbody>
              ${[...state.clients]
                .sort((a, b) => b.amount - a.amount)
                .map(
                  (client) => `<tr>
                    <td>
                      <div class="cell-main">
                        ${avatar(client.name, client.color, "sm")}
                        <div><strong>${client.name}</strong><span>${client.project} · ${client.contact}</span></div>
                      </div>
                    </td>
                    <td>${badge(client.stage, client.stage === "线索" ? "slate" : client.stage === "已报价" ? "amber" : client.stage === "续费中" ? "purple" : "teal", true)}</td>
                    <td class="num">${money(client.amount)}</td>
                    <td class="num">${money(client.received)}</td>
                    <td style="min-width:110px">
                      <div class="client-card__progress" style="margin:0">
                        <div class="progress"><div class="progress__bar" style="width:${pct(client.received, client.amount)}%"></div></div>
                        <span>${pct(client.received, client.amount)}%</span>
                      </div>
                    </td>
                    <td style="color:var(--muted);font-size:10.5px">${client.nextAction}<br><span style="color:var(--muted-2);font-size:9.5px">${shortDate(client.due)} 截止</span></td>
                    <td><button class="btn btn--ghost btn--sm" data-action="client-detail" data-id="${client.id}">详情</button></td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  },
};
