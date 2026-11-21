import { icon } from "./icons.js";
import { uid } from "./data.js";
import { esc } from "./utils.js";

export const ORG_TABS = [
  ["network", "任务网络", "share"],
  ["intelligence", "组织智能", "layers"],
  ["loops", "Looping 看板", "refresh"],
  ["evidence", "证据链", "shield"],
];

const AGENTS = [
  { id: "human", name: "周子博", short: "周", role: "Founder / Builder", type: "human", color: "#0E7C6B", status: "online", focus: "产品与审批", capacity: 82 },
  { id: "builder", name: "Builder Agent", short: "B", role: "Builder", type: "agent", color: "#4B6BFB", status: "working", focus: "产品 / 工程", capacity: 74 },
  { id: "seller", name: "Seller Agent", short: "S", role: "Seller", type: "agent", color: "#C99A3B", status: "working", focus: "线索 / 成交", capacity: 61 },
  { id: "ops", name: "Ops Agent", short: "O", role: "Ops", type: "agent", color: "#6D4BD8", status: "online", focus: "证据 / 复盘", capacity: 68 },
];

const LOOPS = [
  {
    id: "product", name: "产品交付 Loop", color: "#4B6BFB", metric: "交付周期", current: 9, target: 7, unit: "天",
    health: 72, review: "每周一", steps: ["Build", "Review", "Release"], description: "从任务拆解到发布，缩短交付周期。",
    trend: [12, 11, 10, 10, 9.5, 9, 9, 9], taskIds: ["t1", "t2", "t5"],
  },
  {
    id: "gtm", name: "客户获取 Loop", color: "#C99A3B", metric: "付费转化", current: 6, target: 10, unit: "%",
    health: 58, review: "每周三", steps: ["Lead", "Diagnose", "Pilot"], description: "从线索到付费试点，验证一人公司付费意愿。",
    trend: [3, 3.5, 4, 4.5, 5, 5.5, 6, 6], taskIds: ["t3", "t4"],
  },
  {
    id: "geo", name: "GEO 增长 Loop", color: "#6D4BD8", metric: "引用率", current: 42, target: 60, unit: "%",
    health: 64, review: "每周五", steps: ["Brief", "Publish", "Cite"], description: "内容 Brief → 发布 → 引用 → 复盘。",
    trend: [28, 30, 33, 35, 37, 39, 41, 42], taskIds: ["t6"],
  },
  {
    id: "evidence", name: "治理证据 Loop", color: "#0E7C6B", metric: "证据完整率", current: 88, target: 95, unit: "%",
    health: 81, review: "每周一", steps: ["Propose", "Approve", "Prove"], description: "AI 提案、人工审批、证据留痕、审计复核。",
    trend: [72, 76, 79, 82, 84, 86, 87, 88], taskIds: ["t5", "t7"],
  },
  {
    id: "intel", name: "组织智能 Loop", color: "#3B5E9A", metric: "Skill 复用率", current: 54, target: 70, unit: "%",
    health: 69, review: "每两周", steps: ["Capture", "Codify", "Reuse"], description: "把隐性经验沉淀为 Skill，再复用到下一个任务。",
    trend: [30, 34, 38, 42, 46, 49, 52, 54], taskIds: ["t8"],
  },
];

const SKILLS = [
  { id: "s1", name: "平台 GEO 诊断", category: "GEO", level: "已验证", source: "GEO 工作台", uses: 18, owner: "Builder", loopId: "geo", description: "按平台检查提及、引用、首推与内容缺口。" },
  { id: "s2", name: "AI 提案审批", category: "治理", level: "已验证", source: "治理工作流", uses: 26, owner: "Ops", loopId: "evidence", description: "把 AI 提议拆成风险、证据、审批人三件事。" },
  { id: "s3", name: "一人公司合规检查", category: "合规", level: "已验证", source: "合规日历", uses: 11, owner: "Ops", loopId: "evidence", description: "报税、年报、合同、许可证到期前的检查清单。" },
  { id: "s4", name: "设计伙伴访谈", category: "增长", level: "验证中", source: "客户获取 Loop", uses: 7, owner: "Seller", loopId: "gtm", description: "用 5 个问题判断对方是否值得进入付费试点。" },
  { id: "s5", name: "发布前检查", category: "产品", level: "验证中", source: "产品交付 Loop", uses: 9, owner: "Builder", loopId: "product", description: "功能、权限、证据、回滚四项检查。" },
  { id: "s6", name: "周复盘模板", category: "运营", level: "已验证", source: "经营驾驶舱", uses: 14, owner: "周子博", loopId: "intel", description: "目标、进展、卡点、下周一个动作。" },
];

const TASKS = [
  {
    id: "t1", title: "设计智能组织数据模型", agentId: "builder", status: "doing", priority: "P0", loopId: "product",
    due: "今天", dependsOn: [], description: "把任务网络、组织智能、Looping、证据链放进同一个状态模型。",
    steps: [{ label: "拆解实体", done: true }, { label: "定义关系", done: true }, { label: "写入状态", done: false }],
  },
  {
    id: "t2", title: "把任务网络接入 V0.0.5", agentId: "builder", status: "doing", priority: "P0", loopId: "product",
    due: "周二", dependsOn: ["t1"], description: "实现角色泳道、依赖关系、任务详情和推进动作。",
    steps: [{ label: "渲染泳道", done: true }, { label: "接入依赖", done: false }, { label: "测试推进", done: false }],
  },
  {
    id: "t3", title: "整理 10 个设计伙伴名单", agentId: "seller", status: "doing", priority: "P1", loopId: "gtm",
    due: "周三", dependsOn: [], description: "按行业、付费意愿、一人公司特征筛选，准备首批试点。",
    steps: [{ label: "列出候选", done: true }, { label: "分级", done: false }, { label: "发出邀请", done: false }],
  },
  {
    id: "t4", title: "准备 GEO Growth 试点报价", agentId: "seller", status: "todo", priority: "P1", loopId: "gtm",
    due: "周五", dependsOn: ["t3"], description: "给出 3 个试点套餐和成功口径，避免只卖“发稿”。",
    steps: [{ label: "成本测算", done: false }, { label: "套餐设计", done: false }, { label: "合同条款", done: false }],
  },
  {
    id: "t5", title: "审核 V0.0.5 发布说明", agentId: "human", status: "review", priority: "P0", loopId: "product",
    due: "今天", dependsOn: ["t2"], description: "确认任务网络、组织智能、Looping、证据链的描述准确。",
    steps: [{ label: "功能核对", done: true }, { label: "风险核对", done: true }, { label: "签字发布", done: false }],
  },
  {
    id: "t6", title: "复盘本周 GEO 引用率", agentId: "ops", status: "done", priority: "P1", loopId: "geo",
    due: "已复盘", dependsOn: [], description: "对比上周引用来源，找出丢失的引用和新增的信源。",
    steps: [{ label: "拉数据", done: true }, { label: "归因", done: true }, { label: "写结论", done: true }],
  },
  {
    id: "t7", title: "补齐审批证据链", agentId: "ops", status: "doing", priority: "P0", loopId: "evidence",
    due: "周四", dependsOn: ["t5"], description: "把任务、提案、审批、证据、执行连成一条可验证的链。",
    steps: [{ label: "收集事件", done: true }, { label: "计算哈希", done: false }, { label: "验证链", done: false }],
  },
  {
    id: "t8", title: "沉淀平台 GEO 诊断 Skill", agentId: "builder", status: "done", priority: "P2", loopId: "intel",
    due: "已沉淀", dependsOn: ["t6"], description: "把一次 GEO 诊断整理成可复用的检查清单。",
    steps: [{ label: "抽取步骤", done: true }, { label: "写成 Skill", done: true }, { label: "登记复用", done: true }],
  },
];

function fnv(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function eventHash(event, prevHash) {
  return fnv([event.id, event.type, event.actor, event.ref, event.at, event.title, prevHash].join("|"));
}

function makeChain(base) {
  let prevHash = "GENESIS";
  return base.map((event) => {
    const item = { ...event, prevHash, hash: "" };
    item.hash = eventHash(item, prevHash);
    prevHash = item.hash;
    return item;
  });
}

function seedOrg() {
  const evidenceBase = [
    { id: "ev1", type: "task", title: "任务创建：设计智能组织数据模型", actor: "周子博", ref: "t1", refType: "task", at: "2026-11-21T09:00:00+08:00", status: "verified" },
    { id: "ev2", type: "proposal", title: "Builder Agent 拆解任务网络", actor: "Builder Agent", ref: "t1", refType: "task", at: "2026-11-21T09:18:00+08:00", status: "verified" },
    { id: "ev3", type: "approval", title: "人工审批：数据模型方向", actor: "周子博", ref: "t1", refType: "task", at: "2026-11-21T09:32:00+08:00", status: "verified" },
    { id: "ev4", type: "evidence", title: "证据上传：任务网络结构图", actor: "Builder Agent", ref: "t2", refType: "task", at: "2026-11-21T10:05:00+08:00", status: "verified" },
    { id: "ev5", type: "execution", title: "执行：V0.0.5 任务网络接入", actor: "Builder Agent", ref: "t2", refType: "task", at: "2026-11-21T11:20:00+08:00", status: "verified" },
    { id: "ev6", type: "loop", title: "产品交付 Loop 周复盘", actor: "Ops Agent", ref: "product", refType: "loop", at: "2026-11-21T17:40:00+08:00", status: "verified" },
    { id: "ev7", type: "policy", title: "发布前合规检查：不自动发布", actor: "周子博", ref: "t5", refType: "task", at: "2026-11-21T18:10:00+08:00", status: "verified" },
  ];
  return {
    seeded: true,
    agents: AGENTS.map((agent) => ({ ...agent })),
    tasks: TASKS.map((task) => ({ ...task, dependsOn: [...task.dependsOn], steps: task.steps.map((step) => ({ ...step })) })),
    loops: LOOPS.map((loop) => ({ ...loop, trend: [...loop.trend], taskIds: [...loop.taskIds] })),
    skills: SKILLS.map((skill) => ({ ...skill })),
    evidence: makeChain(evidenceBase),
    chainValid: true,
    chainVerifiedAt: "2026-11-21T18:12:00+08:00",
  };
}

export function ensureOrgState(state) {
  if (!state.org || !state.org.seeded) state.org = seedOrg();
  state.org.agents ||= AGENTS;
  state.org.tasks ||= [];
  state.org.loops ||= [];
  state.org.skills ||= [];
  state.org.evidence ||= [];
}

function pushEvidence(state, event) {
  const last = state.org.evidence[state.org.evidence.length - 1];
  const prevHash = last ? last.hash : "GENESIS";
  const item = {
    id: uid("ev"),
    status: "recorded",
    at: new Date().toISOString(),
    prevHash,
    hash: "",
    ...event,
  };
  item.hash = eventHash(item, prevHash);
  state.org.evidence.push(item);
  state.org.chainValid = null;
  state.org.chainVerifiedAt = null;
  return item;
}

function nudgeLoop(state, loopId, boost = 4) {
  const loop = getLoop(state, loopId);
  if (!loop) return;
  if (loop.unit === "天") loop.current = Math.max(loop.target, Math.round((loop.current - 0.4) * 10) / 10);
  else loop.current = Math.min(loop.target, loop.current + Math.max(1, Math.round((loop.target - loop.current) * 0.15)));
  loop.health = Math.min(100, loop.health + boost);
  loop.trend = [...loop.trend.slice(-7), loop.current];
}

export function advanceOrgTask(state, taskId) {
  const task = getTask(state, taskId);
  if (!task || task.status === "done") return false;
  const order = ["todo", "doing", "review", "done"];
  const next = order[Math.min(order.length - 1, order.indexOf(task.status) + 1)];
  task.status = next;
  if (next === "done") task.steps = task.steps.map((step) => ({ ...step, done: true }));
  else {
    const firstOpen = task.steps.findIndex((step) => !step.done);
    if (firstOpen >= 0) task.steps[firstOpen].done = true;
  }
  nudgeLoop(state, task.loopId, next === "done" ? 5 : 2);
  pushEvidence(state, {
    type: next === "review" ? "approval" : "execution",
    title: `任务推进：${task.title} → ${STATUS[next].label}`,
    actor: getAgent(state, task.agentId).name,
    ref: task.id,
    refType: "task",
  });
  return true;
}

export function extractOrgSkill(state, taskId) {
  const task = getTask(state, taskId);
  if (!task) return { added: false };
  if (state.org.skills.some((skill) => skill.name === task.title && skill.source === "任务沉淀")) {
    return { added: false, duplicate: true };
  }
  const loop = getLoop(state, task.loopId);
  const category = { product: "产品", gtm: "增长", geo: "GEO", evidence: "治理", intel: "运营" }[task.loopId] || "运营";
  const skill = {
    id: uid("skill"),
    name: task.title,
    category,
    level: "待验证",
    source: "任务沉淀",
    uses: 0,
    owner: getAgent(state, task.agentId).name,
    loopId: task.loopId,
    description: task.description || `从「${task.title}」沉淀出的可复用步骤。`,
  };
  state.org.skills.push(skill);
  pushEvidence(state, {
    type: "knowledge",
    title: `沉淀 Skill：${skill.name}`,
    actor: getAgent(state, task.agentId).name,
    ref: skill.id,
    refType: "skill",
  });
  nudgeLoop(state, "intel", 3);
  return { added: true, skill, loop };
}

export function useOrgSkill(state, skillId) {
  const skill = state.org.skills.find((item) => item.id === skillId);
  if (!skill) return false;
  skill.uses += 1;
  return true;
}

export function runOrgLoop(state, loopId) {
  const loop = getLoop(state, loopId);
  if (!loop) return false;
  nudgeLoop(state, loop.id, 5);
  pushEvidence(state, {
    type: "loop",
    title: `Loop 复盘：${loop.name}`,
    actor: "Ops Agent",
    ref: loop.id,
    refType: "loop",
  });
  return true;
}

export function addOrgEvidence(state, taskId) {
  const task = getTask(state, taskId);
  if (!task) return false;
  pushEvidence(state, {
    type: "manual",
    title: `补录证据：${task.title}`,
    actor: "周子博",
    ref: task.id,
    refType: "task",
  });
  return true;
}

export function verifyOrgChain(state) {
  let prevHash = "GENESIS";
  for (const event of state.org.evidence) {
    if (event.prevHash !== prevHash) {
      state.org.chainValid = false;
      state.org.chainVerifiedAt = new Date().toISOString();
      return false;
    }
    const expected = eventHash(event, prevHash);
    if (event.hash !== expected) {
      state.org.chainValid = false;
      state.org.chainVerifiedAt = new Date().toISOString();
      return false;
    }
    prevHash = event.hash;
  }
  state.org.chainValid = true;
  state.org.chainVerifiedAt = new Date().toISOString();
  state.org.evidence = state.org.evidence.map((event) => ({ ...event, status: "verified" }));
  return true;
}

function getTask(state, id) {
  return state.org.tasks.find((task) => task.id === id) || state.org.tasks[0];
}
function getLoop(state, id) {
  return state.org.loops.find((loop) => loop.id === id) || state.org.loops[0];
}
function getAgent(state, id) {
  return state.org.agents.find((agent) => agent.id === id) || state.org.agents[0];
}

const STATUS = {
  todo: { label: "待开始", tone: "slate" },
  doing: { label: "进行中", tone: "teal" },
  review: { label: "待审批", tone: "amber" },
  done: { label: "已完成", tone: "green" },
};

function statusChip(status, size = "") {
  const item = STATUS[status] || STATUS.todo;
  return `<span class="org-status org-status--${item.tone} ${size}">${item.label}</span>`;
}

function agentAvatar(agent, size = "sm") {
  return `<span class="org-avatar org-avatar--${size}" style="--agent-color:${agent.color}">${esc(agent.short)}</span>`;
}

function orgStats(state) {
  const active = state.org.tasks.filter((task) => task.status === "doing").length;
  const skills = state.org.skills.length;
  const loops = state.org.loops.length;
  const avgHealth = Math.round(state.org.loops.reduce((sum, loop) => sum + loop.health, 0) / Math.max(loops, 1));
  const evidence = state.org.evidence.length;
  const verified = state.org.evidence.filter((item) => item.status === "verified").length;
  return { active, skills, loops, avgHealth, evidence, verified };
}

export function renderOrgStudio(state, ui) {
  const tab = ui.orgTab || "network";
  const stats = orgStats(state);
  return `<div class="org-page">
    <header class="org-hero">
      <div class="org-hero__copy">
        <div class="special-eyebrow">${icon("layers", 14)} INTELLIGENT ORGANIZATION / V0.0.5</div>
        <h1>智能组织</h1>
        <p>一个人 + 一群 Agent，用任务网络、组织智能、Looping 和证据链，把公司跑成一套系统。</p>
        <div class="org-hero__actions">
          <button type="button" class="btn btn--primary btn--sm" data-action="org-tab" data-tab="network">${icon("share", 13)} 看任务网络</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="org-run-loop">${icon("refresh", 13)} 跑一轮 Loop</button>
          <span class="org-beta">BETA · 本地演示</span>
        </div>
      </div>
      <div class="org-hero__stats">
        <div><strong>${state.org.agents.length}</strong><span>角色节点</span></div>
        <div><strong>${state.org.tasks.length}</strong><span>任务</span></div>
        <div><strong>${stats.skills}</strong><span>组织 Skill</span></div>
        <div><strong>${stats.avgHealth}</strong><span>Loop 健康分</span></div>
      </div>
    </header>
    <div class="org-tabs">
      ${ORG_TABS.map(([key, label, ic]) => `<button type="button" class="org-tab ${tab === key ? "is-active" : ""}" data-action="org-tab" data-tab="${key}">${icon(ic, 13)} ${label}</button>`).join("")}
    </div>
    ${tab === "intelligence" ? renderIntelligence(state, ui) : tab === "loops" ? renderLoops(state, ui) : tab === "evidence" ? renderEvidence(state, ui) : renderNetwork(state, ui)}
  </div>`;
}

function renderNetwork(state, ui) {
  const task = getTask(state, ui.orgTaskId);
  const loop = getLoop(state, task.loopId);
  const agent = getAgent(state, task.agentId);
  const lanes = state.org.agents.map((owner) => {
    const tasks = state.org.tasks.filter((item) => item.agentId === owner.id);
    const load = Math.min(100, 24 + tasks.length * 24);
    return `<section class="org-lane" style="--agent-color:${owner.color}">
      <header class="org-lane__head">
        ${agentAvatar(owner)}
        <div><strong>${owner.name}</strong><small>${owner.role}</small></div>
        <span class="org-lane__load">${load}%</span>
      </header>
      <div class="org-lane__bar"><i style="width:${load}%"></i></div>
      <div class="org-lane__tasks">
        ${tasks.map((item) => `<button type="button" class="org-task-card ${item.id === task.id ? "is-active" : ""}" data-action="org-task" data-task="${item.id}">
          <span class="org-task-card__top">${statusChip(item.status)}<em>${item.priority}</em></span>
          <strong>${esc(item.title)}</strong>
          <small>${item.dependsOn.length ? `依赖 ${item.dependsOn.length} 个任务` : "无前置依赖"} · ${esc(item.due)}</small>
        </button>`).join("") || `<div class="org-lane__empty">暂无任务</div>`}
      </div>
    </section>`;
  }).join("");

  return `<section class="org-section org-network-section">
    <div class="org-section__head"><div><h2>任务网络</h2><p>人负责判断与签字，Agent 负责拆解、执行与整理；任务之间用依赖连接。</p></div><span class="org-demo-chip">点击任务查看详情</span></div>
    <div class="org-network">
      <div class="org-lanes">${lanes}</div>
      ${renderTaskPanel(state, task, agent, loop)}
    </div>
    <div class="org-note">${icon("alert", 13)} 这是 V0.0.5 的本地演示：任务推进、证据、Loop 都是本地状态，不自动执行真实业务动作。</div>
  </section>`;
}

function renderTaskPanel(state, task, agent, loop) {
  const dependencies = task.dependsOn.map((id) => getTask(state, id)).filter(Boolean);
  return `<aside class="org-task-panel">
    <div class="org-task-panel__head"><span class="org-kicker">TASK DETAIL</span>${statusChip(task.status)}</div>
    <h2>${esc(task.title)}</h2>
    <p>${esc(task.description)}</p>
    <div class="org-task-meta">
      <div><span>负责人</span><strong>${agentAvatar(agent)} ${esc(agent.name)}</strong></div>
      <div><span>所属 Loop</span><strong>${esc(loop.name)}</strong></div>
      <div><span>优先级</span><strong>${task.priority}</strong></div>
      <div><span>截止</span><strong>${esc(task.due)}</strong></div>
    </div>
    <div class="org-panel-block"><span>前置依赖</span>${dependencies.length ? dependencies.map((item) => `<button type="button" class="org-dep" data-action="org-task" data-task="${item.id}">${statusChip(item.status)} ${esc(item.title)}</button>`).join("") : "<p>无前置依赖</p>"}</div>
    <div class="org-panel-block"><span>执行步骤</span><ol class="org-steps">${task.steps.map((step) => `<li class="${step.done ? "is-done" : ""}">${step.done ? icon("check", 11) : `<i></i>`} ${esc(step.label)}</li>`).join("")}</ol></div>
    <div class="org-panel-actions">
      <button type="button" class="btn btn--primary btn--sm" data-action="org-advance-task" data-task="${task.id}">${task.status === "done" ? "已完成" : "推进状态"}</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="org-extract-skill" data-task="${task.id}">${icon("layers", 12)} 沉淀 Skill</button>
    </div>
  </aside>`;
}

function renderIntelligence(state, ui) {
  const filter = ui.orgSkillFilter || "all";
  const categories = ["all", ...new Set(state.org.skills.map((skill) => skill.category))];
  const skills = state.org.skills.filter((skill) => filter === "all" || skill.category === filter);
  const recent = [...state.org.evidence].slice(-4).reverse();
  return `<section class="org-section">
    <div class="org-section__head"><div><h2>组织智能</h2><p>把顶尖员工和 Agent 的隐性经验，变成可复用的 Skill、SOP 和证据。</p></div><button type="button" class="btn btn--ghost btn--sm" data-action="org-extract-skill" data-task="${ui.orgTaskId}">${icon("plus", 12)} 从当前任务沉淀</button></div>
    <div class="org-intel-stats">
      <div><strong>${state.org.skills.length}</strong><span>Skill</span></div>
      <div><strong>${state.org.skills.filter((skill) => skill.level === "已验证").length}</strong><span>已验证</span></div>
      <div><strong>${state.org.evidence.length}</strong><span>组织记忆</span></div>
      <div><strong>${Math.round(state.org.skills.reduce((sum, skill) => sum + skill.uses, 0) / Math.max(state.org.skills.length, 1))}</strong><span>平均复用</span></div>
    </div>
    <div class="org-filter-row">${categories.map((category) => `<button type="button" class="org-filter ${filter === category ? "is-active" : ""}" data-action="org-skill-filter" data-filter="${category}">${category === "all" ? "全部" : esc(category)}</button>`).join("")}</div>
    <div class="org-skill-grid">${skills.map((skill) => `<article class="org-skill-card">
      <div class="org-skill-card__top"><span class="org-kicker">${esc(skill.category)}</span><span class="org-level">${esc(skill.level)}</span></div>
      <h3>${esc(skill.name)}</h3>
      <p>${esc(skill.description)}</p>
      <div class="org-skill-card__meta"><span>${esc(skill.source)}</span><span>${skill.uses} 次复用</span></div>
      <button type="button" class="org-skill-use" data-action="org-use-skill" data-skill="${skill.id}">${icon("zap", 11)} 复用一次</button>
    </article>`).join("")}</div>
    <div class="org-intel-bottom">
      <div class="org-playbooks"><div class="org-section__head"><div><h3>Playbooks</h3><p>把经验写成可执行流程。</p></div></div>
        ${[["AI 提案审批", "提案 → 风险分级 → 证据 → 人工签字"], ["GEO 诊断", "平台矩阵 → 缺口 → Brief → 复测"], ["发布前检查", "事实 → 权限 → 证据 → 回滚"]].map(([name, desc]) => `<div class="org-playbook"><strong>${name}</strong><span>${desc}</span></div>`).join("")}
      </div>
      <div class="org-memory"><div class="org-section__head"><div><h3>组织记忆</h3><p>最近被记录下来的动作。</p></div></div>
        ${recent.map((item) => `<div class="org-memory-row"><span>${icon("shield", 10)}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.actor)} · ${esc(item.type)}</small></div></div>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderLoops(state, ui) {
  const selected = getLoop(state, ui.orgLoopId);
  const avg = Math.round(state.org.loops.reduce((sum, loop) => sum + loop.health, 0) / Math.max(state.org.loops.length, 1));
  return `<section class="org-section">
    <div class="org-section__head"><div><h2>Looping 看板</h2><p>可衡量 + Looping = 持续进化；每个 Loop 都有输入、动作、指标和复盘。</p></div><span class="org-demo-chip">平均健康 ${avg}</span></div>
    <div class="org-loop-grid">
      ${state.org.loops.map((loop) => `<button type="button" class="org-loop-card ${loop.id === selected.id ? "is-active" : ""}" data-action="org-loop" data-loop="${loop.id}" style="--loop-color:${loop.color}">
        <div class="org-loop-card__head"><span class="org-loop-dot"></span><strong>${esc(loop.name)}</strong><em>${loop.health}</em></div>
        <div class="org-loop-metric"><strong>${loop.current}${loop.unit}</strong><span>/ 目标 ${loop.target}${loop.unit}</span></div>
        <div class="org-trend">${loop.trend.map((value) => `<i style="height:${Math.max(10, Math.min(100, (value / Math.max(...loop.trend)) * 100))}%"></i>`).join("")}</div>
        <div class="org-loop-card__foot">${esc(loop.metric)} · ${esc(loop.review)}</div>
      </button>`).join("")}
    </div>
    <div class="org-loop-detail">
      <div class="org-loop-detail__main">
        <span class="org-kicker">SELECTED LOOP</span>
        <h3>${esc(selected.name)}</h3>
        <p>${esc(selected.description)}</p>
        <div class="org-loop-steps">${selected.steps.map((step, index) => `<span>${index + 1}. ${esc(step)}</span>`).join("<b>→</b>")}</div>
        <div class="org-loop-detail__meta"><span>指标：${selected.metric}</span><span>当前：${selected.current}${selected.unit}</span><span>目标：${selected.target}${selected.unit}</span><span>复盘：${selected.review}</span></div>
      </div>
      <div class="org-loop-detail__side">
        <div class="org-health-ring" style="--health:${selected.health};--loop-color:${selected.color}"><strong>${selected.health}</strong><span>健康分</span></div>
        <button type="button" class="btn btn--primary btn--sm" data-action="org-run-loop" data-loop="${selected.id}">${icon("refresh", 13)} 跑一轮 Loop</button>
      </div>
    </div>
  </section>`;
}

function renderEvidence(state, ui) {
  const verified = state.org.chainValid === true;
  return `<section class="org-section">
    <div class="org-section__head"><div><h2>治理证据链</h2><p>每一个关键动作都留下 actor、时间、对象、前后哈希；链断了，审计就能发现。</p></div>
      <div class="org-evidence-actions"><button type="button" class="btn btn--ghost btn--sm" data-action="org-add-evidence" data-task="${ui.orgTaskId}">${icon("plus", 12)} 新增证据</button><button type="button" class="btn btn--primary btn--sm" data-action="org-verify-chain">${icon("shield", 12)} 验证链</button></div>
    </div>
    <div class="org-chain-status ${verified ? "is-valid" : "is-unchecked"}">${verified ? icon("check", 13) + " 链验证通过" : icon("alert", 13) + " 链待验证"} <span>${state.org.evidence.length} 个事件 · ${state.org.evidence.filter((item) => item.status === "verified").length} 个已验证</span></div>
    <div class="org-chain">
      ${state.org.evidence.map((event, index) => `<article class="org-chain-item ${event.status === "verified" ? "is-verified" : ""}">
        <div class="org-chain-index">${String(index + 1).padStart(2, "0")}</div>
        <div class="org-chain-body">
          <div class="org-chain-top"><span class="org-kicker">${esc(event.type)}</span><span>${esc(event.at.slice(0, 16).replace("T", " "))}</span></div>
          <strong>${esc(event.title)}</strong>
          <small>${esc(event.actor)} · ${esc(event.refType)} ${esc(event.ref)}</small>
          <div class="org-chain-hash"><span>hash ${esc(event.hash.slice(0, 12))}…</span><span>prev ${esc(event.prevHash.slice(0, 12))}…</span></div>
        </div>
      </article>`).join("")}
    </div>
    <div class="org-note">${icon("lock", 13)} 链哈希是本地演示级 FNV 哈希，用于展示“前后可追溯”的产品逻辑，不是密码学审计。</div>
  </section>`;
}
