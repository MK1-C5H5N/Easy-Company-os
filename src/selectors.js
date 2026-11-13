import { DEMO_TODAY } from "./data.js";

const DAY = 86400000;
export const today = new Date(`${DEMO_TODAY}T00:00:00+08:00`);

export function daysUntil(iso) {
  const target = new Date(`${iso}T00:00:00+08:00`);
  return Math.round((target - today) / DAY);
}

export function cashTotal(state) {
  return state.accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function pendingTasks(state) {
  return state.tasks.filter((task) => task.status !== "done");
}

export function overdueTasks(state) {
  return pendingTasks(state).filter((task) => daysUntil(task.due) < 0);
}

export function dueSoonTasks(state, within = 7) {
  return pendingTasks(state).filter((task) => {
    const days = daysUntil(task.due);
    return days >= 0 && days <= within;
  });
}

export function healthScore(state) {
  const overdue = overdueTasks(state).length;
  const soon = dueSoonTasks(state, 7).length;
  const missingDocs = state.documents.filter((doc) => !doc.done).length;
  const high = pendingTasks(state).filter((task) => task.priority === "high").length;
  return Math.max(55, Math.min(100, 100 - overdue * 8 - soon * 3 - missingDocs * 1 - high * 1));
}

export function receivableTotal(state) {
  const contracted = new Set(["已签约", "交付中", "续费中"]);
  return state.clients
    .filter((client) => contracted.has(client.stage))
    .reduce((sum, client) => sum + Math.max(0, client.amount - client.received), 0);
}

export function monthIncome(state) {
  return state.transactions
    .filter((tx) => tx.type === "income" && tx.date.startsWith("2026-11"))
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function monthExpense(state) {
  return state.transactions
    .filter((tx) => tx.type === "expense" && tx.date.startsWith("2026-11"))
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function completion(state) {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.status === "done").length;
  return Math.round((done / total) * 100);
}

export function runwayMonths(state) {
  const recent = state.monthly.slice(-3);
  const avgExpense = recent.reduce((sum, item) => sum + item.expense, 0) / recent.length;
  return (cashTotal(state) / avgExpense).toFixed(1);
}
