import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getPostData } from "../../lib/providers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: "Missing post URL" });
      return;
    }

    const post = await getPostData(url);
    if (!post) {
      res.status(404).json({ error: "Unable to fetch post data." });
      return;
    }

    // Log which provider was used
    console.log("Provider:", post.network);

    // Use first image if present
    const mainImg = post.images && post.images.length > 0 ? post.images[0] : null;

    // Build the HTML template (reuse CSS, but dynamic fields)
    const html = `
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, Ubuntu, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f7f9f9;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          .post-container {
            margin: 20px;
            width: 600px;
            background: white;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
            box-sizing: border-box;
          }
          .author {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }
          .author img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 12px;
            border: 1px solid rgba(0, 0, 0, 0.04);
          }
          .author-info {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .author-name {
            font-weight: 700;
            font-size: 16px;
            color: #0f1419;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .author-handle {
            color: #536471;
            font-size: 15px;
          }
          .post-text {
            font-size: 17px;
            line-height: 1.5;
            margin-bottom: 12px;
            color: #0f1419;
            white-space: pre-wrap;
          }
          .post-media {
            margin: 8px 0 12px 0;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.08);
          }
          .post-media img {
            width: 100%;
            display: block;
          }
          .post-stats {
            display: flex;
            color: #536471;
            font-size: 14px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eff3f4;
            gap: 24px;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .stat {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .stat-number {
            color: #0f1419;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="post-container">
          <div class="author">
            <img src="${post.author.avatar}" alt="${post.author.name}"/>
            <div class="author-info">
              <span class="author-name">${post.author.name}</span>
              <span class="author-handle">${post.author.handle}</span>
            </div>
          </div>
          <div class="post-text">${post.text ? escapeHtml(post.text) : ""}</div>
          ${
            mainImg
              ? `<div class="post-media"><img src="${mainImg}" alt="Post media" /></div>`
              : ""
          }
          ${
            post.stats && (post.stats.likes || post.stats.recasts || post.stats.replies)
              ? `<div class="post-stats">
                ${post.stats.replies ? `<div class="stat"><span>💬</span><span class="stat-number">${post.stats.replies}</span></div>` : ""}
                ${post.stats.recasts ? `<div class="stat"><span>🔄</span><span class="stat-number">${post.stats.recasts}</span></div>` : ""}
                ${post.stats.likes ? `<div class="stat"><span>❤️</span><span class="stat-number">${post.stats.likes}</span></div>` : ""}
              </div>`
              : ""
          }
        </div>
      </body>
      </html>
    `;

    // Puppeteer logic (same as before)
    let browser;
    if (process.env.VERCEL_ENV === "production") {
      const executablePath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        executablePath,
        args: chromium.args,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 680, height: 2000 });

    // Get the actual dimensions of the content
    const dimensions = await page.evaluate(() => {
      const container = document.querySelector(".post-container");
      const rect = container.getBoundingClientRect();
      return {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      };
    });

    await page.setViewport({
      width: dimensions.width + 40,
      height: dimensions.height + 40,
    });

    const imageBuffer = await page.screenshot({
      type: "png",
      encoding: "base64",
      fullPage: false,
    });

    if (process.env.VERCEL_ENV !== "production") {
      await browser.close();
    }

    res.json({ data: imageBuffer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}