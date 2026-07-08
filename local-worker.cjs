// 本地 API 代理 — 替代 Cloudflare Worker
// 用法: node local-worker.js
const http = require('http');

const ZHIPU_KEY = 'dfa4fa6b5f0549b8869ac68c7c349dc6.zq40GmEKMglpQeOz';
const TENCENT_KEY = 'C3EBZ-CFS37-HVBX3-HJFP2-CDOSS-PDFI5';
const PORT = 8787;

// 简易本地 KV 模拟
const fs = require('fs');
const KV_FILE = __dirname + '/.local-kv.json';
function loadKV() { try { return JSON.parse(fs.readFileSync(KV_FILE, 'utf-8')); } catch(e) { return {}; } }
function saveKV(data) { fs.writeFileSync(KV_FILE, JSON.stringify(data)); }

function getMonthKey() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

async function callGLM(prompt, maxTokens = 200, temp = 0.7) {
  const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ZHIPU_KEY },
    body: JSON.stringify({ model: 'glm-4-flash', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: temp }),
  });
  const data = await resp.json();
  if (data.usage && data.usage.total_tokens > 0) {
    const kv = loadKV();
    const key = 'glm:' + getMonthKey();
    kv[key] = (kv[key] || 0) + data.usage.total_tokens;
    saveKV(kv);
  }
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function getUsage() {
  const kv = loadKV();
  const key = 'glm:' + getMonthKey();
  const used = kv[key] || 0;
  return {
    glm: { used, quota: 2000000, percent: Math.min(100, Math.round((used / 2000000) * 10000) / 100) },
    baidu: { used: 0, quota: 50000, percent: 0 },
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/usage') {
    const usage = await getUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(usage));
    return;
  }

  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { prompt, max_tokens, temperature } = JSON.parse(body);
        const answer = await callGLM(prompt, max_tokens || 200, temperature || 0.7);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer: answer || '暂时无法回答~' }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/greet') {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const tencResp = await fetch('https://apis.map.qq.com/ws/location/v1/ip?key=' + TENCENT_KEY + '&ip=' + ip + '&output=json');
      const tencData = await tencResp.json();
      let loc = '远方', dist = '';
      if (tencData.status === 0 && tencData.result?.ad_info) {
        const info = tencData.result.ad_info;
        loc = (info.province || '') + (info.city && info.city !== info.province ? info.city : '') || '远方';
        if (info.lat && info.lng) {
          const R = 6371, dLat = (info.lat - 34.26) * Math.PI / 180, dLng = (info.lng - 108.94) * Math.PI / 180;
          dist = Math.round(R * 2 * Math.atan2(Math.sqrt(Math.sin(dLat/2)**2 + Math.cos(34.26*Math.PI/180)*Math.cos(info.lat*Math.PI/180)*Math.sin(dLng/2)**2), Math.sqrt(1 - (Math.sin(dLat/2)**2 + Math.cos(34.26*Math.PI/180)*Math.cos(info.lat*Math.PI/180)*Math.sin(dLng/2)**2)))) + '';
        }
      }
      const hour = new Date().getHours();
      let timeGreet = '下午好';
      if (hour < 6) timeGreet = '夜深了'; else if (hour < 9) timeGreet = '早上好'; else if (hour < 12) timeGreet = '上午好'; else if (hour < 14) timeGreet = '中午好'; else if (hour < 18) timeGreet = '下午好'; else if (hour < 22) timeGreet = '晚上好';
      const prompt = '你是一个住在西安的可爱博客小管家。一位来自' + loc + '的访客正在访问你的博客' + (dist ? '，距你约' + dist + '公里' : '') + '。现在是' + timeGreet + '。请用一句话欢迎这位访客，要包含当地特色（美食/文化/风景），语气可爱活泼，25字以内，末尾加一个emoji。只输出这句话，不要其他内容。';
      const greeting = await callGLM(prompt, 60, 0.95);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ip, loc, dist, greeting: greeting || '', timeGreet }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('Local Worker running on http://localhost:' + PORT);
});
