import { icon } from "../icons.js";
import {
  cashTotal,
  daysUntil,
  dueSoonTasks,
  healthScore,
  monthExpense,
  monthIncome,
  overdueTasks,
  pendingTasks,
  receivableTotal,
  runwayMonths,
} from "../selectors.js";
import {
  badge,
  categoryBadge,
  dueLabel,
  dueTone,
  lineChart,
  money,
  pct,
  ring,
  shortDate,
} from "../ui.js";

function sparkline(values, color = "#0E7C6B") {
  const width = 82;
  const height = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
  </svg>`;
}

function kpi({ iconName, tone, label, value, unit = "", delta, deltaTone = "up", note, spark, sparkColor }) {
  return `<article class="kpi">
    <div class="kpi__top">
      <span class="kpi__icon tone-${tone}">${icon(iconName, 17)}</span>
      <span class="kpi__delta ${deltaTone}">${delta}</span>
    </div>
    <p class="kpi__label">${label}</p>
    <strong class="kpi__value">${value}${unit ? `<small>${unit}</small>` : ""}</strong>
    <div class="kpi__foot">
      <span class="kpi__note">${note}</span>
      ${spark ? sparkline(spark, sparkColor) : ""}
    </div>
  </article>`;
}

export const dashboardPage = {
  title: "驾驶舱",
  eyebrow: "TODAY / 经营总览",
  subtitle: "把待办、账、客户、政策收敛到一个界面；先处理最影响现金流与合规的事。",

  render(state) {
    const cash = cashTotal(state);
    const receivable = receivableTotal(state);
    const pending = pendingTasks(state);
    const overdue = overdueTasks(state);
    const soon = dueSoonTasks(state, 7);
    const health = healthScore(state);
    const income = monthIncome(state);
    const expense = monthExpense(state);
    const net = income - expense;

    const priorityTasks = [...pending]
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .slice(0, 4);

    const policies = [...state.policies].sort((a, b) => b.match - a.match).slice(0, 3);
    const recentTx = [...state.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const contractedStages = new Set(["已签约", "交付中", "续费中"]);
    const topClients = [...state.clients]
      .filter((client) => contractedStages.has(client.stage) && client.amount > client.received)
      .sort((a, b) => b.amount - b.received - (a.amount - a.received))
      .slice(0, 3);

    const todayCount = overdue.length + soon.length;
    const missingDocs = state.documents.filter((doc) => !doc.done).length;
    const secondTask = soon.find((task) => task.id !== overdue[0]?.id) || priorityTasks.find((task) => task.id !== overdue[0]?.id);
    const moneyClient = topClients[0];

    const firstInsight = overdue.length
      ? `<strong>${overdue[0].title}</strong>已逾期 ${Math.abs(daysUntil(overdue[0].due))} 天，${overdue[0].note}`
      : `<strong>逾期待办已清零</strong>，当前没有需要立即处理的合规风险。`;
    const secondInsight = secondTask
      ? `<strong>${secondTask.title}</strong> · ${dueLabel(secondTask.due)}，${secondTask.note}`
      : `<strong>本周无新增申报</strong>，可以安排一次客户回访。`;
    const thirdInsight = moneyClient
      ? `<strong>${moneyClient.name}</strong>待回款 ${money(moneyClient.amount - moneyClient.received)}，建议今天跟进。`
      : `<strong>本月回款</strong>已完成，现金流保持为正。`;

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="generate-brief">${icon("sparkles", 15)} 生成经营简报</button>
          <button class="btn btn--primary" data-action="open-task-modal">${icon("plus", 15)} 新增事项</button>
        </div>
      </div>

      <section class="hero-card">
        <div class="hero-card__copy">
          <span class="hero-card__date">${state.company.name} · 2026 年 11 月 5 日</span>
          <h2>早上好，${state.company.founder}<span>👋</span></h2>
          <p>今天有 <strong>${todayCount} 件</strong>事需要你亲自处理：${
            overdue.length
              ? `「${overdue[0].title}」已逾期 ${Math.abs(daysUntil(overdue[0].due))} 天`
              : "没有逾期事项"
          }${soon.length ? `，${soon[0].title}将在 ${daysUntil(soon[0].due)} 天后截止` : ""}。其余 ${pending.length - todayCount} 项 AI 已排好顺序。</p>
          <div class="hero-card__actions">
            <button class="btn btn--primary" data-nav="#/compliance">${icon("shield", 15)} 处理合规待办</button>
            <button class="btn" data-action="ask-ai" data-prompt="用三句话总结我今天的经营重点">${icon("sparkles", 15)} 让 AI 总结今天</button>
          </div>
        </div>
        <div class="hero-card__score">
          ${ring(health, { size: 86, stroke: 7, color: "#2DD4BF", track: "rgba(255,255,255,.14)" })}
          <div class="hero-card__score-text">
            <strong>合规健康分</strong>
            <span>优于 68% 的同城 OPC</span>
            <em>${icon("trend", 11)} 较上月 +4 分</em>
          </div>
        </div>
      </section>

      <div class="kpi-grid">
        ${kpi({
          iconName: "wallet",
          tone: "teal",
          label: "可支配现金",
          value: money(cash),
          delta: "↑ 12.4%",
          note: `可支撑 ${runwayMonths(state)} 个月支出`,
          spark: [42, 48, 45, 58, 64, 72, 86],
        })}
        ${kpi({
          iconName: "trend",
          tone: "blue",
          label: "90 天应收",
          value: money(receivable),
          delta: "4 笔",
          deltaTone: "flat",
          note: "最早 11-18 到期",
          spark: [20, 26, 24, 38, 44, 52, 68],
          sparkColor: "#175CD3",
        })}
        ${kpi({
          iconName: "calendar",
          tone: "amber",
          label: "本月待办",
          value: String(pending.length),
          unit: " 项",
          delta: `${overdue.length + soon.length} 项临期`,
          deltaTone: "down",
          note: "AI 已自动排期",
          spark: [3, 4, 4, 6, 5, 8, 7],
          sparkColor: "#B54708",
        })}
        ${kpi({
          iconName: "shield",
          tone: "purple",
          label: "合规健康分",
          value: String(health),
          unit: " / 100",
          delta: "良好",
          deltaTone: "up",
          note: `${overdue.length} 项逾期 · ${missingDocs} 份资料缺失`,
          spark: [76, 78, 80, 79, 83, 85, 87],
          sparkColor: "#6941C6",
        })}
      </div>

      <div class="dash-grid">
        <section class="card cashflow-card span-8">
          <header class="card__head">
            <div>
              <h3>现金流趋势</h3>
              <p>近 6 个月 · 收入与支出</p>
            </div>
            <div class="segmented" role="group" aria-label="时间范围">
              <button class="is-active">6 个月</button>
              <button>12 个月</button>
            </div>
          </header>
          <div class="card__body">
            ${lineChart(state.monthly)}
            <div class="cashflow-summary">
              <div>
                <strong>${money(net)}</strong>
                <span>本月净现金流</span>
              </div>
              <span class="up">收入 ${money(income)} · 支出 ${money(expense)}</span>
            </div>
            <div class="chart-legend" style="margin-top:10px">
              <span><i class="legend-dot"></i>收入</span>
              <span><i class="legend-dot legend-dot--dash"></i>支出</span>
            </div>
          </div>
        </section>

        <aside class="ai-card span-4">
          <div class="ai-card__head">
            <span class="ai-card__mark">${icon("sparkles", 15)}</span>
            <strong>AI 今日简报</strong>
            <span>09:02 生成</span>
          </div>
          <div class="ai-card__body">
            <h3>${overdue.length ? "先处理逾期，再谈增长。" : "合规回到正轨，把时间留给增长。"}<em>今天先看这 3 件事。</em></h3>
            <div class="ai-card__list">
              <div class="ai-card__item"><i></i><span>${firstInsight}</span></div>
              <div class="ai-card__item"><i></i><span>${secondInsight}</span></div>
              <div class="ai-card__item"><i></i><span>${thirdInsight}</span></div>
            </div>
            <div class="ai-card__metrics">
              <div><span>本月预计回款</span><strong>¥35,200</strong></div>
              <div><span>现金 runway</span><strong>4.2 个月</strong></div>
            </div>
          </div>
          <div class="ai-card__foot">
            <button class="btn btn--primary" data-action="ask-ai" data-prompt="把今天的 3 件事排成时间表">生成今日计划</button>
            <button class="btn" data-nav="#/assistant">继续对话</button>
          </div>
        </aside>

        <section class="card span-7">
          <header class="card__head">
            <div>
              <h3>合规日历</h3>
              <p>按截止时间排序 · ${pending.length} 项待办</p>
            </div>
            <a class="card__link" href="#/compliance" data-nav>查看全部 ${icon("chevronRight", 13)}</a>
          </header>
          <div class="task-list" style="margin-top:10px">
            ${priorityTasks
              .map(
                (task) => `<div class="task-row ${task.status === "done" ? "is-done" : ""}">
                  <button class="check ${task.status === "done" ? "is-checked" : ""}" data-action="toggle-task" data-id="${task.id}" aria-label="标记完成">
                    ${icon("check", 12)}
                  </button>
                  <div>
                    <div class="task-row__title">${task.title} ${categoryBadge(task.category)}</div>
                    <div class="task-row__desc">${task.note}</div>
                  </div>
                  <div class="task-row__meta">
                    <span class="due due--${dueTone(task.due)}">${icon("clock", 12)} ${dueLabel(task.due)}</span>
                    <span class="owner">${task.owner}</span>
                  </div>
                  <button class="icon-btn tooltip" data-action="task-detail" data-id="${task.id}" data-tip="查看详情" style="width:28px;height:28px;border:0;background:transparent">${icon("chevronRight", 15)}</button>
                </div>`
              )
              .join("")}
          </div>
        </section>

        <section class="card span-5">
          <header class="card__head">
            <div>
              <h3>政策匹配</h3>
              <p>按你的行业、区域与主体自动匹配</p>
            </div>
            <a class="card__link" href="#/policies" data-nav>全部 ${icon("chevronRight", 13)}</a>
          </header>
          <div class="card__body" style="padding-top:12px">
            <div class="policy-mini">
              ${policies
                .map(
                  (policy) => `<div class="policy-mini__item">
                    <span class="policy-mini__icon">${icon("star", 15)}</span>
                    <div class="policy-mini__main">
                      <strong>${policy.title}</strong>
                      <span>${policy.amount} · ${policy.deadline === "常年受理" ? "常年受理" : `${shortDate(policy.deadline)} 截止`}</span>
                    </div>
                    <span class="match">${policy.match}%</span>
                  </div>`
                )
                .join("")}
            </div>
            <button class="btn btn--block" style="margin-top:14px" data-nav="#/policies">${icon("target", 14)} 查看 6 项可申报政策</button>
          </div>
        </section>

        <section class="card span-8">
          <header class="card__head">
            <div>
              <h3>最近交易</h3>
              <p>网商银行 + 支付宝 · 自动同步</p>
            </div>
            <a class="card__link" href="#/finance" data-nav>资金台账 ${icon("chevronRight", 13)}</a>
          </header>
          <div class="card__body" style="padding-top:8px">
            ${recentTx
              .map(
                (tx) => `<div class="tx-mini">
                  <span class="tx-mini__icon ${tx.type}">${icon(tx.type === "income" ? "arrowDownLeft" : "arrowUpRight", 15)}</span>
                  <div class="tx-mini__main">
                    <strong>${tx.title}</strong>
                    <span>${shortDate(tx.date)} · ${tx.account} · ${tx.category}</span>
                  </div>
                  <span class="amount ${tx.type}">${tx.type === "income" ? "+" : "-"}${money(tx.amount)}</span>
                </div>`
              )
              .join("")}
          </div>
        </section>

        <section class="card span-4">
          <header class="card__head">
            <div>
              <h3>应收与回款</h3>
              <p>4 个客户 · 最早 11-18 到期</p>
            </div>
          </header>
          <div class="card__body">
            <div class="receivable-block">
              <div class="receivable-block__value"><strong>${money(receivable)}</strong><span>待回款</span></div>
              <div class="progress"><div class="progress__bar" style="width:${pct(receivable, 120000)}%"></div></div>
            </div>
            <div class="receivable-list">
              ${topClients
                .map(
                  (client) => `<div class="receivable-item">
                    <span class="avatar avatar--sm" style="--avatar-color:${client.color}">${client.name.slice(0, 2)}</span>
                    <div class="receivable-item__main">
                      <strong>${client.name}</strong>
                      <span>${client.nextAction}</span>
                    </div>
                    <span class="receivable-item__amount">${money(client.amount - client.received)}</span>
                  </div>`
                )
                .join("")}
            </div>
            <a class="btn btn--block" style="margin-top:14px" href="#/clients" data-nav>${icon("users", 14)} 打开客户看板</a>
          </div>
        </section>
      </div>
    `;
  },
};
