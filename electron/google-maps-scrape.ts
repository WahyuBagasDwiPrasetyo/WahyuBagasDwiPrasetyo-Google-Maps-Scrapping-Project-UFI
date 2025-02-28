import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import pool from "../database/db"; // Sesuaikan dengan lokasi db.ts

export default async function searchGoogleMaps(query: string): Promise<any[]> {
  try {
    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: false,
      dumpio: false,
      executablePath: "", // Ganti dengan path Chrome kamu jika diperlukan
    });

    const page = await browser.newPage();

    try {
      await page.goto(`https://www.google.com/maps/search/${query.split(" ").join("+")}`);
    } catch (error) {
      console.log("Error saat membuka halaman:", error);
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
    console.log("Browser ditutup");

    const $ = cheerio.load(html);
    const aTags: any = $("a");
    const parents: any[] = [];

    aTags.each((_i: number, el: any) => {
      const href: string | undefined = $(el).attr("href");
      if (href && href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    console.log("Jumlah bisnis ditemukan:", parents.length);

    const business: any[] = [];
    let index: number = 0;

    for (const parent of parents) {
      const url: string | undefined = parent.find("a").attr("href");
      const website: string | undefined = parent.find('a[data-value="Website"]').attr("href");
      const storeName: string = parent.find("div.fontHeadlineSmall").text();
      const ratingText: string | undefined = parent.find("span.fontBodyMedium > span").attr("aria-label");

      const bodyDiv: any = parent.find("div.fontBodyMedium").first();
      const children: any = bodyDiv.children();
      const lastChild: any = children.last();
      const firstOfLast: any = lastChild.children().first();
      const lastOfLast: any = lastChild.children().last();
      index++;

      const bizData = {
        index,
        storeName,
        placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
        address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
        category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
        phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
        googleUrl: url,
        bizWebsite: website,
        ratingText,
      };

      business.push(bizData);
    }

    business.sort((a, b) => (a.stars && b.stars ? b.stars - a.stars : 0));

    console.log("Menyimpan data ke database...");

    // Simpan data ke database MySQL
    for (const biz of business) {
      const { storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText } = biz;
      try {
        await pool.query(
          `INSERT INTO businesses (storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText]
        );
      } catch (dbError) {
        console.error("Gagal menyimpan data ke database:", dbError);
      }
    }

    console.log("Data berhasil disimpan.");
    return business;
  } catch (error) {
    console.error("Error di searchGoogleMaps:", error);
    return [];
  }
}
