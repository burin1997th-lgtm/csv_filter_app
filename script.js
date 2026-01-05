// CSV Filter App - Pastel Blue Theme (UTF-8 with BOM only)
// สำหรับเกษตรกรอ้อย - เก็บเฉพาะคอลัมน์ที่ต้องการ

// คอลัมน์ที่ต้องการเก็บ
const COLUMNS_TO_KEEP = ["รหัสนักเกษตร", "ชื่อนักเกษตร", "โซน", "ชื่อประเภทอ้อย", "พื้นที่"];

// ตัวแปร global
let currentCSVData = null;
let currentHeaders = [];
let currentRows = 0;
let currentColumns = 0;

// เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ฟังก์ชันเริ่มต้นแอป
function initApp() {
    console.log('CSV Filter App เริ่มต้นแล้ว - Pastel Blue Theme');
    
    // อ้างอิงถึง DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('csvFile');
    const processBtn = document.getElementById('processBtn');
    const sampleFileBtn = document.getElementById('sampleFileBtn');
    const inputEncoding = document.getElementById('inputEncoding');
    const delimiterSelect = document.getElementById('delimiter');
    
    // ตั้งค่า Drag & Drop
    setupDragAndDrop(dropArea, fileInput);
    
    // เมื่อเลือกไฟล์
    fileInput.addEventListener('change', handleFileSelect);
    
    // เมื่อคลิกปุ่มประมวลผล
    processBtn.addEventListener('click', processCSV);
    
    // เมื่อคลิกปุ่มดาวน์โหลดตัวอย่าง
    sampleFileBtn.addEventListener('click', downloadSampleFile);
    
    // เมื่อเปลี่ยน encoding หรือ delimiter
    inputEncoding.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            handleFileSelect({ target: fileInput });
        }
    });
    
    delimiterSelect.addEventListener('change', function() {
        if (currentCSVData) {
            parseCSV(currentCSVData);
        }
    });
}

// ============================================
// ฟังก์ชันจัดการ Drag & Drop
// ============================================

function setupDragAndDrop(dropArea, fileInput) {
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
// ฟังก์ชันจัดการเมื่อเลือกไฟล์
// ============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
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
    
    // แสดงข้อมูลไฟล์
    showFileInfo(file);
    
    // อ่านไฟล์
    readFile(file);
}

// แสดงข้อมูลไฟล์
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileStatus = document.getElementById('fileStatus');
    
    fileInfo.style.display = 'flex';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileStatus.textContent = 'กำลังอ่านไฟล์...';
    fileStatus.style.background = 'linear-gradient(135deg, #FF9800, #FFB74D)';
    
    // แสดงการตั้งค่า
    document.getElementById('settingsPanel').style.display = 'block';
}

// อ่านไฟล์ CSV
function readFile(file) {
    const encoding = document.getElementById('inputEncoding').value;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let content = e.target.result;
            
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
            parseCSV(content);
            
            // อัปเดตสถานะไฟล์
            document.getElementById('fileStatus').textContent = 'พร้อมประมวลผล';
            document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            
        } catch (error) {
            showMessage('ไม่สามารถอ่านไฟล์ได้: ' + error.message, 'error');
            document.getElementById('fileStatus').textContent = 'มีข้อผิดพลาด';
            document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #F44336, #E57373)';
        }
    };
    
    reader.onerror = function() {
        showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
        document.getElementById('fileStatus').textContent = 'มีข้อผิดพลาด';
        document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #F44336, #E57373)';
    };
    
    // อ่านไฟล์ตาม encoding
    if (encoding === 'utf-8' || encoding === 'utf-8-sig') {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// ============================================
// ฟังก์ชันแยกข้อมูล CSV
// ============================================

function parseCSV(content) {
    try {
        const delimiter = getDelimiter();
        const lines = content.split(/\r\n|\n|\r/);
        
        if (lines.length < 2) {
            showMessage('ไฟล์ CSV ไม่มีข้อมูลหรือมีข้อมูลไม่ถูกต้อง', 'error');
            return;
        }
        
        // หา header (อาจมีหลายบรรทัด header)
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
        currentColumns = headers.length;
        
        // แสดงตัวอย่างข้อมูล
        showPreview(lines, headerLineIndex, delimiter);
        
        // แสดงข้อความสำเร็จ
        const dataRows = lines.length - headerLineIndex - 1;
        currentRows = dataRows;
        
        const foundColumns = COLUMNS_TO_KEEP.filter(col => headers.includes(col)).length;
        
        if (foundColumns === COLUMNS_TO_KEEP.length) {
            showMessage(`✓ พบไฟล์ CSV: ${dataRows} แถว, ${headers.length} คอลัมน์, พบคอลัมน์ที่ต้องการครบถ้วน`, 'success');
        } else if (foundColumns > 0) {
            showMessage(`✓ พบไฟล์ CSV: ${dataRows} แถว, ${headers.length} คอลัมน์, พบคอลัมน์ที่ต้องการ ${foundColumns}/${COLUMNS_TO_KEEP.length} คอลัมน์`, 'warning');
        } else {
            showMessage(`✓ พบไฟล์ CSV: ${dataRows} แถว, ${headers.length} คอลัมน์, ไม่พบคอลัมน์ที่ต้องการในไฟล์นี้`, 'warning');
        }
        
    } catch (error) {
        showMessage('ไม่สามารถแยกข้อมูล CSV: ' + error.message, 'error');
    }
}

// หา delimiter ที่ใช้ในไฟล์
function getDelimiter() {
    const delimiterValue = document.getElementById('delimiter').value;
    return delimiterValue === '\\t' ? '\t' : delimiterValue;
}

// ============================================
// ฟังก์ชันแสดงตัวอย่างข้อมูล
// ============================================

function showPreview(lines, headerLineIndex, delimiter) {
    const headers = currentHeaders;
    
    // หาคอลัมน์ที่ต้องการเก็บ
    const columnIndices = [];
    const filteredHeaders = [];
    
    for (let i = 0; i < headers.length; i++) {
        if (COLUMNS_TO_KEEP.includes(headers[i])) {
            columnIndices.push(i);
            filteredHeaders.push(headers[i]);
        }
    }
    
    // ถ้าไม่เจอคอลัมน์ที่ต้องการเลย
    if (columnIndices.length === 0) {
        showMessage('ไม่พบคอลัมน์ที่ต้องการในไฟล์ กรุณาตรวจสอบชื่อคอลัมน์', 'error');
        document.getElementById('previewCard').style.display = 'none';
        return;
    }
    
    // แสดงการ์ดตัวอย่าง
    document.getElementById('previewCard').style.display = 'block';
    
    // สร้างตาราง HTML
    let tableHTML = '<table class="table table-sm table-hover">';
    
    // Header
    tableHTML += '<thead><tr>';
    filteredHeaders.forEach(header => {
        tableHTML += `<th style="background: linear-gradient(135deg, #B3E5FC, #81D4FA); color: #1976D2; border-bottom: 2px solid #5D9CEC;">${escapeHtml(header)}</th>`;
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
        if (cells.length < Math.max(...columnIndices) + 1) continue;
        
        tableHTML += '<tr>';
        
        columnIndices.forEach(index => {
            let cellValue = '';
            if (index < cells.length) {
                cellValue = cells[index].trim();
            }
            tableHTML += `<td style="border-bottom: 1px solid #E3F2FD;">${escapeHtml(cellValue)}</td>`;
        });
        
        tableHTML += '</tr>';
        displayedRows++;
        
        if (displayedRows >= previewRows) break;
    }
    
    tableHTML += '</tbody></table>';
    
    // แสดงตาราง
    document.getElementById('previewTable').innerHTML = tableHTML;
    
    // แสดงจำนวนแถวและคอลัมน์
    const totalRows = lines.length - headerLineIndex - 1;
    const keptColumns = columnIndices.length;
    
    document.getElementById('rowCount').textContent = `แสดง ${displayedRows} จาก ${totalRows} แถว`;
    document.getElementById('columnCount').textContent = `คอลัมน์ที่เก็บ: ${keptColumns} จาก ${headers.length} คอลัมน์`;
}

// ============================================
// ฟังก์ชันกรองและสร้างไฟล์ CSV ใหม่
// ============================================

function processCSV() {
    if (!currentCSVData || !currentHeaders || currentHeaders.length === 0) {
        showMessage('กรุณาเลือกไฟล์ CSV ก่อน', 'error');
        return;
    }
    
    // แสดงสถานะกำลังประมวลผล
    setProcessingState(true);
    
    // ใช้ setTimeout เพื่อให้ UI อัปเดตก่อน
    setTimeout(() => {
        try {
            const delimiter = getDelimiter();
            const lines = currentCSVData.split(/\r\n|\n|\r/);
            
            // หา header line
            let headerLineIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i] || lines[i].trim() === '') continue;
                
                const testHeaders = lines[i].split(delimiter);
                if (testHeaders.length > 1 && testHeaders.some(h => currentHeaders.includes(h.trim()))) {
                    headerLineIndex = i;
                    break;
                }
            }
            
            const headers = lines[headerLineIndex].split(delimiter).map(h => h.trim());
            
            // หาคอลัมน์ที่ต้องการเก็บ
            const columnIndices = [];
            const filteredHeaders = [];
            
            for (let i = 0; i < headers.length; i++) {
                if (COLUMNS_TO_KEEP.includes(headers[i])) {
                    columnIndices.push(i);
                    filteredHeaders.push(headers[i]);
                }
            }
            
            // ถ้าไม่เจอคอลัมน์ที่ต้องการ
            if (columnIndices.length === 0) {
                showMessage('ไม่พบคอลัมน์ที่ต้องการในไฟล์นี้ กรุณาตรวจสอบชื่อคอลัมน์', 'error');
                setProcessingState(false);
                return;
            }
            
            // กรองข้อมูลทั้งหมด
            const filteredRows = [];
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
                
                filteredRows.push(filteredCells);
            }
            
            // สร้าง CSV ใหม่ในรูปแบบ UTF-8 with BOM
            const csvOutput = createCSVOutputUTF8BOM(filteredHeaders, filteredRows);
            
            // ดาวน์โหลดไฟล์
            downloadCSVFile(csvOutput);
            
            // แสดงข้อความสำเร็จ
            showMessage(
                `✓ สร้างไฟล์สำเร็จ!<br>
                • จำนวนแถวที่กรอง: ${filteredRows.length} แถว<br>
                • คอลัมน์ที่เก็บ: ${filteredHeaders.join(', ')}<br>
                • รูปแบบไฟล์: UTF-8 with BOM (เปิดใน Excel ได้ทันที)<br>
                ${skippedRows > 0 ? `• ข้ามแถวที่ไม่สมบูรณ์: ${skippedRows} แถว` : ''}`,
                'success'
            );
            
        } catch (error) {
            showMessage('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error');
        } finally {
            setProcessingState(false);
        }
    }, 100);
}

// สร้าง CSV output ในรูปแบบ UTF-8 with BOM
function createCSVOutputUTF8BOM(headers, rows) {
    let output = '';
    
    // เพิ่ม BOM สำหรับ UTF-8 with BOM (สำคัญ!)
    output += '\uFEFF'; // UTF-8 BOM
    
    // เพิ่ม header
    output += headers.join(',') + '\r\n';
    
    // เพิ่มข้อมูล
    rows.forEach(row => {
        // Escape ค่าเซลล์ถ้ามีเครื่องหมาย comma หรือ quote
        const escapedRow = row.map(cell => {
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        });
        
        output += escapedRow.join(',') + '\r\n';
    });
    
    return output;
}

// ดาวน์โหลดไฟล์ CSV
function downloadCSVFile(content) {
    // สร้างชื่อไฟล์ตามวันที่
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const fileName = `เกษตรกร_กรองแล้ว_${dateStr}_${timeStr}.csv`;
    
    // สร้าง Blob เป็น UTF-8 with BOM
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    
    // สร้างลิงก์สำหรับดาวน์โหลด
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // ล้างทรัพยากร
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
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
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('messageArea').innerHTML = '';
    currentCSVData = null;
    currentHeaders = [];
    currentRows = 0;
    currentColumns = 0;
}

// ตั้งค่าสถานะกำลังประมวลผล
function setProcessingState(isProcessing) {
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const processBtn = document.getElementById('processBtn');
    
    if (isProcessing) {
        btnText.textContent = 'กำลังกรองข้อมูล...';
        btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>';
        loadingSpinner.style.display = 'inline-block';
        processBtn.disabled = true;
    } else {
        btnText.textContent = 'เริ่มกรองข้อมูลและดาวน์โหลด';
        btnIcon.innerHTML = '<i class="fas fa-filter me-2"></i>';
        loadingSpinner.style.display = 'none';
        processBtn.disabled = false;
    }
}

// รูปแบบขนาดไฟล์
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ฟังก์ชันดาวน์โหลดไฟล์ตัวอย่าง
// ============================================

function downloadSampleFile() {
    // ข้อมูลตัวอย่าง CSV (UTF-8 with BOM)
    const sampleData = `\uFEFFรหัสนักเกษตร,ชื่อนักเกษตร,โซน,ชื่อประเภทอ้อย,พื้นที่,หมายเหตุ,วันที่บันทึก
001,สมชาย ใจดี,เหนือ,อ้อยคั้นน้ำ,15,ตัวอย่างข้อมูล,2023-10-01
002,สมหญิง เก่งดี,กลาง,อ้อยเมล็ด,20,ตัวอย่างข้อมูล,2023-10-01
003,ก้อง กล้าหาญ,ใต้,อ้อยสายน้ำผึ้ง,18,ตัวอย่างข้อมูล,2023-10-01
004,น้ำฝน ทองดี,เหนือ,อ้อยคั้นน้ำ,22,ตัวอย่างข้อมูล,2023-10-02
005,ใหญ่ ใจกว้าง,กลาง,อ้อยเมล็ด,17,ตัวอย่างข้อมูล,2023-10-02
006,เล็ก น่ารัก,ใต้,อ้อยสายน้ำผึ้ง,25,ตัวอย่างข้อมูล,2023-10-02
007,แดง กล้าหาญ,เหนือ,อ้อยคั้นน้ำ,19,ตัวอย่างข้อมูล,2023-10-03
008,ดำ ใจเย็น,กลาง,อ้อยเมล็ด,21,ตัวอย่างข้อมูล,2023-10-03
009,ขาว สะอาด,ใต้,อ้อยสายน้ำผึ้ง,16,ตัวอย่างข้อมูล,2023-10-03
010,เขียว ธรรมชาติ,เหนือ,อ้อยคั้นน้ำ,23,ตัวอย่างข้อมูล,2023-10-04`;
    
    // สร้างไฟล์สำหรับดาวน์โหลด
    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ตัวอย่าง_ข้อมูลเกษตรกร.csv';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // ล้างทรัพยากร
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
    
    showMessage(
        'ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ! ทดลองอัปโหลดไฟล์นี้เพื่อใช้งาน<br><small>ไฟล์นี้เป็นรูปแบบ UTF-8 with BOM ที่เปิดใน Excel ไทยได้ทันที</small>',
        'success'
    );
}
