// CSV Filter App - Pastel Blue Theme (แสดงผลบนหน้าเว็บ)
// สำหรับเกษตรกรอ้อย - แสดงเฉพาะคอลัมน์ที่ต้องการบนหน้าเว็บ

// คอลัมน์ที่ต้องการเก็บ
const COLUMNS_TO_KEEP = ["รหัสนักเกษตร", "ชื่อนักเกษตร", "โซน", "ชื่อประเภทอ้อย", "พื้นที่"];

// ตัวแปร global
let currentCSVData = null;
let currentHeaders = [];
let filteredData = [];
let currentRows = 0;

// เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ฟังก์ชันเริ่มต้นแอป
function initApp() {
    console.log('CSV Filter App เริ่มต้นแล้ว - แสดงผลบนหน้าเว็บ');
    
    // อ้างอิงถึง DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('csvFile');
    const filterBtn = document.getElementById('filterBtn');
    const inputEncoding = document.getElementById('inputEncoding');
    const delimiterSelect = document.getElementById('delimiter');
    
    // ตั้งค่า Drag & Drop
    setupDragAndDrop(dropArea, fileInput);
    
    // เมื่อเลือกไฟล์
    fileInput.addEventListener('change', handleFileSelect);
    
    // เมื่อคลิกปุ่มกรองข้อมูล
    filterBtn.addEventListener('click', processAndDisplayCSV);
    
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
    fileStatus.textContent = 'พร้อมกรองข้อมูล';
    fileStatus.style.background = 'linear-gradient(135deg, #5D9CEC, #81D4FA)';
    
    // แสดงการตั้งค่า
    document.getElementById('settingsPanel').style.display = 'block';
    document.getElementById('resultCard').style.display = 'block';
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
            document.getElementById('fileStatus').textContent = 'พร้อมกรองข้อมูล';
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
        
        // แสดงข้อความสำเร็จ
        const dataRows = lines.length - headerLineIndex - 1;
        currentRows = dataRows;
        
        const foundColumns = COLUMNS_TO_KEEP.filter(col => headers.includes(col)).length;
        
        if (foundColumns === COLUMNS_TO_KEEP.length) {
            showMessage(`✓ โหลดไฟล์สำเร็จ: พบ ${dataRows} แถว, ${headers.length} คอลัมน์, พบคอลัมน์ที่ต้องการครบถ้วน`, 'success');
        } else if (foundColumns > 0) {
            showMessage(`✓ โหลดไฟล์สำเร็จ: พบ ${dataRows} แถว, ${headers.length} คอลัมน์, พบคอลัมน์ที่ต้องการ ${foundColumns}/${COLUMNS_TO_KEEP.length} คอลัมน์`, 'warning');
        } else {
            showMessage(`✓ โหลดไฟล์สำเร็จ: พบ ${dataRows} แถว, ${headers.length} คอลัมน์, ไม่พบคอลัมน์ที่ต้องการในไฟล์นี้`, 'warning');
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
// ฟังก์ชันกรองและแสดงข้อมูล CSV
// ============================================

function processAndDisplayCSV() {
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
            showMessage('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error');
        } finally {
            setProcessingState(false);
        }
    }, 100);
}

// แสดงผลลัพธ์ที่กรองแล้ว
function displayFilteredResults(headers, data, originalColumnCount, skippedRows) {
    // แสดงสรุปผล
    const resultSummary = document.getElementById('resultSummary');
    const totalRows = document.getElementById('totalRows');
    const filteredColumns = document.getElementById('filteredColumns');
    const originalColumns = document.getElementById('originalColumns');
    const fileEncoding = document.getElementById('fileEncoding');
    
    totalRows.textContent = data.length;
    filteredColumns.textContent = headers.length;
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
    
    // เพิ่มสีสลับแถว
    const tableRows = resultTable.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        if (index % 2 === 0) {
            row.style.backgroundColor = 'rgba(179, 229, 252, 0.05)';
        }
    });
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
    document.getElementById('resultSummary').style.display = 'none';
    document.getElementById('resultTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    currentCSVData = null;
    currentHeaders = [];
    filteredData = [];
    currentRows = 0;
}

// ตั้งค่าสถานะกำลังประมวลผล
function setProcessingState(isProcessing) {
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const filterBtn = document.getElementById('filterBtn');
    
    if (isProcessing) {
        btnText.textContent = 'กำลังกรองข้อมูล...';
        btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>';
        loadingSpinner.style.display = 'inline-block';
        filterBtn.disabled = true;
    } else {
        btnText.textContent = 'กรองข้อมูลและแสดงผล';
        btnIcon.innerHTML = '<i class="fas fa-filter me-2"></i>';
        loadingSpinner.style.display = 'none';
        filterBtn.disabled = false;
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
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ฟังก์ชันเพิ่มเติม
// ============================================

// แสดงตัวอย่างข้อมูลเมื่อเปลี่ยน delimiter หรือ encoding
document.getElementById('delimiter').addEventListener('change', function() {
    if (currentCSVData && filteredData.length > 0) {
        // ถ้ามีข้อมูลที่กรองแล้ว ให้กรองใหม่
        processAndDisplayCSV();
    }
});

document.getElementById('inputEncoding').addEventListener('change', function() {
    const fileInput = document.getElementById('csvFile');
    if (fileInput.files.length > 0) {
        // อ่านไฟล์ใหม่ด้วย encoding ใหม่
        readFile(fileInput.files[0]);
    }
});
