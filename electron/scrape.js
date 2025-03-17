import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import mysql from "mysql2/promise";
import { createObjectCsvWriter } from 'csv-writer';

// Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Replace with your MySQL password if any
  database: "google_maps_scraper", // Make sure this matches your created database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    return false;
  }
}

async function init() {
  // Verify database connection before proceeding
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    console.error("Aborting process due to database connection failure");
    return;
  }

  const businesses = await searchGoogleMaps();
  if (businesses && businesses.length > 0) {
    console.log(`Found ${businesses.length} businesses to save`);
    await saveToDatabase(businesses);
  } else {
    console.log("No businesses found to save");
  }
}

async function searchGoogleMaps() {
  try {
    const start = Date.now();
    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: false,
      dumpio: false,
      executablePath: "", // Fill with your Chrome path
    });
    
    const page = await browser.newPage();
    const query = "Toko Kopi Purwokerto";
    console.log(`Searching for: ${query}`);

    try {
      await page.goto(`https://www.google.com/maps/search/${query.split(" ").join("+")}`);
      console.log("Successfully navigated to Google Maps");
    } catch (error) {
      console.log("Error going to page:", error.message);
    }

    async function autoScroll(page) {
      console.log("Starting auto-scroll to load all results...");
      await page.evaluate(async () => {
        const wrapper = document.querySelector('div[role="feed"]');
        if (!wrapper) {
          console.error("Feed wrapper not found");
          return;
        }

        await new Promise((resolve) => {
          let totalHeight = 0;
          let distance = 1000;
          let scrollDelay = 3000;
          let scrollCount = 0;

          let timer = setInterval(async () => {
            let scrollHeightBefore = wrapper.scrollHeight;
            wrapper.scrollBy(0, distance);
            totalHeight += distance;
            scrollCount++;

            if (scrollCount % 5 === 0) {
              console.log(`Scrolled ${scrollCount} times...`);
            }

            if (totalHeight >= scrollHeightBefore) {
              totalHeight = 0;
              await new Promise((res) => setTimeout(res, scrollDelay));
              let scrollHeightAfter = wrapper.scrollHeight;

              if (scrollHeightAfter <= scrollHeightBefore) {
                clearInterval(timer);
                console.log("Reached end of results");
                resolve();
              }
            }
          }, 700);
        });
      });
      console.log("Auto-scroll complete");
    }

    await autoScroll(page);
    console.log("Getting page content...");
    const html = await page.content();
    await browser.close();
    console.log("Browser closed");

    const $ = cheerio.load(html);
    const aTags = $("a");
    const parents = [];
    aTags.each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    console.log("Total results found:", parents.length);
    const businesses = [];
    let index = 0;

    parents.forEach((parent) => {
      const url = parent.find("a").attr("href");
      const website = parent.find('a[data-value="Website"]').attr("href");
      const storeName = parent.find("div.fontHeadlineSmall").text();
      const ratingText = parent.find("span.fontBodyMedium > span").attr("aria-label");
    
      const bodyDiv = parent.find("div.fontBodyMedium").first();
      const children = bodyDiv.children();
      const lastChild = children.last();
      const firstOfLast = lastChild.children().first();
      const lastOfLast = lastChild.children().last();
    
      // Improved placeId extraction using regex
      const placeId = url?.match(/ChI[^?]+/)?.[0] || "";
    
      // Extract latitude and longitude using regex
      let latitude = null;
      let longitude = null;
      const coordMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }
    
      index++;
      const businessData = {
        index,
        storeName,
        placeId,
        address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
        category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
        phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
        googleUrl: url,
        bizWebsite: website,
        ratingText,
        stars: ratingText?.split("Bintang")?.[0]?.trim() ? Number(ratingText?.split("Bintang")?.[0]?.trim()) : null,
        numberOfReviews: ratingText?.split("Bintang")?.[1]?.replace("Ulasan", "")?.trim()
          ? Number(ratingText?.split("Bintang")?.[1]?.replace("Ulasan", "")?.trim())
          : null,
        latitude,  // Add extracted latitude
        longitude, // Add extracted longitude
      };
    
      businesses.push(businessData);
      console.log(`Processed business: ${businessData.storeName}, Coordinates: (${latitude}, ${longitude})`);
    });    
    
    console.log("Scraping finished. Total businesses:", businesses.length);
    return businesses;
  } catch (error) {
    console.error("Error during scraping:", error);
    return [];
  }
}

async function saveToDatabase(businesses) {
  try {
    // Create table if it doesn't exist
    await pool.execute(`CREATE TABLE IF NOT EXISTS businesses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      storeName VARCHAR(255),
      placeId VARCHAR(255),
      address VARCHAR(255),
      category VARCHAR(255),
      phone VARCHAR(50),
      googleUrl TEXT,
      bizWebsite TEXT,
      ratingText VARCHAR(255),
      stars FLOAT,
      numberOfReviews INT,
      latitude FLOAT,
      longitude FLOAT
    )`);
    
    console.log("Table created or already exists");
    console.log("Saving data to database...");

    const insertQuery = `INSERT INTO businesses 
    (storeName, placeId, address, category, phone, googleUrl, bizWebsite, ratingText, stars, numberOfReviews, longitude, latitude) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  for (const business of businesses) {
    console.log("Saving to database:", { 
      storeName: business.storeName, 
      placeId: business.placeId, 
      address: business.address 
    });
  
    try {
      await pool.execute(insertQuery, [
        business.storeName,
        business.placeId,
        business.address,
        business.category,
        business.phone,
        business.googleUrl,
        business.bizWebsite,
        business.ratingText,
        business.stars,
        business.numberOfReviews,
        business.longitude, 
        business.latitude   
      ]);
      console.log(`Business data for ${business.storeName} saved successfully`);
    } catch (dbError) {
      console.error(`Failed to save ${business.storeName}:`, dbError);
    }
  }
  

    console.log("All data saved to database");
    
    // Optional: export to CSV as backup
    await exportToCSV(businesses);
    
  } catch (error) {
    console.error("Failed to save data to database:", error);
  }
}

async function exportToCSV(businesses) {
  try {
    const csvWriter = createObjectCsvWriter({
      path: './google_maps_results.csv',
      header: [
        { id: 'index', title: 'No' },
        { id: 'storeName', title: 'Store Name' },
        { id: 'placeId', title: 'Place ID' },
        { id: 'address', title: 'Address' },
        { id: 'category', title: 'Category' },
        { id: 'phone', title: 'Phone' },
        { id: 'googleUrl', title: 'Google URL' },
        { id: 'bizWebsite', title: 'Website' },
        { id: 'ratingText', title: 'Rating Text' },
        { id: 'stars', title: 'Stars' },
        { id: 'numberOfReviews', title: 'Reviews' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' }
      ]
    });
    
    await csvWriter.writeRecords(businesses);
    console.log('✅ CSV file created successfully as a backup');
  } catch (error) {
    console.error('❌ Error creating CSV:', error);
  }
}

init();