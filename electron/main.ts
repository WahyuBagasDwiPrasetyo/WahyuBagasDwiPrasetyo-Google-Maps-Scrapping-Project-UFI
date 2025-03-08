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
        const results = await searchGoogleMaps(arg);
        event.reply("scraping-done", results);
    } catch (error) {
        event.reply("scraping-error", error);
    }
});