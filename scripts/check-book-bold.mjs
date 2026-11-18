import { readdir, readFile } from "node:fs/promises";
import { load } from "cheerio";
import markdownToHtml from "zenn-markdown-html";

const book = new URL("../books/learning-open-usd/", import.meta.url);
const chapters = (await readdir(book)).filter(name => /^open-usd-[a-z0-9-]+\.md$/.test(name)).sort();
if (!chapters.length) throw new Error("検査対象の章が見つかりません。");

for (const name of chapters) {
  const source = await readFile(new URL(name, book), "utf8");
  // 段落の行番号を原稿とそろえたまま、本文だけをレンダリングする。
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, header => header.replace(/[^\n]/g, ""));
  const $ = load(await markdownToHtml(body));
  $("pre, code").remove();

  for (const node of $("*").contents().toArray()) {
    if (node.type !== "text" || !node.data.includes("**")) continue;
    const line = $(node.parent).closest("[data-line]").attr("data-line");
    const excerpt = node.data.match(/.{0,12}\*\*.{0,56}/u)[0];
    console.error(`${name}${line === undefined ? "" : ":" + (Number(line) + 1)}  ${excerpt}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log(`全${chapters.length}章を確認しました。本文のアスタリスク残りは0件です。`);
