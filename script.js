// CSV Filter App - Pastel Blue Theme
// สำหรับเกษตรกรอ้อย - แสดงเฉพาะคอลัมน์ที่ต้องการ

// คอลัมน์ที่ต้องการเก็บ
const COLUMNS_TO_KEEP = ["รหัสนักเกษตร", "ชื่อนักเกษตร", "โซน", "ชื่อประเภทอ้อย", "พื้นที่"];

// ตัวแปร global
let currentCSVData = null;
let currentHeaders = [];
let currentFileData = null;
let filteredData = [];
let filteredHeaders = [];

// เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ฟังก์ชันเริ่มต้นแอป
function initApp() {
    console.log('CSV Filter App เริ่มต้นแล้ว');
    
    // อ้างอิงถึง DOM elements
    const fileInput = document.getElementById('csvFile');
    const previewBtn = document.getElementById('previewBtn');
    const filterBtn = document.getElementById('filterBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const inputEncoding = document.getElementById('inputEncoding');
    const delimiterSelect = document.getElementById('delimiter');
    
    // เมื่อเลือกไฟล์
    fileInput.addEventListener('change', handleFileSelect);
    
    // เมื่อคลิกปุ่มดูข้อมูลตัวอย่าง
    previewBtn.addEventListener('click', showPreviewData);
    
    // เมื่อคลิกปุ่มกรองข้อมูล
    filterBtn.addEventListener('click', processAndDisplayCSV);
    
    // เมื่อคลิกปุ่มคัดลอกข้อมูล
    copyBtn.addEventListener('click', copyFilteredData);
    
    // เมื่อคลิกปุ่มดาวน์โหลด
    downloadBtn.addEventListener('click', downloadFilteredCSV);
    
    // ตั้งค่า Drag & Drop
    setupDragAndDrop();
    
    console.log('แอปพร้อมใช้งานแล้ว');
}

// ============================================
// ฟังก์ชันจัดการเมื่อเลือกไฟล์
// ============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('ไฟล์ที่เลือก:', file.name);
    
    // รีเซ็ตสถานะ
    resetUI();
    
    // ตรวจสอบว่าเป็นไฟล์ CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('กรุณาเลือกไฟล์ CSV เท่านั้น (.csv)', 'error');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('ไฟล์ขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่า 10MB', 'error');
        return;
    }
    
    // อ่านไฟล์
    readFile(file);
}

// อ่านไฟล์ CSV
function readFile(file) {
    const encoding = document.getElementById('inputEncoding').value;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let content = e.target.result;
            
            console.log('กำลังอ่านไฟล์ด้วย encoding:', encoding);
            
            // พยายาม decode ใหม่ถ้า encoding ไม่ตรง
            if (encoding !== 'utf-8' && encoding !== 'utf-8-sig') {
                try {
                    // สำหรับ encoding อื่นๆ
                    const buffer = e.target.result;
                    const decoder = new TextDecoder(encoding);
                    content = decoder.decode(buffer);
                } catch (decodeError) {
                    console.warn('Cannot decode with', encoding, 'trying UTF-8');
                    showMessage(`ไม่สามารถอ่านไฟล์ด้วย ${encoding} ลองใช้ UTF-8 แทน`, 'warning');
                    
                    // ลองใช้ UTF-8
                    const decoder = new TextDecoder('utf-8');
                    content = decoder.decode(e.target.result);
                }
            }
            
            currentCSVData = content;
            currentFileData = content;
            
            // แสดงการตั้งค่า
            document.getElementById('settingsPanel').style.display = 'block';
            document.getElementById('previewSection').style.display = 'block';
            document.getElementById('previewCard').style.display = 'block';
            
            // แสดงข้อความสำเร็จ
            showMessage(`✓ โหลดไฟล์สำเร็จ: ${file.name}`, 'success');
            
        } catch (error) {
            console.error('Error reading file:', error);
            showMessage('ไม่สามารถอ่านไฟล์ได้: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
    };
    
    // อ่านไฟล์ตาม encoding
    if (encoding === 'utf-8' || encoding === 'utf-8-sig') {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// ============================================
// ฟังก์ชันตั้งค่า Drag & Drop
// ============================================

function setupDragAndDrop() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('csvFile');
    
    // ป้องกันพฤติกรรม default
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // ไฮไลต์เมื่อลากไฟล์มาวาง
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // จัดการเมื่อวางไฟล์
    dropArea.addEventListener('drop', handleDrop, false);
    
    // เมื่อคลิกที่พื้นที่อัปโหลด
    dropArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    }
}

// ============================================
// ฟังก์ชันแสดงข้อมูลตัวอย่าง
// ============================================

function showPreviewData() {
    if (!currentCSVData) {
        showMessage('กรุณาเลือกไฟล์ CSV ก่อน', 'error');
        return;
    }
    
    try {
        const delimiter = getDelimiter();
        const lines = currentCSVData.split(/\r\n|\n|\r/);
        
        if (lines.length < 2) {
            showMessage('ไฟล์ CSV ไม่มีข้อมูลหรือมีข้อมูลไม่ถูกต้อง', 'error');
            return;
        }
        
        // หา header
        let headerLineIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            if (!lines[i] || lines[i].trim() === '') continue;
            
            const testHeaders = lines[i].split(delimiter);
            if (testHeaders.length > 1) {
                headers = testHeaders.map(h => h.trim());
                headerLineIndex = i;
                break;
            }
        }
        
        if (headers.length === 0) {
            showMessage('ไม่พบหัวคอลัมน์ในไฟล์ CSV', 'error');
            return;
        }
        
        currentHeaders = headers;
        
        // หาคอลัมน์ที่ต้องการเก็บ
        const columnIndices = [];
        const previewHeaders = [];
        
        for (let i = 0; i < headers.length; i++) {
            if (COLUMNS_TO_KEEP.includes(headers[i])) {
                columnIndices.push(i);
                previewHeaders.push(headers[i]);
            }
        }
        
        // สร้างตารางตัวอย่าง
        let tableHTML = '<table class="preview-table">';
        
        // Header
        tableHTML += '<thead><tr>';
        headers.forEach(header => {
            const isKeep = COLUMNS_TO_KEEP.includes(header);
            tableHTML += `<th style="${isKeep ? 'background: #B3E5FC;' : ''}">${escapeHtml(header)}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Data (แสดงแค่ 5 แถวแรก)
        tableHTML += '<tbody>';
        const previewRows = Math.min(5, lines.length - headerLineIndex - 1);
        let displayedRows = 0;
        
        for (let i = 1; i <= previewRows + 5; i++) {
            const lineIndex = headerLineIndex + i;
            if (!lines[lineIndex] || !lines[lineIndex].trim()) continue;
            
            const cells = lines[lineIndex].split(delimiter);
            
            tableHTML += '<tr>';
            for (let j = 0; j < headers.length; j++) {
                const isKeep = COLUMNS_TO_KEEP.includes(headers[j]);
                let cellValue = '';
                if (j < cells.length) {
                    cellValue = cells[j].trim();
                }
                tableHTML += `<td style="${isKeep ? 'background: #E8F5E9;' : ''}">${escapeHtml(cellValue)}</td>`;
            }
            tableHTML += '</tr>';
            
            displayedRows++;
            if (displayedRows >= previewRows) break;
        }
        
        tableHTML += '</tbody></table>';
        
        // แสดงตาราง
        const previewTable = document.getElementById('previewTable');
        const previewNoData = document.getElementById('previewNoData');
        
        previewTable.innerHTML = tableHTML;
        previewNoData.style.display = 'none';
        
        // แสดงข้อความ
        const foundColumns = columnIndices.length;
        showMessage(
            `✓ พบไฟล์ CSV: ${lines.length - headerLineIndex - 1} แถว, ${headers.length} คอลัมน์<br>
             ✓ พบคอลัมน์ที่ต้องการ: ${foundColumns}/${COLUMNS_TO_KEEP.length} คอลัมน์`,
            'success'
        );
        
    } catch (error) {
        console.error('Error showing preview:', error);
        showMessage('ไม่สามารถแสดงข้อมูลตัวอย่าง: ' + error.message, 'error');
    }
}

// หา delimiter ที่ใช้ในไฟล์
function getDelimiter() {
    const delimiterValue = document.getElementById('delimiter').value;
    return delimiterValue === '\\t' ? '\t' : delimiterValue;
}

// ============================================
// ฟังก์ชันกรองและแสดงข้อมูล CSV
// ============================================

function processAndDisplayCSV() {
    if (!currentCSVData) {
        showMessage('กรุณาเลือกไฟล์ CSV ก่อน', 'error');
        return;
    }
    
    try {
        const delimiter = getDelimiter();
        const lines = currentCSVData.split(/\r\n|\n|\r/);
        
        // หา header
        let headerLineIndex = 0;
        let headers = [];
        
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i] || lines[i].trim() === '') continue;
            
            const testHeaders = lines[i].split(delimiter);
            if (testHeaders.length > 1) {
                headers = testHeaders.map(h => h.trim());
                headerLineIndex = i;
                break;
            }
        }
        
        if (headers.length === 0) {
            showMessage('ไม่พบหัวคอลัมน์ในไฟล์ CSV', 'error');
            return;
        }
        
        // หาคอลัมน์ที่ต้องการเก็บ
        const columnIndices = [];
        filteredHeaders = [];
        
        for (let i = 0; i < headers.length; i++) {
            if (COLUMNS_TO_KEEP.includes(headers[i])) {
                columnIndices.push(i);
                filteredHeaders.push(headers[i]);
            }
        }
        
        // ถ้าไม่เจอคอลัมน์ที่ต้องการ
        if (columnIndices.length === 0) {
            showMessage('ไม่พบคอลัมน์ที่ต้องการในไฟล์นี้ กรุณาตรวจสอบชื่อคอลัมน์', 'error');
            return;
        }
        
        // กรองข้อมูลทั้งหมด
        filteredData = [];
        let skippedRows = 0;
        
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            if (!lines[i] || !lines[i].trim()) continue;
            
            const cells = lines[i].split(delimiter);
            
            // ข้ามแถวที่ไม่มีความยาวพอ
            if (cells.length < Math.max(...columnIndices) + 1) {
                skippedRows++;
                continue;
            }
            
            const filteredCells = [];
            
            columnIndices.forEach(index => {
                let cellValue = '';
                if (index < cells.length) {
                    cellValue = cells[index].trim();
                }
                filteredCells.push(cellValue);
            });
            
            filteredData.push(filteredCells);
        }
        
        // แสดงผลลัพธ์
        displayFilteredResults(filteredHeaders, filteredData, headers.length, skippedRows);
        
        // แสดงข้อความสำเร็จ
        showMessage(
            `✓ กรองข้อมูลสำเร็จ!<br>
            • จำนวนแถวที่กรอง: ${filteredData.length} แถว<br>
            • คอลัมน์ที่แสดง: ${filteredHeaders.join(', ')}<br>
            ${skippedRows > 0 ? `• ข้ามแถวที่ไม่สมบูรณ์: ${skippedRows} แถว` : ''}`,
            'success'
        );
        
    } catch (error) {
        console.error('Error processing CSV:', error);
        showMessage('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error');
    }
}

// แสดงผลลัพธ์ที่กรองแล้ว
function displayFilteredResults(headers, data, originalColumnCount, skippedRows) {
    // แสดงการ์ดผลลัพธ์
    document.getElementById('resultCard').style.display = 'block';
    
    // แสดงสรุปผล
    const resultSummary = document.getElementById('resultSummary');
    const totalRows = document.getElementById('totalRows');
    const originalColumns = document.getElementById('originalColumns');
    const fileEncoding = document.getElementById('fileEncoding');
    
    totalRows.textContent = data.length;
    originalColumns.textContent = originalColumnCount;
    fileEncoding.textContent = document.getElementById('inputEncoding').options[document.getElementById('inputEncoding').selectedIndex].text;
    
    resultSummary.style.display = 'flex';
    
    // สร้างตาราง HTML
    let tableHTML = '<table class="table table-hover">';
    
    // Header
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${escapeHtml(header)}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Data
    tableHTML += '<tbody>';
    
    if (data.length === 0) {
        tableHTML += `<tr><td colspan="${headers.length}" class="text-center text-muted py-4">
            <i class="fas fa-exclamation-circle me-2"></i>ไม่พบข้อมูลที่กรองได้
        </td></tr>`;
    } else {
        data.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${escapeHtml(cell)}</td>`;
            });
            tableHTML += '</tr>';
        });
    }
    
    tableHTML += '</tbody></table>';
    
    // แสดงตาราง
    const resultTable = document.getElementById('resultTable');
    const noDataMessage = document.getElementById('noDataMessage');
    
    resultTable.innerHTML = tableHTML;
    resultTable.style.display = 'block';
    noDataMessage.style.display = 'none';
    
    // แสดงปุ่มการทำงาน
    document.getElementById('actionButtons').style.display = 'flex';
    
    // เพิ่มสีสลับแถว
    const tableRows = resultTable.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        if (index % 2 === 0) {
            row.style.backgroundColor = 'rgba(179, 229, 252, 0.05)';
        }
    });
}

// ============================================
// ฟังก์ชันคัดลอกข้อมูล
// ============================================

function copyFilteredData() {
    if (filteredData.length === 0) {
        showMessage('ไม่มีข้อมูลที่จะคัดลอก', 'error');
        return;
    }
    
    try {
        // สร้างข้อความ CSV
        let csvText = filteredHeaders.join(',') + '\n';
        filteredData.forEach(row => {
            csvText += row.join(',') + '\n';
        });
        
        // คัดลอกไปยัง clipboard
        navigator.clipboard.writeText(csvText).then(() => {
            showMessage('คัดลอกข้อมูลสำเร็จ! คุณสามารถวางใน Excel หรือโปรแกรมอื่นได้', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showMessage('ไม่สามารถคัดลอกข้อมูลได้', 'error');
        });
        
    } catch (error) {
        console.error('Error copying data:', error);
        showMessage('เกิดข้อผิดพลาดในการคัดลอกข้อมูล', 'error');
    }
}

// ============================================
// ฟังก์ชันดาวน์โหลด CSV
// ============================================

function downloadFilteredCSV() {
    if (filteredData.length === 0) {
        showMessage('ไม่มีข้อมูลที่จะดาวน์โหลด', 'error');
        return;
    }
    
    try {
        // สร้างข้อความ CSV
        let csvText = '\uFEFF'; // UTF-8 BOM สำหรับภาษาไทย
        csvText += filteredHeaders.join(',') + '\r\n';
        filteredData.forEach(row => {
            // Escape ค่าที่มี comma หรือ quotes
            const escapedRow = row.map(cell => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
                    return '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell;
            });
            csvText += escapedRow.join(',') + '\r\n';
        });
        
        // สร้าง Blob
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // สร้างลิงก์ดาวน์โหลด
        const a = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        a.href = url;
        a.download = `เกษตรกร_กรองแล้ว_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // ล้าง URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showMessage('ดาวน์โหลดไฟล์ CSV สำเร็จ!', 'success');
        
    } catch (error) {
        console.error('Error downloading CSV:', error);
        showMessage('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
    }
}

// ============================================
// ฟังก์ชันยูทิลิตี้
// ============================================

// แสดงข้อความ
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    
    let alertClass = 'alert-info';
    let icon = 'info-circle';
    
    if (type === 'success') {
        alertClass = 'alert-success';
        icon = 'check-circle';
    } else if (type === 'warning') {
        alertClass = 'alert-warning';
        icon = 'exclamation-triangle';
    } else if (type === 'error') {
        alertClass = 'alert-danger';
        icon = 'exclamation-circle';
    }
    
    messageArea.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <div class="d-flex align-items-center">
                <i class="fas fa-${icon} me-3 fs-4"></i>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// รีเซ็ต UI
function resetUI() {
    document.getElementById('messageArea').innerHTML = '';
    document.getElementById('settingsPanel').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('resultSummary').style.display = 'none';
    document.getElementById('resultTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'none';
    
    const previewTable = document.getElementById('previewTable');
    const previewNoData = document.getElementById('previewNoData');
    previewTable.innerHTML = '';
    previewNoData.style.display = 'block';
    
    currentCSVData = null;
    currentHeaders = [];
    filteredData = [];
    filteredHeaders = [];
}

// Escape HTML
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ฟังก์ชันเพิ่มเติมสำหรับการแก้ปัญหา
// ============================================

// ตรวจสอบและล็อกข้อผิดพลาด
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    console.error('Error at:', e.filename, 'line:', e.lineno);
});

// ตรวจสอบว่าไฟล์ถูกโหลดแล้ว
document.getElementById('csvFile').addEventListener('click', function(e) {
    e.stopPropagation();
});
