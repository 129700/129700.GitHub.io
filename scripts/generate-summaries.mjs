import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'post');
const OUTPUT = path.join(ROOT, 'src', 'data', 'ai-summaries.json');

const ZHIPU_KEY = '445df3d798f54acf82bb09466b6baac9.wOAegEhfFUpCZOvP';
const API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function parseFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return { data: {}, body: text };
    const fm = match[1];
    const body = text.slice(match[0].length).trim();
    const data = {};
    for (const line of fm.split('\n')) {
        const m = line.match(/^(\w+):\s*(.*)/);
        if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return { data, body };
}

function stripForAI(body) {
    let text = body
        .replace(/```[\s\S]*?```/g, '')           // code blocks
        .replace(/<[^>]+>/g, '')                   // HTML/MDX tags
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // links -> text
        .replace(/!\[.*?\]\([^)]+\)/g, '')          // images
        .replace(/\n{3,}/g, '\n\n')                 // collapse blank lines
        .trim();
    return text.slice(0, 3000);
}

async function generateSummary(title, body) {
    const prompt = `你是一个技术博客的AI编辑。请阅读以下文章内容，用2-3句话生成一段中文摘要（60字以内），概括文章的核心内容和价值。只输出摘要，不要任何其他内容（不要前缀、不要引号）。\n\n文章标题：${title}\n\n文章内容：\n${stripForAI(body)}`;

    const res = await fetch(API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZHIPU_KEY}`,
        },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 120,
            temperature: 0.5,
        }),
    });

    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.choices?.[0]?.message?.content) throw new Error('Empty response');
    return json.choices[0].message.content.trim();
}

async function main() {
    if (!fs.existsSync(POSTS_DIR)) { console.log('No posts directory'); return; }

    const existing = {};
    if (fs.existsSync(OUTPUT)) {
        try { Object.assign(existing, JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'))); } catch {}
    }

    const summaries = { ...existing };
    const dirs = fs.readdirSync(POSTS_DIR, { withFileTypes: true });

    for (const entry of dirs) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        const mdFile = path.join(POSTS_DIR, slug, 'index.md');
        const mdxFile = path.join(POSTS_DIR, slug, 'index.mdx');
        const file = fs.existsSync(mdFile) ? mdFile : fs.existsSync(mdxFile) ? mdxFile : null;
        if (!file) continue;

        const raw = fs.readFileSync(file, 'utf-8');
        const { data } = parseFrontmatter(raw);

        if (data.description) {
            console.log(`[skip] ${slug} (已有 description)`);
            continue;
        }
        if (summaries[slug]) {
            console.log(`[cache] ${slug}`);
            continue;
        }

        console.log(`[generate] ${slug} ...`);
        try {
            const body = stripForAI(raw.replace(/^---[\s\S]*?---/, ''));
            const summary = await generateSummary(data.title || slug, body);
            console.log(`  => ${summary}`);
            summaries[slug] = summary;
            fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
            fs.writeFileSync(OUTPUT, JSON.stringify(summaries, null, 2), 'utf-8');
        } catch (err) {
            console.error(`  ✗ ${slug}: ${err.message}`);
        }
    }

    console.log(`\nSaved ${Object.keys(summaries).length} summaries to ${path.relative(ROOT, OUTPUT)}`);
}

await main();
