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

// Fungsi utama untuk konversi (tetap sama)
function convertJsonToCsv(jsonArray) {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
        return "";
    }

    const allKeys = new Set();
    jsonArray.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    function escapeCsvValue(value) {
        if (value === null || value === undefined) {
            return ""; 
        }

        let strValue = String(value);

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

// Handler untuk tombol Konversi (tetap sama)
convertBtn.addEventListener('click', () => {
    let jsonString = jsonInput.value.trim();
    csvOutput.value = '';
    downloadBtn.disabled = true;

    if (!jsonString) {
        showStatus("⚠️ Input JSON kosong. Harap masukkan data.", 'error');
        return;
    }

    try {
        let jsonArray;

        if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
             jsonArray = [JSON.parse(jsonString)];
        } else {
             jsonArray = JSON.parse(jsonString);
        }

        if (!Array.isArray(jsonArray)) {
            showStatus("❌ Gagal: Data JSON harus berupa Array of Objects atau Single Object.", 'error');
            return;
        }

        const csvString = convertJsonToCsv(jsonArray);
        
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
    jsonInput.value = initialJson.trim();
    convertBtn.click();
});