# Denah Tempat Duduk LAB PPLG — Versi 2.0 PRO (Fleksibel & Dinamis)

Aplikasi denah laboratorium komputer modern dan fleksibel untuk pengaturan tempat duduk ujian, asesmen, atau kegiatan harian di LAB PPLG.

## Fitur Utama yang Telah Dikembangkan

### 1. Fleksibilitas Pengaturan Tempat Duduk (Seating Mode)
- **Drag & Drop Interaktif**:
  - Drag nama siswa dari daftar samping (sidebar) langsung ke kursi di denah.
  - Drag kursi langsung ke kursi lain untuk bertukar posisi duduk (SWAP) secara instan.
- **Sistem Klik untuk Tukar (Click-to-Swap)**:
  - Klik kursi manapun -> pilih "Tukar Posisi Kursi" -> klik kursi tujuan.
- **Menu Cepat Detail Kursi (Modal)**:
  - Lihat identitas siswa (Nama, NIS, Kode, Lab).
  - Ganti atau pilih siswa dari dropdown pencarian.
  - Kosongkan kursi.
  - Tandai kursi "Rusak / Cadangan".
  - Unggah foto siswa langsung per kursi.
- **Operasi Kursi Otomatis**:
  - 🔀 **Acak Kursi (Shuffle)**: Mengacak tempat duduk secara otomatis.
  - 🔤 **Urutkan A-Z**: Mengurutkan berdasarkan nama siswa.
  - 🆔 **Urutkan NIS**: Mengurutkan berdasarkan NIS/ID.
  - 🔢 **Sesuai Urutan Asli**: Mengembalikan urutan sesuai file awal.
  - 📥 **Isi Otomatis**: Memasukkan siswa yang belum duduk ke kursi-kursi kosong.
  - 🧹 **Kosongkan Denah**: Mengosongkan seluruh kursi sekaligus.
  - ↩️ **Undo**: Membatalkan perubahan terakhir jika salah klik atau tukar.

### 2. Editor Tata Letak & Desain Denah (Layout Designer Mode)
- **Bebas Geser Kursi & Elemen Ruangan**:
  - Aktifkan tab **"Mode Desain Layout"**.
  - Kursi dapat di-drag dan dipindahkan bebas ke posisi manapun dalam ruangan.
  - Meja Proktor, Meja Pengawas, Pintu Masuk, dan Papan Tulis/Layar juga dapat digeser posisinya.
- **Snap to Grid**:
  - Pilihan snap 10px / 20px agar posisi kursi lurus dan rapi.
- **Preset Denah Siap Pakai**:
  1. Default Lab PPLG (Kiri 28→17, Kanan 1→12, Tengah 29→40, Bawah 16→13).
  2. Barisan Klasik 5 Kolom x 8 Baris (40 Kursi).
  3. Barisan 4 Kolom x 10 Baris (40 Kursi).
  4. Model U-Shape / Keliling Lab (36 Kursi).
  5. Model Kelompok / Pods 4 Meja (40 Kursi).
  6. Model Dua Pulau Tengah / Twin Island (36 Kursi).
- **Tambah / Kurang & Rapikan Nomor Kursi**:
  - Tambah kursi baru (➕) atau kurangi (➖).
  - Tombol **"Rapikan Nomor Kursi"** untuk memberi nomor berurutan otomatis dari kiri atas ke kanan bawah.
- **Simpan & Bagikan Desain Layout**:
  - Ekspor layout ke file `.json` dan impor kembali kapan saja.

### 3. Kustomisasi Denah, Kop, & Tema Tampilan
- **Pengaturan Kop Denah**:
  - Nama Sekolah/Lembaga, Judul Kegiatan/Ujian, Nama Lab, Sesi, Tanggal, dan Proktor.
  - Klik logo lingkaran untuk mengubah teks logo.
- **Pilihan Orientasi Cetak**:
  - A4 Portrait (Tegak)
  - A4 Landscape (Mendatar / Melebar)
- **Pilihan Tema Warna**:
  - Ungu Signature Lab PPLG
  - Biru Modern
  - Hijau Zamrud
  - Abu Gelap (Slate)
  - Hitam Putih Hemat Tinta (Monochrome)

### 4. Ekspor & Cetak
- **Cetak ke Printer / Simpan PDF (A4)**:
  - Tampilan otomatis bersih dari toolbar & sidebar saat diprint.
- **Ekspor Daftar Duduk ke CSV**:
  - Menyimpan daftar nomor kursi, NIS, nama siswa, kode, lab, sesi, dan status kursi.
- **Unduh Template CSV**:
  - Tersedia template siap isi untuk data siswa baru.
- **Penyimpanan Otomatis (LocalStorage)**:
  - Semua perubahan posisi kursi, nama lab, dan susunan siswa tersimpan otomatis di browser tanpa khawatir hilang saat halaman di-refresh.

---
**LAB PPLG — SMKN / Lembaga Pendidikan Indonesia**
