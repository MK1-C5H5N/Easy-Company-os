import { icon } from "./icons.js";
import { getDatabase, getPage, rowTitle, shortDate } from "./data.js";
import { esc } from "./utils.js";
import { renderMiniDatabase } from "./database.js";

const insertTypes = [
  { type: "paragraph", label: "文本", hint: "普通段落", glyph: "¶" },
  { type: "heading1", label: "一级标题", hint: "大标题", glyph: "H1" },
  { type: "heading2", label: "二级标题", hint: "章节标题", glyph: "H2" },
  { type: "heading3", label: "三级标题", hint: "小节标题", glyph: "H3" },
  { type: "todo", label: "待办", hint: "可勾选任务", glyph: "☑" },
  { type: "bulleted", label: "无序列表", hint: "项目符号", glyph: "•" },
  { type: "numbered", label: "有序列表", hint: "数字编号", glyph: "1." },
  { type: "callout", label: "重点提示", hint: "带图标的强调块", glyph: "💡" },
  { type: "quote", label: "引用", hint: "引用一段判断", glyph: "❝" },
  { type: "divider", label: "分割线", hint: "视觉分隔", glyph: "—" },
  { type: "code", label: "代码", hint: "等宽代码块", glyph: "</>" },
  { type: "database", label: "数据库", hint: "嵌入已有数据库", glyph: "▦" },
];

export function renderDocContent(state, page, ui) {
  return `<article class="page-doc" data-page-body>
    <div class="doc-blocks">
      ${page.blocks.map((block, index) => renderBlock(state, page, block, index, ui)).join("")}
    </div>
    <button type="button" class="add-block-line" data-action="insert-block" data-page="${page.id}" data-after="${page.blocks.at(-1)?.id || ""}">
      ${icon("plus", 14)} 添加块
    </button>
    <div class="doc-footnote">${icon("sparkles", 13)} 输入 <kbd>/</kbd> 或点击块左侧的 ＋ 插入内容 · 最后编辑 ${esc(page.updated || "刚刚")}</div>
  </article>`;
}

function renderBlock(state, page, block, index, ui) {
  const id = block.id;
  const controls = `<div class="block-controls">
    <button type="button" class="block-control" data-action="insert-block" data-page="${page.id}" data-after="${id}" aria-label="在下方插入">${icon("plus", 13)}</button>
    <button type="button" class="block-control block-control--drag" data-action="block-menu" data-page="${page.id}" data-block="${id}" aria-label="块菜单">${icon("drag", 13)}</button>
  </div>`;

  const wrap = (content, extra = "") => `<div class="block block--${block.type} ${extra}" data-block-id="${id}" data-block-type="${block.type}">
    ${controls}
    <div class="block__content">${content}</div>
  </div>`;

  switch (block.type) {
    case "heading1":
      return wrap(`<h1 class="block-h1" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="一级标题">${esc(block.text)}</h1>`);
    case "heading2":
      return wrap(`<h2 class="block-h2" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="二级标题">${esc(block.text)}</h2>`);
    case "heading3":
      return wrap(`<h3 class="block-h3" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="三级标题">${esc(block.text)}</h3>`);
    case "bulleted":
      return wrap(`<span class="block-marker">•</span><div class="block-text" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="列表项">${esc(block.text)}</div>`, "block--list");
    case "numbered":
      return wrap(`<span class="block-marker block-marker--num">${index + 1}.</span><div class="block-text" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="列表项">${esc(block.text)}</div>`, "block--list");
    case "todo":
      return wrap(`<button type="button" class="todo-check ${block.checked ? "is-done" : ""}" data-action="toggle-todo" data-page="${page.id}" data-block="${id}" aria-label="切换完成">
        ${block.checked ? icon("check", 13) : ""}
      </button>
      <div class="block-text ${block.checked ? "is-done" : ""}" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="待办事项">${esc(block.text)}</div>`, "block--todo");
    case "quote":
      return wrap(`<blockquote class="block-quote" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="引用">${esc(block.text)}</blockquote>`);
    case "callout":
      return wrap(`<div class="callout">
        <span class="callout__icon">${esc(block.icon || "💡")}</span>
        <div class="callout__text" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="重点提示">${esc(block.text)}</div>
      </div>`);
    case "divider":
      return wrap(`<hr class="block-divider"/>`, "block--divider");
    case "code":
      return wrap(`<pre class="block-code"><code contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="代码">${esc(block.text)}</code></pre>`);
    case "toggle":
      return wrap(`<details open class="block-toggle"><summary><span class="toggle-mark">▾</span><span contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}">${esc(block.text)}</span></summary><div class="toggle-body">点击左侧 ＋ 继续添加子内容。</div></details>`);
    case "database": {
      const db = getDatabase(state, block.dbId);
      const dbPage = state.pages.find((item) => item.dbId === block.dbId);
      if (!db || !dbPage) return "";
      return wrap(renderMiniDatabase(state, db.id, dbPage.id));
    }
    default:
      return wrap(`<div class="block-text" contenteditable="true" data-block-text data-page="${page.id}" data-block="${id}" data-placeholder="输入内容，或按 / 插入…">${esc(block.text)}</div>`);
  }
}

export function renderBlockMenu(ui) {
  const menu = ui.blockMenu;
  if (!menu) return "";
  if (menu.mode === "actions") {
    return `<div class="popover-shade" data-action="close-block-menu">
      <div class="block-menu block-menu--actions" data-menu-panel>
        <div class="block-menu__title">块操作</div>
        <button type="button" class="block-menu__item" data-action="duplicate-block" data-block="${menu.blockId}">${icon("copy", 15)} 复制块</button>
        <button type="button" class="block-menu__item" data-action="turn-block" data-block="${menu.blockId}">${icon("refresh", 15)} 转为…</button>
        <button type="button" class="block-menu__item block-menu__item--danger" data-action="delete-block" data-block="${menu.blockId}">${icon("trash", 15)} 删除块</button>
      </div>
    </div>`;
  }
  return `<div class="popover-shade" data-action="close-block-menu">
    <div class="block-menu" data-menu-panel>
      <div class="block-menu__search">${icon("search", 15)}<input id="block-menu-search" placeholder="搜索块类型…" autocomplete="off"/></div>
      <div class="block-menu__title">${menu.replaceId ? "转为块类型" : "基础块"}</div>
      <div class="block-menu__grid">
        ${insertTypes
          .map(
            (item) => `<button type="button" class="block-menu__item" data-action="insert-type" data-type="${item.type}" data-page="${menu.pageId}" data-after="${menu.afterId}" data-replace="${menu.replaceId || ""}">
              <span class="block-menu__glyph">${item.glyph}</span>
              <span><strong>${item.label}</strong><small>${item.hint}</small></span>
            </button>`
          )
          .join("")}
      </div>
      <div class="block-menu__foot">按 <kbd>Esc</kbd> 关闭 · 输入 <kbd>#</kbd> 空格可快速转标题</div>
    </div>
  </div>`;
}

export function insertBlockType(type) {
  if (type === "divider") return { type: "divider", text: "" };
  if (type === "callout") return { type: "callout", text: "写下一个重要判断…", icon: "💡" };
  if (type === "todo") return { type: "todo", text: "", checked: false };
  if (type === "code") return { type: "code", text: "" };
  return { type, text: "" };
}

export function blockMenuMarkup() {
  return insertTypes;
}
