import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import pool from "../database/db"; // Adjust the path to your db.ts file
import * as cheerio from "cheerio"; // Import cheerio with named export

export default async function searchGoogleMaps(query: string): Promise<any[]> {
  try {
    if (typeof query !== "string" || !query.trim()) {
      throw new Error("Invalid query parameter. It must be a non-empty string.");
    }

    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: false,
      dumpio: false,
      executablePath: "", // Adjust with your Chrome path if needed
    });

    const page = await browser.newPage();

    try {
      const queryUrl = `https://www.google.com/maps/search/${query.split(" ").join("+")}`;
      await page.goto(queryUrl);
    } catch (error) {
      console.error("Error opening the page:", error);
      throw error;
    }

    async function autoScroll(page: any): Promise<void> {
      await page.evaluate(async () => {
        const wrapper: any = document.querySelector('div[role="feed"]');

        await new Promise<void>((resolve, _reject) => {
          let totalHeight: number = 0;
          let distance: number = 1000;
          const scrollDelay: number = 3000;

          const timer = setInterval(async () => {
            const scrollHeightBefore: number = wrapper.scrollHeight;
            wrapper.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeightBefore) {
              totalHeight = 0;
              await new Promise((resolve) => setTimeout(resolve, scrollDelay));

              const scrollHeightAfter: number = wrapper.scrollHeight;

              if (scrollHeightAfter > scrollHeightBefore) {
                return;
              } else {
                clearInterval(timer);
                resolve();
              }
            }
          }, 700);
        });
      });
    }

    await autoScroll(page);

    const html: string = await page.content();
    const pages: any[] = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
    console.log("Browser closed");

    const $ = cheerio.load(html);
    const aTags: any = $("a");
    const parents: any[] = [];

    aTags.each((_i: number, el: any) => {
      const href: string | undefined = $(el).attr("href");
      if (href && href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    console.log("Number of businesses found:", parents.length);

    function extractCoordinatesFromUrl(url: string): { latitude: number; longitude: number } | null {
      console.log("URL for extracting coordinates:", url);
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      console.log(`Checking URL: ${url}`);
      console.log(`Regex result: ${match ? match[0] : "Not found"}`);
      if (match) {
        console.log(`Coordinates found: Lat ${match[1]}, Lng ${match[2]}`);
        return {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
      }
      console.log("Coordinates not found for this URL.");
      return null;
    }

    const sanitizeText = (text: string): string => {
      return text.replace(/[^ -~]+/g, "").trim();
    };

    const business: any[] = [];

    for (const parent of parents) {
      const url: string | undefined = parent.find("a").attr("href");
      console.log(`Google URL: ${url}`);

      const website: string | undefined = parent.find('a[data-value="Website"]').attr("href");
      const storeName: string = sanitizeText(parent.find("div.fontHeadlineSmall").text());
      const ratingText: string | undefined = sanitizeText(parent.find("span.fontBodyMedium > span").attr("aria-label") || "");

      const coordinates = url ? extractCoordinatesFromUrl(url) : null;
      console.log(`Extracted Coordinates: ${coordinates ? `Lat: ${coordinates.latitude}, Lng: ${coordinates.longitude}` : "Not found"}`);

      const bodyDiv: any = parent.find("div.fontBodyMedium").first();
      const children: any = bodyDiv.children();
      const lastChild: any = children.last();
      const firstOfLast: any = lastChild.children().first();
      const lastOfLast: any = lastChild.children().last();

      const address = sanitizeText(firstOfLast?.text()?.split("·")?.[1]?.trim() || "");
      const category = sanitizeText(firstOfLast?.text()?.split("·")?.[0]?.trim() || "");
      const phone = sanitizeText(lastOfLast?.text()?.split("·")?.[1]?.trim() || "");

      const placeId = url ? `ChI${url.split("?")[0].split("ChI")[1]}` : null;

      const bizData = {
        storeName,
        placeId,
        address,
        category,
        phone,
        googleUrl: url,
        bizWebsite: website,
        ratingText,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
      };

      console.log(`Saving business: ${storeName}`);
      console.log(`Latitude: ${bizData.latitude}, Longitude: ${bizData.longitude}`);

      business.push(bizData);
    }

    console.log("Saving data to the database...");

    for (const biz of business) {
      const { storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText, latitude, longitude } = biz;
      if (storeName && placeId) {
        try {
          // Check if placeId already exists
          const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM businesses WHERE placeId = ?', [placeId]);
          if (rows[0].count > 0) {
            // Update existing entry
            console.log(`Duplicate entry found for placeId: ${placeId}. Updating existing entry...`);
            await pool.query(
              `UPDATE businesses 
               SET storeName = ?, address = ?, category = ?, phone = ?, googleUrl = ?, bizWebsite = ?, ratingText = ?, latitude = ?, longitude = ? 
               WHERE placeId = ?`,
              [storeName, address, category, phone, googleUrl, bizWebsite, ratingText, latitude, longitude, placeId]
            );
          } else {
            // Insert new entry
            console.log(`Saving business: ${storeName}`);
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

            await pool.query(
              `INSERT INTO businesses (storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText, latitude, longitude)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText, latitude, longitude]
            );
          }
        } catch (dbError) {
          console.error("Failed to save data to the database:", dbError);
        }
      }
    }

    console.log("Data successfully saved.");
    return business;
  } catch (error) {
    console.error("Error in searchGoogleMaps:", error);
    return [];
  }
}