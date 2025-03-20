## Aplikasi Desktop Scraping Google Maps - United Farmatic Indonesia Internship Project

Aplikasi ini adalah proyek website selama magang di **United Farmatic Indonesia**. Dibuat sebagai software desktop untuk Ekstraksi Data Google Maps! Dibangun pakai **Electron, React JS, Puppeteer, sama Vite**, tool ini bisa ngumpulin data bisnis atau lokasi berdasarkan kata kunci yang kamu ketik.

### Teknologi yang Digunakan Selama Development

- **Electron**: Framework yang memungkinkan aplikasi web berjalan sebagai aplikasi desktop. Dengan Electron, aplikasi ini bisa digunakan di Windows, macOS, dan Linux tanpa perlu mengakses browser.

- **React JS**: Library JavaScript untuk membangun user interface yang responsif dan interaktif. React membuat tampilan aplikasi jadi smooth dan dinamis.

- **Puppeteer**: Library Node.js yang memberikan API untuk mengontrol Chrome/Chromium. Ini adalah mesin utama yang melakukan scraping data dari Google Maps Secara Gratis Tanpa Google API.

- **Vite**: Build tool yang super cepat untuk pengembangan frontend. 

### Fitur Utama

- **Pencarian Fleksibel**: Masukkan berbagai kata kunci untuk mencari bisnis, lokasi, atau tempat di daerah manapun.

- **Ekstraksi Data Komprehensif**: Dapatkan informasi lengkap seperti nama bisnis, alamat, nomor telepon, rating, jumlah review, koordinat (longtitude & latitude, dan website.

- **Export Data**: Hasil scraping bisa didownload dalam format CSV atau Excel untuk diolah lebih lanjut.

- **UI Ramah Pengguna**: Tampilan yang simpel dan intuitif, cocok buat yang baru mulai sampe yang udah pro.

- **Kustomisasi Pencarian**: Atur parameter pencarian seperti radius, jumlah hasil, dan filter khusus.

### Instalasi

Cara pasangnya gampang:

1. **Clone Repository**
   ```bash
   git clone https://github.com/WahyuBagasDwiPrasetyo-Google-Maps-Scrapping-Project-UFI
   ```
2. **Masuk ke Folder Proyek**
   ```bash
   cd your-project
   ```
3. **Install Dependencies**
   ```bash
   npm install
   ```
4. **Jalanin Aplikasinya**
   ```bash
   npm run dev
   ```

### Cara Pakai

1. Buka aplikasinya.
2. Masukin kata kunci yang mau dicari (contoh: "restoran Jakarta", "apotek Bandung").
3. Atur parameter tambahan jika perlu (radius pencarian, jumlah hasil maksimal).
4. Klik tombol **"Search"** buat mulai proses scraping.
5. Tunggu bentar ya. Hasilnya bakal muncul dalam bentuk tabel.
6. Review datanya dan filter sesuai kebutuhan.
7. Klik tombol "Export" untuk menyimpan data dalam format yang diinginkan.

### Penanganan Error

Aplikasi dilengkapi dengan sistem penanganan error untuk berbagai situasi:
- Koneksi internet terputus
- Pembatasan akses dari Google
- Timeout selama proses scraping
- Format data tidak sesuai

### Penting Nih!

Pake aplikasi ini yang bijak ya dan patuhi **aturan Google** soal scraping. Jangan sampai melanggar kebijakan Cuy Nnanti Kebanned. Beberapa hal yang perlu kamu perhatikan:
- Batasi jumlah request dalam waktu tertentu
- Gunakan delay antar request untuk menghindari pembatasan
- Jangan menggunakan data untuk tujuan yang melanggar hukum
- Hormati hak cipta dan privasi data

### Pengembangan Kedepan

Aplikasi ini bakal terus dikembangin dengan fitur-fitur baru yang bakal diumumin di versi selanjutnya:
- Integrasi dengan database untuk penyimpanan jangka panjang
- Fitur scheduling untuk scraping otomatis
- Dashboard visualisasi data
- Sistem notifikasi untuk update data baru

### Kontribusi

Tertarik untuk berkontribusi? Silakan fork repository dan ajukan pull request dengan perbaikan atau fitur baru yang kamu usulkan!

Butuh bantuan? Langsung aja kontak lewat email: **wahyubagas.smk@gmail.com**
