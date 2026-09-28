# Sistem Keuangan & Pendataan Warga Tulip IX

```
tulip-ix/
├── dashboard.html          Ringkasan kas, grafik, transaksi terakhir
├── masterwarga.html        Data warga (CRUD)
├── masterkategori.html     Kategori pemasukan / pengeluaran (CRUD)
├── transaksi.html          Catatan transaksi kas (CRUD)
├── laporankeuangan.html    Laporan per periode + cetak
└── assets/
    ├── css/style.css               Scrollbar & aturan print
    ├── img/favicon.png             Ganti dengan favicon Anda
    └── js/
        ├── common.js               Format Rupiah, modal login, sidebar mobile
        ├── firebase.js             Auth, Firestore realtime, simpan/hapus
        ├── config/
        │   ├── firebase-config.js  Konfigurasi proyek Firebase
        │   └── tailwind-config.js  Konfigurasi Tailwind CDN
        └── pages/                  Logika tiap halaman
```

## Menjalankan
Jangan buka dengan klik ganda (file://): ES Module dan Firebase Auth butuh http(s).
Gunakan salah satu:
- VS Code + ekstensi Live Server, atau
- `python -m http.server 8000` di folder ini, lalu buka http://localhost:8000/dashboard.html

Untuk online, upload seluruh folder ke Firebase Hosting / Netlify / hosting statis lain.
Domain hosting harus ada di Firebase Console > Authentication > Settings > Authorized domains.

## Catatan
- Tiap halaman hanya membaca koleksi Firestore yang ia butuhkan (atribut `data-collections` di `<body>`).
- Menambah menu: buat halaman baru, tambahkan link di sidebar semua halaman, dan file JS di `assets/js/pages/`.
- Keamanan: status "admin" di sisi klien hanya untuk tampilan. Pastikan Firestore Security Rules membatasi
  tulis/hapus hanya untuk akun admin Anda, dan nonaktifkan pendaftaran akun baru bila tidak dipakai.
