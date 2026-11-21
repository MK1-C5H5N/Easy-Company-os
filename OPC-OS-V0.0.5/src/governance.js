import { icon } from "./icons.js";
import { formatMoney, getDatabase, getPage, rowTitle, uid } from "./data.js";
import { esc } from "./utils.js";

export const RISK = {
  L0: { label: "L0 只读", tone: "slate", short: "只读" },
  L1: { label: "L1 起草", tone: "blue", short: "起草" },
  L2: { label: "L2 对外", tone: "amber", short: "对外" },
  L3: { label: "L3 资金/税务", tone: "red", short: "高风险" },
  L4: { label: "L4 不可逆", tone: "purple", short: "不可逆" },
};

export const WORKFLOW_STATE = {
  draft: { label: "草稿", tone: "slate" },
  proposed: { label: "已提案", tone: "blue" },
  pending_approval: { label: "待批准", tone: "amber" },
  approved: { label: "已批准", tone: "teal" },
  executed: { label: "已执行", tone: "green" },
  closed: { label: "已关闭", tone: "green" },
  rejected: { label: "已驳回", tone: "red" },
};

const EVENT_LABELS = {
  "workflow.created": "创建工作流",
  "action.proposed": "AI 提交提案",
  "action.modified": "修改提案",
  "workflow.approved": "批准执行",
  "workflow.rejected": "驳回提案",
  "workflow.executed": "执行完成",
  "evidence.verified": "核验证据",
};

const EVENT_ICONS = {
  "workflow.created": "layers",
  "action.proposed": "sparkles",
  "action.modified": "edit",
  "workflow.approved": "check",
  "workflow.rejected": "x",
  "workflow.executed": "zap",
  "evidence.verified": "shield",
};

function digest(value) {
  const input = String(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function ensureGovernanceState(state) {
  if (!state.governance) {
    state.governance = { actor: state.workspace?.owner || "周子博", policies: [], workflows: [], events: [] };
  }
  const governance = state.governance;
  governance.policies ||= [];
  governance.workflows ||= [];
  governance.events ||= [];
  governance.actor ||= state.workspace?.owner || "周子博";

  for (const workflow of governance.workflows) {
    workflow.approvals ||= [];
    workflow.evidence ||= [];
    workflow.action ||= { id: uid("act"), tool: "manual", label: "人工处理", summary: "", params: {}, risk: workflow.risk, status: "proposed" };
    for (const evidence of workflow.evidence) {
      if (!evidence.hash) evidence.hash = digest(`${workflow.id}|${evidence.id}|${evidence.label}|${evidence.ref}`);
    }
  }

  let previous = "GENESIS";
  governance.events.forEach((event, index) => {
    event.seq ||= index + 1;
  });
  for (const event of governance.events) {
    event.prevHash ||= previous;
    if (!event.hash) {
      event.hash = digest(`${event.prevHash}|${event.type}|${event.actor}|${event.at}|${JSON.stringify(event.payload || {})}`);
    }
    previous = event.hash;
  }
}

export function verifyLedger(state) {
  const events = state.governance?.events || [];
  let previous = "GENESIS";
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.prevHash !== previous) return { valid: false, brokenAt: index + 1 };
    const expected = digest(`${event.prevHash}|${event.type}|${event.actor}|${event.at}|${JSON.stringify(event.payload || {})}`);
    if (event.hash !== expected) return { valid: false, brokenAt: index + 1 };
    previous = event.hash;
  }
  return { valid: true, count: events.length };
}

export function appendEvent(state, type, actor, payload) {
  const events = state.governance.events;
  const previous = events.at(-1)?.hash || "GENESIS";
  const at = new Date().toISOString();
  const event = { id: uid("evt"), seq: events.length + 1, type, actor, at, payload, prevHash: previous };
  event.hash = digest(`${previous}|${type}|${actor}|${at}|${JSON.stringify(payload || {})}`);
  events.push(event);
  return event;
}

export function getWorkflow(state, workflowId) {
  return state.governance?.workflows?.find((workflow) => workflow.id === workflowId) || null;
}

export function getPolicy(state, policyId) {
  return state.governance?.policies?.find((policy) => policy.id === policyId) || null;
}

export function pendingWorkflows(state) {
  return (state.governance?.workflows || [])
    .filter((workflow) => workflow.state === "pending_approval")
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || String(a.due || "").localeCompare(String(b.due || "")));
}

export function linkedWorkflows(state, page) {
  if (!page) return [];
  return (state.governance?.workflows || []).filter(
    (workflow) => workflow.pageId === page.id || workflow.relatedPageIds?.includes(page.id)
  );
}

export function workflowSource(state, workflow) {
  const page = getPage(state, workflow.pageId);
  const db = workflow.dbId ? getDatabase(state, workflow.dbId) : null;
  const row = db?.rows.find((item) => item.id === workflow.rowId);
  return {
    page,
    db,
    row,
    pageTitle: page?.title || "未关联页面",
    rowTitle: db && row ? rowTitle(db, row) : workflow.title,
  };
}

export function approvalCheck(state, workflow) {
  const missing = workflow.evidence.filter((evidence) => evidence.status !== "verified");
  const policy = getPolicy(state, workflow.policyId);
  const requirements = policy?.requirements || ["owner_approval", "evidence_complete"];
  const versionOk = !requirements.includes("version_lock") || workflow.action.versionLocked === true;
  return {
    ok: workflow.state === "pending_approval" && missing.length === 0 && requirements.includes("owner_approval") && versionOk,
    missing,
    policy,
    requirements,
    versionOk,
  };
}

export function approveWorkflow(state, workflowId, reason = "") {
  const workflow = getWorkflow(state, workflowId);
  if (!workflow) return { ok: false, error: "工作流不存在" };
  const check = approvalCheck(state, workflow);
  if (!check.ok) {
    return { ok: false, error: check.missing.length ? `还有 ${check.missing.length} 项证据未核验` : "当前状态不能批准" };
  }
  const actor = state.workspace?.owner || "周子博";
  const at = new Date().toISOString();
  workflow.state = "executed";
  workflow.action.status = "executed";
  workflow.updatedAt = at;
  workflow.approvals.push({
    id: uid("ap"),
    decision: "approved",
    approver: actor,
    reason: reason || "证据齐全，批准执行",
    at,
  });
  workflow.result = {
    label: `演示执行：${workflow.action.label}`,
    at,
    demo: true,
  };
  appendEvent(state, "workflow.approved", actor, { workflowId, actionId: workflow.action.id, risk: workflow.risk });
  appendEvent(state, "workflow.executed", "系统 · 演示执行", { workflowId, result: workflow.result.label, demo: true });
  return { ok: true, workflow };
}

export function rejectWorkflow(state, workflowId, reason = "") {
  const workflow = getWorkflow(state, workflowId);
  if (!workflow) return { ok: false, error: "工作流不存在" };
  const actor = state.workspace?.owner || "周子博";
  const at = new Date().toISOString();
  workflow.state = "rejected";
  workflow.action.status = "rejected";
  workflow.updatedAt = at;
  workflow.approvals.push({
    id: uid("ap"),
    decision: "rejected",
    approver: actor,
    reason: reason || "证据或判断不充分",
    at,
  });
  appendEvent(state, "workflow.rejected", actor, { workflowId, actionId: workflow.action.id, reason: reason || "证据或判断不充分" });
  return { ok: true, workflow };
}

export function modifyWorkflowAction(state, workflowId, summary) {
  const workflow = getWorkflow(state, workflowId);
  if (!workflow) return { ok: false, error: "工作流不存在" };
  const text = String(summary || "").trim();
  if (!text) return { ok: false, error: "修改内容不能为空" };
  const actor = state.workspace?.owner || "周子博";
  workflow.action.summary = text;
  workflow.action.revision = (workflow.action.revision || 1) + 1;
  workflow.updatedAt = new Date().toISOString();
  appendEvent(state, "action.modified", actor, { workflowId, actionId: workflow.action.id, revision: workflow.action.revision, summary: text });
  return { ok: true, workflow };
}

export function verifyEvidence(state, workflowId, evidenceId) {
  const workflow = getWorkflow(state, workflowId);
  const evidence = workflow?.evidence.find((item) => item.id === evidenceId);
  if (!workflow || !evidence) return { ok: false, error: "证据不存在" };
  evidence.status = "verified";
  evidence.verifiedBy = state.workspace?.owner || "周子博";
  evidence.verifiedAt = new Date().toISOString();
  evidence.detail = `${evidence.detail || ""} · 演示环境已核验`;
  workflow.updatedAt = evidence.verifiedAt;
  appendEvent(state, "evidence.verified", state.workspace?.owner || "周子博", { workflowId, evidenceId, label: evidence.label, demo: true });
  return { ok: true, workflow };
}

export function auditBundle(state) {
  const events = state.governance?.events || [];
  const workflows = state.governance?.workflows || [];
  return {
    schema: "opc-os.audit/v0.0.3",
    generatedAt: new Date().toISOString(),
    workspace: {
      name: state.workspace?.name,
      owner: state.workspace?.owner,
      role: state.workspace?.role,
    },
    ledger: verifyLedger(state),
    policies: state.governance?.policies || [],
    workflows,
    approvals: workflows.flatMap((workflow) => workflow.approvals.map((approval) => ({ ...approval, workflowId: workflow.id }))),
    evidence: workflows.flatMap((workflow) => workflow.evidence.map((evidence) => ({ ...evidence, workflowId: workflow.id }))),
    events,
  };
}

function riskWeight(risk) {
  return Number(String(risk || "L0").replace("L", "")) || 0;
}

function formatAt(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function workflowDue(workflow) {
  if (!workflow.due) return "无截止日";
  const date = new Date(`${workflow.due}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return workflow.due;
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function stateMeta(workflow) {
  return WORKFLOW_STATE[workflow.state] || WORKFLOW_STATE.draft;
}

function evidenceDone(workflow) {
  return workflow.evidence.filter((evidence) => evidence.status === "verified").length;
}

function riskMeta(risk) {
  return RISK[risk] || RISK.L0;
}

export function renderGovernanceStrip(state) {
  const pending = pendingWorkflows(state);
  const high = pending.filter((workflow) => workflow.risk === "L3" || workflow.risk === "L4").length;
  const missing = pending.filter((workflow) => workflow.evidence.some((evidence) => evidence.status !== "verified")).length;
  if (!pending.length) {
    return `<section class="governance-strip governance-strip--calm">
      <div class="governance-strip__icon">${icon("shield", 18)}</div>
      <div class="governance-strip__copy"><strong>治理台是干净的</strong><span>没有待批准动作。AI 可以继续起草，但不会替你执行。</span></div>
      <button type="button" class="btn btn--ghost btn--sm" data-action="open-approvals">打开治理台 ${icon("arrowRight", 13)}</button>
    </section>`;
  }
  return `<section class="governance-strip">
    <div class="governance-strip__icon">${icon("shield", 18)}</div>
    <div class="governance-strip__copy">
      <strong>${pending.length} 件事等你批准</strong>
      <span>${high} 件高风险 · ${missing} 件证据未齐 · AI 已准备，但没有执行</span>
    </div>
    <div class="governance-strip__items">
      ${pending.slice(0, 2).map((workflow) => `<button type="button" class="governance-strip__item" data-action="open-workflow" data-workflow="${workflow.id}">
        <span class="risk-dot risk-dot--${riskMeta(workflow.risk).tone}"></span>${esc(workflow.title)}
      </button>`).join("")}
    </div>
    <button type="button" class="btn btn--dark btn--sm" data-action="open-approvals">审批准入 ${icon("arrowRight", 13)}</button>
  </section>`;
}

export function renderApprovalInbox(state, ui) {
  const all = state.governance?.workflows || [];
  const pending = pendingWorkflows(state);
  const filter = ui.approvalFilter || "pending";
  const history = all.filter((workflow) => workflow.state !== "pending_approval");
  const shown = filter === "all" ? all : filter === "history" ? history : pending;
  const high = pending.filter((workflow) => workflow.risk === "L3" || workflow.risk === "L4").length;
  const missing = pending.reduce((count, workflow) => count + workflow.evidence.filter((evidence) => evidence.status !== "verified").length, 0);
  const ledger = verifyLedger(state);

  return `<div class="approval-page">
    <header class="approval-hero">
      <div class="approval-hero__main">
        <div class="special-eyebrow">${icon("shield", 14)} GOVERNANCE INBOX</div>
        <h1>今天需要你批准的事</h1>
        <p>AI 可以起草、比对和准备，但资金、税务、合同对外发送必须经过你。每次批准都会留下证据和运行记录。</p>
        <div class="approval-hero__actions">
          <button type="button" class="btn btn--primary btn--sm" data-action="approval-filter" data-filter="pending">${icon("inbox", 14)} 待我批准 ${pending.length}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="export-audit">${icon("download", 14)} 导出审计包</button>
        </div>
      </div>
      <div class="approval-hero__seal">
        <div class="approval-seal ${ledger.valid ? "is-valid" : "is-broken"}">${icon(ledger.valid ? "shield" : "alert", 24)}</div>
        <strong>${ledger.valid ? "账本完整" : "账本异常"}</strong>
        <span>${ledger.count || all.length} 条事件 · 演示哈希链</span>
      </div>
    </header>

    <section class="approval-stats">
      <div class="approval-stat"><span>待批准</span><strong>${pending.length}</strong><small>需要你亲自确认</small></div>
      <div class="approval-stat approval-stat--red"><span>高风险</span><strong>${high}</strong><small>L3 资金 / 税务</small></div>
      <div class="approval-stat approval-stat--amber"><span>证据缺口</span><strong>${missing}</strong><small>补齐后才能批准</small></div>
      <div class="approval-stat approval-stat--teal"><span>已完成</span><strong>${history.length}</strong><small>可回放、可导出</small></div>
    </section>

    <div class="approval-toolbar">
      <div class="approval-tabs">
        ${[
          ["pending", `待批准 ${pending.length}`],
          ["all", `全部 ${all.length}`],
          ["history", `历史 ${history.length}`],
        ].map(([key, label]) => `<button type="button" class="approval-tab ${filter === key ? "is-active" : ""}" data-action="approval-filter" data-filter="${key}">${label}</button>`).join("")}
      </div>
      <span class="approval-toolbar__note">${icon("lock", 12)} 浏览器内演示：批准不等于真实外部执行</span>
    </div>

    <section class="approval-list">
      ${shown.length ? shown.map((workflow) => renderWorkflowCard(state, workflow, { compact: false })).join("") : `<div class="governance-empty">
        ${icon("check", 22)}
        <strong>这一栏是空的</strong>
        <span>${filter === "pending" ? "所有提案都已处理。AI 可以继续起草，但不会自动执行。" : "还没有历史记录。"}</span>
      </div>`}
    </section>

    <section class="approval-bottom">
      <div class="approval-policies">
        <div class="approval-section-head"><div><h2>当前生效的规则</h2><p>规则是版本化的；AI 不能自己修改规则。</p></div></div>
        ${(state.governance?.policies || []).map((policy) => `<div class="policy-rule">
          <span class="policy-rule__risk risk-chip risk-chip--${riskMeta(policy.risk).tone}">${esc(riskMeta(policy.risk).label)}</span>
          <div><strong>${esc(policy.name)}</strong><p>${esc(policy.description)}</p></div>
          <span class="policy-rule__version">v${policy.version}</span>
        </div>`).join("")}
      </div>
      <div class="approval-ledger">
        <div class="approval-section-head"><div><h2>最近运行记录</h2><p>按时间倒序；哈希链只保证“改动可被发现”。</p></div></div>
        ${renderEventList(state, 6)}
      </div>
    </section>
  </div>`;
}

function renderWorkflowCard(state, workflow, { compact = false } = {}) {
  const meta = stateMeta(workflow);
  const risk = riskMeta(workflow.risk);
  const source = workflowSource(state, workflow);
  const check = approvalCheck(state, workflow);
  const done = evidenceDone(workflow);
  const total = workflow.evidence.length;
  const pending = workflow.state === "pending_approval";
  const lastApproval = workflow.approvals.at(-1);
  const compactClass = compact ? " governance-card--compact" : "";

  return `<article class="governance-card governance-card--${meta.tone}${compactClass}" data-workflow-card="${workflow.id}">
    <div class="governance-card__head">
      <div class="governance-card__badges">
        <span class="risk-chip risk-chip--${risk.tone}">${esc(risk.label)}</span>
        <span class="state-chip state-chip--${meta.tone}">${esc(meta.label)}</span>
        ${workflow.risk === "L3" ? `<span class="governance-card__alert">${icon("alert", 11)} 需要二次确认</span>` : ""}
      </div>
      <span class="governance-card__due">${icon("clock", 12)} ${workflowDue(workflow)}</span>
    </div>
    <div class="governance-card__title-row">
      <div>
        <h2>${esc(workflow.title)}</h2>
        <div class="governance-card__meta">
          <span>${icon("user", 12)} ${esc(workflow.owner)}</span>
          <span>${icon("layers", 12)} ${esc(source.pageTitle)}</span>
          <span>${icon("shield", 12)} ${esc(check.policy?.name || "默认治理规则")}</span>
        </div>
      </div>
      <button type="button" class="governance-card__open" data-action="open-workflow" data-workflow="${workflow.id}">查看原文 ${icon("arrowUpRight", 13)}</button>
    </div>

    <div class="governance-next">${icon("arrowRight", 13)} ${esc(workflow.nextStep)}</div>

    <div class="governance-action">
      <div class="governance-action__head">
        <span class="governance-ai-label">${icon("sparkles", 12)} AI 提案${workflow.action.revision ? ` · rev.${workflow.action.revision}` : ""}</span>
        <strong>${esc(workflow.action.label)}</strong>
      </div>
      <p>${esc(workflow.action.summary)}</p>
      <div class="governance-action__meta">
        <span>工具 <code>${esc(workflow.action.tool)}</code></span>
        <span>幂等键 <code>${esc(workflow.action.idempotencyKey)}</code></span>
        <span>${workflow.action.status === "executed" ? "已执行" : "未执行"}</span>
      </div>
    </div>

    <details class="governance-evidence" ${pending && !compact && check.missing.length ? "open" : ""}>
      <summary>
        <span>${icon("file", 13)} 证据 ${done}/${total}</span>
        <span class="${check.missing.length ? "is-missing" : "is-complete"}">${check.missing.length ? `差 ${check.missing.length} 项` : "证据齐全"}</span>
        ${icon("chevronDown", 12)}
      </summary>
      <div class="governance-evidence__list">
        ${workflow.evidence.map((evidence) => renderEvidence(workflow, evidence)).join("")}
      </div>
    </details>

    <div class="governance-card__foot">
      <div class="governance-card__foot-note">
        ${pending
          ? check.missing.length
            ? `补齐证据后才能批准 · ${esc(check.missing[0].label)}`
            : "证据齐全 · 批准后仅执行演示动作"
          : lastApproval
            ? `${esc(lastApproval.approver)} ${lastApproval.decision === "approved" ? "已批准" : "已驳回"} · ${formatAt(lastApproval.at)}`
            : "已结束"}
      </div>
      <div class="governance-card__actions">
        ${pending ? `
          <button type="button" class="btn btn--ghost btn--sm" data-action="modify-workflow" data-workflow="${workflow.id}">${icon("edit", 13)} 修改</button>
          <button type="button" class="btn btn--danger btn--sm" data-action="reject-workflow" data-workflow="${workflow.id}">${icon("x", 13)} 驳回</button>
          ${check.missing.length
            ? `<button type="button" class="btn btn--warning btn--sm" data-action="verify-evidence" data-workflow="${workflow.id}" data-evidence="${check.missing[0].id}">${icon("file", 13)} 补齐证据</button>`
            : `<button type="button" class="btn btn--primary btn--sm" data-action="approve-workflow" data-workflow="${workflow.id}">${icon("check", 13)} 批准并执行</button>`}
        ` : `<span class="governance-done">${icon("check", 13)} ${esc(workflow.result?.label || "已处理")}</span>`}
      </div>
    </div>
    ${pending && check.missing.length ? `<div class="governance-card__hint">${icon("alert", 12)} 这是演示审批：先补齐缺失证据，才能测试“批准”动作。</div>` : ""}
  </article>`;
}

function renderEvidence(workflow, evidence) {
  const verified = evidence.status === "verified";
  return `<div class="evidence-item ${verified ? "is-verified" : "is-missing"}">
    <span class="evidence-item__icon">${icon(verified ? "check" : "alert", 13)}</span>
    <div class="evidence-item__body"><strong>${esc(evidence.label)}</strong><small>${esc(evidence.detail || evidence.ref || "")}</small></div>
    <span class="evidence-item__state">${verified ? "已核验" : "缺失"}</span>
    ${verified ? "" : `<button type="button" class="evidence-item__fix" data-action="verify-evidence" data-workflow="${workflow.id}" data-evidence="${evidence.id}">演示补录</button>`}
  </div>`;
}

export function renderGovernancePanel(state, page) {
  const workflows = linkedWorkflows(state, page);
  const pending = workflows.filter((workflow) => workflow.state === "pending_approval");
  const ledger = verifyLedger(state);
  return `<div class="governance-panel">
    <div class="governance-panel__head">
      <div class="governance-panel__title">${icon("shield", 15)} 治理</div>
      <span class="governance-ledger ${ledger.valid ? "is-valid" : "is-broken"}">${ledger.valid ? "账本完整" : "账本异常"}</span>
    </div>
    <div class="governance-panel__intro">
      <strong>${esc(page?.title || "当前页面")}</strong>
      <span>AI 只提案；资金、税务、合同发送需要你批准。</span>
    </div>
    ${workflows.length ? `
      <div class="governance-panel__summary">
        <span><strong>${pending.length}</strong> 待批准</span>
        <span><strong>${workflows.length}</strong> 关联工作流</span>
        <span><strong>${workflows.reduce((count, workflow) => count + workflow.evidence.filter((evidence) => evidence.status !== "verified").length, 0)}</strong> 证据缺口</span>
      </div>
      <div class="governance-panel__list">
        ${workflows.map((workflow) => renderWorkflowCard(state, workflow, { compact: true })).join("")}
      </div>
    ` : `<div class="governance-panel__empty">${icon("shield", 20)}<strong>这个页面还没有受治理动作</strong><span>当 AI 需要对外发送、动钱或提交申报时，会在这里出现审批卡。</span></div>`}
    <div class="governance-panel__foot">
      <button type="button" class="btn btn--ghost btn--sm" data-action="open-approvals">${icon("inbox", 13)} 打开审批箱</button>
      <span>${icon("lock", 11)} 演示模式</span>
    </div>
  </div>`;
}

export function renderAIGovernance(state, page) {
  const pending = linkedWorkflows(state, page).filter((workflow) => workflow.state === "pending_approval");
  if (!pending.length) return "";
  return `<div class="ai-governance">
    <div class="ai-governance__head">${icon("shield", 13)} 治理提案 <span>${pending.length}</span></div>
    ${pending.slice(0, 3).map((workflow) => {
      const risk = riskMeta(workflow.risk);
      return `<div class="ai-governance__item">
        <span class="risk-dot risk-dot--${risk.tone}"></span>
        <div><strong>${esc(workflow.title)}</strong><small>${esc(workflow.action.label)} · ${esc(risk.short)}</small></div>
        <button type="button" class="link-btn" data-action="open-workflow" data-workflow="${workflow.id}">查看</button>
      </div>`;
    }).join("")}
  </div>`;
}

export function renderApprovalModal(state, ui) {
  const modal = ui.approvalModal;
  if (!modal) return "";
  const workflow = getWorkflow(state, modal.workflowId);
  if (!workflow) return "";
  const rejecting = modal.mode === "reject";
  return `<div class="approval-modal-overlay" data-action="close-approval-modal">
    <div class="approval-modal" data-approval-panel>
      <div class="approval-modal__head">
        <div><div class="special-eyebrow">${rejecting ? "REJECT PROPOSAL" : "MODIFY PROPOSAL"}</div><h2>${rejecting ? "驳回这个提案" : "修改 AI 提案"}</h2></div>
        <button type="button" class="icon-btn icon-btn--sm" data-action="close-approval-modal">${icon("x", 14)}</button>
      </div>
      <p class="approval-modal__desc">${rejecting ? `驳回「${esc(workflow.title)}」。请写清原因，它会进入审计日志。` : `修改「${esc(workflow.action.label)}」的执行说明。修改后仍需重新批准。`}</p>
      <textarea id="approval-note" data-approval-note placeholder="${rejecting ? "例如：金额与合同不一致，先和客户确认。" : "写清新的执行说明…"}">${esc(modal.text || "")}</textarea>
      <div class="approval-modal__foot">
        <button type="button" class="btn btn--ghost btn--sm" data-action="close-approval-modal">取消</button>
        <button type="button" class="btn ${rejecting ? "btn--danger" : "btn--primary"} btn--sm" data-action="${rejecting ? "confirm-reject" : "save-modification"}" data-workflow="${workflow.id}">${rejecting ? "确认驳回" : "保存修改"}</button>
      </div>
    </div>
  </div>`;
}

export function renderEventList(state, limit = 6) {
  const events = [...(state.governance?.events || [])].reverse().slice(0, limit);
  if (!events.length) return `<div class="event-empty">还没有运行记录。</div>`;
  return `<div class="event-list">
    ${events.map((event) => `<div class="event-row">
      <span class="event-row__icon">${icon(EVENT_ICONS[event.type] || "dots", 13)}</span>
      <div class="event-row__body"><strong>${esc(EVENT_LABELS[event.type] || event.type)}</strong><span>${esc(event.actor)} · ${formatAt(event.at)}</span></div>
      <code>${esc(event.hash?.slice(0, 8) || "—")}</code>
    </div>`).join("")}
  </div>`;
}

export function workflowMoney(workflow) {
  const amount = Number(workflow.action?.params?.amount || 0);
  return amount ? formatMoney(amount) : "";
}
