import { icon } from "./icons.js";
import { store } from "./store.js";
import { healthScore, overdueTasks, pendingTasks } from "./selectors.js";
import { closeModal, esc, isModalOpen, money, openModal, toast } from "./ui.js";
import { dashboardPage } from "./pages/dashboard.js";
import { compliancePage } from "./pages/compliance.js";
import { financePage } from "./pages/finance.js";
import { clientsPage } from "./pages/clients.js";
import { profilePage } from "./pages/profile.js";
import { policiesPage } from "./pages/policies.js";
import { assistantPage, resetChat, sendMessage } from "./pages/assistant.js";

const routes = {
  dashboard: dashboardPage,
  compliance: compliancePage,
  finance: financePage,
  clients: clientsPage,
  profile: profilePage,
  policies: policiesPage,
  assistant: assistantPage,
};

let currentRoute = "dashboard";

const app = document.getElementById("app");
const ctx = {
  store,
  toast,
  rerender: () => renderPage(true),
  navigate,
};

function routeFromHash() {
  const key = location.hash.replace(/^#\/?/, "").split("?")[0];
  return routes[key] ? key : "dashboard";
}

function updateChrome() {
  const state = store.state;
  const pending = pendingTasks(state).length;
  const health = healthScore(state);

  const badge = document.querySelector("[data-nav-badge]");
  if (badge) {
    badge.textContent = String(pending);
    badge.style.display = pending ? "" : "none";
  }
  const healthText = document.querySelector("[data-health]");
  if (healthText) healthText.textContent = String(health);
  const healthRing = document.querySelector("[data-health-ring]");
  if (healthRing) healthRing.style.setProperty("--score", `${health}%`);
  const healthNote = document.querySelector("[data-health-note]");
  if (healthNote) {
    const overdue = overdueTasks(state).length;
    healthNote.textContent = overdue ? `${overdue} 项逾期 · 建议今天处理` : "无逾期 · 保持当前节奏";
  }
  const company = document.querySelector("[data-company-short]");
  if (company) company.textContent = state.company.shortName;
  const founder = document.querySelector("[data-founder]");
  if (founder) founder.textContent = state.company.founder;

  document.querySelectorAll(".nav__item").forEach((item) => {
    const target = item.getAttribute("href")?.replace("#/", "");
    item.classList.toggle("is-active", target === currentRoute);
  });
}

function renderPage(preserveScroll = false) {
  const y = window.scrollY;
  const page = routes[currentRoute];
  app.innerHTML = page.render(store.state);
  page.bind?.(app, ctx);
  document.getElementById("page-title").textContent = page.title;
  updateChrome();
  if (preserveScroll) {
    requestAnimationFrame(() => window.scrollTo(0, y));
  } else {
    window.scrollTo(0, 0);
  }
}

function navigate(path) {
  const next = path.replace(/^#\/?/, "");
  if (next === currentRoute) {
    renderPage(false);
    return;
  }
  location.hash = `#/${next}`;
}

function closePalette() {
  const root = document.getElementById("palette-root");
  if (root) root.innerHTML = "";
}

function openPalette() {
  const root = document.getElementById("palette-root");
  const routeItems = [
    { type: "route", label: "驾驶舱", hint: "总览", route: "dashboard", iconName: "dashboard" },
    { type: "route", label: "合规日历", hint: "待办与截止日", route: "compliance", iconName: "calendar" },
    { type: "route", label: "资金台账", hint: "账户与流水", route: "finance", iconName: "wallet" },
    { type: "route", label: "客户与合同", hint: "销售漏斗", route: "clients", iconName: "users" },
    { type: "route", label: "公司档案", hint: "主体与资料", route: "profile", iconName: "building" },
    { type: "route", label: "政策与补贴", hint: "匹配与申报", route: "policies", iconName: "star" },
    { type: "route", label: "AI 老板助手", hint: "对话与建议", route: "assistant", iconName: "sparkles" },
    { type: "action", label: "新增合规事项", hint: "操作", action: "open-task-modal", iconName: "plus" },
    { type: "action", label: "生成经营简报", hint: "操作", action: "generate-brief", iconName: "file" },
    { type: "action", label: "导出合规日历", hint: "下载 .ics", action: "export-calendar", iconName: "download" },
    { type: "action", label: "重置演示数据", hint: "恢复初始状态", action: "reset-demo", iconName: "refresh" },
  ];

  root.innerHTML = `<div class="modal-overlay palette-overlay" data-palette-overlay>
    <div class="palette" role="dialog" aria-modal="true" aria-label="快捷跳转">
      <div class="palette__search">
        ${icon("search", 17)}
        <input id="palette-input" placeholder="搜索页面或操作…" autocomplete="off" aria-label="搜索"/>
        <kbd>ESC</kbd>
      </div>
      <div class="palette__list" id="palette-list"></div>
    </div>
  </div>`;

  const input = root.querySelector("#palette-input");
  const list = root.querySelector("#palette-list");
  let filtered = routeItems;
  let selected = 0;

  const paint = () => {
    list.innerHTML = filtered.length
      ? filtered
          .map(
            (item, index) => `<button type="button" class="palette__item ${index === selected ? "is-selected" : ""}" data-palette-index="${index}">
              ${icon(item.iconName, 16)}
              <span>${esc(item.label)}</span>
              <small>${esc(item.hint)}</small>
            </button>`
          )
          .join("")
      : `<div class="palette__empty">没有找到匹配项</div>`;
  };

  const choose = (item) => {
    closePalette();
    if (item.type === "route") navigate(item.route);
    else handleAction(item.action, null);
  };

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    filtered = routeItems.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query));
    selected = 0;
    paint();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(selected + 1, filtered.length - 1);
      paint();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(selected - 1, 0);
      paint();
    } else if (event.key === "Enter" && filtered[selected]) {
      event.preventDefault();
      choose(filtered[selected]);
    }
  });

  list.addEventListener("click", (event) => {
    const target = event.target.closest("[data-palette-index]");
    if (!target) return;
    choose(filtered[Number(target.dataset.paletteIndex)]);
  });

  root.querySelector("[data-palette-overlay]").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closePalette();
  });

  paint();
  input.focus();
}

function download(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function taskFormBody() {
  return `<div class="form-grid">
    <div class="field field--full"><label for="task-title">事项名称</label><input class="input" id="task-title" name="title" required placeholder="例如：四季度增值税申报"/></div>
    <div class="field"><label for="task-category">分类</label><select class="select" id="task-category" name="category">${["税务", "工商", "社保", "知识产权", "补贴", "银行"].map((item) => `<option>${item}</option>`).join("")}</select></div>
    <div class="field"><label for="task-due">截止日期</label><input class="input" id="task-due" name="due" type="date" required value="2026-11-20"/></div>
    <div class="field"><label for="task-owner">负责人</label><select class="select" id="task-owner" name="owner">${["创始人", "AI 助手", "代账 · 小周", "园区管家"].map((item) => `<option>${item}</option>`).join("")}</select></div>
    <div class="field"><label for="task-priority">优先级</label><select class="select" id="task-priority" name="priority"><option value="high">高</option><option value="medium" selected>中</option><option value="low">低</option></select></div>
    <div class="field field--full"><label for="task-note">备注</label><textarea class="textarea" id="task-note" name="note" placeholder="补充材料、对接人、注意事项…"></textarea></div>
  </div>`;
}

function openTaskModal() {
  openModal({
    title: "新增合规事项",
    description: "添加后会立即进入合规日历，并参与健康分计算。",
    body: taskFormBody(),
    submitText: "添加事项",
    onSubmit(data) {
      store.set((state) => {
        state.tasks.push({
          id: `task-${Date.now()}`,
          title: data.title.trim(),
          category: data.category,
          due: data.due,
          owner: data.owner,
          priority: data.priority,
          status: "todo",
          note: data.note.trim() || "手动添加的事项。",
        });
      });
      toast("已加入合规日历");
    },
  });
}

function taskDetail(id) {
  const task = store.state.tasks.find((item) => item.id === id);
  if (!task) return;
  const done = task.status === "done";
  openModal({
    title: task.title,
    description: `${task.category} · ${task.owner}`,
    body: `<dl class="info-list">
      <div class="info-item"><dt>截止日期</dt><dd>${task.due}</dd></div>
      <div class="info-item"><dt>状态</dt><dd>${done ? "已完成" : "待办"}</dd></div>
      <div class="info-item"><dt>优先级</dt><dd>${task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}</dd></div>
      <div class="info-item"><dt>负责人</dt><dd>${task.owner}</dd></div>
      <div class="info-item" style="grid-column:1/-1"><dt>备注</dt><dd>${esc(task.note)}</dd></div>
    </dl>`,
    submitText: done ? "恢复为待办" : "标记完成",
    onSubmit() {
      store.set((state) => {
        const target = state.tasks.find((item) => item.id === id);
        if (target) target.status = done ? "todo" : "done";
      });
      toast(done ? "已恢复为待办" : "已完成，健康分已更新");
    },
  });
}

function renderBrief() {
  const state = store.state;
  const pending = pendingTasks(state);
  const overdue = pending.filter((task) => new Date(`${task.due}T00:00:00+08:00`) < new Date("2026-11-05T00:00:00+08:00"));
  const top = [...pending].sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 3);
  openModal({
    title: "11 月经营简报",
    description: "由 AI 基于公司档案、流水与合规日历生成 · 演示版",
    body: `<div style="display:grid;gap:12px">
      <div style="padding:14px;border-radius:12px;background:var(--teal-soft);color:var(--teal-ink)">
        <strong style="font-size:13px">一句话结论</strong>
        <p style="margin-top:4px;font-size:12px;line-height:1.7">现金流健康，但合规有 1 项逾期；先处理地址续费与增值税，再推进蓝岸尾款，本月不需要新增固定支出。</p>
      </div>
      <div class="info-list">
        <div class="info-item"><dt>可支配现金</dt><dd>${money(state.accounts.reduce((sum, item) => sum + item.balance, 0))}</dd></div>
        <div class="info-item"><dt>90 天应收</dt><dd>${money(state.clients.reduce((sum, item) => sum + item.amount - item.received, 0))}</dd></div>
        <div class="info-item"><dt>待办 / 逾期</dt><dd>${pending.length} / ${overdue.length}</dd></div>
        <div class="info-item"><dt>合规健康分</dt><dd>${healthScore(state)} / 100</dd></div>
      </div>
      <div>
        <strong style="font-size:12px">本周三件事</strong>
        <ol style="margin-top:6px;padding-left:18px;color:var(--ink-2);font-size:12px;line-height:1.8">
          ${top.map((task) => `<li>${task.title} · ${task.due}</li>`).join("")}
        </ol>
      </div>
      <p style="color:var(--muted);font-size:10.5px">如需完整版，可导出 PDF 或发送到你的邮箱。</p>
    </div>`,
    submitText: "知道了",
    onSubmit() {},
  });
}

function exportCalendar() {
  const state = store.state;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OPC OS//Demo//CN",
    "CALSCALE:GREGORIAN",
  ];
  state.tasks.forEach((task) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@opc-os.local`,
      "DTSTAMP:20261105T000000Z",
      `DTSTART;VALUE=DATE:${task.due.replaceAll("-", "")}`,
      `SUMMARY:${task.title}`,
      `DESCRIPTION:${task.note.replace(/\n/g, " ")}`,
      "BEGIN:VALARM",
      "TRIGGER:-P7D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${task.title}`,
      "END:VALARM",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  download("opc-compliance-calendar.ics", lines.join("\r\n"), "text/calendar;charset=utf-8");
  toast("合规日历已导出（.ics）");
}

function exportFinance() {
  const rows = [["日期", "类型", "交易", "分类", "金额", "账户", "状态", "发票"]];
  store.state.transactions.forEach((tx) => {
    rows.push([tx.date, tx.type === "income" ? "收入" : "支出", tx.title, tx.category, tx.amount, tx.account, tx.status, tx.invoice]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  download("opc-finance.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
  toast("流水已导出（CSV）");
}

function exportClients() {
  const rows = [["客户", "项目", "阶段", "合同金额", "已回款", "下一步", "截止"]];
  store.state.clients.forEach((client) => {
    rows.push([client.name, client.project, client.stage, client.amount, client.received, client.nextAction, client.due]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  download("opc-clients.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
  toast("客户与合同已导出（CSV）");
}

function openEditCompany() {
  const company = store.state.company;
  openModal({
    title: "编辑公司档案",
    description: "修改后会同步到合规、政策匹配与 AI 上下文。",
    body: `<div class="form-grid">
      <div class="field field--full"><label>公司名称</label><input class="input" name="name" required value="${esc(company.name)}"/></div>
      <div class="field"><label>创始人</label><input class="input" name="founder" required value="${esc(company.founder)}"/></div>
      <div class="field"><label>纳税人类型</label><select class="select" name="taxType"><option ${company.taxType === "小规模纳税人" ? "selected" : ""}>小规模纳税人</option><option ${company.taxType === "一般纳税人" ? "selected" : ""}>一般纳税人</option></select></div>
      <div class="field"><label>所属行业</label><input class="input" name="industry" value="${esc(company.industry)}"/></div>
      <div class="field"><label>成立日期</label><input class="input" type="date" name="established" value="${company.established}"/></div>
      <div class="field field--full"><label>注册地址</label><input class="input" name="address" value="${esc(company.address)}"/></div>
      <div class="field"><label>开户银行</label><input class="input" name="bankName" value="${esc(company.bank.name)}"/></div>
      <div class="field"><label>银行账号</label><input class="input" name="bankAccount" value="${esc(company.bank.account)}"/></div>
    </div>`,
    submitText: "保存档案",
    onSubmit(data) {
      store.set((state) => {
        state.company.name = data.name.trim();
        state.company.founder = data.founder.trim();
        state.company.taxType = data.taxType;
        state.company.industry = data.industry.trim();
        state.company.established = data.established;
        state.company.address = data.address.trim();
        state.company.bank.name = data.bankName.trim();
        state.company.bank.account = data.bankAccount.trim();
      });
      toast("公司档案已更新");
    },
  });
}

function openAddTransaction() {
  openModal({
    title: "记一笔",
    description: "演示版会同步更新对应账户余额。",
    body: `<div class="form-grid">
      <div class="field"><label>类型</label><select class="select" name="type"><option value="income">收入</option><option value="expense">支出</option></select></div>
      <div class="field"><label>金额</label><input class="input" name="amount" type="number" min="1" step="1" required placeholder="0"/></div>
      <div class="field field--full"><label>交易名称</label><input class="input" name="title" required placeholder="例如：客户首款"/></div>
      <div class="field"><label>日期</label><input class="input" type="date" name="date" value="2026-11-05" required/></div>
      <div class="field"><label>分类</label><select class="select" name="category">${["项目收入", "订阅收入", "内容收入", "算力与云", "财税服务", "场地与地址", "外包与协作", "差旅", "社保"].map((item) => `<option>${item}</option>`).join("")}</select></div>
      <div class="field"><label>账户</label><select class="select" name="account"><option>网商银行</option><option>支付宝</option></select></div>
    </div>`,
    submitText: "保存流水",
    onSubmit(data) {
      const amount = Number(data.amount);
      store.set((state) => {
        state.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: data.date,
          type: data.type,
          title: data.title.trim(),
          category: data.category,
          amount,
          account: data.account,
          status: data.type === "income" ? "已到账" : "已支付",
          invoice: "待取票",
        });
        const account = state.accounts.find((item) => item.name === data.account);
        if (account) account.balance += data.type === "income" ? amount : -amount;
      });
      toast("流水已保存，账户余额已更新");
    },
  });
}

function openAddClient() {
  openModal({
    title: "新增客户",
    description: "先记录线索，后续可补充合同与回款计划。",
    body: `<div class="form-grid">
      <div class="field field--full"><label>客户名称</label><input class="input" name="name" required placeholder="例如：杭州××科技"/></div>
      <div class="field"><label>项目</label><input class="input" name="project" required placeholder="例如：品牌官网"/></div>
      <div class="field"><label>合同金额</label><input class="input" name="amount" type="number" min="0" step="100" required placeholder="0"/></div>
      <div class="field"><label>阶段</label><select class="select" name="stage"><option>线索</option><option>已报价</option><option>已签约</option><option>交付中</option><option>续费中</option></select></div>
      <div class="field"><label>联系人</label><input class="input" name="contact" placeholder="姓名 / 称呼"/></div>
      <div class="field field--full"><label>下一步</label><input class="input" name="nextAction" placeholder="例如：11-10 发送报价"/></div>
      <div class="field"><label>截止日期</label><input class="input" type="date" name="due" value="2026-12-01"/></div>
    </div>`,
    submitText: "添加客户",
    onSubmit(data) {
      store.set((state) => {
        state.clients.push({
          id: `client-${Date.now()}`,
          name: data.name.trim(),
          contact: data.contact.trim() || "待补充",
          project: data.project.trim(),
          amount: Number(data.amount),
          received: 0,
          stage: data.stage,
          nextAction: data.nextAction.trim() || "补充下一步动作",
          due: data.due,
          color: "#0E7C6B",
        });
      });
      toast("客户已添加");
    },
  });
}

function policyDetail(id) {
  const policy = store.state.policies.find((item) => item.id === id);
  if (!policy) return;
  openModal({
    title: policy.title,
    description: `${policy.issuer} · ${policy.city}`,
    body: `<div style="display:grid;gap:12px">
      <p style="font-size:12px;line-height:1.7;color:var(--ink-2)">${policy.desc}</p>
      <dl class="info-list">
        <div class="info-item"><dt>支持额度</dt><dd>${policy.amount}</dd></div>
        <div class="info-item"><dt>截止日期</dt><dd>${policy.deadline}</dd></div>
        <div class="info-item"><dt>匹配度</dt><dd>${policy.match}%</dd></div>
        <div class="info-item"><dt>适用区域</dt><dd>${policy.city}</dd></div>
      </dl>
      <div>
        <strong style="font-size:12px">建议材料</strong>
        <ul style="margin-top:5px;padding-left:18px;color:var(--muted);font-size:11px;line-height:1.8">
          <li>营业执照与法人身份证</li><li>上一年度财务报表 / 纳税证明</li><li>项目合同、发票与银行流水</li><li>知识产权或算力使用凭证</li>
        </ul>
      </div>
    </div>`,
    submitText: "加入合规日历",
    onSubmit() {
      addPolicy(id);
    },
  });
}

function addPolicy(id) {
  const policy = store.state.policies.find((item) => item.id === id);
  if (!policy) return;
  const exists = store.state.tasks.some((task) => task.title.includes(policy.title));
  if (exists) {
    toast("该政策已在合规日历中");
    return;
  }
  store.set((state) => {
    state.tasks.push({
      id: `task-policy-${Date.now()}`,
      title: `政策申报：${policy.title}`,
      category: "补贴",
      due: policy.deadline === "常年受理" ? "2026-12-31" : policy.deadline,
      owner: "AI 助手",
      priority: "medium",
      status: "todo",
      note: `${policy.issuer} · ${policy.amount}；材料清单已生成 80%。`,
    });
  });
  toast("已加入合规日历，截止日前 7 天提醒");
}

function openPolicyBrief() {
  const top = [...store.state.policies].sort((a, b) => b.match - a.match).slice(0, 4);
  openModal({
    title: "政策申报清单",
    description: "按匹配度排序，可逐项加入合规日历。",
    wide: true,
    body: `<div style="display:grid;gap:9px">
      ${top
        .map(
          (policy) => `<div style="display:flex;align-items:center;gap:10px;padding:11px;border:1px solid var(--line);border-radius:10px">
            <span class="summary-item__icon tone-teal">${icon("star", 15)}</span>
            <div style="flex:1"><strong style="display:block;font-size:11.5px">${policy.title}</strong><span style="color:var(--muted-2);font-size:9.5px">${policy.amount} · ${policy.deadline} 截止</span></div>
            <span class="match">${policy.match}%</span>
          </div>`
        )
        .join("")}
      <p style="color:var(--muted);font-size:10.5px;margin-top:4px">建议优先准备：营业执照、纳税证明、项目合同、算力使用凭证、知识产权证书。</p>
    </div>`,
    submitText: "全部加入日历",
    onSubmit() {
      top.forEach((policy) => addPolicy(policy.id));
      toast("已批量加入合规日历");
    },
  });
}

function clientDetail(id) {
  const client = store.state.clients.find((item) => item.id === id);
  if (!client) return;
  const progress = Math.round((client.received / client.amount) * 100);
  openModal({
    title: client.name,
    description: `${client.project} · ${client.contact}`,
    body: `<div style="display:grid;gap:12px">
      <dl class="info-list">
        <div class="info-item"><dt>合同金额</dt><dd>${money(client.amount)}</dd></div>
        <div class="info-item"><dt>已回款</dt><dd>${money(client.received)}（${progress}%）</dd></div>
        <div class="info-item"><dt>当前阶段</dt><dd>${client.stage}</dd></div>
        <div class="info-item"><dt>截止日期</dt><dd>${client.due}</dd></div>
        <div class="info-item" style="grid-column:1/-1"><dt>下一步</dt><dd>${client.nextAction}</dd></div>
      </dl>
      <div class="progress"><div class="progress__bar" style="width:${progress}%"></div></div>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn btn--sm" data-action="remind-client" data-id="${client.id}">${icon("message", 13)} 生成催款消息</button>
        <button type="button" class="btn btn--sm" data-action="add-client-task" data-id="${client.id}">${icon("calendar", 13)} 加入待办</button>
      </div>
    </div>`,
    submitText: "关闭",
    onSubmit() {},
  });
}

function handleAction(action, element) {
  switch (action) {
    case "toggle-sidebar":
      document.body.classList.toggle("is-menu-open");
      break;
    case "company-switcher":
      toast("演示版仅有一个工作区；多主体切换将在下一版开放。");
      break;
    case "notifications":
      openModal({
        title: "通知",
        description: "来自合规、资金与客户的三条提醒",
        body: `<div style="display:grid;gap:9px">
          <div class="risk-item"><span class="risk-item__icon">${icon("alert", 14)}</span><div><strong>注册地址即将到期</strong><p>园区提示 11 月底到期，已逾期 2 天未确认续费。</p></div></div>
          <div class="risk-item"><span class="risk-item__icon">${icon("clock", 14)}</span><div><strong>增值税申报还有 4 天</strong><p>代账小周已收到票据，等待你确认银行流水。</p></div></div>
          <div class="risk-item"><span class="risk-item__icon">${icon("wallet", 14)}</span><div><strong>蓝岸尾款已过合同节点</strong><p>¥19,200 待回款，建议今天发送催款邮件。</p></div></div>
        </div>`,
        submitText: "全部标为已读",
        onSubmit() {
          toast("通知已全部标为已读");
        },
      });
      break;
    case "open-palette":
      openPalette();
      break;
    case "toggle-task": {
      const id = element?.dataset.id;
      store.set((state) => {
        const task = state.tasks.find((item) => item.id === id);
        if (task) task.status = task.status === "done" ? "todo" : "done";
      });
      toast("事项状态已更新，健康分已重新计算");
      break;
    }
    case "task-detail":
      taskDetail(element?.dataset.id);
      break;
    case "open-task-modal":
      openTaskModal();
      break;
    case "generate-brief":
      renderBrief();
      break;
    case "export-calendar":
      exportCalendar();
      break;
    case "export-finance":
      exportFinance();
      break;
    case "export-clients":
      exportClients();
      break;
    case "sync-accounts":
      toast("已同步 2 个账户，新增 3 笔流水（演示）");
      break;
    case "add-transaction":
      openAddTransaction();
      break;
    case "add-client":
      openAddClient();
      break;
    case "client-detail":
      clientDetail(element?.dataset.id);
      break;
    case "remind-client": {
      const client = store.state.clients.find((item) => item.id === element.dataset.id);
      toast(client ? `已生成给 ${client.name} 的催款消息草稿` : "已生成催款消息");
      break;
    }
    case "add-client-task": {
      const client = store.state.clients.find((item) => item.id === element.dataset.id);
      if (!client) break;
      store.set((state) => {
        state.tasks.push({
          id: `task-client-${Date.now()}`,
          title: `${client.name}：${client.nextAction}`,
          category: "银行",
          due: client.due,
          owner: "创始人",
          priority: "medium",
          status: "todo",
          note: `来自客户 ${client.name} 的合同节点。`,
        });
      });
      toast("已加入合规日历");
      break;
    }
    case "request-invoice": {
      const id = element?.dataset.id;
      store.set((state) => {
        const tx = state.transactions.find((item) => item.id === id);
        if (tx) tx.invoice = "已催票";
      });
      toast("已生成催票消息");
      break;
    }
    case "policy-detail":
      policyDetail(element?.dataset.id);
      break;
    case "add-policy":
      addPolicy(element?.dataset.id);
      break;
    case "policy-brief":
      openPolicyBrief();
      break;
    case "refresh-policies":
      toast("已重新匹配 6 项政策，新增 1 项高匹配结果");
      break;
    case "edit-company":
      openEditCompany();
      break;
    case "download-archive": {
      const state = store.state;
      const payload = {
        company: state.company,
        documents: state.documents,
        tasks: state.tasks,
        exportedAt: new Date().toISOString(),
      };
      download("opc-company-archive.json", JSON.stringify(payload, null, 2), "application/json");
      toast("公司档案包已下载");
      break;
    }
    case "upload-doc": {
      const doc = store.state.documents.find((item) => !item.done);
      if (!doc) {
        toast("所有资料都已归档");
        break;
      }
      store.set((state) => {
        const target = state.documents.find((item) => item.id === doc.id);
        if (target) {
          target.done = true;
          target.updated = "2026-11-05";
        }
      });
      toast(`已归档：${doc.name}`);
      break;
    }
    case "add-audit-task": {
      const exists = store.state.tasks.some((task) => task.title.includes("年度审计"));
      if (exists) {
        toast("年度审计已在待办中");
        break;
      }
      store.set((state) => {
        state.tasks.push({
          id: `task-audit-${Date.now()}`,
          title: "年度审计 / 财产独立性专项审计",
          category: "工商",
          due: "2026-12-20",
          owner: "创始人",
          priority: "high",
          status: "todo",
          note: "一人公司需证明财产独立，建议 12 月前完成。",
        });
      });
      toast("已加入待办");
      break;
    }
    case "add-missing-docs":
      store.set((state) => {
        state.documents.forEach((doc) => {
          if (!doc.done) {
            doc.done = true;
            doc.updated = "2026-11-05";
          }
        });
      });
      toast("AI 已生成 2 份资料模板，档案完整度 100%");
      break;
    case "clear-chat":
      resetChat(ctx);
      toast("对话已清空");
      break;
    case "ask-ai": {
      const prompt = element?.dataset.prompt || "总结今天的经营重点";
      if (currentRoute !== "assistant") {
        location.hash = "#/assistant";
        setTimeout(() => sendMessage(prompt, ctx), 120);
      } else {
        sendMessage(prompt, ctx);
      }
      break;
    }
    case "reset-demo":
      openModal({
        title: "重置演示数据",
        description: "会清除本地的所有修改，恢复到初始演示状态。",
        body: `<p style="font-size:12px;color:var(--muted);line-height:1.7">包括已完成的待办、新增的客户、对话记录与设置。此操作不可撤销。</p>`,
        submitText: "确认重置",
        onSubmit() {
          store.reset();
          navigate("dashboard");
          toast("演示数据已重置");
        },
      });
      break;
    default:
      break;
  }
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    const target = nav.dataset.nav || nav.getAttribute("href") || "";
    if (!target) return;
    event.preventDefault();
    navigate(target.replace(/^#\/?/, ""));
    document.body.classList.remove("is-menu-open");
    return;
  }
  const actionEl = event.target.closest("[data-action]");
  if (actionEl) {
    event.preventDefault();
    handleAction(actionEl.dataset.action, actionEl);
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
    return;
  }
  if (event.key === "Escape") {
    if (document.getElementById("palette-root")?.innerHTML) {
      closePalette();
      return;
    }
    if (isModalOpen()) {
      closeModal();
      return;
    }
    document.body.classList.remove("is-menu-open");
  }
});

window.addEventListener("hashchange", () => {
  currentRoute = routeFromHash();
  renderPage(false);
});

store.subscribe(() => renderPage(true));

document.querySelectorAll("[data-icon]").forEach((node) => {
  node.innerHTML = icon(node.dataset.icon, Number(node.dataset.size) || 17);
});

if (!location.hash) history.replaceState(null, "", "#/dashboard");
currentRoute = routeFromHash();
renderPage(false);
