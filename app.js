/**
 * DENAH TEMPAT DUDUK LAB PPLG — SISTEM FLEKSIBEL & DINAMIS (v2.4 PRO)
 * Card Template: Persegi Panjang (78x56px), Nama Maksimal 2 Kata Depan,
 * Foto Dominan, Nomor Kursi Pojok, dan Zero-clipping A4 Print Fit.
 */

// =============================================================================
// GLOBAL STATE & STORAGE
// =============================================================================

const STORAGE_KEY_SEATING = "pplg_denah_seating_v4_0";
const STORAGE_KEY_LAYOUT = "pplg_denah_layout_v4_0";
const STORAGE_KEY_SETTINGS = "pplg_denah_settings_v4_0";
const STORAGE_KEY_SHEETS = "pplg_denah_sheets_v4_0";
const STORAGE_KEY_ACTIVE_SHEET = "pplg_denah_active_sheet_v4_0";

const state = {
  students: [],          // Raw or uploaded student list
  seats: {},             // Map: { [seatNum]: { x, y, occupantId, disabled } }
  roomElements: {        // Movable room props - Presisi center (Room width: 670px, Center: 335px)
    entrance: { x: 24, y: 8, label: "PINTU MASUK" },
    whiteboard: { x: 205, y: 8, label: "LAYAR PROYEKTOR / PAPAN TULIS" },
    proctor: { x: 231, y: 36, label: "MEJA PROKTOR" },
    supervisor: { x: 343, y: 36, label: "MEJA PENGAWAS" }
  },
  currentSheetKey: "LAB-PPLG-SESI-1",
  sheets: {},            // Multi-sheet data store
  activeLab: "ALL",
  activeLabTemplate: "PPLG", // "PPLG" | "BCF" | "TJKT"
  activeSession: "Sesi 1",
  activeMode: "seating", // "seating" | "layout"
  snapGrid: 10,
  activeTab: "all",      // "all" | "unseated" | "seated"
  searchQuery: "",
  swapSourceSeat: null,
  activeModalSeat: null,
  zoomLevel: 1.0,
  undoStack: [],
  settings: {
    institution: "SMK PPLG INDONESIA",
    exam: "Denah Tempat Duduk — Tes Kemampuan Akademik",
    labName: "LAB PPLG",
    session: "Sesi 1",
    date: "Okt 2026",
    proctorName: "Proktor Lab",
    theme: "purple",
    orientation: "portrait",
    idDisplayFormat: "nis_full", // "nis_full" | "nis_short" | "code" | "no_only"
    logoImage: "default_logo.png",
    logoText: "LAB"
  }
};

// =============================================================================
// HELPER: SHORTEN NAME TO MAX 2 FIRST WORDS
// =============================================================================

function formatDisplayName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName.trim();
  return parts.slice(0, 2).join(" ");
}

// =============================================================================
// PRESET LAYOUT GENERATORS (PERSEGI PANJANG & ZERO-CLIPPING A4 FIT)
// =============================================================================

/**
 * Default PPLG Layout:
 * Room width: 670px, Center: 335px
 * Seat Width: 82px, Seat Height: 60px (Persegi panjang lega menampung nama & foto)
 * Left Col: 28 down to 17 (x: 24, margin kiri: 24px)
 * Right Col: 1 to 12 (x: 564 -> margin kanan: 670 - (564+82) = 24px, 100% simetris)
 * Middle Island: 29..34 (x: 245) and 35..40 (x: 343) -> Center: 335 (Aisle: 139px tiap sisi, 100% seimbang)
 * Bottom Row: 16, 15, 14, 13 (x: 147, 245, 343, 441) -> Center: 335 (Margin: 147px tiap sisi)
 */
function generateDefaultPPLGSeats() {
  const seats = {};
  const rowStep = 64;
  const startY = 64;

  // Kiri: Kursi 28 turun ke 17 (12 kursi) - Margin kiri: 24px
  [28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17].forEach((n, i) => {
    seats[n] = { x: 24, y: startY + i * rowStep, occupantId: null, disabled: false };
  });

  // Kanan: Kursi 1 naik ke 12 (12 kursi) - Margin kanan: 24px (Presisi simetris dengan kiri)
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((n, i) => {
    seats[n] = { x: 564, y: startY + i * rowStep, occupantId: null, disabled: false };
  });

  // Pulau Tengah (2 kolom x 6 baris): Kursi 29 s/d 40
  // Kolom 2: x = 245 (aisle kiri: 245 - 106 = 139px)
  // Kolom 3: x = 343 (aisle kanan: 564 - 425 = 139px)
  // Jarak kedua kolom pulau = 16px, Titik tengah pulau = 335px (Presisi di tengah ruangan 670px)
  [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40].forEach((n, i) => {
    const isCol2 = i >= 6;
    const colX = isCol2 ? 343 : 245;
    const row = i % 6;
    seats[n] = { x: colX, y: 192 + row * rowStep, occupantId: null, disabled: false };
  });

  // Baris Bawah: Kursi 16, 15, 14, 13 (sejajar baris ke-11)
  // Kursi 15 dan 14 presisi sejajar di bawah kolom tengah (x: 245 dan 343)
  // Kursi 16 di x: 147, Kursi 13 di x: 441. Margin kiri & kanan = 147px (100% simetris!)
  const bottomY = startY + 11 * rowStep; // 768px
  const bottomX = [147, 245, 343, 441];
  [16, 15, 14, 13].forEach((n, i) => {
    seats[n] = { x: bottomX[i], y: bottomY, occupantId: null, disabled: false };
  });

  return seats;
}

function generateBCFSeats() {
  // Template LAB BCF (Broadcasting & Perfilman):
  // Workstation editing suites & studio island layout (40 Kursi)
  return generateDefaultPPLGSeats();
}

function generateTJKTSeats() {
  // Template LAB TJKT (Teknik Jaringan Komputer & Telekomunikasi):
  // Perimeter network cable benches & central router pods (40 Kursi)
  return generateDefaultPPLGSeats();
}

function generateGridSeats(cols = 5, rows = 8) {
  const seats = {};
  const seatW = 78;
  const seatH = 56;
  const roomW = 676;
  const gapX = cols === 5 ? 42 : 60;
  const gapY = rows === 8 ? 36 : 22;

  const totalGridW = cols * seatW + (cols - 1) * gapX;
  const startX = Math.round((roomW - totalGridW) / 2);
  const startY = 72;

  let count = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats[count] = {
        x: startX + c * (seatW + gapX),
        y: startY + r * (seatH + gapY),
        occupantId: null,
        disabled: false
      };
      count++;
    }
  }
  return seats;
}

function generateUShapeSeats() {
  const seats = {};
  let num = 1;
  const rowStep = 64;
  const startY = 64;

  for (let i = 0; i < 12; i++) {
    seats[num++] = { x: 18, y: startY + i * rowStep, occupantId: null, disabled: false };
  }
  const bottomStartX = 100;
  const bottomStep = 40;
  for (let i = 0; i < 12; i++) {
    seats[num++] = { x: bottomStartX + i * bottomStep, y: 770, occupantId: null, disabled: false };
  }
  for (let i = 11; i >= 0; i--) {
    seats[num++] = { x: 580, y: startY + i * rowStep, occupantId: null, disabled: false };
  }
  return seats;
}

function generatePodsSeats() {
  const seats = {};
  let num = 1;
  const podPositions = [
    { x: 110, y: 74 }, { x: 380, y: 74 },
    { x: 110, y: 218 }, { x: 380, y: 218 },
    { x: 110, y: 362 }, { x: 380, y: 362 },
    { x: 110, y: 506 }, { x: 380, y: 506 },
    { x: 110, y: 650 }, { x: 380, y: 650 },
  ];
  podPositions.forEach((pod) => {
    seats[num++] = { x: pod.x, y: pod.y, occupantId: null, disabled: false };
    seats[num++] = { x: pod.x + 86, y: pod.y, occupantId: null, disabled: false };
    seats[num++] = { x: pod.x, y: pod.y + 64, occupantId: null, disabled: false };
    seats[num++] = { x: pod.x + 86, y: pod.y + 64, occupantId: null, disabled: false };
  });
  return seats;
}

function generateTwinIslandsSeats() {
  const seats = {};
  let num = 1;
  const step = 72;
  const startY = 68;

  for (let i = 0; i < 10; i++) {
    seats[num++] = { x: 16, y: startY + i * step, occupantId: null, disabled: false };
  }
  for (let r = 0; r < 4; r++) {
    seats[num++] = { x: 155, y: 175 + r * step, occupantId: null, disabled: false };
    seats[num++] = { x: 245, y: 175 + r * step, occupantId: null, disabled: false };
  }
  for (let r = 0; r < 4; r++) {
    seats[num++] = { x: 355, y: 175 + r * step, occupantId: null, disabled: false };
    seats[num++] = { x: 445, y: 175 + r * step, occupantId: null, disabled: false };
  }
  for (let i = 0; i < 10; i++) {
    seats[num++] = { x: 582, y: startY + i * step, occupantId: null, disabled: false };
  }
  return seats;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  loadSavedSettings();
  loadSavedLayout();
  initEventListeners();
  loadDefaultData();
});

function resetAllAppData() {
  if (!confirm("Apakah Anda yakin ingin me-reset total aplikasi ke kondisi awal pabrik? Seluruh pengaturan, kursi, dan data di aplikasi akan dibersihkan.")) {
    return;
  }
  try {
    localStorage.clear();
  } catch (e) {}
  window.location.reload();
}

function initEventListeners() {
  const labSel = document.getElementById("labSelect");
  if (labSel) {
    labSel.addEventListener("change", (e) => {
      state.activeLab = e.target.value;
      updateLabTitle();
      renderStudentList();
      renderSeats();
    });
  }

  const sesInput = document.getElementById("sessionInput");
  if (sesInput) {
    sesInput.addEventListener("input", (e) => {
      state.activeSession = e.target.value;
      state.settings.session = e.target.value;
      const sessionTitle = document.getElementById("sessionTitle");
      if (sessionTitle) sessionTitle.textContent = e.target.value || "Sesi 1";
      const badge = document.getElementById("activeSheetBadge");
      if (badge) badge.textContent = e.target.value || "Sesi 1";
      if (state.sheets[state.currentSheetKey]) {
        state.sheets[state.currentSheetKey].session = e.target.value;
        saveSheetsToStorage();
      }
      saveSettingsToStorage();
    });
  }

  const fInput = document.getElementById("fileInput");
  if (fInput) {
    fInput.addEventListener("change", handleFileUpload);
  }
}

// =============================================================================
// PHOTO DATABASE & RESOLVER
// =============================================================================

let PHOTO_DATABASE = {};

const EMBEDDED_PHOTO_DB = {
  "christiangiovanimezewea": "FOTOANAKANAKSETAN/X DKV 1/CHRISTIAN GIOVANI.jpg",
  "rebeccafeliciachristie": "FOTOANAKANAKSETAN/X DKV 1/REBECCA FELICIA.jpg",
  "rizkydwiprasetiyo": "FOTOANAKANAKSETAN/X DKV 1/RIZKY DWI PRASETYO.jpg",
  "gabrielayuanitaberlianmegaputri": "FOTOANAKANAKSETAN/X DKV 1/GABRIELLA YUANITA.jpg",
  "biancaryleerikin": "FOTOANAKANAKSETAN/X DKV 1/BIANCA RYLEE KIKIN.jpg",
  "faridasyrafsabiq": "FOTOANAKANAKSETAN/X DKV 1/FARID ASYRAF SABIQ.jpg",
  "jacquelynnsyallomeleoramt": "FOTOANAKANAKSETAN/X DKV 1/JACQUELYNN SYALOOM.jpg",
  "fachriilham": "FOTOANAKANAKSETAN/X DKV 1/FACHRI ILHAM.jpg",
  "kenzietimothykimoranainggolan": "FOTOANAKANAKSETAN/X DKV 1/KENZIE TIMOTHY.jpg",
  "rassyadwiputraradityarochman": "FOTOANAKANAKSETAN/X DKV 1/RASSYA DWI PUTRA.jpg",
  "asyafaizahludieny": "FOTOANAKANAKSETAN/X DKV 1/ASYA FAIZAH LUDIENY.jpg",
  "muhamadirsyadazhar": "FOTOANAKANAKSETAN/X DKV 1/MUHAMAD IRSYAD AZHAR.jpg",
  "muhammadalfahrizysetiawan": "FOTOANAKANAKSETAN/X DKV 1/MUHAMMAD ALFAHRIZY.jpg",
  "davinamaulidazahra": "FOTOANAKANAKSETAN/X DKV 1/DAVINA MAULIDA ZAHRA.jpg",
  "kinaranaomi": "FOTOANAKANAKSETAN/X DKV 1/KINARA NAOMI.jpg",
  "ferdiansyah": "FOTOANAKANAKSETAN/X DKV 1/FERDIANSYAH.jpg",
  "muhammadfachrezyakbar": "FOTOANAKANAKSETAN/X DKV 1/MUHAMMAD FACHREZY.jpg",
  "hafizahkaylaputri": "FOTOANAKANAKSETAN/X DKV 1/HAFIZAH KAYLA PUTRI.jpg",
  "muhammadfarandzulyarfano": "FOTOANAKANAKSETAN/X DKV 1/MUHAMMAD FARAND.jpg",
  "vonnieyerevatumanggur": "FOTOANAKANAKSETAN/X DKV 1/VONNY YEREFA TUMANGGOR.jpg",
  "alexadiandraanantadewisuhendiputri": "FOTOANAKANAKSETAN/X DKV 1/ALEXADIANRA A.D.jpg",
  "aryasutrisnoaritonang": "FOTOANAKANAKSETAN/X DKV 1/ARYA SUTRISNO ARITONANG.jpg",
  "fahrialbuqory": "FOTOANAKANAKSETAN/X DKV 1/FAHRI ALBUQORY.jpg",
  "bernadetandriarosari": "FOTOANAKANAKSETAN/X DKV 1/BERNADET ANDRIA.jpg",
  "tsaniaamalianabila": "FOTOANAKANAKSETAN/X DKV 1/TSANIA AMALIA NABLIA.jpg",
  "kaysanmaiza": "FOTOANAKANAKSETAN/X DKV 1/KAYSAN MAIZA.jpg",
  "asyraqsharezasuroso": "FOTOANAKANAKSETAN/X DKV 1/ASYRAQ SHAREZA.jpg",
  "rasharovianazra": "FOTOANAKANAKSETAN/X DKV 1/RASHA ROVIAN AZRA.jpg",
  "carrissatabina": "FOTOANAKANAKSETAN/X DKV 1/CARISSA TABINA.jpg",
  "agueroerdhianpranaja": "FOTOANAKANAKSETAN/X DKV 1/AGUERO ERDHIAN.jpg",
  "aryawiryadacostariyadi": "FOTOANAKANAKSETAN/X DKV 1/ARYA WIRA DACOSTA.jpg",
  "keishanaurasalsabila": "FOTOANAKANAKSETAN/X DKV 1/KEISHA NAURA SALSABILA.jpg",
  "hafidzrafirabbani": "FOTOANAKANAKSETAN/X DKV 1/HAFIDZ RAFI RABBANI.jpg",
  "zakynauvalrabbani": "FOTOANAKANAKSETAN/X TJKT 1/ZAKY.jpg",
  "michaeldavila": "FOTOANAKANAKSETAN/X TJKT 1/MICHAEL.jpg",
  "muhamadteukukaffawaefrieputeh": "FOTOANAKANAKSETAN/X TJKT 1/TEUKU.jpg"
};

async function loadPhotoDatabase() {
  try {
    const resp = await fetch("photo_database.json");
    if (resp.ok) {
      PHOTO_DATABASE = await resp.json();
    }
  } catch (e) {
    console.warn("Using embedded photo database fallback:", e);
  }
}

function resolveStudentPhoto(name, explicitPhoto) {
  if (explicitPhoto && explicitPhoto.trim()) {
    return explicitPhoto.trim().replace(/\\/g, "/");
  }
  if (!name) return null;
  const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cName = clean(name);

  const db = { ...EMBEDDED_PHOTO_DB, ...(PHOTO_DATABASE || {}) };

  // 1. Direct match
  if (db[cName]) {
    return db[cName].replace(/\\/g, "/");
  }

  // 2. Substring match
  for (const [k, p] of Object.entries(db)) {
    if (k.length > 5 && (cName.includes(k) || k.includes(cName))) {
      return p.replace(/\\/g, "/");
    }
  }

  // 3. Multi-word match (first 2 words)
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const twoWords = clean(parts[0] + parts[1]);
    for (const [k, p] of Object.entries(db)) {
      if (k.includes(twoWords) || twoWords.includes(k)) {
        return p.replace(/\\/g, "/");
      }
    }
  }

  // 4. First word match (at least 5 letters)
  if (parts.length >= 1 && parts[0].length >= 5) {
    const firstWord = clean(parts[0]);
    for (const [k, p] of Object.entries(db)) {
      if (k.startsWith(firstWord)) {
        return p.replace(/\\/g, "/");
      }
    }
  }

  return null;
}

// =============================================================================
// DATA PARSING & SAMPLES
// =============================================================================

function norm(v) {
  return String(v ?? "").trim();
}

function parseRows(rows) {
  return rows.map((r, idx) => {
    const keys = Object.keys(r);
    const get = (names) => {
      for (const n of names) {
        const k = keys.find(x => norm(x).toLowerCase() === n.toLowerCase());
        if (k) return norm(r[k]);
      }
      return "";
    };
    const name = get(["Nama", "NAMA", "Nama Siswa", "Nama Lengkap", "Nama_Lengkap"]);
    const id = get(["ID Siswa", "ID", "NIS", "NISN", "No Peserta", "ID_Siswa_NIS"]) || `S-${idx + 1}`;
    const code = get(["Kode", "KODE", "Kode Peserta", "Kode_Peserta", "No"]) || "";
    const lab = get(["Lab", "LAB", "Ruang", "Kelas"]) || "LAB PPLG";
    const session = get(["Sesi", "SESI", "Session", "SESSION", "Sesi Ujian"]);
    const explicitPhoto = get(["Foto", "FOTO", "Photo", "PHOTO", "URL Foto", "Gambar", "File Foto", "Foto URL", "Image", "File_Foto"]);
    const photo = resolveStudentPhoto(name, explicitPhoto);
    return { id, name, code, lab, session, photo };
  }).filter(x => x.name);
}

// =============================================================================
// MULTI-SHEET / MULTI-SESI DATA & SWITCHER (LAB PPLG, BCF, TJKT SESI 1-3)
// =============================================================================

function initDefaultSheets(allCsvStudents = []) {
  // Ambil murni data siswa dari data.csv berdasarkan kolom SESI (1, 2, atau 3)
  const getSessionStudents = (sesiNum) => {
    return (allCsvStudents || []).filter(s => {
      const ses = String(s.session || "").trim().toLowerCase();
      return ses === String(sesiNum) || ses === `sesi ${sesiNum}` || ses === `sesi-${sesiNum}` || ses === `session ${sesiNum}`;
    });
  };

  const s1Students = getSessionStudents(1);
  const s2Students = getSessionStudents(2);
  const s3Students = getSessionStudents(3);

  // Jika kolom sesi tidak ada / kosong di CSV, potong per 36 baris langsung dari data.csv
  const p1Students = s1Students.length > 0 ? s1Students : allCsvStudents.slice(0, 36);
  const p2Students = s2Students.length > 0 ? s2Students : allCsvStudents.slice(36, 72);
  const p3Students = s3Students.length > 0 ? s3Students : allCsvStudents.slice(72, 108);

  // Helper kursi 1..36 default
  const buildInitialSeating = (studentList) => {
    const seating = {};
    (studentList || []).forEach((s, idx) => {
      const seatNum = idx + 1;
      if (seatNum <= 36) {
        seating[seatNum] = s.id;
      }
    });
    return seating;
  };

  state.sheets = {
    "LAB-PPLG-SESI-1": {
      name: "LAB PPLG — Sesi 1",
      lab: "LAB PPLG",
      labTemplate: "PPLG",
      session: "Sesi 1",
      students: p1Students,
      seating: buildInitialSeating(p1Students)
    },
    "LAB-PPLG-SESI-2": {
      name: "LAB PPLG — Sesi 2",
      lab: "LAB PPLG",
      labTemplate: "PPLG",
      session: "Sesi 2",
      students: p2Students,
      seating: buildInitialSeating(p2Students)
    },
    "LAB-PPLG-SESI-3": {
      name: "LAB PPLG — Sesi 3",
      lab: "LAB PPLG",
      labTemplate: "PPLG",
      session: "Sesi 3",
      students: p3Students,
      seating: buildInitialSeating(p3Students)
    },
    "LAB-BCF-SESI-1": {
      name: "LAB BCF — Sesi 1",
      lab: "LAB BCF",
      labTemplate: "BCF",
      session: "Sesi 1",
      students: p1Students,
      seating: buildInitialSeating(p1Students)
    },
    "LAB-BCF-SESI-2": {
      name: "LAB BCF — Sesi 2",
      lab: "LAB BCF",
      labTemplate: "BCF",
      session: "Sesi 2",
      students: p2Students,
      seating: buildInitialSeating(p2Students)
    },
    "LAB-BCF-SESI-3": {
      name: "LAB BCF — Sesi 3",
      lab: "LAB BCF",
      labTemplate: "BCF",
      session: "Sesi 3",
      students: p3Students,
      seating: buildInitialSeating(p3Students)
    },
    "LAB-TJKT-SESI-1": {
      name: "LAB TJKT — Sesi 1",
      lab: "LAB TJKT",
      labTemplate: "TJKT",
      session: "Sesi 1",
      students: p1Students,
      seating: buildInitialSeating(p1Students)
    },
    "LAB-TJKT-SESI-2": {
      name: "LAB TJKT — Sesi 2",
      lab: "LAB TJKT",
      labTemplate: "TJKT",
      session: "Sesi 2",
      students: p2Students,
      seating: buildInitialSeating(p2Students)
    },
    "LAB-TJKT-SESI-3": {
      name: "LAB TJKT — Sesi 3",
      lab: "LAB TJKT",
      labTemplate: "TJKT",
      session: "Sesi 3",
      students: p3Students,
      seating: buildInitialSeating(p3Students)
    }
  };

  saveSheetsToStorage();
}

function saveCurrentSheetState() {
  if (!state.currentSheetKey) return;
  if (!state.sheets[state.currentSheetKey]) {
    state.sheets[state.currentSheetKey] = {};
  }
  const currentOccupants = {};
  Object.keys(state.seats).forEach(num => {
    currentOccupants[num] = state.seats[num].occupantId || null;
  });
  state.sheets[state.currentSheetKey].students = [...(state.students || [])];
  state.sheets[state.currentSheetKey].seating = currentOccupants;
  // Simpan juga struktur posisi kursi dan elemen ruangan khusus denah ini
  state.sheets[state.currentSheetKey].seats = JSON.parse(JSON.stringify(state.seats || {}));
  state.sheets[state.currentSheetKey].roomElements = JSON.parse(JSON.stringify(state.roomElements || {}));

  // Simpan kop header khusus denah ini
  state.sheets[state.currentSheetKey].header = {
    institution: state.settings.institution || "SMK PPLG INDONESIA",
    exam: state.settings.exam || "Denah Tempat Duduk — Tes Kemampuan Akademik",
    labName: state.settings.labName || "LAB PPLG",
    session: state.settings.session || "Sesi 1",
    date: state.settings.date || "Okt 2026",
    proctorName: state.settings.proctorName || "Proktor Lab",
    logoImage: state.settings.logoImage || "",
    logoText: state.settings.logoText || "LAB"
  };

  saveSheetsToStorage();
}

function saveSheetsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(state.sheets));
  } catch (e) {
    console.warn("Gagal menyimpan sheets ke storage:", e);
  }
}

function loadSavedSheets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Gagal memuat sheets dari storage:", e);
  }
  return null;
}

function switchSheet(sheetKey, skipSave = false) {
  if (!sheetKey) return;

  // Hanya simpan state sheet sebelumnya jika benar-benar berganti ke sheet yang lain,
  // skipSave false, dan sheet lama memang memiliki siswa terisi
  if (!skipSave && state.currentSheetKey && state.currentSheetKey !== sheetKey && state.students && state.students.length > 0) {
    saveCurrentSheetState();
  }
  state.currentSheetKey = sheetKey;

  if (!state.sheets[sheetKey]) {
    const sUpper = sheetKey.toUpperCase();
    let lab = "LAB PPLG";
    let labTemplate = "PPLG";
    let session = "Sesi 1";
    if (sUpper.includes("BCF")) { lab = "LAB BCF"; labTemplate = "BCF"; }
    else if (sUpper.includes("TJKT")) { lab = "LAB TJKT"; labTemplate = "TJKT"; }
    const m = sUpper.match(/SESI[\s-_]*([0-9]+)/);
    if (m) session = `Sesi ${m[1]}`;

    state.sheets[sheetKey] = {
      name: sheetKey,
      lab,
      labTemplate,
      session,
      students: [],
      seating: {}
    };
  }

  const sheet = state.sheets[sheetKey];
  state.students = sheet.students || [];
  state.activeLab = sheet.lab || "LAB PPLG";
  state.activeSession = sheet.session || "Sesi 1";

  // Muat kop header khusus denah ini ke state.settings
  if (!sheet.header) {
    sheet.header = {
      institution: state.settings.institution || "SMK PPLG INDONESIA",
      exam: state.settings.exam || "Denah Tempat Duduk — Tes Kemampuan Akademik",
      labName: sheet.lab || "LAB PPLG",
      session: sheet.session || "Sesi 1",
      date: state.settings.date || "Okt 2026",
      proctorName: state.settings.proctorName || "Proktor Lab",
      logoImage: state.settings.logoImage || "",
      logoText: state.settings.logoText || "LAB"
    };
  }

  state.settings.institution = sheet.header.institution || "SMK PPLG INDONESIA";
  state.settings.exam = sheet.header.exam || "Denah Tempat Duduk — Tes Kemampuan Akademik";
  state.settings.labName = sheet.lab || sheet.header.labName || "LAB PPLG";
  state.settings.session = sheet.session || sheet.header.session || "Sesi 1";
  state.settings.date = sheet.header.date || "Okt 2026";
  state.settings.proctorName = sheet.header.proctorName || "Proktor Lab";
  state.settings.logoImage = sheet.header.logoImage !== undefined ? sheet.header.logoImage : "";
  state.settings.logoText = sheet.header.logoText || "LAB";

  // Update elemen DOM kop header
  if (document.getElementById("institutionTitle")) document.getElementById("institutionTitle").textContent = state.settings.institution;
  if (document.getElementById("examTitle")) document.getElementById("examTitle").textContent = state.settings.exam;
  if (document.getElementById("examDate")) document.getElementById("examDate").textContent = state.settings.date;
  if (document.getElementById("proctorNameDisplay")) document.getElementById("proctorNameDisplay").textContent = state.settings.proctorName;
  if (document.getElementById("labTitle")) document.getElementById("labTitle").textContent = state.settings.labName;
  if (document.getElementById("sessionTitle")) document.getElementById("sessionTitle").textContent = state.settings.session;
  if (document.getElementById("sessionInput")) document.getElementById("sessionInput").value = state.settings.session;

  applyHeaderLogoToDOM();

  const theme = sheet.theme || (sheet.lab?.includes("BCF") ? "orange" : (sheet.lab?.includes("TJKT") ? "blue" : "purple"));
  sheet.theme = theme;
  setTheme(theme, false);

  if (sheet.labTemplate) {
    applyLabTemplate(sheet.labTemplate, false);
  }

  const sel = document.getElementById("sheetSelect");
  if (sel && sel.value !== sheetKey) sel.value = sheetKey;

  const badge = document.getElementById("activeSheetBadge");
  if (badge) badge.textContent = sheet.session || sheetKey;

  const sessionTitle = document.getElementById("sessionTitle");
  if (sessionTitle) sessionTitle.textContent = sheet.session || "Sesi 1";

  const sessionInput = document.getElementById("sessionInput");
  if (sessionInput) sessionInput.value = sheet.session || "Sesi 1";

  // Muat posisi tata letak kursi dan elemen khusus denah ini jika sudah ada
  if (sheet.seats && Object.keys(sheet.seats).length > 0) {
    state.seats = JSON.parse(JSON.stringify(sheet.seats));
  } else if (!state.seats || Object.keys(state.seats).length === 0) {
    state.seats = generateDefaultPPLGSeats();
  }

  if (sheet.roomElements && Object.keys(sheet.roomElements).length > 0) {
    state.roomElements = JSON.parse(JSON.stringify(sheet.roomElements));
  }

  // Reset status terisi pada kursi sebelum memuat data sheet ini
  Object.keys(state.seats).forEach(num => {
    state.seats[num].occupantId = null;
  });

  // Cek apakah sheet.seating memiliki occupant ID yang valid
  const hasValidOccupants = sheet.seating && Object.values(sheet.seating).some(id => Boolean(id));

  if (hasValidOccupants) {
    Object.keys(sheet.seating).forEach(num => {
      if (state.seats[num]) {
        state.seats[num].occupantId = sheet.seating[num] || null;
      }
    });
  } else if (state.students && state.students.length > 0) {
    // Dudukkan otomatis siswa 1..36 ke kursi 1..36
    state.students.forEach((s, idx) => {
      const seatNum = idx + 1;
      if (state.seats[seatNum] && seatNum <= 36) {
        state.seats[seatNum].occupantId = s.id;
      }
    });
    // Simpan susunan kursi yang baru di-assign ke sheet.seating agar sinkron
    sheet.seating = {};
    Object.keys(state.seats).forEach(num => {
      sheet.seating[num] = state.seats[num].occupantId;
    });
  }

  populateLabOptions();
  renderAll();
  saveSheetsToStorage();
  saveSeatingToStorage();
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SHEET, sheetKey);
  } catch (e) {}
  if (!skipSave) {
    showToast(`📑 Beralih ke: ${sheet.name || sheetKey} (${state.students.length} Siswa)`);
  }
}

function renderSheetSelectOptions() {
  const sel = document.getElementById("sheetSelect");
  if (!sel) return;

  const currentKey = state.currentSheetKey;
  const sheetKeys = Object.keys(state.sheets);
  if (sheetKeys.length === 0) return;

  const isCustomWorkbook = sheetKeys.some(k => !k.startsWith("LAB-"));
  if (isCustomWorkbook) {
    sel.innerHTML = sheetKeys.map(k => {
      const s = state.sheets[k];
      return `<option value="${escapeHtml(k)}" ${k === currentKey ? 'selected' : ''}>${escapeHtml(s.name || k)} (${s.students ? s.students.length : 0} Siswa)</option>`;
    }).join("");
  } else {
    sel.innerHTML = `
      <optgroup label="💻 LAB PPLG">
        <option value="LAB-PPLG-SESI-1" ${currentKey === "LAB-PPLG-SESI-1" ? 'selected' : ''}>LAB PPLG — Sesi 1</option>
        <option value="LAB-PPLG-SESI-2" ${currentKey === "LAB-PPLG-SESI-2" ? 'selected' : ''}>LAB PPLG — Sesi 2</option>
        <option value="LAB-PPLG-SESI-3" ${currentKey === "LAB-PPLG-SESI-3" ? 'selected' : ''}>LAB PPLG — Sesi 3</option>
      </optgroup>
      <optgroup label="🎬 LAB BCF">
        <option value="LAB-BCF-SESI-1" ${currentKey === "LAB-BCF-SESI-1" ? 'selected' : ''}>LAB BCF — Sesi 1</option>
        <option value="LAB-BCF-SESI-2" ${currentKey === "LAB-BCF-SESI-2" ? 'selected' : ''}>LAB BCF — Sesi 2</option>
        <option value="LAB-BCF-SESI-3" ${currentKey === "LAB-BCF-SESI-3" ? 'selected' : ''}>LAB BCF — Sesi 3</option>
      </optgroup>
      <optgroup label="🌐 LAB TJKT">
        <option value="LAB-TJKT-SESI-1" ${currentKey === "LAB-TJKT-SESI-1" ? 'selected' : ''}>LAB TJKT — Sesi 1</option>
        <option value="LAB-TJKT-SESI-2" ${currentKey === "LAB-TJKT-SESI-2" ? 'selected' : ''}>LAB TJKT — Sesi 2</option>
        <option value="LAB-TJKT-SESI-3" ${currentKey === "LAB-TJKT-SESI-3" ? 'selected' : ''}>LAB TJKT — Sesi 3</option>
      </optgroup>
    `;
  }
}

async function loadDefaultData() {
  await loadPhotoDatabase();

  // 1. Cek apakah ada data denah yang sudah tersimpan di localStorage browser
  const savedSheets = loadSavedSheets();
  const savedActiveKey = localStorage.getItem(STORAGE_KEY_ACTIVE_SHEET);

  if (savedSheets && Object.keys(savedSheets).length > 0) {
    state.sheets = savedSheets;
    renderSheetSelectOptions();
    const activeKeyToUse = (savedActiveKey && state.sheets[savedActiveKey])
      ? savedActiveKey
      : Object.keys(state.sheets)[0];
    switchSheet(activeKeyToUse, true);
    return;
  }

  // 2. Jika belum pernah ada data denah sama sekali (pertama kali buka), baru inisialisasi default dari data.csv
  let csvStudents = [];
  try {
    const resp = await fetch("data.csv?t=" + Date.now());
    if (resp.ok) {
      const text = await resp.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length >= 2) {
        const delim = lines[0].includes(";") ? ";" : ",";
        const headers = lines[0].split(delim).map(x => x.replace(/^"|"$/g, "").trim());
        const rows = lines.slice(1).map(line => {
          const vals = line.split(delim).map(x => x.replace(/^"|"$/g, "").trim());
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
        });
        csvStudents = parseRows(rows);
      }
    }
  } catch (err) {
    console.warn("Could not fetch data.csv, fallback to standard mock:", err);
  }

  initDefaultSheets(csvStudents);
  renderSheetSelectOptions();
  switchSheet(state.currentSheetKey || "LAB-PPLG-SESI-1", true);
}

function processCsvText(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return;
  const delim = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delim).map(x => x.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(delim).map(x => x.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
  const allParsed = parseRows(rows);
  initDefaultSheets(allParsed);
  renderSheetSelectOptions();
  switchSheet(state.currentSheetKey || "LAB-PPLG-SESI-1", true);
  showToast(`Berhasil memuat ${allParsed.length} siswa dari CSV!`);
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();

  try {
    if (ext === "csv") {
      const text = await file.text();
      processCsvText(text);
    } else {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        alert("File Excel tidak memiliki sheet yang valid!");
        return;
      }

      state.sheets = {};
      wb.SheetNames.forEach((sheetName, sIdx) => {
        if (sheetName.toLowerCase().includes("petunjuk") || sheetName.toLowerCase().includes("panduan")) return;

        const ws = wb.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const students = parseRows(rawRows);

        let lab = "LAB PPLG";
        let labTemplate = "PPLG";
        let session = `Sesi ${sIdx + 1}`;

        const sUpper = sheetName.toUpperCase();
        if (sUpper.includes("BCF")) { lab = "LAB BCF"; labTemplate = "BCF"; }
        else if (sUpper.includes("TJKT")) { lab = "LAB TJKT"; labTemplate = "TJKT"; }
        else if (sUpper.includes("PPLG")) { lab = "LAB PPLG"; labTemplate = "PPLG"; }

        const m = sUpper.match(/SESI[\s-_]*([0-9]+)/);
        if (m) session = `Sesi ${m[1]}`;

        state.sheets[sheetName] = {
          name: sheetName,
          lab,
          labTemplate,
          session,
          students,
          seating: {}
        };
      });

      const firstSheet = Object.keys(state.sheets)[0] || wb.SheetNames[0];
      renderSheetSelectOptions();
      switchSheet(firstSheet, true);
      showToast(`📊 Berhasil mengimpor ${Object.keys(state.sheets).length} sheet dari file Excel!`);
    }
  } catch (err) {
    alert("Gagal membaca file: " + err.message);
  }
}

function populateLabOptions() {
  const sel = document.getElementById("labSelect");
  if (!sel) return;
  const current = sel.value;
  const foundLabs = state.students.map(s => s.lab).filter(Boolean);
  const labs = [...new Set(["LAB PPLG", "LAB BCF", "LAB TJKT", ...foundLabs])];
  sel.innerHTML = '<option value="ALL">Semua Data Lab</option>' +
    labs.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
  if (labs.includes(current)) sel.value = current;
  state.activeLab = sel.value;
  updateLabTitle();
}

function updateLabTitle() {
  const lab = state.activeLab === "ALL" ? (state.settings.labName || "LAB PPLG") : state.activeLab;
  document.getElementById("labTitle").textContent = lab;
  document.getElementById("sessionTitle").textContent = state.activeSession || "Sesi 1";
}

// =============================================================================
// SEATING ASSIGNMENT LOGIC
// =============================================================================

function getFilteredStudents() {
  if (state.activeLab === "ALL") return state.students;
  const filtered = state.students.filter(s => s.lab === state.activeLab);
  return filtered.length > 0 ? filtered : state.students;
}

function restoreOrAutoAssignSeats() {
  const saved = localStorage.getItem(STORAGE_KEY_SEATING);
  let loaded = false;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.keys(state.seats).forEach(seatNum => {
        if (parsed[seatNum] !== undefined) {
          state.seats[seatNum].occupantId = parsed[seatNum];
          loaded = true;
        }
      });
    } catch (e) {
      console.warn("Could not load saved seating:", e);
    }
  }

  const hasOccupants = Object.values(state.seats).some(s => s.occupantId);
  if (!loaded || !hasOccupants) {
    resetSeatsToDefault(false);
  }
}

function pushUndoState() {
  const snapshot = {};
  Object.keys(state.seats).forEach(k => {
    snapshot[k] = state.seats[k].occupantId;
  });
  state.undoStack.push(snapshot);
  if (state.undoStack.length > 20) state.undoStack.shift();
  updateUndoButton();
}

function undoLastAction() {
  if (!state.undoStack.length) return;
  const previous = state.undoStack.pop();
  Object.keys(state.seats).forEach(k => {
    state.seats[k].occupantId = previous[k] ?? null;
  });
  updateUndoButton();
  renderAll();
  saveSeatingToStorage();
  showToast("Perubahan terakhir dibatalkan (Undo)!");
}

function updateUndoButton() {
  const btn = document.getElementById("btnUndo");
  if (btn) btn.disabled = state.undoStack.length === 0;
}

function resetSeatsToDefault(recordUndo = true) {
  if (recordUndo) pushUndoState();
  const students = getFilteredStudents();
  const seatNums = Object.keys(state.seats).map(Number).sort((a, b) => a - b);

  seatNums.forEach((seatNum, idx) => {
    if (state.seats[seatNum].disabled) {
      state.seats[seatNum].occupantId = null;
    } else {
      state.seats[seatNum].occupantId = students[idx] ? students[idx].id : null;
    }
  });

  renderAll();
  saveSeatingToStorage();
  if (recordUndo) showToast("Duduk diurutkan sesuai urutan data awal!");
}

function shuffleSeats() {
  pushUndoState();
  const students = getFilteredStudents();
  const availableSeatNums = Object.keys(state.seats)
    .map(Number)
    .filter(num => !state.seats[num].disabled);

  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

  availableSeatNums.forEach((seatNum, idx) => {
    state.seats[seatNum].occupantId = shuffledStudents[idx] ? shuffledStudents[idx].id : null;
  });

  renderAll();
  saveSeatingToStorage();
  showToast("🎲 Tempat duduk siswa berhasil diacak secara merata!");
}

function sortSeatsAlphabetical() {
  pushUndoState();
  const students = [...getFilteredStudents()].sort((a, b) => a.name.localeCompare(b.name));
  const availableSeatNums = Object.keys(state.seats)
    .map(Number)
    .filter(num => !state.seats[num].disabled)
    .sort((a, b) => a - b);

  availableSeatNums.forEach((seatNum, idx) => {
    state.seats[seatNum].occupantId = students[idx] ? students[idx].id : null;
  });

  renderAll();
  saveSeatingToStorage();
  showToast("🔤 Tempat duduk diurutkan berdasarkan Abjad Nama (A-Z)!");
}

function sortSeatsByNIS() {
  pushUndoState();
  const students = [...getFilteredStudents()].sort((a, b) => a.id.localeCompare(b.id));
  const availableSeatNums = Object.keys(state.seats)
    .map(Number)
    .filter(num => !state.seats[num].disabled)
    .sort((a, b) => a - b);

  availableSeatNums.forEach((seatNum, idx) => {
    state.seats[seatNum].occupantId = students[idx] ? students[idx].id : null;
  });

  renderAll();
  saveSeatingToStorage();
  showToast("🆔 Tempat duduk diurutkan berdasarkan NIS / ID!");
}

function autoFillEmptySeats() {
  pushUndoState();
  const seatedStudentIds = new Set(Object.values(state.seats).map(s => s.occupantId).filter(Boolean));
  const unseatedStudents = getFilteredStudents().filter(s => !seatedStudentIds.has(s.id));
  let unseatedIdx = 0;

  const emptySeats = Object.keys(state.seats)
    .map(Number)
    .filter(num => !state.seats[num].disabled && !state.seats[num].occupantId)
    .sort((a, b) => a - b);

  emptySeats.forEach(seatNum => {
    if (unseatedStudents[unseatedIdx]) {
      state.seats[seatNum].occupantId = unseatedStudents[unseatedIdx].id;
      unseatedIdx++;
    }
  });

  renderAll();
  saveSeatingToStorage();
  showToast(`⚡ ${unseatedIdx} siswa ditempatkan ke kursi yang kosong!`);
}

function clearAllSeats() {
  if (!confirm("Apakah Anda yakin ingin mengosongkan seluruh tempat duduk?")) return;
  pushUndoState();
  Object.keys(state.seats).forEach(seatNum => {
    state.seats[seatNum].occupantId = null;
  });
  renderAll();
  saveSeatingToStorage();
  showToast("🧹 Seluruh tempat duduk telah dikosongkan!");
}

// =============================================================================
// SWAP & CLICK-TO-ASSIGN LOGIC
// =============================================================================

function swapSeats(seatA, seatB) {
  if (seatA === seatB || !state.seats[seatA] || !state.seats[seatB]) return;
  pushUndoState();

  const temp = state.seats[seatA].occupantId;
  state.seats[seatA].occupantId = state.seats[seatB].occupantId;
  state.seats[seatB].occupantId = temp;

  renderAll();
  saveSeatingToStorage();
  showToast(`🔄 Kursi #${seatA} dan Kursi #${seatB} berhasil ditukar!`);
}

function startSwapMode(fromSeatNum) {
  state.swapSourceSeat = fromSeatNum;
  document.getElementById("interactiveBanner").style.display = "flex";
  document.getElementById("bannerText").textContent =
    `Mode Tukar Aktif: Klik kursi tujuan untuk menukar dengan Kursi #${fromSeatNum}...`;

  document.querySelectorAll(".seat").forEach(el => {
    el.classList.remove("swap-source-highlight");
    if (parseInt(el.dataset.seat, 10) === fromSeatNum) {
      el.classList.add("swap-source-highlight");
    }
  });
}

function cancelSwapMode() {
  state.swapSourceSeat = null;
  document.getElementById("interactiveBanner").style.display = "none";
  document.querySelectorAll(".seat").forEach(el => el.classList.remove("swap-source-highlight"));
}

function handleSeatClick(seatNum) {
  if (state.activeMode === "layout") return;

  if (state.swapSourceSeat !== null) {
    const src = state.swapSourceSeat;
    cancelSwapMode();
    swapSeats(src, seatNum);
    return;
  }

  openSeatModal(seatNum);
}

// =============================================================================
// SEAT MODAL
// =============================================================================

function openSeatModal(seatNum) {
  state.activeModalSeat = seatNum;
  const seat = state.seats[seatNum];
  if (!seat) return;

  const student = state.students.find(s => s.id === seat.occupantId);

  document.getElementById("modalSeatNumber").textContent = `Kursi #${seatNum}`;
  document.getElementById("modalSeatTitle").textContent = student ? student.name : "Kursi Kosong";

  const occupantWrap = document.getElementById("modalOccupantWrap");
  const emptyNotice = document.getElementById("modalEmptyNotice");
  const clearBtn = document.getElementById("btnClearModalSeat");

  if (student) {
    occupantWrap.style.display = "flex";
    emptyNotice.style.display = "none";
    clearBtn.style.display = "inline-flex";

    document.getElementById("modalStudentName").textContent = student.name;
    document.getElementById("modalStudentId").textContent = student.id;
    document.getElementById("modalStudentCode").textContent = student.code || "-";
    document.getElementById("modalStudentLab").textContent = student.lab || "-";

    const preview = document.getElementById("modalPhotoPreview");
    if (student.photo) {
      preview.innerHTML = `<img src="${student.photo}" alt="Foto Siswa">`;
    } else {
      preview.textContent = "👤";
    }
  } else {
    occupantWrap.style.display = "none";
    emptyNotice.style.display = "block";
    clearBtn.style.display = "none";
  }

  const select = document.getElementById("modalStudentSelect");
  const currentLabStudents = getFilteredStudents();
  const seatedMap = {};
  Object.entries(state.seats).forEach(([num, s]) => {
    if (s.occupantId) seatedMap[s.occupantId] = num;
  });

  select.innerHTML = '<option value="">-- Pilih Siswa Untuk Kursi Ini --</option>' +
    currentLabStudents.map(s => {
      const seatedAt = seatedMap[s.id];
      const label = seatedAt ? `${s.name} (Sedang di Kursi #${seatedAt})` : `${s.name} (Belum Duduk)`;
      const selected = (student && student.id === s.id) ? "selected" : "";
      return `<option value="${escapeHtml(s.id)}" ${selected}>${escapeHtml(label)}</option>`;
    }).join("");

  const btnDisabled = document.getElementById("btnToggleDisabled");
  const textDisabled = document.getElementById("textToggleDisabled");
  if (seat.disabled) {
    textDisabled.textContent = "Aktifkan Kursi";
    btnDisabled.classList.add("btn-accent");
  } else {
    textDisabled.textContent = "Tandai Rusak / Off";
    btnDisabled.classList.remove("btn-accent");
  }

  openModal("seatModal");
}

function assignSelectedStudentToModalSeat() {
  const seatNum = state.activeModalSeat;
  const select = document.getElementById("modalStudentSelect");
  const targetStudentId = select.value;
  if (!seatNum || !targetStudentId) return;

  pushUndoState();

  Object.keys(state.seats).forEach(num => {
    if (state.seats[num].occupantId === targetStudentId) {
      state.seats[num].occupantId = null;
    }
  });

  state.seats[seatNum].occupantId = targetStudentId;
  closeModal("seatModal");
  renderAll();
  saveSeatingToStorage();
  showToast(`Siswa berhasil ditempatkan di Kursi #${seatNum}!`);
}

function clearSeatFromModal() {
  const seatNum = state.activeModalSeat;
  if (!seatNum) return;
  pushUndoState();
  state.seats[seatNum].occupantId = null;
  closeModal("seatModal");
  renderAll();
  saveSeatingToStorage();
  showToast(`Kursi #${seatNum} telah dikosongkan.`);
}

function toggleSeatDisabledFromModal() {
  const seatNum = state.activeModalSeat;
  if (!seatNum) return;
  pushUndoState();
  state.seats[seatNum].disabled = !state.seats[seatNum].disabled;
  if (state.seats[seatNum].disabled) {
    state.seats[seatNum].occupantId = null;
  }
  closeModal("seatModal");
  renderAll();
  saveLayoutToStorage();
  saveSeatingToStorage();
  showToast(`Status Kursi #${seatNum} diubah!`);
}

function startSwapFromModal() {
  const seatNum = state.activeModalSeat;
  closeModal("seatModal");
  if (seatNum) startSwapMode(seatNum);
}

function uploadStudentPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const seatNum = state.activeModalSeat;
  const seat = state.seats[seatNum];
  if (!seat || !seat.occupantId) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const student = state.students.find(s => s.id === seat.occupantId);
    if (student) {
      student.photo = dataUrl;
      const preview = document.getElementById("modalPhotoPreview");
      preview.innerHTML = `<img src="${dataUrl}" alt="Foto">`;
      renderAll();
      showToast(`Foto untuk ${student.name} berhasil diperbarui!`);
    }
  };
  reader.readAsDataURL(file);
}

// =============================================================================
// HTML5 DRAG & DROP FOR SEATING MODE
// =============================================================================

let draggedStudentId = null;
let draggedFromSeatNum = null;

function handleStudentCardDragStart(e) {
  if (state.activeMode !== "seating") return;
  draggedStudentId = e.target.dataset.studentId;
  draggedFromSeatNum = null;
  e.dataTransfer.setData("text/plain", draggedStudentId);
  e.dataTransfer.effectAllowed = "move";
  e.target.classList.add("dragging");
}

function handleStudentCardDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedStudentId = null;
  draggedFromSeatNum = null;
  clearDragOverEffects();
}

function handleSeatDragStart(e) {
  if (state.activeMode !== "seating") return;
  const seatEl = e.currentTarget;
  const seatNum = parseInt(seatEl.dataset.seat, 10);
  const seat = state.seats[seatNum];
  if (!seat || !seat.occupantId) {
    e.preventDefault();
    return;
  }
  draggedStudentId = seat.occupantId;
  draggedFromSeatNum = seatNum;
  e.dataTransfer.setData("text/plain", draggedStudentId);
  e.dataTransfer.effectAllowed = "move";
  seatEl.style.opacity = "0.4";
}

function handleSeatDragEnd(e) {
  e.currentTarget.style.opacity = "1";
  draggedStudentId = null;
  draggedFromSeatNum = null;
  clearDragOverEffects();
}

function handleSeatDragOver(e) {
  if (state.activeMode !== "seating") return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("drag-over-target");
}

function handleSeatDragLeave(e) {
  e.currentTarget.classList.remove("drag-over-target");
}

function handleSeatDrop(e) {
  if (state.activeMode !== "seating") return;
  e.preventDefault();
  clearDragOverEffects();

  const targetSeatNum = parseInt(e.currentTarget.dataset.seat, 10);
  if (!targetSeatNum || !state.seats[targetSeatNum]) return;
  if (state.seats[targetSeatNum].disabled) {
    showToast("⚠️ Kursi ini sedang nonaktif / rusak!");
    return;
  }

  pushUndoState();

  if (draggedFromSeatNum !== null) {
    if (draggedFromSeatNum === targetSeatNum) return;
    const temp = state.seats[targetSeatNum].occupantId;
    state.seats[targetSeatNum].occupantId = state.seats[draggedFromSeatNum].occupantId;
    state.seats[draggedFromSeatNum].occupantId = temp;
    showToast(`🔄 Siswa ditukar ke Kursi #${targetSeatNum}!`);
  } else if (draggedStudentId) {
    Object.keys(state.seats).forEach(num => {
      if (state.seats[num].occupantId === draggedStudentId) {
        state.seats[num].occupantId = null;
      }
    });
    state.seats[targetSeatNum].occupantId = draggedStudentId;
    showToast(`👤 Siswa ditempatkan di Kursi #${targetSeatNum}!`);
  }

  renderAll();
  saveSeatingToStorage();
}

function clearDragOverEffects() {
  document.querySelectorAll(".drag-over-target").forEach(el => el.classList.remove("drag-over-target"));
}

// =============================================================================
// LAYOUT DESIGNER MODE (DRAGGABLE SEATS & PROPS)
// =============================================================================

function switchMode(mode) {
  state.activeMode = mode;
  cancelSwapMode();

  document.getElementById("btnModeSeating").classList.toggle("active", mode === "seating");
  document.getElementById("btnModeLayout").classList.toggle("active", mode === "layout");

  document.getElementById("seatingControls").classList.toggle("active-group", mode === "seating");
  document.getElementById("layoutControls").classList.toggle("active-group", mode === "layout");

  document.body.classList.toggle("layout-mode-active", mode === "layout");

  const modeBadge = document.getElementById("modeIndicatorBadge");
  const modeText = document.getElementById("modeIndicatorText");
  const sidebarHint = document.getElementById("sidebarHint");

  if (mode === "layout") {
    modeBadge.classList.add("layout-mode");
    modeText.textContent = "Mode Desain Layout Aktif (Geser Bebas Kursi & Meja)";
    sidebarHint.innerHTML = "🛠️ <b>Mode Desain:</b> Klik dan seret (drag) kursi atau meja pengawas/proktor ke posisi mana saja di ruangan!";
  } else {
    modeBadge.classList.remove("layout-mode");
    modeText.textContent = "Mode Penataan Siswa Aktif";
    sidebarHint.innerHTML = "💡 <b>Tips Cepat:</b> Drag nama siswa ke kursi di denah, atau klik kursi mana saja untuk tukar/edit posisi!";
  }

  renderSeats();
}

let isLayoutDragging = false;
let currentDragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let elemStartX = 0;
let elemStartY = 0;

function setupLayoutDragEvents() {
  const room = document.getElementById("roomCanvas");

  room.addEventListener("mousedown", (e) => {
    if (state.activeMode !== "layout") return;

    const targetSeat = e.target.closest(".seat");
    const targetElem = e.target.closest(".room-element");
    const target = targetSeat || targetElem;

    if (!target) return;
    e.preventDefault();

    isLayoutDragging = true;
    currentDragTarget = target;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    elemStartX = parseFloat(target.style.left) || 0;
    elemStartY = parseFloat(target.style.top) || 0;

    target.style.zIndex = "100";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isLayoutDragging || !currentDragTarget || state.activeMode !== "layout") return;

    const dx = (e.clientX - dragStartX) / state.zoomLevel;
    const dy = (e.clientY - dragStartY) / state.zoomLevel;

    let newX = elemStartX + dx;
    let newY = elemStartY + dy;

    if (state.snapGrid > 0) {
      newX = Math.round(newX / state.snapGrid) * state.snapGrid;
      newY = Math.round(newY / state.snapGrid) * state.snapGrid;
    }

    const room = document.getElementById("roomCanvas");
    const maxX = room.clientWidth - currentDragTarget.offsetWidth;
    const maxY = room.clientHeight - currentDragTarget.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    currentDragTarget.style.left = `${newX}px`;
    currentDragTarget.style.top = `${newY}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!isLayoutDragging || !currentDragTarget || state.activeMode !== "layout") return;

    const x = parseFloat(currentDragTarget.style.left) || 0;
    const y = parseFloat(currentDragTarget.style.top) || 0;

    if (currentDragTarget.classList.contains("seat")) {
      const seatNum = parseInt(currentDragTarget.dataset.seat, 10);
      if (state.seats[seatNum]) {
        state.seats[seatNum].x = x;
        state.seats[seatNum].y = y;
      }
    } else if (currentDragTarget.classList.contains("room-element")) {
      const elemId = currentDragTarget.dataset.id;
      if (state.roomElements[elemId]) {
        state.roomElements[elemId].x = x;
        state.roomElements[elemId].y = y;
      }
    }

    currentDragTarget.style.zIndex = "";
    isLayoutDragging = false;
    currentDragTarget = null;
    saveLayoutToStorage();
  });
}

function applyPresetLayout(presetKey) {
  let newSeats = {};
  if (presetKey === "pplg_default") {
    newSeats = generateDefaultPPLGSeats();
    state.roomElements = {
      entrance: { x: 24, y: 8 },
      whiteboard: { x: 205, y: 8 },
      proctor: { x: 231, y: 36 },
      supervisor: { x: 343, y: 36 }
    };
  } else if (presetKey === "bcf_studio") {
    newSeats = generateBCFSeats();
    state.roomElements = {
      entrance: { x: 24, y: 8 },
      whiteboard: { x: 205, y: 8 },
      proctor: { x: 231, y: 36 },
      supervisor: { x: 343, y: 36 }
    };
  } else if (presetKey === "tjkt_network") {
    newSeats = generateTJKTSeats();
    state.roomElements = {
      entrance: { x: 24, y: 8 },
      whiteboard: { x: 205, y: 8 },
      proctor: { x: 231, y: 36 },
      supervisor: { x: 343, y: 36 }
    };
  } else if (presetKey === "grid_5x8") {
    newSeats = generateGridSeats(5, 8);
    state.roomElements = {
      entrance: { x: 16, y: 8 },
      whiteboard: { x: 228, y: 8 },
      proctor: { x: 226, y: 36 },
      supervisor: { x: 346, y: 36 }
    };
  } else if (presetKey === "grid_4x10") {
    newSeats = generateGridSeats(4, 10);
  } else if (presetKey === "u_shape") {
    newSeats = generateUShapeSeats();
  } else if (presetKey === "pods") {
    newSeats = generatePodsSeats();
  } else if (presetKey === "twin_islands") {
    newSeats = generateTwinIslandsSeats();
  }

  Object.keys(newSeats).forEach(num => {
    if (state.seats[num]) {
      newSeats[num].occupantId = state.seats[num].occupantId;
      newSeats[num].disabled = state.seats[num].disabled;
    }
  });

  state.seats = newSeats;
  renderAll();
  saveLayoutToStorage();
  showToast(`📐 Preset denah "${presetKey}" berhasil diterapkan!`);
}

function addNewSeat() {
  const currentNums = Object.keys(state.seats).map(Number);
  const nextNum = currentNums.length ? Math.max(...currentNums) + 1 : 1;

  const room = document.getElementById("roomCanvas");
  const x = Math.round((room.clientWidth - 78) / 2);
  const y = Math.round((room.clientHeight - 56) / 2);

  state.seats[nextNum] = { x, y, occupantId: null, disabled: false };
  renderAll();
  saveLayoutToStorage();
  showToast(`➕ Kursi #${nextNum} berhasil ditambahkan!`);
}

function removeLastSeat() {
  const currentNums = Object.keys(state.seats).map(Number).sort((a, b) => a - b);
  if (currentNums.length <= 1) {
    alert("Minimal harus ada 1 kursi di denah!");
    return;
  }
  const lastNum = currentNums[currentNums.length - 1];
  delete state.seats[lastNum];
  renderAll();
  saveLayoutToStorage();
  showToast(`➖ Kursi #${lastNum} telah dihapus.`);
}

function renumberSeats() {
  const entries = Object.entries(state.seats).map(([oldNum, data]) => ({
    oldNum,
    x: data.x,
    y: data.y,
    occupantId: data.occupantId,
    disabled: data.disabled
  }));

  entries.sort((a, b) => {
    const rowDiff = a.y - b.y;
    if (Math.abs(rowDiff) > 25) return rowDiff;
    return a.x - b.x;
  });

  const renumbered = {};
  entries.forEach((item, idx) => {
    renumbered[idx + 1] = {
      x: item.x,
      y: item.y,
      occupantId: item.occupantId,
      disabled: item.disabled
    };
  });

  state.seats = renumbered;
  renderAll();
  saveLayoutToStorage();
  showToast("🔢 Nomor kursi telah dirapikan dari kiri atas!");
}

function resetToDefaultLayout() {
  if (!confirm("Kembalikan posisi kursi dan elemen ruangan ke denah awal Lab PPLG?")) return;
  state.seats = generateDefaultPPLGSeats();
  state.roomElements = {
    entrance: { x: 24, y: 8 },
    whiteboard: { x: 205, y: 8 },
    proctor: { x: 231, y: 36 },
    supervisor: { x: 343, y: 36 }
  };
  document.getElementById("presetSelect").value = "pplg_default";
  restoreOrAutoAssignSeats();
  renderAll();
  saveLayoutToStorage();
  showToast("🔄 Layout berhasil dikembalikan ke posisi rapi!");
}

// =============================================================================
// FORMATTING & RENDERING (MATCHING USER TEMPLATE)
// =============================================================================

function formatStudentId(student) {
  if (!student) return "";
  const fmt = state.settings.idDisplayFormat || "nis_full";
  if (fmt === "no_only") return "";
  if (fmt === "code") {
    return student.code ? student.code : (student.id ? student.id : "");
  }
  if (fmt === "nis_short") {
    const digits = String(student.id || "").replace(/\D/g, "");
    return digits.length > 5 ? digits.slice(-5) : (student.id || "");
  }
  return student.id || "";
}

function renderAll() {
  renderRoomElements();
  renderSeats();
  renderStudentList();
  renderStats();
  renderLabSidebar();
}

function renderRoomElements() {
  Object.entries(state.roomElements).forEach(([key, pos]) => {
    const el = document.getElementById("elem" + capitalize(key));
    if (el) {
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      if (pos.label) {
        const labelEl = el.querySelector(".elem-label");
        if (labelEl) {
          labelEl.innerHTML = pos.label.replace(/\n/g, "<br>");
        }
      }
    }
  });
}

function renderSeats() {
  const container = document.getElementById("seatsContainer");
  container.innerHTML = "";

  const studentMap = {};
  state.students.forEach(s => studentMap[s.id] = s);

  const seatEntries = Object.entries(state.seats).sort((a, b) => Number(a[0]) - Number(b[0]));

  seatEntries.forEach(([numStr, seat]) => {
    const seatNum = parseInt(numStr, 10);
    const occupant = seat.occupantId ? studentMap[seat.occupantId] : null;

    const el = document.createElement("div");
    el.className = "seat";
    el.dataset.seat = seatNum;
    el.style.left = `${seat.x}px`;
    el.style.top = `${seat.y}px`;

    if (seat.disabled) {
      el.classList.add("disabled");
      el.innerHTML = `
        <div class="seat-card-inner">
          <div class="seat-photo-box">
            <span class="seat-avatar-placeholder">🚫</span>
            <span class="seat-num-badge">${seatNum}</span>
          </div>
          <div class="seat-name-bar">RUSAK / OFF</div>
          <div class="seat-id-bar">NONAKTIF</div>
        </div>
      `;
    } else if (occupant) {
      const photoHtml = occupant.photo
        ? `<img src="${occupant.photo}" alt="Foto ${escapeHtml(occupant.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'seat-avatar-placeholder\\'>👤</div>';">`
        : `<div class="seat-avatar-placeholder">👤</div>`;
      const idTag = formatStudentId(occupant);
      const displayName = formatDisplayName(occupant.name);
      const longNameClass = displayName.length > 13 ? " long-name" : "";

      el.innerHTML = `
        <div class="seat-card-inner">
          <div class="seat-photo-box">
            ${photoHtml}
            <span class="seat-num-badge">${seatNum}</span>
          </div>
          <div class="seat-name-bar${longNameClass}" title="${escapeHtml(occupant.name)}">
            ${escapeHtml(displayName)}
          </div>
          <div class="seat-id-bar" title="${escapeHtml(occupant.id)}">
            ${escapeHtml(idTag)}
          </div>
        </div>
      `;
    } else {
      el.classList.add("empty");
      el.innerHTML = `
        <div class="seat-card-inner">
          <div class="seat-photo-box">
            <span class="seat-num-badge">${seatNum}</span>
          </div>
          <div class="seat-name-bar">KOSONG</div>
          <div class="seat-id-bar">MEJA ${seatNum}</div>
        </div>
      `;
    }

    if (state.activeMode === "seating") {
      if (occupant) {
        el.setAttribute("draggable", "true");
        el.addEventListener("dragstart", handleSeatDragStart);
        el.addEventListener("dragend", handleSeatDragEnd);
      }
      el.addEventListener("dragover", handleSeatDragOver);
      el.addEventListener("dragleave", handleSeatDragLeave);
      el.addEventListener("drop", handleSeatDrop);
    }

    el.addEventListener("click", () => handleSeatClick(seatNum));
    container.appendChild(el);
  });
}

function renderStudentList() {
  const list = document.getElementById("studentList");
  if (!list) return;
  list.innerHTML = "";

  const students = getFilteredStudents();
  const seatedMap = {};
  Object.entries(state.seats).forEach(([num, s]) => {
    if (s.occupantId) seatedMap[s.occupantId] = num;
  });

  const query = state.searchQuery.toLowerCase();
  const filtered = students.filter(s => {
    const matchesSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query);

    const isSeated = Boolean(seatedMap[s.id]);
    if (state.activeTab === "seated") return matchesSearch && isSeated;
    if (state.activeTab === "unseated") return matchesSearch && !isSeated;
    return matchesSearch;
  });

  if (filtered.length === 0) {
    if (state.students.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:36px 16px;color:#94a3b8;">
          <div style="font-size:32px;margin-bottom:8px;opacity:0.6;">📋</div>
          <div style="font-weight:700;color:#64748b;font-size:13px;margin-bottom:4px;">Belum Ada Data Siswa</div>
          <div style="font-size:11px;line-height:1.5;">Database kosong bersih.<br>Unggah file Excel/CSV atau gunakan tombol <b>+ Tambah</b> di atas.</div>
        </div>
      `;
    } else {
      list.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:12px;">Tidak ada siswa yang cocok dengan pencarian/filter.</div>`;
    }
    return;
  }

  filtered.forEach(s => {
    const seatNum = seatedMap[s.id];
    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.studentId = s.id;
    card.setAttribute("draggable", "true");

    const photoHtml = s.photo ? `<img src="${s.photo}" alt="Foto">` : "👤";
    const seatPill = seatNum
      ? `<span class="seat-pill seat-pill-assigned" title="Duduk di Kursi #${seatNum}">Kursi ${seatNum}</span>`
      : `<span class="seat-pill seat-pill-unassigned">Belum Duduk</span>`;

    card.innerHTML = `
      <div class="student-card-left">
        <span class="student-drag-handle">⋮⋮</span>
        <div class="student-avatar-thumb">${photoHtml}</div>
        <div class="student-card-info">
          <div class="student-card-name" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</div>
          <div class="student-card-meta">
            <span>${escapeHtml(s.id)}</span>
            <span>·</span>
            <span>${escapeHtml(s.lab)}</span>
          </div>
        </div>
      </div>
      ${seatPill}
    `;

    card.addEventListener("dragstart", handleStudentCardDragStart);
    card.addEventListener("dragend", handleStudentCardDragEnd);

    card.addEventListener("click", () => {
      if (seatNum) {
        const seatEl = document.querySelector(`.seat[data-seat="${seatNum}"]`);
        if (seatEl) {
          seatEl.scrollIntoView({ behavior: "smooth", block: "center" });
          seatEl.classList.add("swap-source-highlight");
          setTimeout(() => seatEl.classList.remove("swap-source-highlight"), 1600);
        }
      }
    });

    list.appendChild(card);
  });
}

function renderStats() {
  const students = getFilteredStudents();
  const seatedIds = new Set(Object.values(state.seats).map(s => s.occupantId).filter(Boolean));

  let seatedCount = 0;
  students.forEach(s => {
    if (seatedIds.has(s.id)) seatedCount++;
  });

  const unseatedCount = students.length - seatedCount;

  const statTotal = document.getElementById("statTotalStudents");
  const statSeatedEl = document.getElementById("statSeated");
  const statUnseatedEl = document.getElementById("statUnseated");
  if (statTotal) statTotal.textContent = students.length;
  if (statSeatedEl) statSeatedEl.textContent = seatedCount;
  if (statUnseatedEl) statUnseatedEl.textContent = unseatedCount;
}

// =============================================================================
// SIDEBAR FILTER & SEARCH
// =============================================================================

function filterStudentList() {
  const input = document.getElementById("studentSearch");
  state.searchQuery = input.value.trim();
  document.getElementById("btnClearSearch").style.display = state.searchQuery ? "block" : "none";
  renderStudentList();
}

function clearStudentSearch() {
  const input = document.getElementById("studentSearch");
  input.value = "";
  state.searchQuery = "";
  document.getElementById("btnClearSearch").style.display = "none";
  renderStudentList();
}

function setStudentTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".student-tabs .tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  renderStudentList();
}

// =============================================================================
// ZOOM & FIT CANVAS
// =============================================================================

function zoomCanvas(delta) {
  state.zoomLevel = Math.max(0.5, Math.min(1.8, state.zoomLevel + delta));
  applyCanvasZoom();
}

function resetZoom() {
  state.zoomLevel = 1.0;
  applyCanvasZoom();
}

function fitCanvas() {
  const viewport = document.querySelector(".canvas-viewport");
  const page = document.getElementById("page");
  if (!viewport || !page) return;

  const pad = 36;
  const availW = viewport.clientWidth - pad;
  const availH = viewport.clientHeight - pad;
  const scale = Math.min(availW / page.offsetWidth, availH / page.offsetHeight, 1.1);
  state.zoomLevel = Math.max(0.5, parseFloat(scale.toFixed(2)));
  applyCanvasZoom();
}

function applyCanvasZoom() {
  const container = document.getElementById("pageContainer");
  container.style.transform = `scale(${state.zoomLevel})`;
  document.getElementById("zoomPercent").textContent = `${Math.round(state.zoomLevel * 100)}%`;
}

// =============================================================================
// SETTINGS, ORIENTATION & DISPLAY PREFERENCES
// =============================================================================

function loadSavedSettings() {
  const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (saved) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("Could not parse settings:", e);
    }
  }

  document.getElementById("settingInstitution").value = state.settings.institution;
  document.getElementById("institutionTitle").textContent = state.settings.institution;

  document.getElementById("settingExam").value = state.settings.exam;
  document.getElementById("examTitle").textContent = state.settings.exam;

  document.getElementById("settingLabName").value = state.settings.labName;
  document.getElementById("settingSession").value = state.settings.session;
  document.getElementById("sessionInput").value = state.settings.session;
  document.getElementById("sessionTitle").textContent = state.settings.session;

  document.getElementById("settingDate").value = state.settings.date;
  document.getElementById("examDate").textContent = state.settings.date;

  document.getElementById("settingProctor").value = state.settings.proctorName;
  document.getElementById("proctorNameDisplay").textContent = state.settings.proctorName;

  document.getElementById("settingOrientation").value = state.settings.orientation;
  changeOrientation(state.settings.orientation, false);

  if (document.getElementById("settingIdFormat")) {
    document.getElementById("settingIdFormat").value = state.settings.idDisplayFormat || "nis_full";
  }

  setTheme(state.settings.theme, false);
  applyHeaderLogoToDOM();

  // Aktifkan pill lab yang sesuai
  const labName = state.settings.labName || "LAB PPLG";
  if (labName.includes("BCF")) {
    state.activeLabTemplate = "BCF";
  } else if (labName.includes("TJKT")) {
    state.activeLabTemplate = "TJKT";
  } else {
    state.activeLabTemplate = "PPLG";
  }
  document.querySelectorAll(".btn-lab-pill").forEach(el => el.classList.remove("active"));
  const activeBtn = document.getElementById(`btnTpl${state.activeLabTemplate}`);
  if (activeBtn) activeBtn.classList.add("active");
}

function openSettingsModal(targetFocusId = null) {
  // Populasikan nilai form modal langsung dari state.settings aktif yang sudah tersinkronkan dengan denah ini
  document.getElementById("settingInstitution").value = state.settings.institution || "SMK PPLG INDONESIA";
  document.getElementById("settingExam").value = state.settings.exam || "Denah Tempat Duduk — Tes Kemampuan Akademik";
  document.getElementById("settingLabName").value = state.settings.labName || "LAB PPLG";
  document.getElementById("settingSession").value = state.settings.session || "Sesi 1";
  document.getElementById("settingDate").value = state.settings.date || "Okt 2026";
  document.getElementById("settingProctor").value = state.settings.proctorName || "Proktor Lab";
  document.getElementById("settingOrientation").value = state.settings.orientation || "portrait";
  if (document.getElementById("settingIdFormat")) {
    document.getElementById("settingIdFormat").value = state.settings.idDisplayFormat || "nis_full";
  }

  setTheme(state.settings.theme || "purple", false);
  applyHeaderLogoToDOM();
  openModal("settingsModal");

  if (targetFocusId) {
    const focusEl = document.getElementById(targetFocusId);
    if (focusEl) {
      setTimeout(() => {
        focusEl.focus();
        if (focusEl.select) focusEl.select();
      }, 120);
    }
  }
}

function saveSettings() {
  state.settings.institution = document.getElementById("settingInstitution").value.trim();
  state.settings.exam = document.getElementById("settingExam").value.trim();
  state.settings.labName = document.getElementById("settingLabName").value.trim();
  state.settings.session = document.getElementById("settingSession").value.trim();
  state.settings.date = document.getElementById("settingDate").value.trim();
  state.settings.proctorName = document.getElementById("settingProctor").value.trim();
  state.settings.idDisplayFormat = document.getElementById("settingIdFormat") ? document.getElementById("settingIdFormat").value : "nis_full";

  // Simpan secara terpisah untuk denah (sheet) yang sedang aktif saat ini
  const currentKey = state.currentSheetKey;
  if (state.sheets[currentKey]) {
    state.sheets[currentKey].lab = state.settings.labName;
    state.sheets[currentKey].session = state.settings.session;
    state.sheets[currentKey].name = `${state.settings.labName} — ${state.settings.session}`;
    state.sheets[currentKey].header = {
      institution: state.settings.institution,
      exam: state.settings.exam,
      labName: state.settings.labName,
      session: state.settings.session,
      date: state.settings.date,
      proctorName: state.settings.proctorName,
      logoImage: state.settings.logoImage || "",
      logoText: state.settings.logoText || "LAB"
    };
  }

  if (document.getElementById("institutionTitle")) document.getElementById("institutionTitle").textContent = state.settings.institution;
  if (document.getElementById("examTitle")) document.getElementById("examTitle").textContent = state.settings.exam;
  if (document.getElementById("sessionInput")) document.getElementById("sessionInput").value = state.settings.session;
  if (document.getElementById("sessionTitle")) document.getElementById("sessionTitle").textContent = state.settings.session;
  if (document.getElementById("examDate")) document.getElementById("examDate").textContent = state.settings.date;
  if (document.getElementById("proctorNameDisplay")) document.getElementById("proctorNameDisplay").textContent = state.settings.proctorName;
  if (document.getElementById("labTitle")) document.getElementById("labTitle").textContent = state.settings.labName;
  applyHeaderLogoToDOM();

  saveSheetsToStorage();
  saveSettingsToStorage();
  closeModal("settingsModal");
  renderAll();
  showToast("✏️ Kop Header Denah ini berhasil disimpan!");
}

function handlePaperHeaderClick(event) {
  if (event.target.closest("#logoContainer") || event.target.closest("#headerLogoFileInput")) {
    return;
  }

  let focusInputId = "settingInstitution";
  if (event.target.closest("#examTitle")) {
    focusInputId = "settingExam";
  } else if (event.target.closest("#dateDisplay") || event.target.closest("#examDate")) {
    focusInputId = "settingDate";
  } else if (event.target.closest("#proctorMeta") || event.target.closest("#proctorNameDisplay")) {
    focusInputId = "settingProctor";
  } else if (event.target.closest("#labTitle")) {
    focusInputId = "settingLabName";
  } else if (event.target.closest("#sessionTitle")) {
    focusInputId = "settingSession";
  }

  openSettingsModal(focusInputId);
}

function updateIdDisplayFormat(fmt) {
  state.settings.idDisplayFormat = fmt;
  saveSettingsToStorage();
  renderSeats();
}

function saveSettingsToStorage() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
}

function changeOrientation(orientation, save = true) {
  state.settings.orientation = orientation;
  document.body.dataset.orientation = orientation;
  if (save) saveSettingsToStorage();
}

function setTheme(themeName, save = true) {
  state.settings.theme = themeName;
  document.body.dataset.theme = themeName;

  if (state.currentSheetKey && state.sheets[state.currentSheetKey]) {
    state.sheets[state.currentSheetKey].theme = themeName;
    if (save) saveSheetsToStorage();
  }

  // Update swatch buttons active class
  document.querySelectorAll(".theme-swatches-inline .swatch-btn").forEach(btn => {
    btn.classList.toggle("active", btn.classList.contains(`theme-${themeName}`));
  });

  if (save) {
    saveSettingsToStorage();
    renderLabSidebar();
    showToast(`🎨 Tema warna denah diganti ke: ${capitalize(themeName)}`);
  }
}

// =============================================================================
// LOGO GAMBAR & KOP HEADER
// =============================================================================

function applyHeaderLogoToDOM() {
  const headerImg = document.getElementById("headerLogoImg");
  const headerText = document.getElementById("logoText");
  const modalImg = document.getElementById("settingsLogoImg");
  const modalText = document.getElementById("settingsLogoText");

  const logoSrc = state.settings.logoImage || "default_logo.png";
  if (logoSrc) {
    if (headerImg) {
      headerImg.src = logoSrc;
      headerImg.style.display = "block";
    }
    if (headerText) headerText.style.display = "none";
    if (modalImg) {
      modalImg.src = logoSrc;
      modalImg.style.display = "block";
    }
    if (modalText) modalText.style.display = "none";
  } else {
    if (headerImg) headerImg.style.display = "none";
    if (headerText) {
      headerText.style.display = "block";
      headerText.textContent = state.settings.logoText || "LAB";
    }
    if (modalImg) modalImg.style.display = "none";
    if (modalText) {
      modalText.style.display = "block";
      modalText.textContent = state.settings.logoText || "LAB";
    }
  }
}

function triggerHeaderLogoUpload() {
  const input = document.getElementById("headerLogoFileInput");
  if (input) input.click();
}

function handleHeaderLogoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.settings.logoImage = e.target.result;
    const currentKey = state.currentSheetKey;
    if (state.sheets[currentKey]) {
      if (!state.sheets[currentKey].header) state.sheets[currentKey].header = {};
      state.sheets[currentKey].header.logoImage = e.target.result;
      saveSheetsToStorage();
    }
    applyHeaderLogoToDOM();
    saveSettingsToStorage();
    showToast("🖼️ Logo gambar header berhasil diganti & disimpan!");
  };
  reader.readAsDataURL(file);
}

function resetHeaderLogo() {
  state.settings.logoImage = "";
  state.settings.logoText = state.settings.labName ? state.settings.labName.replace("LAB ", "") : "LAB";
  const currentKey = state.currentSheetKey;
  if (state.sheets[currentKey]) {
    if (!state.sheets[currentKey].header) state.sheets[currentKey].header = {};
    state.sheets[currentKey].header.logoImage = "";
    state.sheets[currentKey].header.logoText = state.settings.logoText;
    saveSheetsToStorage();
  }
  applyHeaderLogoToDOM();
  saveSettingsToStorage();
  showToast("🔄 Logo header dikembalikan ke teks bawaan.");
}

function promptCustomLogo() {
  triggerHeaderLogoUpload();
}

// =============================================================================
// TEMPLATE 3 LAB: PPLG, BCF, TJKT
// =============================================================================

function applyLabTemplate(labCode) {
  state.activeLabTemplate = labCode;

  // Update pills active state
  document.querySelectorAll(".btn-lab-pill").forEach(el => el.classList.remove("active"));
  const activeBtn = document.getElementById(`btnTpl${labCode}`);
  if (activeBtn) activeBtn.classList.add("active");

  const elemBoard = document.getElementById("elemWhiteboard");
  const elemProctor = document.getElementById("elemProctor");
  const elemSupervisor = document.getElementById("elemSupervisor");

  if (labCode === "PPLG") {
    state.settings.labName = "LAB PPLG";
    state.settings.theme = "purple";
    setTheme("purple", false);
    applyPresetLayout("pplg_default");

    if (elemBoard) elemBoard.textContent = "LAYAR PROYEKTOR / PAPAN TULIS";
    if (elemProctor) elemProctor.textContent = "MEJA PROKTOR";
    if (elemSupervisor) elemSupervisor.textContent = "MEJA PENGAWAS";
    const sel = document.getElementById("presetSelect");
    if (sel) sel.value = "pplg_default";
  } else if (labCode === "BCF") {
    state.settings.labName = "LAB BCF";
    state.settings.theme = "orange"; // Permintaan user: warna oranye!
    setTheme("orange", false);
    applyPresetLayout("bcf_studio");

    if (elemBoard) elemBoard.textContent = "LAYAR MONITOR MASTER BROADCAST";
    if (elemProctor) elemProctor.textContent = "MASTER CONTROL ROOM (MCR)";
    if (elemSupervisor) elemSupervisor.textContent = "MEJA SUTRADARA / PENGAWAS";
    const sel = document.getElementById("presetSelect");
    if (sel) sel.value = "bcf_studio";
  } else if (labCode === "TJKT") {
    state.settings.labName = "LAB TJKT";
    state.settings.theme = "blue";
    setTheme("blue", false);
    applyPresetLayout("tjkt_network");

    if (elemBoard) elemBoard.textContent = "RACK SERVER & PATCH PANEL UTAMA";
    if (elemProctor) elemProctor.textContent = "MEJA PROKTOR JARINGAN";
    if (elemSupervisor) elemSupervisor.textContent = "MEJA PENGAWAS LAB";
    const sel = document.getElementById("presetSelect");
    if (sel) sel.value = "tjkt_network";
  }

  // Update Header title
  document.getElementById("labTitle").textContent = state.settings.labName;
  if (document.getElementById("settingLabName")) {
    document.getElementById("settingLabName").value = state.settings.labName;
  }

  // Update filter lab if exists
  const labSel = document.getElementById("labSelect");
  if (labSel) {
    const hasOption = Array.from(labSel.options).some(o => o.value.includes(labCode));
    if (hasOption) {
      labSel.value = Array.from(labSel.options).find(o => o.value.includes(labCode)).value;
      state.activeLab = labSel.value;
    }
  }

  saveSettingsToStorage();
  saveLayoutToStorage();
  renderAll();
  showToast(`🏢 Template ${state.settings.labName} & warna tema aktif!`);
}

// =============================================================================
// STORAGE & EXPORT / IMPORT
// =============================================================================

function saveSeatingToStorage() {
  const seatingData = {};
  Object.keys(state.seats).forEach(k => {
    seatingData[k] = state.seats[k].occupantId;
  });
  localStorage.setItem(STORAGE_KEY_SEATING, JSON.stringify(seatingData));

  // Sinkronkan juga langsung ke sheet yang sedang aktif agar tersimpan permanen
  if (state.currentSheetKey && state.sheets[state.currentSheetKey]) {
    state.sheets[state.currentSheetKey].seating = { ...seatingData };
    saveSheetsToStorage();
  }
}

function saveLayoutToStorage() {
  const layoutData = {
    seats: state.seats,
    roomElements: state.roomElements
  };
  localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layoutData));
}

function loadSavedLayout() {
  const saved = localStorage.getItem(STORAGE_KEY_LAYOUT);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.seats && Object.keys(parsed.seats).length > 0) {
        state.seats = parsed.seats;
        if (parsed.roomElements) state.roomElements = parsed.roomElements;
        return;
      }
    } catch (e) {
      console.warn("Could not load layout from storage:", e);
    }
  }
  state.seats = generateDefaultPPLGSeats();
}

function exportSeatingToExcel() {
  if (typeof XLSX === "undefined") {
    showToast("⚠️ Library Excel sedang dimuat, gunakan ekspor CSV.");
    exportSeatingToCSV();
    return;
  }

  saveCurrentSheetState();
  const wb = XLSX.utils.book_new();
  const sheetKeys = Object.keys(state.sheets);
  const sortedSeats = Object.keys(state.seats).map(Number).sort((a, b) => a - b);

  sheetKeys.forEach(sKey => {
    const sheet = state.sheets[sKey];
    const studentMap = {};
    if (sheet.students) {
      sheet.students.forEach(s => studentMap[s.id] = s);
    }
    const seating = sheet.seating || {};

    const rows = sortedSeats.map(seatNum => {
      const occupantId = (sKey === state.currentSheetKey)
        ? (state.seats[seatNum] ? state.seats[seatNum].occupantId : null)
        : seating[seatNum];
      const s = occupantId ? studentMap[occupantId] : null;
      const isDisabled = state.seats[seatNum] && state.seats[seatNum].disabled;

      return {
        "No Kursi": seatNum,
        "NIS / ID Siswa": s ? s.id : "",
        "Nama Siswa": s ? s.name : "",
        "Kode Peserta": s ? s.code : "",
        "Lab": sheet.lab || state.settings.labName,
        "Sesi": sheet.session || "Sesi 1",
        "Status Kursi": isDisabled ? "Rusak / Nonaktif" : (s ? "Terisi" : "Kosong"),
        "File Foto": s && s.photo ? s.photo : ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 36 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 48 }
    ];
    const safeSheetTitle = sKey.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetTitle);
  });

  const labSlug = (state.settings.labName || "LAB").replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Denah_Duduk_${labSlug}_MultiSheet.xlsx`);
  showToast(`📊 Semua sheet (${sheetKeys.length}) berhasil diekspor ke Excel!`);
}

function downloadStudentTemplateExcel() {
  if (typeof XLSX === "undefined") {
    downloadStudentTemplateCsv();
    return;
  }
  const wb = XLSX.utils.book_new();

  // Buat sheet terpisah untuk LAB-PPLG-SESI-1, LAB-PPLG-SESI-2, LAB-PPLG-SESI-3
  ["LAB-PPLG-SESI-1", "LAB-PPLG-SESI-2", "LAB-PPLG-SESI-3"].forEach((sheetKey, sIdx) => {
    const sheetData = (state.sheets && state.sheets[sheetKey] && state.sheets[sheetKey].students && state.sheets[sheetKey].students.length > 0)
      ? state.sheets[sheetKey].students
      : state.students;

    const rows = (sheetData && sheetData.length > 0) ? sheetData.map((s, idx) => ({
      "No": idx + 1,
      "NIS": s.id,
      "Nama Lengkap": s.name,
      "Kode Peserta": s.code || "",
      "Lab": s.lab || "LAB PPLG",
      "Sesi": `Sesi ${sIdx + 1}`,
      "Foto": s.photo || ""
    })) : [
      {
        "No": 1,
        "NIS": "K0105026800365",
        "Nama Lengkap": "Christian Giovani Meze Wea",
        "Kode Peserta": "K01050268-AC6K",
        "Lab": "LAB PPLG",
        "Sesi": `Sesi ${sIdx + 1}`,
        "Foto": "FOTOANAKANAKSETAN/X DKV 1/CHRISTIAN GIOVANI.jpg"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 38 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, sheetKey);
  });

  const guideRows = [
    { "Panduan Kolom": "KOLOM", "Penjelasan": "KETERANGAN FORMAT TEMPLATE EXCEL" },
    { "Panduan Kolom": "No", "Penjelasan": "Nomor urut siswa (1, 2, 3...)" },
    { "Panduan Kolom": "NIS", "Penjelasan": "Nomor Induk Siswa / ID Peserta (Muncul di kartu meja)" },
    { "Panduan Kolom": "Nama Lengkap", "Penjelasan": "Nama lengkap siswa (di denah otomatis diambil 2 kata depan)" },
    { "Panduan Kolom": "Kode Peserta", "Penjelasan": "Kode ujian / peserta (Opsional)" },
    { "Panduan Kolom": "Lab", "Penjelasan": "LAB PPLG, LAB BCF, atau LAB TJKT" },
    { "Panduan Kolom": "Sesi", "Penjelasan": "Sesi pelaksanaan ujian (Contoh: Sesi 1, Sesi 2, Sesi 3)" },
    { "Panduan Kolom": "Foto", "Penjelasan": "Path file foto lokal (Contoh: FOTOANAKANAKSETAN/X PPLG 1/NAMA.jpg) atau biarkan kosong jika nama sudah sama dengan nama file foto." }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideRows, { skipHeader: true });
  wsGuide['!cols'] = [{ wch: 18 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Petunjuk Format");

  XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
  showToast("📄 Template Excel Siswa Multi-Sheet (.xlsx) berhasil diunduh!");
}

function downloadStudentTemplateCsv() {
  const link = document.createElement("a");
  link.href = "Template_Data_Siswa.csv";
  link.download = "Template_Data_Siswa.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("📄 Template CSV Siswa (.csv) berhasil diunduh!");
}

function exportSeatingToCSV() {
  const studentMap = {};
  state.students.forEach(s => studentMap[s.id] = s);

  const rows = [
    ["No Kursi", "ID Siswa / NIS", "Nama Siswa", "Kode Peserta", "Lab", "Sesi", "Status Kursi", "Foto"]
  ];

  const sortedSeats = Object.keys(state.seats).map(Number).sort((a, b) => a - b);
  sortedSeats.forEach(seatNum => {
    const seat = state.seats[seatNum];
    const s = seat.occupantId ? studentMap[seat.occupantId] : null;

    rows.push([
      seatNum,
      s ? s.id : "",
      s ? s.name : "",
      s ? s.code : "",
      s ? s.lab : (state.activeLab !== "ALL" ? state.activeLab : "LAB PPLG"),
      state.activeSession,
      seat.disabled ? "Rusak / Nonaktif" : (s ? "Terisi" : "Kosong"),
      s && s.photo ? s.photo : ""
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Daftar_Duduk_${state.activeLab}_${state.activeSession}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("📥 Daftar tempat duduk berhasil diekspor ke CSV!");
}

function exportLayoutJSON() {
  const layout = {
    version: "2.4",
    name: "Tata Letak Lab PPLG",
    seats: state.seats,
    roomElements: state.roomElements
  };
  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonStr);
  link.setAttribute("download", `Layout_Denah_PPLG.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("📐 Desain layout berhasil disimpan sebagai JSON!");
}

function importLayoutJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.seats) {
        state.seats = data.seats;
        if (data.roomElements) state.roomElements = data.roomElements;
        renderAll();
        saveLayoutToStorage();
        showToast("📐 Layout denah berhasil dimuat dari file JSON!");
      } else {
        alert("File JSON tidak memiliki struktur layout yang valid.");
      }
    } catch (err) {
      alert("Gagal membaca file layout JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// =============================================================================
// BACKUP & RESTORE TOTAL (ALL LAB DENAHS + SISWA + SETTINGS AS JSON)
// =============================================================================

function exportAllDataJSON() {
  saveCurrentSheetState();
  const backup = {
    app: "Denah_Lab_PPLG_Auto",
    version: "4.0",
    savedAt: new Date().toISOString(),
    currentSheetKey: state.currentSheetKey,
    sheets: state.sheets,
    settings: state.settings,
    roomElements: state.roomElements,
    seats: state.seats
  };

  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `Cadangan_Semua_Denah_Lab_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`💾 Cadangan ${Object.keys(state.sheets).length} denah lab berhasil disimpan ke file JSON!`);
}

function triggerImportAllDataJSON() {
  const input = document.getElementById("backupRestoreFileInput");
  if (input) input.click();
}

function importAllDataJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || (!data.sheets && !data.seats)) {
        alert("File JSON tidak valid atau bukan cadangan denah lab.");
        return;
      }

      if (data.sheets && Object.keys(data.sheets).length > 0) {
        state.sheets = data.sheets;
      }

      if (data.settings) {
        state.settings = { ...state.settings, ...data.settings };
      }

      if (data.roomElements) {
        state.roomElements = { ...state.roomElements, ...data.roomElements };
      }

      // Simpan semua ke localStorage
      saveSheetsToStorage();
      saveSettingsToStorage();
      saveLayoutToStorage();

      const keyToSwitch = (data.currentSheetKey && state.sheets[data.currentSheetKey])
        ? data.currentSheetKey
        : Object.keys(state.sheets)[0];

      if (keyToSwitch) {
        switchSheet(keyToSwitch, false);
      } else {
        renderAll();
      }

      showToast(`✅ Berhasil memulihkan ${Object.keys(state.sheets).length} denah lab dari file JSON!`);
    } catch (err) {
      alert("Gagal membaca atau memulihkan file JSON: " + err.message);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function downloadCsvTemplate() {
  const sample = "No,ID Siswa,Nama,Kode,Lab\n1,K01050268001,Ahmad Santoso,K01-01,LAB PPLG-1\n2,K01050268002,Budi Wijaya,K01-02,LAB PPLG-1\n3,K01050268003,Citra Lestari,K01-03,LAB PPLG-1";
  const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Template_Siswa_Denah_Lab.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function prepareAndPrint() {
  try {
    // 1. Kembalikan ke mode seating jika sedang mode layout
    if (state.activeMode !== "seating") {
      switchMode("seating");
    }
    // 2. Reset zoom ke 1.0 agar ukuran cetak A4 100% presisi dan tidak offset
    if (typeof resetZoom === "function") {
      resetZoom();
    }
    showToast("🖨️ Membuka jendela cetak / PDF...");
    setTimeout(() => {
      window.print();
    }, 150);
  } catch (err) {
    console.error("Gagal menjalankan cetak:", err);
    window.print();
  }
}

// =============================================================================
// MANUAL STUDENT ADDITION
// =============================================================================

function openAddStudentModal() {
  document.getElementById("addLab").value = state.activeLab !== "ALL" ? state.activeLab : "LAB PPLG-1";
  openModal("addStudentModal");
}

function handleAddStudentSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("addName").value.trim();
  const id = document.getElementById("addId").value.trim();
  const code = document.getElementById("addCode").value.trim();
  const lab = document.getElementById("addLab").value.trim() || "LAB PPLG-1";

  if (!name || !id) return;

  const newStudent = { id, name, code, lab, photo: null };
  state.students.push(newStudent);
  populateLabOptions();
  renderAll();
  closeModal("addStudentModal");

  document.getElementById("addName").value = "";
  document.getElementById("addId").value = "";
  document.getElementById("addCode").value = "";

  showToast(`Siswa "${name}" berhasil ditambahkan!`);
}

// =============================================================================
// MODAL & UI HELPERS
// =============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "flex";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

function handleModalBackdropClick(event, modalId) {
  if (event.target === document.getElementById(modalId)) {
    closeModal(modalId);
  }
}

let toastTimer = null;
function showToast(message, icon = "✅") {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  const iconEl = document.getElementById("toastIcon");

  msgEl.textContent = message;
  iconEl.textContent = icon;
  toast.style.display = "flex";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function capitalize(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}

// =============================================================================
// NEW: DEDICATED LAB MANAGER & 1-DENAH-1-CSV LOGIC
// =============================================================================

function renderLabSidebar() {
  const activeNameEl = document.getElementById("sidebarActiveLabName");
  const studentCountEl = document.getElementById("sidebarStudentCount");
  const totalLabsCountEl = document.getElementById("sidebarTotalLabsCount");
  const labCardsListEl = document.getElementById("labCardsList");
  const studentListMiniEl = document.getElementById("studentListMini");

  const currentSheet = state.sheets[state.currentSheetKey] || {
    name: state.settings.labName || "LAB PPLG",
    lab: state.settings.labName || "LAB PPLG",
    session: state.settings.session || "Sesi 1",
    students: state.students || []
  };

  if (activeNameEl) {
    activeNameEl.textContent = `${currentSheet.lab || currentSheet.name} — ${currentSheet.session || "Sesi 1"}`;
  }
  if (studentCountEl) {
    studentCountEl.textContent = `${(state.students || []).length} Siswa`;
  }

  const sheetKeys = Object.keys(state.sheets);
  if (totalLabsCountEl) {
    totalLabsCountEl.textContent = sheetKeys.length;
  }

  // Update active color swatch in sidebar
  const currentTheme = currentSheet.theme || state.settings.theme || "purple";
  document.querySelectorAll(".theme-swatches-inline .swatch-btn").forEach(btn => {
    btn.classList.toggle("active", btn.classList.contains(`theme-${currentTheme}`));
  });

  // Render list of lab cards
  if (labCardsListEl) {
    if (sheetKeys.length === 0) {
      labCardsListEl.innerHTML = `<div style="font-size:11px;color:#94a3b8;text-align:center;padding:12px;">Belum ada denah lab.</div>`;
    } else {
      labCardsListEl.innerHTML = sheetKeys.map(k => {
        const item = state.sheets[k];
        const isActive = k === state.currentSheetKey;
        const count = item.students ? item.students.length : 0;
        const itemTheme = item.theme || (item.lab?.includes("BCF") ? "orange" : (item.lab?.includes("TJKT") ? "blue" : "purple"));
        return `
          <div class="lab-card-item ${isActive ? 'active' : ''}" onclick="switchSheet('${escapeHtml(k)}')">
            <div class="lab-card-info">
              <span class="lab-card-title">
                <span class="swatch-dot theme-${itemTheme}" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;"></span>
                ${escapeHtml(item.name || item.lab || k)}
              </span>
              <span class="lab-card-meta">${escapeHtml(item.session || "Sesi 1")} • <b>${count} Siswa</b></span>
            </div>
            <div class="lab-card-actions">
              <button class="btn-icon-xs" title="Duplikat denah ini" onclick="event.stopPropagation(); openDuplicateLabModal('${escapeHtml(k)}')">📋</button>
              ${sheetKeys.length > 1 ? `
                <button class="btn-icon-xs" title="Hapus denah ini" onclick="event.stopPropagation(); deleteLab('${escapeHtml(k)}')">🗑️</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // Render list of students in active lab
  if (studentListMiniEl) {
    if (!state.students || state.students.length === 0) {
      studentListMiniEl.innerHTML = `
        <div style="font-size:11px;color:#94a3b8;text-align:center;padding:16px 8px;">
          Belum ada siswa di denah ini.<br>Upload file CSV di atas atau klik <b>+ Tambah</b>.
        </div>
      `;
    } else {
      const seatedMap = {};
      Object.entries(state.seats).forEach(([num, s]) => {
        if (s.occupantId) seatedMap[s.occupantId] = num;
      });

      studentListMiniEl.innerHTML = "";
      state.students.forEach((s, idx) => {
        const seatNum = seatedMap[s.id];
        const avatarHtml = s.photo
          ? `<img src="${escapeHtml(s.photo)}" onerror="this.parentElement.innerHTML='👤';">`
          : '👤';
        const row = document.createElement("div");
        row.className = "student-row-mini";
        row.dataset.studentId = s.id;
        row.setAttribute("draggable", "true");
        row.style.cursor = "grab";
        row.innerHTML = `
          <div class="student-row-info">
            <span class="student-drag-handle" style="font-size:11px;color:#94a3b8;margin-right:2px;cursor:grab;">⋮⋮</span>
            <div class="student-row-avatar">${avatarHtml}</div>
            <span class="student-row-name" title="${escapeHtml(s.name)}">${idx + 1}. ${escapeHtml(s.name)}</span>
          </div>
          <span class="student-row-seat ${seatNum ? '' : 'unseated'}">
            ${seatNum ? `Kursi ${seatNum}` : 'Belum Duduk'}
          </span>
        `;
        row.addEventListener("dragstart", handleStudentCardDragStart);
        row.addEventListener("dragend", handleStudentCardDragEnd);
        row.addEventListener("click", () => {
          if (seatNum) {
            const seatEl = document.querySelector(`.seat[data-seat="${seatNum}"]`);
            if (seatEl) {
              seatEl.scrollIntoView({ behavior: "smooth", block: "center" });
              seatEl.classList.add("swap-source-highlight");
              setTimeout(() => seatEl.classList.remove("swap-source-highlight"), 1600);
            }
          }
        });
        studentListMiniEl.appendChild(row);
      });
    }
  }
}

// Upload CSV khusus untuk Denah Lab yang sedang aktif (1 Denah 1 CSV)
async function handleSingleLabCsvUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      alert("File CSV tidak memiliki data!");
      return;
    }

    const delim = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(delim).map(x => x.replace(/^"|"$/g, "").trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(delim).map(x => x.replace(/^"|"$/g, "").trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    });

    const parsedStudents = parseRows(rows);
    if (parsedStudents.length === 0) {
      alert("Tidak ditemukan baris siswa yang valid di file CSV!");
      return;
    }

    // Terapkan ke sheet aktif saat ini
    const key = state.currentSheetKey;
    if (!state.sheets[key]) {
      state.sheets[key] = {
        name: state.settings.labName,
        lab: state.settings.labName,
        session: state.settings.session,
        students: [],
        seating: {}
      };
    }

    state.sheets[key].students = parsedStudents;
    state.students = parsedStudents;

    // Reset dan pasang otomatis ke kursi
    Object.keys(state.seats).forEach(num => {
      state.seats[num].occupantId = null;
    });

    const seating = {};
    parsedStudents.forEach((s, idx) => {
      const seatNum = idx + 1;
      if (state.seats[seatNum]) {
        state.seats[seatNum].occupantId = s.id;
        seating[seatNum] = s.id;
      }
    });
    state.sheets[key].seating = seating;

    renderAll();
    saveSheetsToStorage();
    saveSeatingToStorage();
    showToast(`✅ Berhasil memuat ${parsedStudents.length} siswa ke ${state.sheets[key].name || state.settings.labName}!`);
  } catch (err) {
    alert("Gagal membaca file CSV: " + err.message);
  } finally {
    event.target.value = "";
  }
}

// Modal Create Lab
function openCreateLabModal() {
  document.getElementById("newLabNameInput").value = "";
  document.getElementById("newLabSessionInput").value = "Sesi 1";
  openModal("createLabModal");
}

function setLabTheme(themeName) {
  if (!themeName) return;
  const currentKey = state.currentSheetKey;
  if (state.sheets[currentKey]) {
    state.sheets[currentKey].theme = themeName;
    saveSheetsToStorage();
  }
  state.settings.theme = themeName;
  setTheme(themeName, true);
  renderLabSidebar();
}

function handleCreateLabSubmit(e) {
  e.preventDefault();
  const labName = document.getElementById("newLabNameInput").value.trim();
  const sessionName = document.getElementById("newLabSessionInput").value.trim() || "Sesi 1";
  const preset = document.getElementById("newLabPresetSelect").value;
  const selectedTheme = document.getElementById("newLabThemeSelect") ? document.getElementById("newLabThemeSelect").value : "purple";

  if (!labName) return;

  const key = `LAB-${labName.toUpperCase().replace(/\s+/g, '-')}-${sessionName.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;
  
  state.sheets[key] = {
    name: `${labName} — ${sessionName}`,
    lab: labName,
    labTemplate: "PPLG",
    theme: selectedTheme,
    session: sessionName,
    students: [],
    seating: {}
  };

  saveSheetsToStorage();
  closeModal("createLabModal");
  switchSheet(key);

  if (preset) {
    applyPresetLayout(preset);
  }
  saveCurrentSheetState();

  showToast(`🎉 Denah "${labName} (${sessionName})" berhasil dibuat!`);
}

// Modal Rename Lab
function openRenameLabModal() {
  const current = state.sheets[state.currentSheetKey] || {};
  document.getElementById("renameLabNameInput").value = current.lab || state.settings.labName || "LAB PPLG";
  document.getElementById("renameLabSessionInput").value = current.session || state.settings.session || "Sesi 1";
  const themeSel = document.getElementById("renameLabThemeSelect");
  if (themeSel) {
    themeSel.value = current.theme || state.settings.theme || "purple";
  }
  openModal("renameLabModal");
}

function handleRenameLabSubmit(e) {
  e.preventDefault();
  const newName = document.getElementById("renameLabNameInput").value.trim();
  const newSession = document.getElementById("renameLabSessionInput").value.trim() || "Sesi 1";
  const themeSel = document.getElementById("renameLabThemeSelect");
  const chosenTheme = themeSel ? themeSel.value : (state.settings.theme || "purple");

  if (!newName) return;

  const key = state.currentSheetKey;
  if (state.sheets[key]) {
    state.sheets[key].name = `${newName} — ${newSession}`;
    state.sheets[key].lab = newName;
    state.sheets[key].session = newSession;
    state.sheets[key].theme = chosenTheme;
  }
  state.settings.labName = newName;
  state.settings.session = newSession;
  state.settings.theme = chosenTheme;
  state.activeLab = newName;
  state.activeSession = newSession;

  setTheme(chosenTheme, true);
  document.getElementById("labTitle").textContent = newName;
  const sesEl = document.getElementById("sessionTitle");
  if (sesEl) sesEl.textContent = newSession;

  closeModal("renameLabModal");
  renderAll();
  saveSheetsToStorage();
  saveSettingsToStorage();
  showToast(`✏️ Informasi denah "${newName} — ${newSession}" berhasil diperbarui!`);
}

// Modal Duplicate / Copas Denah Lab
function openDuplicateLabModal(sourceKey = null) {
  const key = sourceKey || state.currentSheetKey;
  const current = state.sheets[key] || {};
  const currentLab = current.lab || state.settings.labName || "LAB PPLG";
  const currentSession = current.session || state.settings.session || "Sesi 1";

  // Prediksi nama sesi berikutnya (misal Sesi 1 -> Sesi 2)
  let nextSession = "Sesi 2";
  const numMatch = currentSession.match(/(\d+)/);
  if (numMatch) {
    nextSession = currentSession.replace(numMatch[1], parseInt(numMatch[1], 10) + 1);
  }

  document.getElementById("dupLabNameInput").value = currentLab;
  document.getElementById("dupLabSessionInput").value = nextSession;
  const themeSel = document.getElementById("dupLabThemeSelect");
  if (themeSel) themeSel.value = "keep";
  openModal("duplicateLabModal");
}

function handleDuplicateLabSubmit(e) {
  e.preventDefault();
  const newName = document.getElementById("dupLabNameInput").value.trim();
  const newSession = document.getElementById("dupLabSessionInput").value.trim() || "Sesi 1";
  const copyMode = document.getElementById("dupCopyStudentsSelect").value;
  const chosenThemeVal = document.getElementById("dupLabThemeSelect") ? document.getElementById("dupLabThemeSelect").value : "keep";

  if (!newName) return;

  // Pastikan simpan sheet aktif terlebih dahulu
  saveCurrentSheetState();

  const sourceKey = state.currentSheetKey;
  const sourceSheet = state.sheets[sourceKey] || {};

  const newKey = `LAB-${newName.toUpperCase().replace(/\s+/g, '-')}-${newSession.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;

  // Copas susunan kursi dan posisi meja secara presisi
  const copiedSeats = JSON.parse(JSON.stringify(sourceSheet.seats || state.seats || {}));
  const copiedRoomElements = JSON.parse(JSON.stringify(sourceSheet.roomElements || state.roomElements || {}));

  let newStudents = [];
  let newSeating = {};

  if (copyMode === "keep") {
    newStudents = JSON.parse(JSON.stringify(sourceSheet.students || state.students || []));
    newSeating = JSON.parse(JSON.stringify(sourceSheet.seating || {}));
  } else {
    // Kosongkan siswa tapi struktur meja tetap utuh
    Object.keys(copiedSeats).forEach(k => {
      copiedSeats[k].occupantId = null;
    });
  }

  const finalTheme = (chosenThemeVal && chosenThemeVal !== "keep")
    ? chosenThemeVal
    : (sourceSheet.theme || state.settings.theme || "purple");

  const copiedHeader = sourceSheet.header
    ? JSON.parse(JSON.stringify(sourceSheet.header))
    : {
        institution: state.settings.institution || "SMK PPLG INDONESIA",
        exam: state.settings.exam || "Denah Tempat Duduk — Tes Kemampuan Akademik",
        labName: newName,
        session: newSession,
        date: state.settings.date || "Okt 2026",
        proctorName: state.settings.proctorName || "Proktor Lab",
        logoImage: state.settings.logoImage || "",
        logoText: state.settings.logoText || "LAB"
      };
  copiedHeader.labName = newName;
  copiedHeader.session = newSession;

  state.sheets[newKey] = {
    name: `${newName} — ${newSession}`,
    lab: newName,
    labTemplate: sourceSheet.labTemplate || "PPLG",
    theme: finalTheme,
    session: newSession,
    seats: copiedSeats,
    roomElements: copiedRoomElements,
    students: newStudents,
    seating: newSeating,
    header: copiedHeader
  };

  closeModal("duplicateLabModal");
  switchSheet(newKey);
  showToast(`📋 Berhasil menduplikasi denah menjadi "${newName} — ${newSession}"!`);
}

function deleteLab(sheetKey) {
  if (Object.keys(state.sheets).length <= 1) {
    alert("Minimal harus ada 1 denah lab!");
    return;
  }
  const item = state.sheets[sheetKey];
  const name = item ? (item.name || item.lab || sheetKey) : sheetKey;
  if (!confirm(`Hapus denah "${name}" beserta data siswanya?`)) return;

  delete state.sheets[sheetKey];

  if (state.currentSheetKey === sheetKey) {
    const nextKey = Object.keys(state.sheets)[0];
    switchSheet(nextKey);
  } else {
    renderAll();
    saveSheetsToStorage();
  }

  showToast(`🗑️ Denah "${name}" berhasil dihapus.`);
}

// =============================================================================
// ROOM ELEMENT CUSTOMIZATION (LAYAR, MEJA PROKTOR, PENGAWAS, PINTU)
// =============================================================================

const ROOM_ELEMENT_PRESETS = {
  whiteboard: [
    "LAYAR PROYEKTOR / PAPAN TULIS",
    "LAYAR MONITOR MASTER BROADCAST",
    "RACK SERVER & PATCH PANEL UTAMA",
    "PAPAN TULIS SMARTBOARD",
    "LAYAR UTAMA PRESENTASI"
  ],
  proctor: [
    "MEJA PROKTOR",
    "PROKTOR LAB",
    "MEJA PROKTOR JARINGAN",
    "MASTER CONTROL ROOM (MCR)",
    "SERVER ADMIN & OPERATOR",
    "MEJA INSTRUKTUR"
  ],
  supervisor: [
    "MEJA PENGAWAS",
    "PENGAWAS RUANG",
    "MEJA PENGAWAS LAB",
    "MEJA SUTRADARA / PENGAWAS",
    "ASISTEN LAB / PENDAMPING"
  ],
  entrance: [
    "PINTU MASUK",
    "PINTU KELUAR",
    "PINTU UTAMA",
    "AKSES MASUK LAB"
  ]
};

function openEditRoomElementModal(elemId) {
  // Hanya buka jika bukan sedang aktif drag di Layout Mode
  const el = document.getElementById("elem" + capitalize(elemId));
  if (!el) return;

  const currentText = state.roomElements[elemId]?.label || el.querySelector(".elem-label")?.innerText || "";
  
  document.getElementById("editRoomElementId").value = elemId;
  document.getElementById("editRoomElementInput").value = currentText.replace(/\n+/g, " ").trim();

  let titleText = "Ubah Teks Elemen";
  if (elemId === "whiteboard") titleText = "✏️ Ubah Teks Layar / Papan Tulis";
  else if (elemId === "proctor") titleText = "✏️ Ubah Nama Meja Proktor";
  else if (elemId === "supervisor") titleText = "✏️ Ubah Nama Meja Pengawas";
  else if (elemId === "entrance") titleText = "✏️ Ubah Teks Pintu Masuk";
  document.getElementById("editRoomElementTitle").textContent = titleText;

  // Render presets
  const presetsContainer = document.getElementById("roomElementPresetsRow");
  presetsContainer.innerHTML = "";
  const presets = ROOM_ELEMENT_PRESETS[elemId] || [];
  presets.forEach(p => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-xs btn-outline";
    btn.style.height = "auto";
    btn.style.padding = "4px 8px";
    btn.style.fontSize = "10.5px";
    btn.textContent = p;
    btn.onclick = () => {
      document.getElementById("editRoomElementInput").value = p;
    };
    presetsContainer.appendChild(btn);
  });

  openModal("editRoomElementModal");
}

function handleSaveRoomElementText(e) {
  e.preventDefault();
  const elemId = document.getElementById("editRoomElementId").value;
  const newText = document.getElementById("editRoomElementInput").value.trim();

  if (!elemId || !newText) return;

  if (!state.roomElements[elemId]) {
    state.roomElements[elemId] = { x: 0, y: 0 };
  }
  state.roomElements[elemId].label = newText;

  // Simpan juga ke sheet aktif jika ada
  if (state.sheets[state.currentSheetKey]) {
    if (!state.sheets[state.currentSheetKey].roomElements) {
      state.sheets[state.currentSheetKey].roomElements = {};
    }
    state.sheets[state.currentSheetKey].roomElements[elemId] = { ...state.roomElements[elemId] };
    saveSheetsToStorage();
  }

  saveLayoutToStorage();
  renderRoomElements();
  closeModal("editRoomElementModal");
  showToast(`✅ Teks elemen berhasil diubah menjadi "${newText}"!`);
}

setupLayoutDragEvents();

