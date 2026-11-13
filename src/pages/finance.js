import { icon } from "../icons.js";
import {
  cashTotal,
  monthExpense,
  monthIncome,
  receivableTotal,
  runwayMonths,
} from "../selectors.js";
import { badge, barChart, categoryBadge, money, shortDate } from "../ui.js";

const ui = { type: "all" };

export const financePage = {
  title: "资金台账",
  eyebrow: "FINANCE / 现金流与账户",
  subtitle: "把对公账户、支付宝、发票与应收放在一张表里；先看现金流，再看利润。",

  render(state) {
    const cash = cashTotal(state);
    const income = monthIncome(state);
    const expense = monthExpense(state);
    const net = income - expense;
    const receivable = receivableTotal(state);

    const transactions = [...state.transactions]
      .filter((tx) => ui.type === "all" || tx.type === ui.type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const pendingInvoices = state.transactions.filter((tx) => tx.invoice === "待取票");
    const invoiceTotal = pendingInvoices.reduce((sum, tx) => sum + tx.amount, 0);

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="export-finance">${icon("download", 15)} 导出流水</button>
          <button class="btn btn--primary" data-action="add-transaction">${icon("plus", 15)} 记一笔</button>
        </div>
      </div>

      <div class="finance-summary">
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon">${icon("wallet", 17)}</span><span class="kpi__delta up">+12.4%</span></div>
          <p class="kpi__label">可支配现金</p>
          <strong class="kpi__value">${money(cash)}</strong>
          <div class="kpi__foot"><span class="kpi__note">两个账户合计</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-blue">${icon("arrowDownLeft", 17)}</span><span class="kpi__delta up">11 月</span></div>
          <p class="kpi__label">本月收入</p>
          <strong class="kpi__value">${money(income)}</strong>
          <div class="kpi__foot"><span class="kpi__note">较上月同期 +18%</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-amber">${icon("arrowUpRight", 17)}</span><span class="kpi__delta flat">11 月</span></div>
          <p class="kpi__label">本月支出</p>
          <strong class="kpi__value">${money(expense)}</strong>
          <div class="kpi__foot"><span class="kpi__note">固定支出占 62%</span></div>
        </article>
        <article class="kpi">
          <div class="kpi__top"><span class="kpi__icon tone-purple">${icon("trend", 17)}</span><span class="kpi__delta ${net >= 0 ? "up" : "down"}">${net >= 0 ? "健康" : "承压"}</span></div>
          <p class="kpi__label">本月净现金流</p>
          <strong class="kpi__value">${money(net)}</strong>
          <div class="kpi__foot"><span class="kpi__note">可支撑 ${runwayMonths(state)} 个月</span></div>
        </article>
      </div>

      <div class="finance-grid">
        <section class="card">
          <header class="card__head">
            <div><h3>收入与支出</h3><p>近 6 个月 · 单位：元</p></div>
            <div class="chart-legend"><span><i class="legend-dot"></i>收入</span><span><i class="legend-dot" style="background:#D9E3EE"></i>支出</span></div>
          </header>
          <div class="card__body" style="padding-top:6px">
            ${barChart(state.monthly)}
            <div class="cashflow-summary" style="margin-top:6px">
              <div><strong>${money(net)}</strong><span>本月净现金流</span></div>
              <span class="up">${net >= 0 ? "现金流为正" : "现金流为负"}</span>
            </div>
          </div>
        </section>

        <div style="display:grid;gap:14px">
          <section class="card" style="padding:17px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:11px">
              <h3 style="font-size:12px;font-weight:700">账户</h3>
              <span style="color:var(--muted-2);font-size:9.5px">自动同步 · 2 分钟前</span>
            </div>
            <div class="account-list">
              ${state.accounts
                .map(
                  (account) => `<div class="account-card">
                    <span class="account-card__icon ${account.type === "wallet" ? "wallet" : ""}">${icon(account.type === "wallet" ? "wallet" : "bank", 17)}</span>
                    <div class="account-card__main"><strong>${account.name}</strong><span>${account.detail}</span></div>
                    <span class="account-card__value">${money(account.balance)}</span>
                  </div>`
                )
                .join("")}
            </div>
            <button class="btn btn--block" style="margin-top:11px" data-action="sync-accounts">${icon("refresh", 14)} 同步银行流水</button>
          </section>

          <section class="card" style="padding:17px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <h3 style="font-size:12px;font-weight:700">待取票</h3>
              <span class="badge badge--amber">${pendingInvoices.length} 笔</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
              <strong style="color:var(--navy);font-size:22px;font-weight:750;letter-spacing:-.03em">${money(invoiceTotal)}</strong>
              <span style="color:var(--muted);font-size:10px">可抵扣进项</span>
            </div>
            <div class="invoice-list">
              ${pendingInvoices
                .map(
                  (tx) => `<div class="invoice-row">
                    ${badge(tx.category, "slate")}
                    <div class="invoice-row__main"><strong>${tx.title}</strong><span>${shortDate(tx.date)} · ${money(tx.amount)}</span></div>
                    <button class="btn btn--ghost btn--sm" data-action="request-invoice" data-id="${tx.id}">催票</button>
                  </div>`
                )
                .join("")}
            </div>
          </section>
        </div>
      </div>

      <section class="card" style="margin-top:16px">
        <header class="card__head" style="align-items:center">
          <div><h3>全部流水</h3><p>${state.transactions.length} 笔 · 最近 30 天</p></div>
          <div class="tabs">
            ${[
              ["all", "全部"],
              ["income", "收入"],
              ["expense", "支出"],
            ]
              .map(
                ([key, label]) => `<button class="tab ${ui.type === key ? "is-active" : ""}" data-tx-filter="${key}">${label}</button>`
              )
              .join("")}
          </div>
        </header>
        <div class="table-wrap" style="padding:0 8px 8px">
          <table class="data-table">
            <thead><tr><th>日期</th><th>交易</th><th>分类</th><th>账户</th><th>发票</th><th style="text-align:right">金额</th></tr></thead>
            <tbody>
              ${transactions
                .map(
                  (tx) => `<tr>
                    <td style="color:var(--muted);font-size:11px">${shortDate(tx.date)}</td>
                    <td>
                      <div class="cell-main">
                        <span class="tx-mini__icon ${tx.type}" style="width:26px;height:26px">${icon(tx.type === "income" ? "arrowDownLeft" : "arrowUpRight", 13)}</span>
                        <div><strong>${tx.title}</strong><span>${tx.status}</span></div>
                      </div>
                    </td>
                    <td>${categoryBadge(tx.category)}</td>
                    <td style="color:var(--muted);font-size:11px">${tx.account}</td>
                    <td>${badge(tx.invoice, tx.invoice === "待取票" ? "amber" : tx.invoice === "已开票" ? "green" : "neutral")}</td>
                    <td class="num ${tx.type === "income" ? "positive" : ""}">${tx.type === "income" ? "+" : "-"}${money(tx.amount)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll("[data-tx-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.type = button.dataset.txFilter;
        ctx.rerender();
      });
    });
  },
};
