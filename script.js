/*
========================================
JAVASCRIPT LOGIC - KONVERSI JSON ke CSV
========================================
*/

// --- DOM ELEMENTS ---
const jsonInput = document.getElementById('json-input');
const csvOutput = document.getElementById('csv-output');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const fileInput = document.getElementById('json-file-input');
const uploadLabel = document.querySelector('.upload-label');
const statusMessage = document.getElementById('status-message');
// --- Data inisial (diasumsikan didefinisikan di HTML atau tempat lain) ---
// const initialJson = '...'; 

const textToType = "Transformasikan data JSON Anda menjadi format CSV secara instan.";
    const typingElement = document.getElementById('typed-text');
    let charIndex = 0;
    const typingSpeed = 70; 

    function typeText() {
        if (charIndex < textToType.length) {
            // Add the next character
            typingElement.textContent += textToType.charAt(charIndex);
            charIndex++;
            // Call the function again after a delay
            setTimeout(typeText, typingSpeed);
        } else {

        }
    }

    // Start the typing animation when the page loads
    window.onload = function() {
        typeText();
    };

// Hapus require('json2csv') karena ini adalah kode front-end

// --- Fungsi untuk Meratakan Objek JSON (TIDAK DIGUNAKAN DALAM LOGIKA CONVERT SAAT INI) ---
/**
 * Meratakan objek bersarang menjadi objek datar (flat) 
 * menggunakan notasi titik (misalnya, 'data.email').
 * @param {object} obj - Objek bersarang yang akan diratakan.
 * @param {string} prefix - Prefix (awalan) untuk kunci.
 * @param {object} res - Objek hasil untuk menyimpan data yang diratakan.
 */
const flattenObject = (obj, prefix = '', res = {}) => {
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? prefix + '.' + key : key;
      const value = obj[key];

      // Jika nilai adalah Objek (dan bukan null atau Array), lakukan rekursif
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, res);
      } 
      // Jika nilai adalah Array, konversi menjadi string dengan pemisah (Join)
      else if (Array.isArray(value)) {
        // PERINGATAN: Array di dalam array 'items' (misalnya print_metadata.print_waybill_info.items) 
        // akan dikonversi menjadi string. Jika Array berisi objek, Anda perlu meratakan elemennya lebih lanjut.
        res[newKey] = value.join('; '); // Menggabungkan elemen array dengan '; '
      }
      // Nilai lainnya (string, number, boolean)
      else {
        res[newKey] = value;
      }
    }
  }
  return res;
};

// --- LOGIKA json2csv DARI FILE ASLI DIHAPUS ---
// const flatJsonData = nestedJsonData.map(item => flattenObject(item));
// const fields = Object.keys(flatJsonData[0]);
// try {
//   const json2csvParser = new Parser({ fields });
//   const csv = json2csvParser.parse(flatJsonData);
//   ...
// } catch (err) {
//   ...
// }


// Fungsi utama untuk konversi (TETAP SAMA - Tidak menggunakan flattenObject)
function convertJsonToCsv(jsonArray) {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
        return "";
    }

    const allKeys = new Set();
    jsonArray.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
    });
    // Mengurutkan headers agar urutannya konsisten
    const headers = Array.from(allKeys).sort();

    function escapeCsvValue(value) {
        if (value === null || value === undefined) {
            return ""; 
        }

        let strValue = String(value);

        // Jika value adalah objek/array (seperti print_metadata), konversi ke string JSON
        if (typeof value === 'object') {
             strValue = JSON.stringify(value);
        }

        strValue = strValue.replace(/"/g, '""');

        if (strValue.includes(",") || strValue.includes("\n") || strValue.includes('"')) {
            return `"${strValue}"`;
        }
        
        return strValue;
    }

    let csv = headers.map(header => escapeCsvValue(header)).join(",") + "\n";

    jsonArray.forEach(obj => {
        const row = headers.map(header => {
            const value = obj[header];
            return escapeCsvValue(value);
        }).join(",");
        csv += row + "\n";
    });

    return csv;
}

// Fungsi untuk menampilkan pesan status (tetap sama)
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = ''; 
    statusMessage.classList.add('show', type);

    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000); 
}

// Handler untuk tombol Konversi (MODIFIKASI UTAMA DI SINI)
convertBtn.addEventListener('click', () => {
    let jsonString = jsonInput.value.trim();
    csvOutput.value = '';
    downloadBtn.disabled = true;

    if (!jsonString) {
        showStatus("⚠️ Input JSON kosong. Harap masukkan data.", 'error');
        return;
    }

    try {
        let jsonObject = JSON.parse(jsonString);
        let dataToConvert = [];

        // Logika untuk menemukan Array Data:
        // 1. Cek apakah ini adalah format Array of Objects biasa
        if (Array.isArray(jsonObject)) {
            dataToConvert = jsonObject;
        } 
        // 2. Cek apakah strukturnya seperti { "code":..., "data": { "result": { "items": [...] } } }
        else if (jsonObject.data && jsonObject.data.result && Array.isArray(jsonObject.data.result.items)) {
            // Ambil array yang ada di data.result.items
            dataToConvert = jsonObject.data.result.items;
        } 
        // 3. Cek apakah inputnya adalah Single Object (seperti yang ditangani sebelumnya, tapi objeknya diratakan/dianggap satu baris)
        else if (typeof jsonObject === 'object' && jsonObject !== null) {
            // Untuk JSON non-array tunggal (seperti objek request dalam contoh Anda), 
            // kita akan meratakannya terlebih dahulu agar semua field nested muncul sebagai kolom di CSV.
            // PENTING: Karena fungsi convertJsonToCsv TIDAK meratakan objek, 
            // kita harus memastikan data yang dimasukkan ke dalamnya adalah FLAT.
            // Jika objek input (seperti request) adalah JSON utama (bukan array di dalam field), 
            // kita asumsikan pengguna ingin meratakan objek utamanya.
            const flattenedObject = flattenObject(jsonObject);
            dataToConvert = [flattenedObject];
        }


        if (dataToConvert.length === 0) {
            showStatus("❌ Gagal: Tidak ada data Array of Objects yang ditemukan di root, data.result.items, atau objek tunggal yang valid.", 'error');
            return;
        }

        // Karena item di dalam array 'items' memiliki nested object (`print_metadata`),
        // kita perlu MENGGANTI objek-objek bersarang di dalam dataToConvert dengan versi yang **diratakan (flattened)**
        // agar kolom-kolomnya terpecah menjadi `print_metadata.delivery_type`, dll.
        // Jika tidak diratakan, kolom akan menjadi `print_metadata` dan isinya berupa string JSON.
        const flatDataToConvert = dataToConvert.map(item => flattenObject(item));


        const csvString = convertJsonToCsv(flatDataToConvert);
        
        csvOutput.value = csvString;
        downloadBtn.disabled = csvString.length === 0;

        showStatus("✅ Konversi berhasil!", 'success');

    } catch (error) {
        csvOutput.value = 'ERROR: Data JSON tidak valid atau formatnya salah.';
        showStatus("❌ Gagal: Data JSON tidak valid.", 'error');
        console.error("JSON Parsing Error:", error);
    }
});

downloadBtn.addEventListener('click', () => {
    const csvData = csvOutput.value;
    if (!csvData) return;

    // 1. Proses Download
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_konversi.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus("⬇️ File CSV berhasil didownload!", 'success');

    csvOutput.value = ''; 
    downloadBtn.disabled = true; 
});

// Handler untuk Upload File (tetap sama)
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        jsonInput.value = e.target.result;
        uploadLabel.innerHTML = `<i class="fas fa-file-alt"></i> File Terupload: <b>${file.name}</b>`;
        convertBtn.click();
    };
    reader.onerror = () => {
         showStatus("❌ Gagal membaca file.", 'error');
    };
    reader.readAsText(file);
});


// Inisialisasi (tetap sama)
window.addEventListener('load', () => {
    // Diasumsikan 'initialJson' ada di file HTML/sebelumnya. Jika tidak, baris ini akan error.
    // Jika tidak ada data awal, hapus dua baris ini.
    // jsonInput.value = initialJson.trim(); 
    // convertBtn.click();
});