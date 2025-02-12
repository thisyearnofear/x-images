import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async (req, res) => {
  try {
    console.log("API Key available:", !!process.env.RAPIDAPI_KEY);
    const { xUrl } = req.body;

    // Extract tweet ID from URL
    const tweetId = xUrl.split("/").pop().split("?")[0];
    console.log("Tweet ID:", tweetId);

    // Get tweet data from RapidAPI
    const tweetResponse = await fetch(
      `https://twitter-api45.p.rapidapi.com/tweet.php?id=${tweetId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        },
      }
    );

    const tweetData = await tweetResponse.json();
    console.log("API Response:", JSON.stringify(tweetData, null, 2));

    if (!tweetData || !tweetData.text) {
      throw new Error(
        `Failed to fetch tweet data: ${JSON.stringify(tweetData)}`
      );
    }

    // Get the media URL if it exists
    let mediaUrl = null;
    if (
      tweetData.entities &&
      tweetData.entities.media &&
      tweetData.entities.media.length > 0
    ) {
      const mediaItem = tweetData.entities.media[0];
      if (mediaItem.type === "photo") {
        mediaUrl = mediaItem.media_url_https;
      } else if (mediaItem.type === "video") {
        mediaUrl = mediaItem.media_url_https; // This is usually the video thumbnail
      }

      // If the media has a large size available, use that
      if (mediaItem.sizes && mediaItem.sizes.large) {
        // Append size parameters to get the large version
        mediaUrl = `${mediaUrl}?format=jpg&name=large`;
      }
    }

    // Create an HTML template for the tweet
    const tweetHtml = `
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
            .tweet-container {
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
            .verified-badge {
              color: #1d9bf0;
              font-size: 16px;
            }
            .author-handle {
              color: #536471;
              font-size: 15px;
            }
            .tweet-text {
              font-size: 17px;
              line-height: 1.5;
              margin-bottom: 12px;
              color: #0f1419;
              white-space: pre-wrap;
            }
            .tweet-media {
              margin: 8px 0 12px 0;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid rgba(0, 0, 0, 0.08);
            }
            .tweet-media img {
              width: 100%;
              display: block;
            }
            .tweet-stats {
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
          <div class="tweet-container">
            <div class="author">
              <img src="${tweetData.author.image}" alt="${
      tweetData.author.name
    }" />
              <div class="author-info">
                <span class="author-name">
                  ${tweetData.author.name}
                  ${
                    tweetData.author.blue_verified
                      ? '<span class="verified-badge">✓</span>'
                      : ""
                  }
                </span>
                <span class="author-handle">@${
                  tweetData.author.screen_name
                }</span>
              </div>
            </div>
            <div class="tweet-text">${tweetData.text}</div>
            ${
              mediaUrl
                ? `<div class="tweet-media"><img src="${mediaUrl}" alt="Tweet media" /></div>`
                : ""
            }
            <div class="tweet-stats">
              <div class="stat">
                <span>💬</span>
                <span class="stat-number">${tweetData.replies.toLocaleString()}</span>
              </div>
              <div class="stat">
                <span>🔄</span>
                <span class="stat-number">${tweetData.retweets.toLocaleString()}</span>
              </div>
              <div class="stat">
                <span>❤️</span>
                <span class="stat-number">${tweetData.likes.toLocaleString()}</span>
              </div>
              ${
                tweetData.bookmarks
                  ? `
                    <div class="stat">
                      <span>🔖</span>
                      <span class="stat-number">${tweetData.bookmarks.toLocaleString()}</span>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>
        </body>
      </html>
    `;

    // Launch browser and create screenshot
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
    await page.setContent(tweetHtml, { waitUntil: "networkidle0" });

    // First set a larger viewport
    await page.setViewport({ width: 680, height: 2000 });

    // Get the actual dimensions of the content
    const dimensions = await page.evaluate(() => {
      const container = document.querySelector(".tweet-container");
      const rect = container.getBoundingClientRect();
      return {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      };
    });

    // Update viewport to match content
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
    console.log(err);
    res.json({ error: err.message });
  }
};
