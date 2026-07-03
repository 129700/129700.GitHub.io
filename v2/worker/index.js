export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/greet') {
      return handleGreet(request, env, corsHeaders);
    }
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env, corsHeaders);
    }
    if (url.pathname === '/api/usage') {
      return handleUsage(env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

// ========== /api/greet：看板娘问候 ==========
async function handleGreet(request, env, corsHeaders) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') || '';

    const tencResp = await fetch(
      `https://apis.map.qq.com/ws/location/v1/ip?key=${env.TENCENT_KEY}&ip=${ip}&output=json`
    );
    const tencData = await tencResp.json();

    let loc = '远方';
    let dist = '';
    let lat = 0, lng = 0;

    if (tencData.status === 0 && tencData.result && tencData.result.ad_info) {
      const info = tencData.result.ad_info;
      loc = (info.province || '') + (info.city && info.city !== info.province ? info.city : '') || '远方';
      if (info.lat && info.lng) {
        lat = info.lat;
        lng = info.lng;
        dist = calcDist(34.26, 108.94, lat, lng) + '';
      }
    }

    const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })).getHours();
    let timeGreet = '下午好';
    if (hour < 6) timeGreet = '夜深了';
    else if (hour < 9) timeGreet = '早上好';
    else if (hour < 12) timeGreet = '上午好';
    else if (hour < 14) timeGreet = '中午好';
    else if (hour < 18) timeGreet = '下午好';
    else if (hour < 22) timeGreet = '晚上好';

    const prompt = `你是一个住在西安的可爱博客小管家。一位来自${loc}的访客正在访问你的博客${dist ? '，距你约' + dist + '公里' : ''}。现在是${timeGreet}。请用一句话欢迎这位访客，要包含当地特色（美食/文化/风景），语气可爱活泼，25字以内，末尾加一个emoji。只输出这句话，不要其他内容。`;

    let aiGreeting = '';
    try {
      const aiResp = await callGLM(env, prompt, 60, 0.95);
      if (aiResp) aiGreeting = aiResp;
    } catch (e) {}

    return json({ ip, loc, dist, lat, lng, greeting: aiGreeting, timeGreet }, corsHeaders);
  } catch (e) {
    return json({ error: e.message }, corsHeaders, 500);
  }
}

// ========== /api/chat：文章 AI 问答 & 看板娘闲聊 ==========
async function handleChat(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const prompt = body.prompt || '';
    const maxTokens = body.max_tokens || 200;
    const temperature = body.temperature || 0.7;

    if (!prompt) {
      return json({ error: 'prompt is required' }, corsHeaders, 400);
    }

    const answer = await callGLM(env, prompt, maxTokens, temperature);

    return json({
      answer: answer || '暂时无法回答，请稍后再试 ~',
      usage: await getCurrentUsage(env),
    }, corsHeaders);
  } catch (e) {
    return json({ error: e.message }, corsHeaders, 500);
  }
}

// ========== /api/usage：返回本月用量 ==========
async function handleUsage(env, corsHeaders) {
  const usage = await getCurrentUsage(env);
  return json(usage, corsHeaders);
}

// ========== 工具函数 ==========

async function callGLM(env, prompt, maxTokens = 200, temperature = 0.7) {
  const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.ZHIPU_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const data = await resp.json();

  // 记录 token 用量到 KV
  if (data.usage && data.usage.total_tokens > 0 && env.GLM_USAGE) {
    const key = getMonthKey();
    const old = Number(await env.GLM_USAGE.get(key) || 0);
    await env.GLM_USAGE.put(key, String(old + data.usage.total_tokens));
  }

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content.trim();
  }
  return '';
}

function getMonthKey() {
  const d = new Date();
  return `glm-usage:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const QUOTA = 2_000_000;

async function getCurrentUsage(env) {
  const key = getMonthKey();
  const used = Number(await env.GLM_USAGE?.get(key) || 0);
  return {
    used,
    quota: QUOTA,
    percent: Math.min(100, Math.round((used / QUOTA) * 10000) / 100),
  };
}

function json(data, corsHeaders = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function calcDist(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
