// electron-main.js
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

let winKiosk; // Window 1 (Operator/Touchscreen)
let winDisplay; // Window 2 (TV)

// --- FUNGSI 1: BIKIN WINDOW TV (Bisa dipanggil pas start, atau pas tombol ditekan) ---
const createTVWindow = () => {
  const displays = screen.getAllDisplays();

  // Logic: Cari monitor yang koordinatnya BUKAN 0,0
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  if (externalDisplay) {
    // Kalau window TV udah ada sebelumnya, tutup dulu (biar refresh)
    if (winDisplay) {
      winDisplay.close();
    }

    winDisplay = new BrowserWindow({
      x: externalDisplay.bounds.x + 50, // Geser ke layar TV
      y: externalDisplay.bounds.y + 50,
      kiosk: true, // Fullscreen
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Arahkan ke halaman display public
    // Pastikan route ini sudah lu bikin di Next.js
    winDisplay.loadURL("https://disnaker-antrian.vercel.app");

    console.log("Berhasil membuka layar TV!");
  } else {
    console.log(
      "Monitor TV tidak terdeteksi! Pastikan kabel nyolok & TV nyala."
    );
  }
};

// --- FUNGSI 2: BIKIN WINDOW KIOSK (Jalan sekali pas awal) ---
const createMainWindow = () => {
  winKiosk = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1000,
    height: 800,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Penting biar bisa komunikasi sama tombol admin
    },
  });

  // Load halaman utama admin/kiosk
  winKiosk.loadURL("https://disnaker-antrian.vercel.app");

  // (Opsional) Buka DevTools buat ngecek error
  // winKiosk.webContents.openDevTools();
};

// --- STARTUP LOGIC ---
app.whenReady().then(() => {
  // 1. Buka Kiosk dulu (Wajib)
  createMainWindow();

  // 2. Coba buka TV otomatis (Siapa tau TV udah nyala dari pagi)
  createTVWindow();

  // 3. Pasang kuping (Listener) buat tombol "Refresh TV"
  ipcMain.on("buka-layar-tv", (event, arg) => {
    console.log("Tombol refresh ditekan, mencoba membuka TV...");
    createTVWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- LOGIC PRINT STRUK THERMAL ---
ipcMain.on("print-struk", (event, data) => {
  // console.log("Menerima data tiket:", data);

  let workerWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true },
  });

  const htmlContent = `
    <html>
    <head>
        <style>
            body { 
                margin: 0; padding: 0; 
                font-family: 'Courier New', monospace; /* Font monospace paling aman buat thermal */
                width: 80mm; /* Sesuaikan kertas lu */
                font-size: 12px;
                color: black;
            }
            .header { text-align: center; font-weight: bold; margin-bottom: 5px; }
            .date-row { display: flex; justify-content: space-between; font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;}
            .content { text-align: center; }
            .service { font-size: 14px; font-weight: bold; margin-top: 5px; text-transform: uppercase; }
            .number { font-size: 42px; font-weight: 900; margin: 10px 0; line-height: 1; }
            .qr-img { width: 100px; height: 100px; margin: 5px auto; display: block; }
            .footer { text-align: center; font-size: 10px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div style="padding: 0 5px;">
            <div class="header">DISNAKER KOTA BANDUNG<br><span style="font-size:10px; font-weight:normal;">Jl. Martanegara No.4</span></div>
            
            <div class="date-row">
                <span>${data.tanggal}</span>
                <span>${data.waktu}</span>
            </div>

            <div class="content">
                <div>Layanan:</div>
                <div class="service">${data.nama_layanan}</div>
                
                <div style="margin-top: 5px;">Nomor Antrian:</div>
                <div class="number">${data.kode_layanan}${data.nomor}</div>
                
                <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
                
                <img src="${data.qrCode}" class="qr-img" />
            </div>

            <div class="footer">
                Simpan struk ini.<br>
                Terima Kasih.
            </div>
            <br>.
        </div>
    </body>
    </html>
    `;

  workerWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURI(htmlContent)
  );

  workerWindow.webContents.on("did-finish-load", () => {
    workerWindow.webContents.print(
      {
        silent: true,
        printBackground: true,
        deviceName: "",
      },
      () => {
        workerWindow.close();
      }
    );
  });
});
