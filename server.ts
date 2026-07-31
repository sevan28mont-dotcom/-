import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const refinedText = response.text ? response.text.trim() : localSmartFormat(text);
      return res.json({ refinedText });
    } catch (error) {
      console.error("Gemini speech refinement error:", error);
      return res.json({ refinedText: localSmartFormat(req.body?.text || "") });
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
