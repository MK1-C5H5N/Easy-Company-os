import { icon } from "../icons.js";
import { daysUntil, dueSoonTasks, healthScore, overdueTasks, pendingTasks } from "../selectors.js";
import { categoryBadge, dueLabel, dueTone, money, ring } from "../ui.js";

const ui = { filter: "all", query: "" };

function matches(task) {
  if (ui.filter === "todo" && task.status === "done") return false;
  if (ui.filter === "done" && task.status !== "done") return false;
  if (ui.filter === "overdue" && !(task.status !== "done" && daysUntil(task.due) < 0)) return false;
  if (ui.query) {
    const haystack = `${task.title} ${task.category} ${task.owner} ${task.note}`.toLowerCase();
    if (!haystack.includes(ui.query.toLowerCase())) return false;
  }
  return true;
}

function taskRow(task) {
  const done = task.status === "done";
  return `<div class="task-row ${done ? "is-done" : ""}" data-status="${done ? "done" : "todo"}">
    <button class="check ${done ? "is-checked" : ""}" data-action="toggle-task" data-id="${task.id}" aria-label="${done ? "恢复待办" : "标记完成"}">
      ${icon("check", 12)}
    </button>
    <div>
      <div class="task-row__title">
        ${task.title}
        ${categoryBadge(task.category)}
        ${task.priority === "high" && !done ? '<span class="badge badge--red">高优先级</span>' : ""}
      </div>
      <div class="task-row__desc">${task.note}</div>
    </div>
    <div class="task-row__meta">
      ${
        done
          ? `<span class="due due--neutral">${icon("check", 12)} 已归档</span>`
          : `<span class="due due--${dueTone(task.due)}">${icon("clock", 12)} ${dueLabel(task.due)}</span>`
      }
      <span class="owner">${task.owner}</span>
    </div>
    <button class="icon-btn" data-action="task-detail" data-id="${task.id}" aria-label="查看详情" style="width:28px;height:28px;border:0;background:transparent">${icon("chevronRight", 15)}</button>
  </div>`;
}

function calendarStrip(state) {
  const base = new Date("2026-11-05T00:00:00+08:00");
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index - 2);
    return date;
  });
  const iso = (date) => date.toISOString().slice(0, 10);
  const taskDates = new Set(state.tasks.filter((task) => task.status !== "done").map((task) => task.due));
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  return `<div class="calendar-strip">
    ${days
      .map((date) => {
        const key = iso(date);
        const classes = ["calendar-day"];
        if (taskDates.has(key)) classes.push("has-task");
        if (key === "2026-11-05") classes.push("is-today");
        return `<div class="${classes.join(" ")}">${week[date.getDay()]}<strong>${date.getDate()}</strong></div>`;
      })
      .join("")}
  </div>`;
}

export const compliancePage = {
  title: "合规日历",
  eyebrow: "COMPLIANCE / 合规与财税",
  subtitle: "把申报、年报、许可、补贴截止日放在一条时间轴上；完成一项，健康分实时更新。",

  render(state) {
    const pending = pendingTasks(state);
    const overdue = overdueTasks(state);
    const soon = dueSoonTasks(state, 7);
    const done = state.tasks.filter((task) => task.status === "done");
    const health = healthScore(state);
    const filtered = state.tasks
      .filter(matches)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "done" ? 1 : -1;
        return new Date(a.due) - new Date(b.due);
      });

    const filters = [
      ["all", "全部", state.tasks.length],
      ["todo", "待办", pending.length],
      ["overdue", "已逾期", overdue.length],
      ["done", "已完成", done.length],
    ];

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="export-calendar">${icon("download", 15)} 导出日历</button>
          <button class="btn btn--primary" data-action="open-task-modal">${icon("plus", 15)} 新增事项</button>
        </div>
      </div>

      <div class="summary-strip">
        <div class="summary-item">
          <span class="summary-item__icon tone-teal">${icon("calendar", 17)}</span>
          <div><strong>${pending.length}</strong><span>待办事项</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon tone-red">${icon("alert", 17)}</span>
          <div><strong>${overdue.length}</strong><span>已逾期 · 需立即处理</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon tone-amber">${icon("clock", 17)}</span>
          <div><strong>${soon.length}</strong><span>7 天内到期</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-item__icon">${icon("check", 17)}</span>
          <div><strong>${done.length}</strong><span>本月已完成</span></div>
        </div>
      </div>

      <div class="compliance-grid">
        <section class="card">
          <div class="toolbar">
            <div class="tabs" role="tablist">
              ${filters
                .map(
                  ([key, label, count]) => `<button class="tab ${ui.filter === key ? "is-active" : ""}" data-filter="${key}" role="tab" aria-selected="${ui.filter === key}">
                    ${label}<span class="tab__count">${count}</span>
                  </button>`
                )
                .join("")}
            </div>
            <div class="toolbar__search">
              ${icon("search", 14)}
              <input class="input" type="search" placeholder="搜索事项、负责人" value="${ui.query}" data-task-search aria-label="搜索合规事项"/>
            </div>
          </div>
          <div class="task-list">
            ${
              filtered.length
                ? filtered.map(taskRow).join("")
                : `<div class="empty"><div class="empty__mark">○</div><h3>没有匹配的事项</h3><p>试试切换筛选条件，或新增一项合规事项。</p></div>`
            }
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:13px 20px;border-top:1px solid var(--line);color:var(--muted-2);font-size:10px">
            <span>共 ${filtered.length} 项 · 已完成会自动归档</span>
            <button class="btn btn--ghost btn--sm" data-action="open-task-modal">${icon("plus", 13)} 新增</button>
          </div>
        </section>

        <aside class="compliance-side">
          <section class="card health-card">
            ${ring(health, { size: 112, stroke: 9 })}
            <h3>合规健康分</h3>
            <p>${health >= 85 ? "状态良好，保持当前的申报节奏。" : "存在风险项，建议优先处理逾期事项。"}</p>
            <div class="health-card__stats">
              <div><strong>${state.tasks.length}</strong><span>年度事项</span></div>
              <div><strong>${Math.round((done.length / state.tasks.length) * 100)}%</strong><span>完成率</span></div>
            </div>
          </section>

          <section class="card" style="padding:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <h3 style="font-size:12px;font-weight:700">本周日历</h3>
              <span style="color:var(--muted-2);font-size:9.5px">11 月 3–9 日</span>
            </div>
            ${calendarStrip(state)}
            <p style="color:var(--muted);font-size:10px;line-height:1.6">绿色日期表示有待办事项；今天已用深色标记。点击“新增事项”可把政策申报、合同节点也加进来。</p>
          </section>

          <section class="card" style="padding:16px">
            <h3 style="font-size:12px;font-weight:700">AI 风险提示</h3>
            <p style="margin-top:3px;color:var(--muted);font-size:10px">基于你的主体、行业与开票情况</p>
            <div class="risk-list" style="margin-top:10px">
              <div class="risk-item">
                <span class="risk-item__icon">${icon("alert", 14)}</span>
                <div><strong>地址异常风险</strong><p>注册地址 11 月底到期，逾期未续费可能被列入经营异常名录。</p></div>
              </div>
              <div class="risk-item">
                <span class="risk-item__icon">${icon("alert", 14)}</span>
                <div><strong>公私账户混用</strong><p>近 30 天有 2 笔个人账户收款，建议尽快归集到对公账户并留存凭证。</p></div>
              </div>
              <div class="risk-item">
                <span class="risk-item__icon">${icon("file", 14)}</span>
                <div><strong>年度审计缺失</strong><p>一人公司需证明财产独立；建议 12 月前完成年度审计或专项审计。</p></div>
              </div>
            </div>
          </section>

          <section class="card" style="padding:14px 16px;display:flex;align-items:center;gap:10px">
            <span class="summary-item__icon tone-teal">${icon("bank", 16)}</span>
            <div style="flex:1">
              <div style="font-size:10.5px;font-weight:650">自动提醒已开启</div>
              <div style="color:var(--muted-2);font-size:9.5px">提前 7 天 · 短信 + 企微</div>
            </div>
            <button class="btn btn--sm" data-nav="#/profile">设置</button>
          </section>
        </aside>
      </div>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.filter = button.dataset.filter;
        ctx.rerender();
      });
    });
    const search = root.querySelector("[data-task-search]");
    if (search) {
      let timer = null;
      search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          ui.query = search.value.trim();
          ctx.rerender();
          const next = document.querySelector("[data-task-search]");
          next?.focus();
          next?.setSelectionRange(next.value.length, next.value.length);
        }, 180);
      });
    }
  },
};
