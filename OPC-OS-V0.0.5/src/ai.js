import { daysUntil, dueLabel, formatCompact, metrics } from "./data.js";

export function aiReply(state, page, prompt) {
  const m = metrics(state);
  const text = prompt.toLowerCase();
  const pageTitle = page?.title || "当前页面";

  if (text.includes("周报")) {
    return `我先按 ${pageTitle} 的上下文起草一份周报：

**本周关键进展**
• 合规待办 ${m.pending.length} 项，其中 ${m.overdue.length} 项逾期。
• 本月收入 ${formatCompact(m.monthIncome)}，支出 ${formatCompact(m.monthExpense)}，净现金流 ${formatCompact(m.netCash)}。
• 待回款 ${formatCompact(m.receivable)}，优先跟进 ${m.topReceivables[0]?.name || "高优先级客户"}。

**下周计划**
• 先清逾期，再谈增长。
• 把「合规日历」里的节点同步给代账和园区。
• 把本周的判断写进「产品想法」，不要只留在聊天里。

需要我把这份周报插入当前页面吗？`;
  }

  if (text.includes("税") || text.includes("申报") || text.includes("合规")) {
    return `我从合规日历里看到 ${m.pending.length} 项待办，${m.overdue.length} 项已逾期。

最紧的三件：
${m.pending.slice(0, 3).map((row, i) => `${i + 1}. ${row.title} · ${dueLabel(row.due)} · ${row.owner}`).join("\n")}

建议今天先处理「${m.overdue[0]?.title || m.pending[0]?.title}」。需要我把它加入今日重点，或生成一条提醒吗？`;
  }

  if (text.includes("现金") || text.includes("钱") || text.includes("回款")) {
    return `当前可支配现金 **${formatCompact(m.cash)}**，按近 3 个月平均支出计算，可支撑约 **${m.runway} 个月**。

本月收入 ${formatCompact(m.monthIncome)}，支出 ${formatCompact(m.monthExpense)}，净现金流 ${formatCompact(m.netCash)}。

最值得优先处理的应收：
${m.topReceivables.map((row) => `• ${row.name}：${formatCompact(row.amount - row.received)}（${row.nextAction}）`).join("\n")}`;
  }

  if (text.includes("政策") || text.includes("补贴")) {
    return `匹配度最高的政策是 **${m.topPolicies[0]?.title}**（${m.topPolicies[0]?.match}%），截止 ${m.topPolicies[0]?.deadline}。

另外两项：
${m.topPolicies.slice(1).map((policy) => `• ${policy.title} · ${policy.amount} · ${policy.deadline}`).join("\n")}

建议先准备「${m.topPolicies[0]?.title}」的材料清单。需要我把它加入合规日历吗？`;
  }

  if (text.includes("客户") || text.includes("合同") || text.includes("催款")) {
    const client = m.topReceivables[0];
    return `当前有 ${m.contracted.length} 个进行中的合同，待回款 ${formatCompact(m.receivable)}。

最该跟进的是 **${client?.name || "高优先级客户"}**：
• 合同额：${formatCompact(client?.amount || 0)}
• 已回款：${formatCompact(client?.received || 0)}
• 下一步：${client?.nextAction || "补充下一步"}

我可以起草一封催款邮件，或者把这笔应收加入今日重点。`;
  }

  return `我读完了「${pageTitle}」以及它关联的合规、资金、客户和政策数据。

当前最值得你亲自决定的三件事：
1. ${m.overdue[0] ? `${m.overdue[0].title}（${dueLabel(m.overdue[0].due)}）` : "没有逾期事项，检查下周的截止日"}
2. ${m.topReceivables[0] ? `跟进 ${m.topReceivables[0].name} 的回款 ${formatCompact(m.topReceivables[0].amount - m.topReceivables[0].received)}` : "复盘本月现金流"}
3. ${m.topPolicies[0] ? `准备 ${m.topPolicies[0].title} 的申报材料` : "浏览政策雷达"}

你可以继续问我：“帮我写周报”“这个月要交哪些税”“现金还能撑多久”。`;
}

export function aiSuggestions(state, page) {
  const m = metrics(state);
  return [
    { icon: "📌", label: "今天先做什么", prompt: "今天先做什么？" },
    { icon: "🧾", label: "本月税务节点", prompt: "这个月要交哪些税？" },
    { icon: "💰", label: "现金还能撑多久", prompt: "现金还能撑多久？" },
    { icon: "✍️", label: "起草本周周报", prompt: "帮我写一份本周经营周报" },
  ];
}

export function aiMarkup(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
