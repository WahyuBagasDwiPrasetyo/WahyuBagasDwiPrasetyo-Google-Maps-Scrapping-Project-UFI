import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import searchGoogleMaps from "./google-maps-scrape";
import mysql from 'mysql2/promise';

// Konfigurasi database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Sesuaikan dengan password MySQL Anda
    database: 'google_maps_scraper',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, "../public");

let window: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

async function createWindow() {
    window = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    window.webContents.on("did-finish-load", () => {
        window?.webContents.send(
            "main-process-message",
            new Date().toLocaleString()
        );
    });

    if (VITE_DEV_SERVER_URL) {
        window.loadURL(VITE_DEV_SERVER_URL);
    } else {
        window.loadFile(path.join(process.env.DIST, "index.html"));
    }
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        window = null;
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);

// Handler untuk mengambil data provinsi
ipcMain.handle('get-provinces', async () => {
    try {
        const [rows] = await pool.query(
            'SELECT kode as id, nama as name FROM wilayah_2022 WHERE CHAR_LENGTH(kode) = 2 ORDER BY nama ASC'
        );
        return rows;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return [];
    }
});

// Handler untuk mengambil data kabupaten
ipcMain.handle('get-regencies', async (_event, provinceCode) => {
    try {
        const [rows] = await pool.query(
            'SELECT kode as id, nama as name FROM wilayah_2022 WHERE CHAR_LENGTH(kode) = 5 AND kode LIKE ? ORDER BY nama ASC',
            [provinceCode + '%']
        );
        return rows;
    } catch (error) {
        console.error('Error fetching regencies:', error);
        return [];
    }
});

// Handler untuk mengambil data kecamatan
ipcMain.handle('get-districts', async (_event, regencyCode) => {
    try {
        const [rows] = await pool.query(
            'SELECT kode as id, nama as name FROM wilayah_2022 WHERE CHAR_LENGTH(kode) = 8 AND kode LIKE ? ORDER BY nama ASC',
            [regencyCode + '%']
        );
        return rows;
    } catch (error) {
        console.error('Error fetching districts:', error);
        return [];
    }
});

// Handler untuk mengambil data kelurahan/desa
ipcMain.handle('get-villages', async (_event, districtCode) => {
    try {
        const [rows] = await pool.query(
            'SELECT kode as id, nama as name FROM wilayah_2022 WHERE CHAR_LENGTH(kode) = 13 AND kode LIKE ? ORDER BY nama ASC',
            [districtCode + '%']
        );
        return rows;
    } catch (error) {
        console.error('Error fetching villages:', error);
        return [];
    }
});

// Handler untuk scraping
ipcMain.on("start-scraping", async (event, arg) => {
    try {
        if (typeof arg.query !== "string" || !arg.query.trim()) {
            throw new Error("Invalid query parameter. It must be a non-empty string.");
        }

        const results = await searchGoogleMaps(arg.query); // Pass the full query string

        // Add scraped_at field to results
        const today = new Date().toISOString().split("T")[0];
        const enrichedResults = results.map((result) => ({
            ...result,
            scrapedAt: today,
        }));

        event.reply("scraping-done", enrichedResults);
    } catch (error) {
        console.error("Error during scraping:", error);
        event.reply("scraping-error", error instanceof Error ? error.message : "An unknown error occurred");
    }
});

ipcMain.handle("update-place", async (_event, updatedPlace) => {
  try {
    const {
      storeName,
      placeId,
      address,
      category,
      phone,
      googleUrl,
      bizWebsite,
      ratingText,
      latitude,
      longitude,
    } = updatedPlace;

    // Update the database with the new data
    await pool.query(
      `UPDATE businesses 
       SET storeName = ?, address = ?, category = ?, phone = ?, googleUrl = ?, bizWebsite = ?, ratingText = ?, latitude = ?, longitude = ? 
       WHERE placeId = ?`,
      [storeName, address, category, phone, googleUrl, bizWebsite, ratingText, latitude, longitude, placeId]
    );

    console.log(`Place with ID ${placeId} successfully updated in the database.`);
  } catch (error) {
    console.error("Error updating place in the database:", error);
    throw error;
  }
});

ipcMain.handle("delete-place", async (_event, placeId) => {
  try {
    await pool.query("DELETE FROM businesses WHERE placeId = ?", [placeId]);
    console.log(`Place with ID ${placeId} successfully deleted from the database.`);
  } catch (error) {
    console.error(`Error deleting place with ID ${placeId} from the database:`, error);
    throw error;
  }
});

ipcMain.handle("get-scrapped-today", async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    // Fixed the type issue by removing the explicit type annotation
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE DATE(scraped_at) = ?",
      [today]
    );
    
    // Cast the result appropriately
    return (rows as any[])[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching today's scrapped count:", error);
    return 0;
  }
});