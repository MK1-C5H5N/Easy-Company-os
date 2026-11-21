// OPC OS v2 seed data. Demo only: names, companies and numbers are fictional.

export const DEMO_TODAY = "2026-11-05";
export const DEMO_DATE_LABEL = "2026 年 11 月 5 日 · 星期四";

export function uid(prefix = "id") {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}_${random.replaceAll("-", "").slice(0, 10)}`;
}

const taskRows = [
  { id: "task-1", title: "注册地址续费确认", category: "工商", due: "2026-11-03", owner: "园区管家", priority: "高", status: "待办", note: "园区提示地址服务将在 11 月底到期，需确认续费方案。" },
  { id: "task-2", title: "增值税及附加税费申报", category: "税务", due: "2026-11-09", owner: "代账 · 小周", priority: "高", status: "待办", note: "本期有 3 笔进项可抵扣，预计应缴 1,260 元。" },
  { id: "task-3", title: "个人所得税（经营所得）申报", category: "税务", due: "2026-11-15", owner: "代账 · 小周", priority: "中", status: "待办", note: "与工资薪金分开核算，注意不要重复扣除。" },
  { id: "task-4", title: "软件著作权补贴申报", category: "补贴", due: "2026-11-20", owner: "AI 助手", priority: "中", status: "待办", note: "上城区 800 元/件，材料已生成 80%。" },
  { id: "task-5", title: "社保缴费基数调整确认", category: "社保", due: "2026-11-25", owner: "创始人", priority: "中", status: "待办", note: "杭州 2026 年度基数上下限已更新，建议按最低档确认。" },
  { id: "task-6", title: "工商年报预填资料确认", category: "工商", due: "2026-12-31", owner: "AI 助手", priority: "低", status: "待办", note: "年报系统将在 1 月开放，提前准备社保与股东信息。" },
  { id: "task-7", title: "商标“易康”续展材料准备", category: "知识产权", due: "2027-01-12", owner: "创始人", priority: "低", status: "待办", note: "有效期至 2027-07，建议提前 6 个月启动。" },
  { id: "task-8", title: "10 月发票归档", category: "税务", due: "2026-11-01", owner: "AI 助手", priority: "低", status: "已完成", note: "已自动归档 18 张发票。" },
  { id: "task-9", title: "对公账户月度对账", category: "银行", due: "2026-10-31", owner: "AI 助手", priority: "中", status: "已完成", note: "账实一致，差异 0 元。" },
  { id: "task-10", title: "三季度增值税申报", category: "税务", due: "2026-10-24", owner: "代账 · 小周", priority: "高", status: "已完成", note: "已申报，回执已归档。" },
];

const transactionRows = [
  { id: "tx-0", title: "企业 AI 咨询 · 单次工作坊", date: "2026-11-05", type: "收入", category: "内容收入", amount: 13200, account: "网商银行", status: "已到账", invoice: "已开票" },
  { id: "tx-11", title: "年度审计预付", date: "2026-11-04", type: "支出", category: "财税服务", amount: 8000, account: "网商银行", status: "已支付", invoice: "已开票" },
  { id: "tx-1", title: "杭州蓝岸品牌 · 项目尾款", date: "2026-11-04", type: "收入", category: "项目收入", amount: 18000, account: "网商银行", status: "已到账", invoice: "已开票" },
  { id: "tx-12", title: "阿里云 · 年度算力续费", date: "2026-11-02", type: "支出", category: "算力与云", amount: 6000, account: "网商银行", status: "已支付", invoice: "已开票" },
  { id: "tx-13", title: "视觉设计外包尾款", date: "2026-11-01", type: "支出", category: "外包与协作", amount: 4000, account: "支付宝", status: "已支付", invoice: "已开票" },
  { id: "tx-14", title: "客户拜访差旅 · 南京", date: "2026-11-01", type: "支出", category: "差旅", amount: 1780, account: "支付宝", status: "已支付", invoice: "待取票" },
  { id: "tx-2", title: "阿里云 · 11 月算力", date: "2026-11-03", type: "支出", category: "算力与云", amount: 1280, account: "支付宝", status: "已支付", invoice: "待取票" },
  { id: "tx-3", title: "代理记账 · 11 月服务费", date: "2026-11-02", type: "支出", category: "财税服务", amount: 300, account: "支付宝", status: "已支付", invoice: "已开票" },
  { id: "tx-4", title: "上海栖野科技 · 月度订阅", date: "2026-11-01", type: "收入", category: "订阅收入", amount: 6800, account: "网商银行", status: "已到账", invoice: "已开票" },
  { id: "tx-5", title: "园区注册地址续费", date: "2026-10-30", type: "支出", category: "场地与地址", amount: 4000, account: "网商银行", status: "已支付", invoice: "已开票" },
  { id: "tx-6", title: "视觉设计外包", date: "2026-10-28", type: "支出", category: "外包与协作", amount: 2400, account: "支付宝", status: "已支付", invoice: "待取票" },
  { id: "tx-7", title: "深圳木棉工作室 · 项目首款", date: "2026-10-25", type: "收入", category: "项目收入", amount: 12000, account: "网商银行", status: "已到账", invoice: "已开票" },
  { id: "tx-8", title: "灵活就业社保", date: "2026-10-20", type: "支出", category: "社保", amount: 1450, account: "网商银行", status: "已支付", invoice: "无需开票" },
  { id: "tx-9", title: "AI 课程分销", date: "2026-10-15", type: "收入", category: "内容收入", amount: 3200, account: "支付宝", status: "已到账", invoice: "已开票" },
  { id: "tx-10", title: "客户拜访差旅", date: "2026-10-10", type: "支出", category: "差旅", amount: 860, account: "支付宝", status: "已支付", invoice: "待取票" },
];

const clientRows = [
  { id: "client-1", name: "杭州蓝岸品牌", contact: "陈女士", project: "品牌升级与官网", amount: 48000, received: 28800, stage: "交付中", nextAction: "11-08 提交第二版视觉稿", due: "2026-11-18", note: "第二期款项已过合同节点，本周跟进。" },
  { id: "client-2", name: "深圳木棉工作室", contact: "木棉", project: "小程序 MVP 开发", amount: 32000, received: 16000, stage: "交付中", nextAction: "11-12 联调支付回调", due: "2026-11-28", note: "首款已到，尾款与上线验收绑定。" },
  { id: "client-3", name: "杭州见山文化", contact: "周先生", project: "内容代运营（季度）", amount: 12000, received: 0, stage: "已签约", nextAction: "11-06 寄送合同原件", due: "2026-12-01", note: "合同已签，等待盖章原件。" },
  { id: "client-4", name: "上海栖野科技", contact: "Kiki", project: "AI 内容工作流年框", amount: 20800, received: 0, stage: "续费中", nextAction: "11-15 发送续费报价", due: "2026-11-30", note: "年框到期，续费概率高。" },
  { id: "client-5", name: "杭州云栖教育", contact: "王老师", project: "AI 课程内容共建", amount: 30000, received: 0, stage: "线索", nextAction: "11-07 需求访谈", due: "2026-12-15", note: "教育行业，预算待确认。" },
  { id: "client-6", name: "苏州澜图科技", contact: "刘总", project: "品牌官网改版", amount: 18000, received: 0, stage: "已报价", nextAction: "11-10 跟进报价反馈", due: "2026-12-10", note: "报价已发，等待反馈。" },
];

const policyRows = [
  { id: "policy-1", title: "杭州市人工智能服务券（算力券）", issuer: "杭州市经济和信息化局", city: "杭州", amount: "最高 1,000 万元 / 年", deadline: "2026-12-15", match: 96, tags: "算力, AI, OPC", desc: "面向 AI 原生企业与一人公司，按算力实际使用量抵扣，可与园区补贴叠加。" },
  { id: "policy-2", title: "上城区 OPC 社区场地补贴", issuer: "上城区科技局", city: "杭州", amount: "最高 3 万元 / 年", deadline: "2026-11-30", match: 92, tags: "场地, 社区, OPC", desc: "入驻指定 OPC 社区的一人公司，可按实际工位支出申请 50%–100% 补贴。" },
  { id: "policy-3", title: "浙江省数据知识产权登记", issuer: "浙江省数据知识产权登记中心", city: "浙江", amount: "确权 + 质押融资", deadline: "2026-12-31", match: 88, tags: "数据资产, 知识产权", desc: "将经营数据确权登记，可用于实缴资本抵扣、质押融资与数据资产入表。" },
  { id: "policy-4", title: "软件著作权登记资助", issuer: "上城区市场监督管理局", city: "杭州", amount: "800 元 / 件", deadline: "2026-12-31", match: 90, tags: "软著, 知识产权", desc: "每家企业每年最多资助 5 件，材料齐全后 20 个工作日内拨付。" },
  { id: "policy-5", title: "小微企业招用高校毕业生社保补贴", issuer: "杭州市人力资源和社会保障局", city: "杭州", amount: "1,500 元 / 人", deadline: "2026-12-31", match: 84, tags: "社保, 用工", desc: "招用毕业 2 年内高校毕业生并缴纳社保满 6 个月，可按人申请。" },
  { id: "policy-6", title: "宁波市 OPC 创业保险", issuer: "宁波市人力资源和社会保障局", city: "宁波", amount: "最高 2 万 + 4 万元", deadline: "2026-12-31", match: 71, tags: "保险, 风险", desc: "首次创业失败可获基础补助，带动就业另有奖励；需在宁波注册。" },
];

const dbTasks = {
  id: "db_tasks",
  title: "合规日历",
  icon: "🗓️",
  titleKey: "title",
  groupBy: "status",
  calendarKey: "due",
  description: "按截止时间管理申报、年报、补贴、社保与知识产权事项。",
  properties: [
    { key: "title", label: "事项", type: "title", width: 300 },
    { key: "category", label: "分类", type: "select", width: 100, options: ["税务", "工商", "社保", "知识产权", "补贴", "银行"] },
    { key: "due", label: "截止日", type: "date", width: 130 },
    { key: "owner", label: "负责人", type: "text", width: 130 },
    { key: "priority", label: "优先级", type: "select", width: 95, options: ["高", "中", "低"] },
    { key: "status", label: "状态", type: "status", width: 105, options: ["待办", "已完成"] },
  ],
  rows: taskRows,
};

const dbFinance = {
  id: "db_finance",
  title: "资金台账",
  icon: "💰",
  titleKey: "title",
  groupBy: "type",
  calendarKey: "date",
  description: "收入、支出、账户与发票，一页看清现金流。",
  properties: [
    { key: "title", label: "交易", type: "title", width: 280 },
    { key: "date", label: "日期", type: "date", width: 120 },
    { key: "type", label: "类型", type: "select", width: 90, options: ["收入", "支出"] },
    { key: "category", label: "分类", type: "select", width: 120, options: ["项目收入", "订阅收入", "内容收入", "算力与云", "财税服务", "场地与地址", "外包与协作", "差旅", "社保"] },
    { key: "amount", label: "金额", type: "money", width: 120 },
    { key: "account", label: "账户", type: "select", width: 120, options: ["网商银行", "支付宝"] },
    { key: "status", label: "状态", type: "status", width: 105, options: ["已到账", "已支付", "待处理"] },
    { key: "invoice", label: "发票", type: "select", width: 100, options: ["已开票", "待取票", "无需开票"] },
  ],
  rows: transactionRows,
};

const dbClients = {
  id: "db_clients",
  title: "客户与合同",
  icon: "🤝",
  titleKey: "name",
  groupBy: "stage",
  calendarKey: "due",
  description: "从线索到回款，把客户、合同和下一步放在一起。",
  properties: [
    { key: "name", label: "客户", type: "title", width: 210 },
    { key: "project", label: "项目", type: "text", width: 210 },
    { key: "amount", label: "合同额", type: "money", width: 110 },
    { key: "received", label: "已回款", type: "money", width: 110 },
    { key: "stage", label: "阶段", type: "status", width: 100, options: ["线索", "已报价", "已签约", "交付中", "续费中"] },
    { key: "due", label: "截止日", type: "date", width: 120 },
    { key: "nextAction", label: "下一步", type: "text", width: 240 },
    { key: "contact", label: "联系人", type: "text", width: 100 },
  ],
  rows: clientRows,
};

const dbPolicies = {
  id: "db_policies",
  title: "政策雷达",
  icon: "📡",
  titleKey: "title",
  groupBy: "city",
  calendarKey: "deadline",
  description: "按城市、行业与主体匹配政策，加入合规日历。",
  properties: [
    { key: "title", label: "政策", type: "title", width: 310 },
    { key: "city", label: "城市", type: "select", width: 90, options: ["杭州", "浙江", "宁波"] },
    { key: "amount", label: "额度", type: "text", width: 170 },
    { key: "deadline", label: "截止", type: "date", width: 120 },
    { key: "match", label: "匹配", type: "number", width: 80 },
    { key: "issuer", label: "机构", type: "text", width: 220 },
    { key: "tags", label: "标签", type: "tags", width: 180 },
  ],
  rows: policyRows,
};

const companyBlocks = [
  { id: "b-c1", type: "paragraph", text: "易康科技是一家一人公司，做 AI 内容与企业服务。这个页面是公司的单一事实源：主体、银行、资质、合同模板与关键节点都在这里。" },
  { id: "b-c2", type: "callout", icon: "🧭", text: "公司档案不是静态资料柜。每次申报、开户、签约、融资，都应该回到这里更新一次。" },
  { id: "b-c3", type: "heading2", text: "主体信息" },
  { id: "b-c4", type: "bulleted", text: "统一社会信用代码：91330106MA2K9X8L7Q" },
  { id: "b-c5", type: "bulleted", text: "成立时间：2025-03-18 · 注册资本 10 万元（认缴）" },
  { id: "b-c6", type: "bulleted", text: "纳税人类型：小规模纳税人 · 软件与信息服务" },
  { id: "b-c7", type: "heading2", text: "银行与账户" },
  { id: "b-c8", type: "paragraph", text: "网商银行对公账户 · 尾号 8821；支付宝企业账户用于小额收款与支出。建议每月 1 日完成对账。" },
  { id: "b-c9", type: "heading2", text: "年度合规节奏" },
  { id: "b-c10", type: "todo", text: "1 月：工商年报预填", checked: false },
  { id: "b-c11", type: "todo", text: "3 月：年度审计 / 财产独立性专项", checked: false },
  { id: "b-c12", type: "todo", text: "5 月：汇算清缴", checked: false },
  { id: "b-c13", type: "todo", text: "12 月：地址、社保基数、商标续展检查", checked: false },
  { id: "b-c14", type: "divider", text: "" },
  { id: "b-c15", type: "paragraph", text: "最后更新：2026-11-05 · 维护人：周子博" },
];

const weeklyBlocks = [
  { id: "b-w1", type: "callout", icon: "📌", text: "本周主题：把合规待办清完，把蓝岸尾款收回，把 OPC OS 的新版信息架构定下来。" },
  { id: "b-w2", type: "heading2", text: "本周关键进展" },
  { id: "b-w3", type: "bulleted", text: "完成 3 个 OPC 社区的试点签约，合计 18 万元合同。" },
  { id: "b-w4", type: "bulleted", text: "OPC OS v2 完成「页面 + 数据库 + AI」的整合原型。" },
  { id: "b-w5", type: "bulleted", text: "蓝岸品牌第二版视觉稿交付，尾款进入催收。" },
  { id: "b-w6", type: "heading2", text: "数字" },
  { id: "b-w7", type: "paragraph", text: "本月收入 ¥38,000，支出 ¥21,360，净现金流 ¥16,640；可支配现金 ¥86,400，约 4.2 个月安全垫。" },
  { id: "b-w8", type: "heading2", text: "下周计划" },
  { id: "b-w9", type: "todo", text: "11-09 前完成增值税申报", checked: false },
  { id: "b-w10", type: "todo", text: "11-08 提交蓝岸第二版视觉稿并催款", checked: false },
  { id: "b-w11", type: "todo", text: "把「合规日历」模板开放给 3 个社区试用", checked: false },
  { id: "b-w12", type: "quote", text: "老板不是 CEO，而是公司唯一的人肉集成层。把集成交给系统，把判断留给自己。" },
];

const notesBlocks = [
  { id: "b-n1", type: "paragraph", text: "记录产品判断、用户访谈和下一版 OPC OS 的想法。不要写成会议纪要，写成可以复用的结论。" },
  { id: "b-n2", type: "heading2", text: "一个判断" },
  { id: "b-n3", type: "quote", text: "一人公司买的不是工具，是「有人替我记住」。" },
  { id: "b-n4", type: "paragraph", text: "所以 OPC OS 的首页不应该是一个仪表盘，而应该是一个「今天需要你决定什么」的收件箱。" },
  { id: "b-n5", type: "heading2", text: "待验证" },
  { id: "b-n6", type: "todo", text: "访谈 5 个 OPC：他们每天打开的第一个工作软件是什么？", checked: false },
  { id: "b-n7", type: "todo", text: "测试「合规日历 + 数据库视图」是否能替代微信群提醒。", checked: false },
  { id: "b-n8", type: "todo", text: "把 AI 建议限制在「起草 + 解释」，不要自动发。", checked: true },
];

const governancePolicies = [
  {
    id: "pol-tax-filing",
    name: "税务申报：本人批准 + 证据齐全",
    description: "AI 可以生成申报草稿，但导出或提交前必须由创始人确认，并具备申报记录、发票/流水、政策口径与上期回执。",
    risk: "L3",
    tool: "tax.export",
    requirements: ["owner_approval", "evidence_complete"],
    version: 1,
  },
  {
    id: "pol-money-received",
    name: "资金核销：本人批准 + 双证据",
    description: "收款确认会改变应收与现金流，必须同时核对银行流水与合同节点，再由创始人批准。",
    risk: "L3",
    tool: "ledger.mark_received",
    requirements: ["owner_approval", "evidence_complete"],
    version: 1,
  },
  {
    id: "pol-contract-send",
    name: "对外合同：本人批准 + 版本锁定",
    description: "合同对外发送前锁定价款、交付范围和签署主体；AI 只能准备，不能代替你发送。",
    risk: "L2",
    tool: "contract.send",
    requirements: ["owner_approval", "version_lock"],
    version: 1,
  },
];

const governanceWorkflows = [
  {
    id: "wf_tax_202611",
    title: "2026 年 11 月增值税申报",
    type: "compliance_filing",
    pageId: "compliance",
    relatedPageIds: ["finance", "home"],
    dbId: "db_tasks",
    rowId: "task-2",
    owner: "周子博",
    approver: "周子博",
    risk: "L3",
    state: "pending_approval",
    policyId: "pol-tax-filing",
    nextStep: "核对 3 张进项发票，批准后导出申报表",
    due: "2026-11-09",
    createdAt: "2026-11-03T09:12:00+08:00",
    updatedAt: "2026-11-05T09:20:00+08:00",
    action: {
      id: "act_tax_202611",
      tool: "tax.export",
      label: "导出增值税申报表",
      summary: "按小规模纳税人口径生成 2026-11 增值税及附加税费申报表，预计应缴 ¥1,260。",
      params: { period: "2026-11", amount: 1260, taxType: "增值税及附加" },
      risk: "L3",
      status: "proposed",
      idempotencyKey: "tax-2026-11-v1",
      proposedAt: "2026-11-05T09:20:00+08:00",
    },
    evidence: [
      { id: "ev-tax-row", kind: "row", label: "合规日历 · 增值税申报", status: "verified", ref: "db_tasks/task-2", detail: "截止 11-09 · 优先级高 · 负责人 代账·小周" },
      { id: "ev-tax-invoices", kind: "ledger", label: "进项发票 3 张", status: "verified", ref: "db_finance", detail: "合计进项 ¥3,840，抵扣后预计应缴 ¥1,260" },
      { id: "ev-tax-policy", kind: "policy", label: "小规模纳税人申报口径", status: "verified", ref: "policy/tax-2026-11", detail: "2026 年 11 月申报期，按季度申报" },
      { id: "ev-tax-receipt", kind: "file", label: "上期申报回执", status: "missing", ref: "", detail: "缺少 2026-10 申报回执，补录后才能批准" },
    ],
    approvals: [],
    result: null,
  },
  {
    id: "wf_receivable_lanan",
    title: "蓝岸品牌尾款到账确认",
    type: "receivable_reconciliation",
    pageId: "clients",
    relatedPageIds: ["finance", "home"],
    dbId: "db_clients",
    rowId: "client-1",
    owner: "周子博",
    approver: "周子博",
    risk: "L3",
    state: "pending_approval",
    policyId: "pol-money-received",
    nextStep: "核对银行流水与合同节点，批准后核销应收",
    due: "2026-11-08",
    createdAt: "2026-11-04T16:40:00+08:00",
    updatedAt: "2026-11-05T08:55:00+08:00",
    action: {
      id: "act_receivable_lanan",
      tool: "ledger.mark_received",
      label: "确认 ¥19,200 到账并核销应收",
      summary: "蓝岸品牌项目尾款已入网商银行。批准后把客户合同的已回款从 ¥28,800 更新为 ¥48,000。",
      params: { clientId: "client-1", amount: 19200, account: "网商银行" },
      risk: "L3",
      status: "proposed",
      idempotencyKey: "receivable-client-1-2026-11",
      proposedAt: "2026-11-05T08:55:00+08:00",
    },
    evidence: [
      { id: "ev-recv-bank", kind: "bank", label: "网商银行入账流水", status: "verified", ref: "bank/2026-11-04/19200", detail: "付款方：杭州蓝岸品牌 · 金额 ¥19,200" },
      { id: "ev-recv-contract", kind: "contract", label: "蓝岸品牌合同节点", status: "verified", ref: "db_clients/client-1", detail: "第二期款与视觉稿验收绑定" },
      { id: "ev-recv-invoice", kind: "invoice", label: "对应发票", status: "verified", ref: "invoice/2026-10/018", detail: "发票金额 ¥19,200，已交付客户" },
    ],
    approvals: [],
    result: null,
  },
  {
    id: "wf_contract_jianshan",
    title: "见山文化合同发送",
    type: "contract_send",
    pageId: "clients",
    relatedPageIds: ["home"],
    dbId: "db_clients",
    rowId: "client-3",
    owner: "周子博",
    approver: "周子博",
    risk: "L2",
    state: "pending_approval",
    policyId: "pol-contract-send",
    nextStep: "确认签署主体与回寄地址，批准后发送合同",
    due: "2026-11-06",
    createdAt: "2026-11-04T11:10:00+08:00",
    updatedAt: "2026-11-05T10:05:00+08:00",
    action: {
      id: "act_contract_jianshan",
      tool: "contract.send",
      label: "发送合同定稿并请求盖章",
      summary: "把季度内容代运营合同发送给周先生，附盖章说明、回寄地址和电子签备选方案。",
      params: { clientId: "client-3", template: "内容代运营-季度", amount: 12000 },
      risk: "L2",
      status: "proposed",
      idempotencyKey: "contract-client-3-v2",
      proposedAt: "2026-11-05T10:05:00+08:00",
      versionLocked: true,
    },
    evidence: [
      { id: "ev-contract-draft", kind: "file", label: "合同定稿 v2", status: "verified", ref: "contract/client-3/v2", detail: "签署主体：杭州见山文化 · 金额 ¥12,000" },
      { id: "ev-contract-scope", kind: "row", label: "交付范围", status: "verified", ref: "db_clients/client-3", detail: "季度内容代运营 · 12 条内容/月" },
      { id: "ev-contract-identity", kind: "note", label: "签署主体核验", status: "verified", ref: "company/profile", detail: "统一社会信用代码已核对" },
    ],
    approvals: [],
    result: null,
  },
  {
    id: "wf_invoice_oct",
    title: "10 月发票归档",
    type: "invoice_archive",
    pageId: "compliance",
    relatedPageIds: ["finance"],
    dbId: "db_tasks",
    rowId: "task-8",
    owner: "AI 助手",
    approver: "周子博",
    risk: "L1",
    state: "closed",
    policyId: "pol-tax-filing",
    nextStep: "已归档，保留 18 张发票与对账回执",
    due: "2026-11-01",
    createdAt: "2026-11-01T18:00:00+08:00",
    updatedAt: "2026-11-01T18:22:00+08:00",
    action: {
      id: "act_invoice_oct",
      tool: "archive.invoices",
      label: "归档 10 月发票",
      summary: "将 18 张发票按税号、金额、日期归档，生成月度索引。",
      params: { month: "2026-10", count: 18 },
      risk: "L1",
      status: "executed",
      idempotencyKey: "invoice-archive-2026-10",
      proposedAt: "2026-11-01T18:00:00+08:00",
    },
    evidence: [
      { id: "ev-invoice-index", kind: "file", label: "18 张发票索引", status: "verified", ref: "archive/2026-10/invoices", detail: "发票合计 ¥38,420" },
      { id: "ev-invoice-receipt", kind: "receipt", label: "归档回执", status: "verified", ref: "archive/2026-10/receipt", detail: "归档时间 2026-11-01 18:22" },
    ],
    approvals: [
      { id: "ap-invoice-oct", decision: "approved", approver: "周子博", reason: "发票数量与台账一致", at: "2026-11-01T18:21:00+08:00" },
    ],
    result: { label: "已归档 18 张发票", at: "2026-11-01T18:22:00+08:00", demo: true },
  },
];

const governanceEvents = [
  { id: "evt-g5", type: "workflow.approved", actor: "周子博", at: "2026-11-01T18:21:00+08:00", payload: { workflowId: "wf_invoice_oct", decision: "approved" } },
  { id: "evt-g6", type: "workflow.executed", actor: "系统", at: "2026-11-01T18:22:00+08:00", payload: { workflowId: "wf_invoice_oct", result: "已归档 18 张发票" } },
  { id: "evt-g1", type: "workflow.created", actor: "AI 助手", at: "2026-11-03T09:12:00+08:00", payload: { workflowId: "wf_tax_202611", title: "2026 年 11 月增值税申报" } },
  { id: "evt-g3", type: "action.proposed", actor: "AI 助手", at: "2026-11-05T08:55:00+08:00", payload: { workflowId: "wf_receivable_lanan", actionId: "act_receivable_lanan", risk: "L3" } },
  { id: "evt-g2", type: "action.proposed", actor: "AI 助手", at: "2026-11-05T09:20:00+08:00", payload: { workflowId: "wf_tax_202611", actionId: "act_tax_202611", risk: "L3" } },
  { id: "evt-g4", type: "action.proposed", actor: "AI 助手", at: "2026-11-05T10:05:00+08:00", payload: { workflowId: "wf_contract_jianshan", actionId: "act_contract_jianshan", risk: "L2" } },
];

export const seed = {
  version: 6,
  workspace: {
    name: "易康科技",
    icon: "W",
    plan: "Pro",
    owner: "周子博",
    role: "创始人 / 唯一股东",
  },
  accounts: [
    { id: "acc-1", name: "网商银行", detail: "对公账户 · 尾号 8821", balance: 73600, type: "bank" },
    { id: "acc-2", name: "支付宝企业账户", detail: "收款与小额支出", balance: 12800, type: "wallet" },
  ],
  pages: [
    {
      id: "home",
      title: "今日驾驶舱",
      icon: "☀️",
      kind: "dashboard",
      parentId: null,
      favorite: true,
      cover: "aurora",
      description: "今天需要你决定什么。",
      updated: "刚刚",
      comments: [],
    },
    {
      id: "compliance",
      title: "合规日历",
      icon: "🗓️",
      kind: "database",
      dbId: "db_tasks",
      parentId: null,
      favorite: true,
      cover: "mint",
      description: "申报、年报、补贴、社保与知识产权。",
      updated: "2 小时前",
      comments: [],
    },
    {
      id: "finance",
      title: "资金台账",
      icon: "💰",
      kind: "database",
      dbId: "db_finance",
      parentId: null,
      favorite: false,
      cover: "sand",
      description: "收入、支出、账户与发票。",
      updated: "昨天",
      comments: [],
    },
    {
      id: "clients",
      title: "客户与合同",
      icon: "🤝",
      kind: "database",
      dbId: "db_clients",
      parentId: null,
      favorite: true,
      cover: "rose",
      description: "从线索到回款。",
      updated: "昨天",
      comments: [],
    },
    {
      id: "policies",
      title: "政策雷达",
      icon: "📡",
      kind: "database",
      dbId: "db_policies",
      parentId: null,
      favorite: false,
      cover: "violet",
      description: "城市、行业与主体匹配。",
      updated: "3 天前",
      comments: [],
    },
    {
      id: "company",
      title: "公司档案",
      icon: "🏛️",
      kind: "doc",
      parentId: null,
      favorite: false,
      cover: "navy",
      description: "主体、银行、资质与年度节奏。",
      updated: "2026-11-05",
      blocks: structuredClone(companyBlocks),
      comments: [
        { id: "c-1", author: "周子博", text: "把年度审计加进 12 月待办。", time: "11-04 18:20" },
      ],
    },
    {
      id: "weekly",
      title: "第 45 周经营周报",
      icon: "📄",
      kind: "doc",
      parentId: "company",
      favorite: false,
      cover: "paper",
      description: "每周一页，写给下一周的自己。",
      updated: "今天 09:12",
      blocks: structuredClone(weeklyBlocks),
      comments: [],
    },
    {
      id: "notes",
      title: "产品想法",
      icon: "💡",
      kind: "doc",
      parentId: null,
      favorite: false,
      cover: "sunset",
      description: "判断、访谈与下一版。",
      updated: "2 天前",
      blocks: structuredClone(notesBlocks),
      comments: [],
    },
  ],
  databases: {
    db_tasks: dbTasks,
    db_finance: dbFinance,
    db_clients: dbClients,
    db_policies: dbPolicies,
  },
  templates: [
    {
      id: "tpl-weekly",
      title: "经营周报",
      desc: "一页写清本周进展、数字、下周计划和一句判断。",
      icon: "📄",
      category: "经营",
      kind: "doc",
      blocks: structuredClone(weeklyBlocks),
    },
    {
      id: "tpl-meeting",
      title: "会议纪要",
      desc: "会前问题、会中结论、会后动作，全部带负责人。",
      icon: "🗣️",
      category: "协作",
      kind: "doc",
      blocks: [
        { id: uid("b"), type: "heading2", text: "会议信息" },
        { id: uid("b"), type: "paragraph", text: "时间 / 参会人 / 目标：" },
        { id: uid("b"), type: "heading2", text: "会前问题" },
        { id: uid("b"), type: "bulleted", text: "这次会议必须决定什么？" },
        { id: uid("b"), type: "heading2", text: "结论" },
        { id: uid("b"), type: "paragraph", text: "写下已经达成共识的结论。" },
        { id: uid("b"), type: "heading2", text: "行动项" },
        { id: uid("b"), type: "todo", text: "动作 · 负责人 · 截止日", checked: false },
      ],
    },
    {
      id: "tpl-bp",
      title: "融资 BP 提纲",
      desc: "从公司现状、经营、优势、财务到融资需求。",
      icon: "📈",
      category: "融资",
      kind: "doc",
      pro: true,
      blocks: [
        { id: uid("b"), type: "heading1", text: "一页纸 BP" },
        { id: uid("b"), type: "callout", icon: "🎯", text: "一句话：为谁、解决什么问题、为什么是你。" },
        { id: uid("b"), type: "heading2", text: "1. 公司现状" },
        { id: uid("b"), type: "paragraph", text: "阶段、产品、客户、收入。" },
        { id: uid("b"), type: "heading2", text: "2. 市场与竞争" },
        { id: uid("b"), type: "heading2", text: "3. 商业模式" },
        { id: uid("b"), type: "heading2", text: "4. 财务预测" },
        { id: uid("b"), type: "heading2", text: "5. 融资需求" },
      ],
    },
    {
      id: "tpl-okr",
      title: "个人 OKR",
      desc: "一个季度 3 个目标，每个目标 3 个关键结果。",
      icon: "🎯",
      category: "目标",
      kind: "doc",
      blocks: [
        { id: uid("b"), type: "heading1", text: "2026 Q4 OKR" },
        { id: uid("b"), type: "heading2", text: "O1 · 让公司更稳" },
        { id: uid("b"), type: "todo", text: "KR1：合规零逾期", checked: false },
        { id: uid("b"), type: "todo", text: "KR2：现金安全垫 ≥ 6 个月", checked: false },
        { id: uid("b"), type: "todo", text: "KR3：年度审计完成", checked: false },
        { id: uid("b"), type: "heading2", text: "O2 · 让收入更稳" },
        { id: uid("b"), type: "todo", text: "KR1：签约 3 个年框客户", checked: false },
      ],
    },
    {
      id: "tpl-crm",
      title: "客户 CRM",
      desc: "线索、报价、签约、交付、续费，一条数据库管完。",
      icon: "🤝",
      category: "数据库",
      kind: "database",
      pro: true,
      db: {
        title: "客户 CRM",
        titleKey: "name",
        groupBy: "stage",
        calendarKey: "due",
        description: "从线索到回款。",
        properties: structuredClone(dbClients.properties),
        rows: [],
      },
    },
    {
      id: "tpl-content",
      title: "内容日历",
      desc: "选题、渠道、状态、发布日期，一屏排完。",
      icon: "🗓️",
      category: "数据库",
      kind: "database",
      pro: true,
      db: {
        title: "内容日历",
        titleKey: "title",
        groupBy: "status",
        calendarKey: "publish",
        description: "选题、制作、发布与复盘。",
        properties: [
          { key: "title", label: "选题", type: "title", width: 300 },
          { key: "channel", label: "渠道", type: "select", width: 110, options: ["公众号", "小红书", "视频号", "Newsletter"] },
          { key: "publish", label: "发布日期", type: "date", width: 130 },
          { key: "owner", label: "负责人", type: "text", width: 120 },
          { key: "status", label: "状态", type: "status", width: 110, options: ["选题", "写作中", "待发布", "已发布"] },
        ],
        rows: [],
      },
    },
    {
      id: "tpl-compliance",
      title: "合规日历",
      desc: "申报、年报、补贴、社保、知识产权，带截止日视图。",
      icon: "🗓️",
      category: "数据库",
      kind: "database",
      pro: true,
      db: {
        title: "合规日历",
        titleKey: "title",
        groupBy: "status",
        calendarKey: "due",
        description: "按截止时间管理合规事项。",
        properties: structuredClone(dbTasks.properties),
        rows: [],
      },
    },
  ],
  governance: {
    actor: "周子博",
    policies: governancePolicies,
    workflows: governanceWorkflows,
    events: governanceEvents,
  },
  seo: {
    site: {
      name: "易康科技",
      url: "https://yikang.example",
      titleTemplate: "%s · 易康科技",
      defaultTitle: "易康科技 · 一人公司的 AI 内容与企业服务",
      defaultDescription: "易康科技是杭州的一人公司，提供 AI 内容工作流、企业培训与轻量咨询。用 OPC OS 把合规、资金、客户和政策放在一个工作空间里。",
      language: "zh-CN",
      logo: "/assets/favicon.svg",
      email: "1285989844@qq.com",
      phone: "",
      addressLocality: "杭州",
      addressRegion: "浙江",
      areaServed: "杭州 / 全国远程",
      sameAs: [],
      aiCrawlerPolicy: "allow",
      llmsIntro: "易康科技的公开知识库：一人公司、AI 内容工作流、企业服务与 OPC 合规。",
      facts: [
        "易康科技是一家位于杭州的一人公司，专注 AI 内容工作流与企业服务。",
        "核心服务包括 AI 内容工作流搭建、企业培训与轻量咨询。",
        "使用 OPC OS 管理工作流、合规、资金、客户与政策。",
      ],
    },
    pages: {
      home: {
        visibility: "public",
        slug: "",
        title: "易康科技 · 一人公司的 AI 内容与企业服务",
        description: "易康科技是杭州的一人公司，提供 AI 内容工作流、企业培训与轻量咨询。用 OPC OS 把合规、资金、客户和政策放在一个工作空间里。",
        keywords: ["一人公司", "OPC", "AI 内容", "企业服务", "杭州"],
        schemaType: "Service",
        answer: "易康科技是一家位于杭州的一人公司，专注 AI 内容工作流与企业服务，帮助小型团队把内容生产、客户交付和合规管理跑成可复用的系统。",
        targetQueries: ["杭州一人公司 AI 内容服务", "一人公司如何搭建内容工作流", "OPC 一人公司是什么"],
        faqs: [
          { q: "易康科技做什么？", a: "做 AI 内容工作流、企业培训与轻量咨询，服务一人公司和小型团队。" },
          { q: "易康科技在哪里？", a: "总部在杭州，服务全国远程客户。" },
          { q: "OPC 是什么？", a: "One Person Company，一人公司：一个人借助 AI 和外部服务完成产品、交付与经营闭环。" },
        ],
        sources: ["公司档案 · 主体信息", "第 45 周经营周报", "政策雷达 · 杭州 AI 服务券"],
        updated: "2026-11-16",
      },
      company: {
        visibility: "public",
        slug: "about",
        title: "关于易康科技 · 一人公司档案",
        description: "易康科技的主体信息、银行账户、资质、年度合规节奏与对外合作方式。一个一人公司的公开档案。",
        keywords: ["易康科技", "一人公司", "公司档案", "杭州"],
        schemaType: "AboutPage",
        answer: "易康科技是一家 2025 年成立于杭州的一人公司，做 AI 内容与企业服务，采用小规模、项目制、远程协作的方式运营。",
        targetQueries: ["易康科技是谁", "一人公司公司档案包含什么"],
        faqs: [
          { q: "易康科技什么时候成立？", a: "2025 年 3 月 18 日成立于杭州。" },
          { q: "易康科技怎么合作？", a: "以项目制或月度顾问方式合作，先做需求诊断，再给交付范围与报价。" },
        ],
        sources: ["公司档案 · 主体信息", "公司档案 · 银行与账户"],
        updated: "2026-11-16",
      },
      policies: {
        visibility: "public",
        slug: "policies",
        title: "OPC 政策雷达 · 一人公司补贴与合规",
        description: "按城市、行业和主体匹配杭州、浙江与宁波的 OPC 政策，包含算力券、场地补贴、软著资助与创业保险。",
        keywords: ["OPC 政策", "一人公司补贴", "杭州算力券", "浙江创业政策"],
        schemaType: "CollectionPage",
        answer: "OPC 政策雷达整理杭州、浙江和宁波与一人公司相关的算力券、场地补贴、软著资助和创业保险，按匹配度与截止日排序。",
        targetQueries: ["杭州一人公司有什么补贴", "OPC 社区场地补贴怎么申请", "浙江 AI 算力券政策"],
        faqs: [
          { q: "杭州一人公司能申请算力券吗？", a: "符合 AI 原生企业或一人公司条件可按实际算力使用量申请，具体以当期政策为准。" },
          { q: "场地补贴和社区免租能叠加吗？", a: "部分园区政策可叠加，需分别核对申报条件与兑现口径。" },
        ],
        sources: ["杭州市人工智能服务券政策", "上城区 OPC 社区场地补贴", "浙江省数据知识产权登记"],
        updated: "2026-11-16",
      },
      clients: {
        visibility: "private",
        slug: "clients",
        title: "客户与合同 · 内部",
        description: "客户、合同、回款与交付进度，仅工作区内部可见。",
        keywords: ["客户", "合同", "回款"],
        schemaType: "WebPage",
        answer: "内部客户与合同数据库，不对外索引。",
        targetQueries: [],
        faqs: [],
        sources: [],
        updated: "2026-11-16",
      },
    },
  },
  trash: [],
};

export function clone(value) {
  return structuredClone(value);
}

export function getPage(state, id) {
  return state.pages.find((page) => page.id === id) || null;
}

export function getDatabase(state, id) {
  return state.databases[id] || null;
}

export function pageChildren(state, parentId) {
  return state.pages.filter((page) => !page.trashed && page.parentId === parentId);
}

export function pagePath(state, pageId) {
  const result = [];
  let page = getPage(state, pageId);
  while (page) {
    result.unshift(page);
    page = page.parentId ? getPage(state, page.parentId) : null;
  }
  return result;
}

export function formatMoney(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN")}`;
}

export function formatCompact(value) {
  if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(1).replace(".0", "")} 万`;
  return formatMoney(value);
}

export function formatDate(iso, withYear = false) {
  if (!iso || iso === "常年受理") return iso || "—";
  const date = new Date(`${iso}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return withYear ? `${date.getFullYear()} 年 ${month} 月 ${day} 日` : `${month} 月 ${day} 日`;
}

export function shortDate(iso) {
  if (!iso || iso === "常年受理") return iso || "—";
  const date = new Date(`${iso}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function daysUntil(iso) {
  if (!iso || iso === "常年受理") return 999;
  const date = new Date(`${iso}T00:00:00+08:00`);
  const today = new Date(`${DEMO_TODAY}T00:00:00+08:00`);
  return Math.round((date - today) / 86400000);
}

export function dueLabel(iso) {
  const days = daysUntil(iso);
  if (days === 999) return "常年受理";
  if (days < 0) return `逾期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天到期";
  if (days === 1) return "明天到期";
  if (days <= 30) return `${days} 天后到期`;
  return `${Math.round(days / 30)} 个月后到期`;
}

export function metrics(state) {
  const tasks = state.databases.db_tasks.rows;
  const transactions = state.databases.db_finance.rows;
  const clients = state.databases.db_clients.rows;
  const pending = tasks.filter((row) => row.status !== "已完成");
  const overdue = pending.filter((row) => daysUntil(row.due) < 0);
  const dueSoon = pending.filter((row) => daysUntil(row.due) >= 0 && daysUntil(row.due) <= 7);
  const missingDocs = 2;
  const high = pending.filter((row) => row.priority === "高").length;
  const health = Math.max(55, Math.min(100, 100 - overdue.length * 8 - dueSoon.length * 3 - missingDocs - high));
  const cash = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthIncome = transactions.filter((row) => row.type === "收入" && row.date.startsWith("2026-11")).reduce((sum, row) => sum + row.amount, 0);
  const monthExpense = transactions.filter((row) => row.type === "支出" && row.date.startsWith("2026-11")).reduce((sum, row) => sum + row.amount, 0);
  const recentExpense = [19800, 21000, 21360].reduce((sum, value) => sum + value, 0) / 3;
  const receivable = clients.filter((row) => ["已签约", "交付中", "续费中"].includes(row.stage)).reduce((sum, row) => sum + Math.max(0, row.amount - row.received), 0);
  const contracted = clients.filter((row) => ["已签约", "交付中", "续费中"].includes(row.stage));
  return {
    pending,
    overdue,
    dueSoon,
    health,
    cash,
    monthIncome,
    monthExpense,
    netCash: monthIncome - monthExpense,
    runway: (cash / recentExpense).toFixed(1),
    receivable,
    contracted,
    documents: 8,
    doneDocs: 6,
    topPolicies: [...state.databases.db_policies.rows].sort((a, b) => b.match - a.match).slice(0, 3),
    topReceivables: contracted.filter((row) => row.amount > row.received).sort((a, b) => (b.amount - b.received) - (a.amount - a.received)).slice(0, 3),
  };
}

export function rowTitle(db, row) {
  return row[db.titleKey] || row.title || row.name || "未命名";
}

export function property(db, key) {
  return db.properties.find((item) => item.key === key);
}
