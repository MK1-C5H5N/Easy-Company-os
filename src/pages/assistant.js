import { icon } from "../icons.js";
import {
  cashTotal,
  healthScore,
  overdueTasks,
  pendingTasks,
  receivableTotal,
  runwayMonths,
} from "../selectors.js";
import { money } from "../ui.js";

let pending = false;

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatMessage(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function replyFor(input, state) {
  const text = input.toLowerCase();
  const overdue = overdueTasks(state);
  const pendingTasksCount = pendingTasks(state).length;

  if (/税|申报|增值税|个税/.test(input)) {
    return `11 月你需要关注 **2 个申报节点**：\n• 11-09：增值税及附加税费（还有 4 天）\n• 11-15：个人所得税（经营所得）\n\n本期有 **3 笔进项可抵扣**，预计应缴 ¥1,260，比上月少 ¥340。代账小周已收到票据，你只需要在 11-08 前确认银行流水。`;
  }

  if (/社保|基数|灵活就业/.test(input)) {
    return `按杭州灵活就业最低基数测算：\n• 养老 20% + 医疗约 9.5%，合计约 **¥1,470/月**，一年约 ¥1.76 万\n• 如果走公司名义缴纳，单位 + 个人约 **¥1,860/月**\n\n你当前是灵活就业参保，建议保留；等月收入稳定超过 ¥3 万再考虑公司名义缴纳。`;
  }

  if (/报价|邮件|合同|催款/.test(input)) {
    return `这是给杭州蓝岸品牌的催款邮件草稿：\n\n**主题：** 蓝岸品牌项目第二期款项确认\n**正文：** 陈女士您好，第二版视觉稿已于 11-04 交付，按合同约定第二期款项 ¥19,200 已到付款节点。附件为发票与交付清单，麻烦本周内安排付款，谢谢。\n\n需要我直接生成到“客户与合同”里吗？`;
  }

  if (/现金|现金流| runway|支撑|回款/.test(text)) {
    return `当前可支配现金 **${money(cashTotal(state))}**，按近 3 个月平均支出计算，可支撑 **${runwayMonths(state)} 个月**。\n\n最值得优先处理的两笔应收：\n• 杭州蓝岸品牌 ¥19,200（已过合同节点）\n• 深圳木棉工作室 ¥16,000（11-28 到期）\n\n如果本周收回蓝岸，现金可多支撑约 0.9 个月。`;
  }

  if (/政策|补贴|算力券/.test(input)) {
    const top = [...state.policies].sort((a, b) => b.match - a.match)[0];
    return `和你匹配度最高的是 **${top.title}**（${top.match}%）：${top.amount}，截止 ${top.deadline}。\n\n另外，上城区场地补贴（92%）本月 30 日截止，建议优先准备租赁合同与工位照片。需要我把它们加入合规日历吗？`;
  }

  if (/今天|重点|计划|三件/.test(input)) {
    const first = overdue[0];
    return `今天只做 3 件事：\n1. **${first ? first.title : "处理逾期事项"}**${first ? `（已逾期 ${Math.abs(Math.round((new Date(first.due) - new Date("2026-11-05")) / 86400000))} 天）` : ""}\n2. **增值税申报**：11-09 截止，确认 3 笔进项\n3. **催收蓝岸尾款**：¥19,200，已过合同节点\n\n其余 ${Math.max(0, pendingTasksCount - 3)} 项已由 AI 排到下周，不需要今天处理。`;
  }

  if (/你好|hi|hello/.test(text)) {
    return `你好，李然。我是你的 OPC 老板助手，已经接入公司档案、合规日历、资金台账和客户合同。你可以问我：这个月要交哪些税、现金还能撑多久、帮我写一封催款邮件。`;
  }

  return `我基于你的公司档案看了一遍：当前有 **${pendingTasksCount} 项待办**、**${overdue.length} 项逾期**，合规健康分 **${healthScore(state)}**。\n\n你可以把问题说得更具体一些，例如“这个月要交哪些税”“蓝岸的尾款怎么催”“帮我写一份报价邮件”。我也可以直接生成任务、加入合规日历。`;
}

export const assistantPage = {
  title: "AI 老板助手",
  eyebrow: "AI / 经营副驾",
  subtitle: "不是通用聊天框：它能看到你的账、证、客、政策，并把建议直接变成待办。",

  render(state) {
    const messages = state.messages;
    const overdue = overdueTasks(state);
    const pendingCount = pendingTasks(state).length;

    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${this.eyebrow}</p>
          <h1>${this.title}</h1>
          <p class="page-sub">${this.subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn" data-action="clear-chat">${icon("refresh", 15)} 清空对话</button>
          <button class="btn btn--primary" data-action="ask-ai" data-prompt="用三句话总结我今天的经营重点">${icon("sparkles", 15)} 生成今日简报</button>
        </div>
      </div>

      <div class="assistant-layout">
        <section class="card chat-card">
          <header class="chat-card__head">
            <span class="avatar avatar--round" style="--avatar-color:#0E7C6B">AI</span>
            <div>
              <strong>OPC 老板助手</strong>
              <span><i class="status-dot"></i>在线 · 已读取 4 个数据源</span>
            </div>
            <button class="icon-btn tooltip" data-tip="对话仅保存在本地" aria-label="对话信息">${icon("lock", 15)}</button>
          </header>
          <div class="chat-scroll" id="chat-scroll">
            ${messages
              .map(
                (message) => `<div class="msg msg--${message.role}">
                  <span class="msg__avatar">${message.role === "assistant" ? "AI" : "李"}</span>
                  <div class="msg__body">
                    <div class="msg__bubble">${formatMessage(message.text)}</div>
                    <div class="msg__time">${message.time}</div>
                  </div>
                </div>`
              )
              .join("")}
            ${
              pending
                ? `<div class="msg msg--assistant">
                    <span class="msg__avatar">AI</span>
                    <div class="msg__body">
                      <div class="msg__bubble"><span class="typing"><i></i><i></i><i></i></span></div>
                    </div>
                  </div>`
                : ""
            }
          </div>
          <form class="composer" id="chat-form">
            <div class="composer__chips">
              ${["这个月要交哪些税？", "现金还能撑多久？", "帮我写一封催款邮件", "有哪些补贴可以申请？"]
                .map((text) => `<button type="button" class="chip" data-action="ask-ai" data-prompt="${text}">${text}</button>`)
                .join("")}
            </div>
            <div class="composer__box">
              <textarea id="chat-input" rows="1" placeholder="问点什么，例如：帮我排一下本周的优先级…" aria-label="输入问题"></textarea>
              <button class="composer__send" type="submit" aria-label="发送">${icon("send", 15)}</button>
            </div>
            <p class="composer__hint">AI 只做建议，不替代代账/律师的最终判断 · 演示数据保存在浏览器本地</p>
          </form>
        </section>

        <aside class="assistant-side">
          <section class="card side-card">
            <h3>它能做什么</h3>
            <p>基于你的真实经营上下文</p>
            <div class="capability-list">
              <div class="capability"><span class="capability__icon">${icon("shield", 14)}</span><div><strong>合规排期</strong><span>申报、年报、许可、补贴</span></div></div>
              <div class="capability"><span class="capability__icon">${icon("wallet", 14)}</span><div><strong>算账与预测</strong><span>现金流、税负、 runway</span></div></div>
              <div class="capability"><span class="capability__icon">${icon("target", 14)}</span><div><strong>获客与催款</strong><span>商机、报价、回款话术</span></div></div>
              <div class="capability"><span class="capability__icon">${icon("file", 14)}</span><div><strong>生成材料</strong><span>邮件、清单、申报草稿</span></div></div>
            </div>
          </section>

          <section class="card side-card">
            <h3>今日上下文</h3>
            <p>回答会引用这些实时数据</p>
            <div class="context-list">
              <div class="context-row"><span>可支配现金</span><strong>${money(cashTotal(state))}</strong></div>
              <div class="context-row"><span>待办 / 逾期</span><strong>${pendingCount} / <em style="color:var(--red);font-style:normal">${overdue.length}</em></strong></div>
              <div class="context-row"><span>90 天应收</span><strong>${money(receivableTotal(state))}</strong></div>
              <div class="context-row"><span>合规健康分</span><strong>${healthScore(state)} / 100</strong></div>
              <div class="context-row"><span>政策匹配</span><strong>${state.policies.length} 项</strong></div>
            </div>
          </section>

          <section class="card side-card" style="background:linear-gradient(135deg,#0b1b34,#123b42);color:#dbe9e7;border:0">
            <h3 style="color:#fff">建议开启自动执行</h3>
            <p style="color:#9db4c9">让 AI 在截止前 7 天自动创建待办、生成材料并提醒你确认。</p>
            <button class="btn btn--block" style="margin-top:12px;border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff" data-nav="#/profile">${icon("settings", 14)} 配置自动化</button>
          </section>
        </aside>
      </div>
    `;
  },

  bind(root, ctx) {
    const scroll = root.querySelector("#chat-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;

    const form = root.querySelector("#chat-form");
    const input = root.querySelector("#chat-input");
    if (form && input) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text || pending) return;
        sendMessage(text, ctx);
        input.value = "";
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          form.requestSubmit();
        }
      });
    }
  },
};

export function sendMessage(text, ctx) {
  if (pending) return;
  ctx.store.set((state) => {
    state.messages.push({ id: `msg-${Date.now()}`, role: "user", text, time: nowTime() });
  });
  pending = true;
  ctx.rerender();

  const snapshot = ctx.store.state;
  setTimeout(() => {
    const answer = replyFor(text, snapshot);
    ctx.store.set((state) => {
      state.messages.push({ id: `msg-${Date.now()}-a`, role: "assistant", text: answer, time: nowTime() });
    });
    pending = false;
    ctx.rerender();
  }, 780);
}

export function resetChat(ctx) {
  pending = false;
  ctx.store.set((state) => {
    state.messages = [
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        text: "对话已重置。需要我先帮你过一遍 11 月的合规待办吗？",
        time: nowTime(),
      },
    ];
  });
}
