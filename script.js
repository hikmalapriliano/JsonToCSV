// === Tema ===
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
  const isDark = body.dataset.theme === "dark";
  body.dataset.theme = isDark ? "light" : "dark";

  themeToggle.querySelector("span").textContent = isDark ? "Dark" : "Light";
  themeToggle.querySelector("i").classList.toggle("fa-sun");
  themeToggle.querySelector("i").classList.toggle("fa-moon");
});

// === Konversi JSON ke CSV (versi lengkap dan fleksibel) ===
document.getElementById("convertBtn").addEventListener("click", () => {
  const input = document.getElementById("jsonInput").value.trim();
  const output = document.getElementById("csvOutput");

  if (!input) {
    alert("Masukkan JSON terlebih dahulu!");
    return;
  }

  try {
    const jsonData = JSON.parse(input);
    let dataArray = [];

    // Deteksi struktur JSON otomatis
    if (Array.isArray(jsonData)) {
      dataArray = jsonData;
    } else if (
      jsonData.data &&
      jsonData.data.result &&
      Array.isArray(jsonData.data.result.items)
    ) {
      dataArray = jsonData.data.result.items;
    } else if (jsonData.items && Array.isArray(jsonData.items)) {
      dataArray = jsonData.items;
    } else if (typeof jsonData === "object") {
      dataArray = [jsonData];
    } else {
      throw new Error("Struktur JSON tidak dikenali!");
    }

    if (dataArray.length === 0) {
      alert("Tidak ada data yang bisa dikonversi!");
      return;
    }

    // Ambil semua key unik (gabungan seluruh objek)
    const headers = Array.from(
      new Set(dataArray.flatMap((obj) => Object.keys(obj)))
    );

    // Buat CSV
    const csvRows = [];
    csvRows.push(headers.join(",")); // Header

    for (const row of dataArray) {
      const values = headers.map((h) => {
        let val = row[h];
        if (val === null || val === undefined) val = "";
        if (typeof val === "object") val = JSON.stringify(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvData = csvRows.join("\n");
    output.value = csvData;
  } catch (e) {
    alert("JSON tidak valid: " + e.message);
  }
});

// === Clear ===
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("jsonInput").value = "";
  document.getElementById("csvOutput").value = "";
});

// === Download CSV ===
document.getElementById("downloadBtn").addEventListener("click", () => {
  const csv = document.getElementById("csvOutput").value;
  if (!csv) {
    alert("Tidak ada data CSV untuk diunduh!");
    return;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "output.csv";
  a.click();
});

// === Copy ke Clipboard ===
document.getElementById("copyBtn").addEventListener("click", () => {
  const csv = document.getElementById("csvOutput").value;
  if (!csv) {
    alert("Belum ada data untuk disalin!");
    return;
  }
  navigator.clipboard.writeText(csv);
  alert("Tersalin ke clipboard!");
});

// === Upload File JSON ===
document.getElementById("jsonFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("jsonInput").value = e.target.result;
  };
  reader.readAsText(file);
});
