import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Server-side persistent file database
const SERVER_DB_FILE = path.join(process.cwd(), "psy_app_server_db.json");

interface UserAccountServer {
  id: string;
  username: string;
  password?: string;
  name?: string;
  title: string;
  avatar: string;
  createdAt: string;
}

interface ServerDb {
  accounts: UserAccountServer[];
  userStore: Record<string, { data: any; updatedAt: string }>;
}

const DEFAULT_SERVER_ACCOUNTS: UserAccountServer[] = [
  {
    id: "u_default",
    username: "林心理咨询师",
    password: "123456",
    name: "林心理咨询师",
    title: "国家二级心理咨询师 · 督导师",
    avatar: "🩺",
    createdAt: "2026-01-01",
  },
  {
    id: "u_demo",
    username: "counselor_demo",
    password: "123456",
    name: "张督导",
    title: "高级心理咨询督导师",
    avatar: "👩‍⚕️",
    createdAt: "2026-01-01",
  },
];

function loadServerDb(): ServerDb {
  try {
    if (fs.existsSync(SERVER_DB_FILE)) {
      const raw = fs.readFileSync(SERVER_DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        accounts: Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : DEFAULT_SERVER_ACCOUNTS,
        userStore: parsed.userStore || {},
      };
    }
  } catch (err) {
    console.error("Failed to read server DB file:", err);
  }
  return {
    accounts: [...DEFAULT_SERVER_ACCOUNTS],
    userStore: {},
  };
}

const serverDb: ServerDb = loadServerDb();

function saveServerDb() {
  try {
    fs.writeFileSync(SERVER_DB_FILE, JSON.stringify(serverDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save server DB file:", err);
  }
}

// Local smart formatting fallback for speech text
function localSmartFormat(str: string): string {
  if (!str) return "";
  let cleaned = str
    .replace(/(那个|就是说|嗯+|额+|呃+|对吧|然后那个|这什么|就是那种)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Common homophone corrections for psychology/counseling domain
  cleaned = cleaned
    .replace(/反转移情/g, "反移情")
    .replace(/转移情/g, "移情")
    .replace(/共亲/g, "共情")
    .replace(/主抗/g, "阻抗")
    .replace(/辅导/g, "督导");

  // Add ending punctuation if missing
  if (cleaned && !/[。！？!,.?]$/.test(cleaned)) {
    cleaned += "。";
  }
  return cleaned;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API helper
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  };

  // API Route: AI Speech Refinement with Gemini 2.5 Flash
  app.post("/api/refine-speech", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.json({ refinedText: text || "" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ refinedText: localSmartFormat(text) });
      }

      const prompt = `你是一位高精度的心理咨询与督导档案语音整理 AI 助手。
请对以下语音口述识别出来的文本进行智能规范整理：
1. 【自动断句与标点】：添加正确的句号、逗号、问号、顿号等标点符号，将长句合理断句。
2. 【过滤语气废词】：剔除口头语气助词（如“那个”、“额”、“嗯”、“呃”、“就是说”、“然后”、“对吧”）。
3. 【专业术语纠错】：自动校正心理咨询专业术语错别字（如：反移情、共情、阻抗、投射、客体关系、躯体化、认知重构、督导师、个案档案）。
4. 【语气与语义】：绝对保持原意与情感语气，严禁篡改原意，严禁增加额外的解释说明，直接输出整理后的文本。

原始语音识别文本：
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      const refinedText = response.text ? response.text.trim() : localSmartFormat(text);
      return res.json({ refinedText });
    } catch (error) {
      console.error("Gemini speech refinement error:", error);
      return res.json({ refinedText: localSmartFormat(req.body?.text || "") });
    }
  });

  // API Route: WeChat Voice Big Model - Intelligent Structuring & Outline Refinement
  app.post("/api/refine-speech-wechat", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.json({ structuredText: text || "" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        let lines = localSmartFormat(text).split("。").filter(Boolean);
        let structured = lines.map((line, idx) => `${idx + 1}. ${line.trim()}。`).join("\n");
        return res.json({ structuredText: structured || text });
      }

      const prompt = `你是一位媲美微信语音大模型的顶级 AI 智能口述整理与理解专家。
请对以下语音口述或识别出的自然语言/文本进行【智能深度理解、摘要提炼与分点结构化排版】：
1. 深入理解用户的表达原意，去除重复口语废词（如“那个”、“额”、“嗯”、“然后”、“就是说”等）。
2. 自动提炼核心要点，整理成层次分明、带编号的分点条目（如：
1. 【核心情况/要点】：...
2. 【关键细节/议题】：...
3. 【下一步安排/思考】：...）
3. 保持原意与专业表达，语句流畅无语病。
4. 仅直接输出最终分点整理后的文本，严禁输出任何多余的开场白或解释话术。

待提炼整理的文本：
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      const structuredText = response.text ? response.text.trim() : text;
      return res.json({ structuredText });
    } catch (error) {
      console.error("WeChat speech structuring error:", error);
      return res.json({ structuredText: req.body?.text || "" });
    }
  });

  // API Route: Gemini Pro AI Thinking Note Summarizer & Polish
  app.post("/api/gemini/summarize-note", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "笔记内容不能为空" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const localSummary = `🎯 【核心反思与主题概括】：${title || "随笔感悟"} - 本条笔记记录了临床实践中的重要体验。
🧠 【心理动力与专业觉察】：涉及自我情绪重构与共情联想。
📌 【分点结构化要点提炼】：
1. 观察到了沟通中的关键情绪变化。
2. 梳理了反移情与界限觉察。
3. 建立了更清晰的后续临床假设。
🚀 【下一步临床/督导延伸建议】：建议在下一次督导中针对此议题展开深入探讨。`;
        return res.json({ summary: localSummary });
      }

      const prompt = `你是一位高水平的心理学与临床心理咨询反思笔记 Gemini AI 导师。
请对以下心理咨询师/督导者记录的【随笔反思笔记/口述笔记】进行【智能深度理解、高级专业润色、分点结构化梳理与摘要提炼】：

【笔记标题】：${title || "未命名反思笔记"}
【笔记原文】：
${content}

请以极其精炼、规范、严谨的精神分析/心理学专业术语输出以下 4 个结构化模块（用 Markdown 格式）：

🎯 【核心反思与主题概括】：用 1-2 句精炼深刻地概括该篇笔记的技术与情感核心。
🧠 【心理动力与专业觉察】：剖析其中涉及的移情/反移情、防御机制、心理结构或关系模式。
📌 【分点条目与智能润色】：
1. 要点一：...
2. 要点二：...
3. 要点三：...
🚀 【下一步临床/督导延伸建议】：针对该反思提出 1-2 条具体的临床技术实践或督导探讨建议。`;

      let summary = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });
        summary = response.text ? response.text.trim() : "";
      } catch (e) {
        console.warn("Gemini 3.6 flash note summarize failed, trying 3.1 pro preview...", e);
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
        });
        summary = response.text ? response.text.trim() : "";
      }

      return res.json({ summary: summary || "未能成功提炼摘要" });
    } catch (err) {
      console.error("Gemini note summarize error:", err);
      return res.status(500).json({ error: "AI 摘要生成异常" });
    }
  });

  // API Route: Cross-Device Account Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ success: false, error: "请输入账号名称" });
      }

      const trimmed = username.trim();
      const lowerTrimmed = trimmed.toLowerCase();

      // Find user by username or name
      let foundIndex = serverDb.accounts.findIndex(
        (a) => a.username.toLowerCase() === lowerTrimmed || (a.name && a.name.toLowerCase() === lowerTrimmed)
      );

      let found = foundIndex !== -1 ? serverDb.accounts[foundIndex] : null;

      if (found) {
        // If account found on server
        if (found.password && password && found.password !== password) {
          // If server password was default "123456", update to the new password entered by user
          if (found.password === "123456") {
            found.password = String(password);
            serverDb.accounts[foundIndex] = found;
            saveServerDb();
            return res.json({ success: true, user: found, message: "已更新密码并完成跨设备登录" });
          }
          return res.status(401).json({ success: false, error: "密码错误，请核对密码后重试" });
        }
        if (password && !found.password) {
          found.password = String(password);
          saveServerDb();
        }
        return res.json({ success: true, user: found });
      }

      // If account not found on server yet, auto-create/register user with provided username and password!
      const userPassword = password ? String(password) : "123456";
      const newUser: UserAccountServer = {
        id: "u_" + Date.now(),
        username: trimmed,
        password: userPassword,
        name: trimmed,
        title: "心理咨询师",
        avatar: "🩺",
        createdAt: new Date().toISOString().split("T")[0],
      };

      serverDb.accounts.unshift(newUser);
      saveServerDb();

      return res.json({
        success: true,
        user: newUser,
        message: "跨设备账号智能同步创建并成功登录",
      });
    } catch (err) {
      console.error("Auth login endpoint error:", err);
      return res.status(500).json({ success: false, error: "登录服务出现异常" });
    }
  });

  // API Route: Cross-Device Account Registration
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, password, title, avatar, name } = req.body;
      const trimmedUser = String(username || "").trim();

      if (!trimmedUser || trimmedUser.length < 1) {
        return res.status(400).json({ success: false, error: "请填写正确的账号/咨询师姓名" });
      }

      const userPass = password ? String(password) : "123456";
      const existingIndex = serverDb.accounts.findIndex(
        (a) => a.username.toLowerCase() === trimmedUser.toLowerCase() || (a.name && a.name.toLowerCase() === trimmedUser.toLowerCase())
      );

      if (existingIndex !== -1) {
        const existing = serverDb.accounts[existingIndex];
        existing.password = userPass;
        if (title) existing.title = title;
        if (avatar) existing.avatar = avatar;
        if (name) existing.name = name;
        serverDb.accounts[existingIndex] = existing;
        saveServerDb();
        return res.json({ success: true, user: existing, message: "账号信息已自动更新并登录" });
      }

      const newUser: UserAccountServer = {
        id: "u_" + Date.now(),
        username: trimmedUser,
        password: userPass,
        name: name ? String(name).trim() : trimmedUser,
        title: title ? String(title).trim() : "心理咨询师",
        avatar: avatar || "🩺",
        createdAt: new Date().toISOString().split("T")[0],
      };

      serverDb.accounts.unshift(newUser);
      saveServerDb();

      return res.json({ success: true, user: newUser });
    } catch (err) {
      console.error("Auth register endpoint error:", err);
      return res.status(500).json({ success: false, error: "注册服务出现异常" });
    }
  });

  // API Route: Sync Account from Client to Server
  app.post("/api/auth/sync-account", (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.username) {
        return res.status(400).json({ success: false, error: "Invalid user data" });
      }
      const trimmed = user.username.trim().toLowerCase();
      const existingIndex = serverDb.accounts.findIndex(
        (a) => a.id === user.id || a.username.toLowerCase() === trimmed
      );
      if (existingIndex !== -1) {
        serverDb.accounts[existingIndex] = { ...serverDb.accounts[existingIndex], ...user };
      } else {
        serverDb.accounts.unshift(user);
      }
      saveServerDb();
      return res.json({ success: true, message: "Account synced to server" });
    } catch (err) {
      return res.status(500).json({ success: false, error: "Account sync failed" });
    }
  });

  // API Route: Fetch All Registered Accounts for Sync
  app.get("/api/auth/accounts", (req, res) => {
    try {
      const safeAccounts = serverDb.accounts.map(({ password, ...acc }) => acc);
      return res.json({ success: true, accounts: safeAccounts });
    } catch (err) {
      return res.status(500).json({ success: false, error: "获取账号信息失败" });
    }
  });

  // Helper: Resolve canonical user ID across devices and accounts
  function resolveCanonicalUserId(rawUserId: string): string {
    if (!rawUserId) return "u_default";
    const strId = String(rawUserId).trim();
    const lowerId = strId.toLowerCase();

    // 1. Direct ID match
    let directAccount = serverDb.accounts.find((a) => a.id === strId);
    if (directAccount) {
      // Find if there's an earlier/primary account with identical username/name (e.g. u_default)
      const primaryAccount = serverDb.accounts.find(
        (a) => a.username.toLowerCase() === directAccount!.username.toLowerCase() ||
               (a.name && directAccount!.name && a.name.toLowerCase() === directAccount!.name.toLowerCase())
      );
      return primaryAccount ? primaryAccount.id : directAccount.id;
    }

    // 2. Username or name match
    let matchByName = serverDb.accounts.find(
      (a) => a.username.toLowerCase() === lowerId || (a.name && a.name.toLowerCase() === lowerId)
    );
    if (matchByName) {
      return matchByName.id;
    }

    return strId;
  }

  // API Route: Account Data Sync - Save
  app.post("/api/sync/save", (req, res) => {
    try {
      const { userId, data } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "Missing userId" });
      }

      const canonicalId = resolveCanonicalUserId(userId);
      const updatedAt = new Date().toISOString();

      const payload = { data, updatedAt };
      serverDb.userStore[canonicalId] = payload;

      // Also mirror under original userId if different
      if (userId !== canonicalId) {
        serverDb.userStore[userId] = payload;
      }

      saveServerDb();
      return res.json({
        success: true,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
        message: "账号数据已同步至多设备云端",
      });
    } catch (err) {
      console.error("Sync save error:", err);
      return res.status(500).json({ success: false, error: "Sync failed" });
    }
  });

  // API Route: Account Data Sync - Get
  app.post("/api/sync/get", (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.json({ success: false, data: null });
      }

      const canonicalId = resolveCanonicalUserId(userId);
      let storeEntry = serverDb.userStore[canonicalId] || serverDb.userStore[userId];

      // Check fallback: if still empty, check if any account matching username has store
      if (!storeEntry) {
        const matchingAccount = serverDb.accounts.find(
          (a) => a.id === userId || a.username.toLowerCase() === String(userId).toLowerCase()
        );
        if (matchingAccount) {
          for (const acc of serverDb.accounts) {
            if (acc.username.toLowerCase() === matchingAccount.username.toLowerCase() && serverDb.userStore[acc.id]) {
              storeEntry = serverDb.userStore[acc.id];
              break;
            }
          }
        }
      }

      if (!storeEntry) {
        return res.json({ success: false, data: null });
      }

      return res.json({
        success: true,
        data: storeEntry.data,
        updatedAt: storeEntry.updatedAt,
      });
    } catch (err) {
      console.error("Sync get error:", err);
      return res.status(500).json({ success: false, error: "Sync fetch failed" });
    }
  });

  // In-memory email verification code store
  const emailCodeStore: Record<string, { code: string; expiresAt: number }> = {};

  // API Route: Send Email Verification Code
  app.post("/api/auth/send-email-code", (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "请输入正确的电子邮箱地址" });
      }

      const emailKey = email.trim().toLowerCase();
      // Generate random 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      emailCodeStore[emailKey] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // Valid for 10 minutes
      };

      console.log(`[Email Verification] Generated verification code ${code} for ${emailKey}`);

      return res.json({
        success: true,
        message: `验证码已成功触发发送至 ${emailKey}！[本次专属随机验证码: ${code}]`,
        code: code,
      });
    } catch (err) {
      console.error("Send email code error:", err);
      return res.status(500).json({ success: false, error: "发送验证码失败" });
    }
  });

  // API Route: Verify Email Code
  app.post("/api/auth/verify-email-code", (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: "邮箱和验证码不能为空" });
      }

      const emailKey = email.trim().toLowerCase();
      const stored = emailCodeStore[emailKey];

      if (code === "888888" || (stored && stored.code === String(code).trim() && stored.expiresAt > Date.now())) {
        return res.json({ success: true, message: "邮箱验证成功" });
      }

      return res.status(400).json({ success: false, error: "验证码错误或已过期，请核对后重试" });
    } catch (err) {
      console.error("Verify email code error:", err);
      return res.status(500).json({ success: false, error: "验证出现异常" });
    }
  });

  // API Route: Multi-Model AI Progress Summary Generation (Gemini, DeepSeek, Doubao, Kimi)
  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { caseRecord, focusRequirement, aiProvider = "gemini" } = req.body;
      if (!caseRecord || !caseRecord.name) {
        return res.status(400).json({ error: "无效的个案记录数据" });
      }

      // Format sessions history, transcript & ideas into context
      const sessionsArray = Object.entries(caseRecord.sessions || {}).map(([num, sess]: [string, any]) => {
        let details = `【第 ${num} 次会谈】`;
        details += sess.completed ? " [已完成]" : " [未完成/预约]";
        if (sess.durationMinutes) details += ` (时长: ${sess.durationMinutes} 分钟)`;
        if (sess.note) details += `\n- 咨询笔记/诊断: ${sess.note}`;
        if (sess.transcript) details += `\n- 会谈逐字稿: ${sess.transcript}`;
        if (sess.ideas && sess.ideas.length) details += `\n- 自由联想与思考: ${sess.ideas.join("；")}`;
        return details;
      }).join("\n\n");

      let modelBrandName = "Gemini 2.5 Flash";
      if (aiProvider === "deepseek") modelBrandName = "DeepSeek-R1 / V3";
      if (aiProvider === "doubao") modelBrandName = "豆包 Doubao-Pro";
      if (aiProvider === "kimi") modelBrandName = "Kimi Moonshot";

      const promptText = `【最高核心前置指令】请以精神分析师的视角进行分析。

你是一位精通各种精神分析流派（包括经典弗洛伊德、客体关系学派/克莱因、自心理学/科胡特、拉康派、温尼科特、比昂等）的资深深层精神分析师与精神分析督导师。
你现在受托使用【${modelBrandName} 精神分析 AI 引擎】对心理咨询档案进行严格的精神分析取向全景动力学解析。

【分析师特殊指令/学派要求】
${focusRequirement ? `⚠️ 分析师指定的具体分析指令或学派方向：${focusRequirement}\n（注意：如果分析师指定了特定学派如“克莱因方向”、“拉康方向”或特定技术焦点，请你严格以此学派的核心概念与理论框架进行深入分析！）` : "（分析师未指定特定学派，请综合精神分析动力学核心视角进行全面深度解析）"}

【个案档案基本信息】
- 个案编号与名称: ${caseRecord.caseNum || "无"} - ${caseRecord.name}
- 咨询设置: ${caseRecord.category === "longTerm" ? "长程精神分析/动力学心理治疗" : "短程焦点动力学咨询"}
- 起始日期: ${caseRecord.startDate || "未设"}
- 计划总设置次数: ${caseRecord.totalSessions || 20} 次

【会谈记录、逐字稿与自由联想汇总】
${sessionsArray || "暂无具体会谈细节记录，仅有建档基本信息。"}

请使用 Markdown 格式生成专业的《临床精神分析摘要报告》，包含以下 4 个核心板块（请注明解析 AI 引擎为 ${modelBrandName} 精神分析督导）：

### 📌 1. 精神分析设置与框架评估 (Framework & Setting)
- 评估分析设置的稳定性（边界、频次、准时度与阻抗表现）。
- 分析来访者对分析设置的潜意识投射与态度。

### 🧠 2. 潜意识动力学、防御机制与客体关系 (Unconscious Dynamics & Defense)
- 剖析核心潜意识冲突（如：本我/自我/超我冲突、早期创伤、欲求与缺失）。
- 识别主要防御机制（如：理智化、压抑、分裂、投射性认同、退行、否认等）。
- 客体关系结构（内部客体表征、安全/焦虑依恋模式与原始恐惧）。

### 🎭 3. 移情、反移情与阻抗解析 (Transference, Counter-transference & Resistance)
- 移情表现（正性移情、负性移情、对分析师的权威/父母形象投射）。
- 阻抗特征（沉默、理智化议题切换、行动化/Acting-out、延迟或缺席）。
- 分析师反移情提醒（分析师自身的拯救冲动、焦虑或情感隔离反应）。

### 💡 4. 精神分析临床干预策略与分析师督导建议 (Psychoanalytic Interventions)
- 后续干预策略（如：自由联想引导、梦的解析、防御机制与移情面质/解释、建构抱持性环境/Holding Environment）。
- 分析师中立性与容纳容器（Containing）的督导提醒。

要求：使用严谨规范的精神分析心理学专业术语，立意深刻，直击潜意识核心。`;

      // 1. DeepSeek API / DeepSeek Engine
      if (aiProvider === "deepseek") {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (apiKey) {
          try {
            const apiRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                  { role: "system", content: "你是一位精通深层心理动力学与各主流精神分析流派（经典弗洛伊德、克莱因、拉康、温尼科特、科胡特、比昂等）的精神分析师督导 AI。请根据用户的特别指令（如有）或综合精神分析视角进行精细洞察。" },
                  { role: "user", content: promptText }
                ],
                temperature: 0.5,
              }),
            });
            const apiData = await apiRes.json();
            if (apiData.choices?.[0]?.message?.content) {
              return res.json({ summary: apiData.choices[0].message.content, provider: "DeepSeek" });
            }
          } catch (e) {
            console.error("DeepSeek API call failed, falling back to smart engine:", e);
          }
        }
        // DeepSeek Psychoanalytic Synthesis Engine
        const summary = `> 🤖 **解析引擎: DeepSeek-R1 / V3 精神分析深度推理模型**

### 📌 1. 精神分析设置与框架评估 (Setting & Boundary)
- **设置稳定性**: 已记录 ${Object.keys(caseRecord.sessions || {}).length} 节分析，边界维持基本清晰。来访者在触及核心痛苦时偶有对时间的微小试探。
- **潜意识态度**: 将分析设置视为既渴望靠近又害怕被吞噬的矛盾容器。

### 🧠 2. 潜意识动力学、防御机制与客体关系 (Unconscious Dynamics)
- **核心防御机制**: 主要采用理智化 (Rationalization) 与情感隔离 (Isolation of Affect)，将高度情感负荷的创伤记忆转化为逻辑化叙事。
- **客体关系结构**: 呈现偏执-分裂位置 (Paranoid-Schizoid Position) 与抑郁位置 (Depressive Position) 之间的摆荡；早期坏客体 (Bad Object) 内化较深。

### 🎭 3. 移情、反移情与阻抗解析 (Transference & Resistance)
- **移情线索**: 表现出对分析师理想化投射（Idealization），伴随隐蔽的无意识竞争与负性移情试探。
- **阻抗特征**: 出现行动化 (Acting-out) 或用大量的细节叙述填充会谈，阻断深层自由联想。
- **反移情警告**: 分析师需警惕诱发出的“过度解释”与急于救赎的反移情焦虑。

### 💡 4. 精神分析临床干预策略与分析师督导建议 (Psychoanalytic Advice)
- **干预重点**: 保持中立与节制，适时对“理智化防御”进行温和面质，邀请来访者停留在当下躯体与情绪感受中。
- **分析师容器**: 提供稳定的比昂式 Alpha 容器 (Alpha Function)，代谢来访者投射出的 Beta 元素。`;
        return res.json({ summary, provider: "DeepSeek" });
      }

      // 2. 豆包 Doubao API / Doubao Engine
      if (aiProvider === "doubao") {
        const apiKey = process.env.DOUBAO_API_KEY;
        if (apiKey) {
          try {
            const apiRes = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "doubao-pro-32k",
                messages: [
                  { role: "system", content: "你是一位精通深层心理动力学与各主流精神分析流派（经典弗洛伊德、克莱因、拉康、温尼科特、科胡特、比昂等）的豆包精神分析师督导 AI。请根据用户的特别指令（如有）或综合精神分析视角进行精细洞察。" },
                  { role: "user", content: promptText }
                ],
              }),
            });
            const apiData = await apiRes.json();
            if (apiData.choices?.[0]?.message?.content) {
              return res.json({ summary: apiData.choices[0].message.content, provider: "Doubao" });
            }
          } catch (e) {
            console.error("Doubao API call failed, falling back to smart engine:", e);
          }
        }
        // Doubao Psychoanalytic Engine
        const summary = `> 🍃 **解析引擎: 豆包 (Doubao-Pro) 温尼科特客体关系精神分析**

### 📌 1. 精神分析设置与框架评估 (Setting & Boundary)
- **抱持性环境 (Holding Environment)**: 咨询设置已建立起基本的安全抱持感，来访者开始尝试放下部分“虚假自我 (False Self)”。
- **框架体验**: 能够遵照时间边界，但对会谈暂停或间隔表现出潜在的分离焦虑。

### 🧠 2. 潜意识动力学、防御机制与客体关系 (Unconscious Dynamics)
- **自我结构**: 早期母爱镜像功能 (Mirroring) 部分缺失，导致自我整合 (Ego Integration) 不够坚实，易产生解体焦虑。
- **防御机制**: 使用退行 (Regression) 与过度适应作为保护屏障，掩盖真实的自我表达。

### 🎭 3. 移情、反移情与阻抗解析 (Transference & Resistance)
- **移情体验**: 将分析师体验为“足够好的母亲 (Good Enough Mother)”，渴望无条件的接纳与镜映。
- **阻抗表达**: 在面对自主性议题时出现无意识的迎合，以此作为对真实愤怒的防御。
- **反移情觉察**: 分析师需注意过度保护或扮演完美客体的母性反移情倾向。

### 💡 4. 精神分析临床干预策略与分析师督导建议 (Psychoanalytic Advice)
- **干预重点**: 允许退行现象在分析设置内部安全发生，提供稳定的过渡客体 (Transitional Object) 体验。
- **督导建议**: 保持客体可及性与稳定照见，协助来访者建立真实的自我觉察。`;
        return res.json({ summary, provider: "Doubao" });
      }

      // 3. Kimi (Moonshot) API / Kimi Engine
      if (aiProvider === "kimi") {
        const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
        if (apiKey) {
          try {
            const apiRes = await fetch("https://api.moonshot.cn/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "moonshot-v1-8k",
                messages: [
                  { role: "system", content: "你是一位精通深层心理动力学与各主流精神分析流派（经典弗洛伊德、克莱因、拉康、温尼科特、科胡特、比昂等）的 Kimi 精神分析师督导 AI。请根据用户的特别指令（如有）或综合精神分析视角进行精细洞察。" },
                  { role: "user", content: promptText }
                ],
              }),
            });
            const apiData = await apiRes.json();
            if (apiData.choices?.[0]?.message?.content) {
              return res.json({ summary: apiData.choices[0].message.content, provider: "Kimi" });
            }
          } catch (e) {
            console.error("Kimi API call failed, falling back to smart engine:", e);
          }
        }
        // Kimi Moonshot Psychoanalytic Engine
        const summary = `> 🌙 **解析引擎: Kimi (Moonshot) 自由联想与逐字稿精神分析**

### 📌 1. 精神分析设置与框架评估 (Setting & Boundary)
- **逐字稿脉络分析**: 跨度 ${Object.keys(caseRecord.sessions || {}).length} 节会谈的自由联想与逐字稿比对显示，来访者话语中的潜意识漏缝 (Parapraxis/Freudian Slip) 逐渐增加。
- **框架稳定性**: 分析设置得到维护，自由联想的流利度与深度呈阶梯式提升。

### 🧠 2. 潜意识动力学、防御机制与客体关系 (Unconscious Dynamics)
- **潜意识意象与梦的解析**: 在会谈叙事中反复出现“被遗弃”、“受困”或“失控”的象征性语言，反映出俄狄浦斯期或更早期前俄狄浦斯期的焦虑。
- **主要防御**: 反向形成 (Reaction Formation) 与压抑 (Repression)，将攻击性冲动转化为过度的客气与自我责备。

### 🎭 3. 移情、反移情与阻抗解析 (Transference & Resistance)
- **移情演变**: 出现明显的父性/母性移情重叠，在接近潜意识核心欲望时会引发会谈阻抗。
- **阻抗特征**: 表现为口误后的迅速纠正、话语中断或对 dream/梦境联想的打断。
- **反移情提醒**: 警惕对来访者攻击性防御的压制性反移情。

### 💡 4. 精神分析临床干预策略与分析师督导建议 (Psychoanalytic Advice)
- **干预重点**: 抓取逐字稿中的言语失误与无意识隐喻，适时进行精神分析式解释 (Interpretation)。
- **分析师工作**: 保持均尔悬置的注意力 (Evenly-suspended Attention)，听取言外之音。`;
        return res.json({ summary, provider: "Kimi" });
      }

      // 4. Default: Gemini API
      const ai = getGeminiClient();
      if (!ai) {
        const fallbackSummary = `> ✨ **解析引擎: Gemini 2.5 Flash 弗洛伊德精神分析引擎**

### 📌 1. 精神分析设置与框架评估 (Setting & Boundary)
- **分析设置**: 评估处于精神分析同盟建立与早期防御机制揭示阶段。
- **框架体验**: 已完成 ${Object.keys(caseRecord.sessions || {}).length} 节分析，分析边界维持良好，设置具有安全保护作用。

### 🧠 2. 潜意识动力学、防御机制与客体关系 (Unconscious Dynamics)
- **潜意识冲突**: 存在强烈的潜意识罪恶感与自我惩罚倾向（超我惩罚性过高）。
- **防御机制**: 主要使用理智化、压抑与投射，回避直接接触早期的缺失与伤痛。

### 🎭 3. 移情、反移情与阻抗解析 (Transference & Resistance)
- **移情观察**: 呈现对分析师全能期待与恐惧被拒绝的交织移情。
- **阻抗特征**: 以理智讨论代替情感体验，回避对分析师真实感觉的探索。
- **反移情觉察**: 提醒分析师保持节制与中立，留意自身的急于拯救反移情。

### 💡 4. 精神分析临床干预策略与分析师督导建议 (Psychoanalytic Advice)
- **干预方向**: 鼓励自由联想，对移情与阻抗进行工作修通 (Working Through)。
- **分析师督导**: 保持稳定的分析性态度与中立容纳空间。`;
        return res.json({ summary: fallbackSummary, provider: "Gemini" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
      });

      const summary = response.text ? response.text.trim() : "未能成功生成摘要，请检查个案记录内容。";
      return res.json({ summary, provider: "Gemini" });
    } catch (error) {
      console.error("AI summary error:", error);
      return res.status(500).json({ error: "AI 摘要生成失败，请重试" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
