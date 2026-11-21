export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function attr(value) {
  return esc(value).replaceAll("`", "&#096;");
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function download(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return true;
  }
}

export function initials(name) {
  const clean = String(name || "").replace(/[（(].*?[)）]/g, "").trim();
  if (!clean) return "?";
  if (/^[A-Za-z]/.test(clean)) {
    return clean.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  return clean.slice(0, 2);
}

export function toneFor(value) {
  const map = {
    高: "red",
    中: "amber",
    低: "slate",
    待办: "amber",
    已完成: "green",
    已到账: "green",
    已支付: "blue",
    待处理: "amber",
    收入: "green",
    支出: "slate",
    线索: "slate",
    已报价: "amber",
    已签约: "blue",
    交付中: "teal",
    续费中: "purple",
    税务: "blue",
    工商: "amber",
    社保: "purple",
    知识产权: "teal",
    补贴: "green",
    银行: "slate",
    杭州: "teal",
    浙江: "blue",
    宁波: "amber",
  };
  return map[value] || "slate";
}
