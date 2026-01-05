// CSV Filter App - แก้ไขปัญหาอัปโหลดไฟล์

// ตัวแปร global
let currentCSVData = null;
let currentHeaders = [];
let filteredData = [];
let filteredHeaders = [];
let totalRows = 0;
let totalColumns = 0;
let selectedColumns = new Set();
let allColumns = [];

// เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    console.log('CSV Filter App เริ่มต้นแล้ว');
    
    // อ้างอิงถึง DOM elements
    const csvFileInput = document.getElementById('csvFileInput');
    const readFileBtn = document.getElementById('readFileBtn');
    const showPreviewBtn = document.getElementById('showPreviewBtn');
    const filterBtn = document.getElementById('filterBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    const backToColumnsBtn = document.getElementById('backToColumnsBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const columnSearch = document.getElementById('columnSearch');
    
    // เมื่อเลือกไฟล์
    csvFileInput.addEventListener('change', handleFileSelect);
    
    // เมื่อคลิกปุ่มอ่านไฟล์
    readFileBtn.addEventListener('click', readSelectedFile);
    
    // เมื่อคลิกปุ่มดูข้อมูลตัวอย่าง
    showPreviewBtn.addEventListener('click', showPreviewWithSelectedColumns);
    
    // เมื่อคลิกปุ่มกรองข้อมูล
    filterBtn.addEventListener('click', processAndDisplayCSV);
    
    // เมื่อคลิกปุ่มคัดลอกข้อมูล
    copyBtn.addEventListener('click', copyFilteredData);
    
    // เมื่อคลิกปุ่มดาวน์โหลด
    downloadBtn.addEventListener('click', downloadFilteredCSV);
    
    // เมื่อคลิกปุ่มไฟล์ใหม่
    newFileBtn.addEventListener('click', resetToNewFile);
    
    // เมื่อคลิกปุ่มกลับไปเลือกคอลัมน์
    backToColumnsBtn.addEventListener('click', goBackToColumnSelection);
    
    // เมื่อคลิกปุ่มเลือกทั้งหมด
    selectAllBtn.addEventListener('click', selectAllColumns);
    
    // เมื่อคลิกปุ่มไม่เลือกทั้งหมด
    deselectAllBtn.addEventListener('click', deselectAllColumns);
    
    // เมื่อค้นหาคอลัมน์
    columnSearch.addEventListener('input', filterColumnList);
    
    // ตั้งค่า Drag & Drop
    setupDragAndDrop();
    
    console.log('แอปพร้อมใช้งานแล้ว');
});

// ============================================
// ฟังก์ชันจัดการเมื่อเลือกไฟล์ (แก้ไขให้ง่าย)
// ============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('ไฟล์ที่เลือก:', file.name, 'ขนาด:', formatFileSize(file.size));
    
    // รีเซ็ตสถานะก่อน
    resetUI();
    
    // ตรวจสอบว่าเป็นไฟล์ CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('กรุณาเลือกไฟล์ CSV เท่านั้น (.csv)', 'error');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showMessage(`ไฟล์ขนาดใหญ่เกินไป (${formatFileSize(file.size)}) กรุณาเลือกไฟล์ที่เล็กกว่า 100MB`, 'error');
        return;
    }
    
    // แสดงข้อมูลไฟล์
    showFileInfo(file);
    
    // แสดงการ์ดตั้งค่า
    document.getElementById('settingsCard').style.display = 'block';
    
    // แสดงข้อความสำเร็จ
    showMessage(`เลือกไฟล์สำเร็จ: ${file.name} (${formatFileSize(file.size)})`, 'success');
}

// อ่านไฟล์ที่เลือก
function readSelectedFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('กรุณาเลือกไฟล์ก่อน', 'error');
        return;
    }
    
    // อ่านไฟล์
    readFile(file);
}

// อ่านไฟล์ CSV
function readFile(file) {
    const encoding = document.getElementById('inputEncoding').value;
    
    // แสดงสถานะ
    document.getElementById('fileStatus').textContent = 'กำลังอ่านไฟล์...';
    document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #FF9800, #FFB74D)';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let content = e.target.result;
            
            console.log('กำลังอ่านไฟล์ด้วย encoding:', encoding);
            
            // พยายาม decode ใหม่ถ้า encoding ไม่ตรง
            if (encoding !== 'utf-8' && encoding !== 'utf-8-sig') {
                try {
                    // สำหรับ encoding อื่นๆ
                    const decoder = new TextDecoder(encoding);
                    content = decoder.decode(e.target.result);
                } catch (decodeError) {
                    console.warn('Cannot decode with', encoding, 'trying UTF-8');
                    showMessage(`ไม่สามารถอ่านไฟล์ด้วย ${encoding} ลองใช้ UTF-8 แทน`, 'warning');
                    
                    // ลองใช้ UTF-8
                    const decoder = new TextDecoder('utf-8');
                    content = decoder.decode(e.target.result);
                }
            }
            
            currentCSVData = content;
            
            // แยกและแสดงคอลัมน์
            parseAndShowColumns();
            
            // อัปเดตสถานะไฟล์
            document.getElementById('fileStatus').textContent = 'อ่านไฟล์สำเร็จ';
            document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            
            // แสดงข้อความสำเร็จ
            showMessage(`อ่านไฟล์สำเร็จ: พบ ${totalRows} แถว, ${totalColumns} คอลัมน์`, 'success');
            
        } catch (error) {
            console.error('Error reading file:', error);
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
    console.log('กำลังอ่านไฟล์...');
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
    const fileInput = document.getElementById('csvFileInput');
    
    // ป้องกันพฤติกรรม default
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
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
// ฟังก์ชันแยกและแสดงคอลัมน์
// ============================================

function parseAndShowColumns() {
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
        allColumns = headers;
        totalColumns = headers.length;
        totalRows = lines.length - headerLineIndex - 1;
        
        // เลือกคอลัมน์ทั้งหมดโดย default
        selectedColumns = new Set(headers);
        
        // แสดงการ์ดเลือกคอลัมน์
        document.getElementById('columnSelectionCard').style.display = 'block';
        
        // สร้างรายการคอลัมน์
        createColumnList(headers);
        
        // อัปเดตจำนวนคอลัมน์ที่เลือก
        updateSelectedCount();
        
    } catch (error) {
        console.error('Error parsing columns:', error);
        showMessage('ไม่สามารถแสดงคอลัมน์: ' + error.message, 'error');
    }
}

// ============================================
// ฟังก์ชันสร้างรายการคอลัมน์
// ============================================

function createColumnList(headers) {
    const columnList = document.getElementById('columnList');
    columnList.innerHTML = '';
    
    headers.forEach((header, index) => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.dataset.columnName = header;
        
        columnItem.innerHTML = `
            <input type="checkbox" class="column-checkbox" id="col_${index}" 
                   data-column="${header}" ${selectedColumns.has(header) ? 'checked' : ''}>
            <span class="column-index">${index + 1}</span>
            <span class="column-name">${escapeHtml(header)}</span>
        `;
        
        // เพิ่ม event listener สำหรับ checkbox
        const checkbox = columnItem.querySelector('.column-checkbox');
        checkbox.addEventListener('change', function() {
            const columnName = this.dataset.column;
            if (this.checked) {
                selectedColumns.add(columnName);
            } else {
                selectedColumns.delete(columnName);
            }
            
            // อัปเดต UI
            updateSelectedCount();
            if (this.checked) {
                columnItem.classList.add('selected');
            } else {
                columnItem.classList.remove('selected');
            }
        });
        
        // เพิ่ม selected class ถ้าเลือก
        if (selectedColumns.has(header)) {
            columnItem.classList.add('selected');
        }
        
        columnList.appendChild(columnItem);
    });
}

// กรองรายการคอลัมน์
function filterColumnList() {
    const searchTerm = document.getElementById('columnSearch').value.toLowerCase();
    const columnItems = document.querySelectorAll('.column-item');
    
    columnItems.forEach(item => {
        const columnName = item.dataset.columnName.toLowerCase();
        if (columnName.includes(searchTerm) || searchTerm === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// อัปเดตจำนวนคอลัมน์ที่เลือก
function updateSelectedCount() {
    const selectedCount = document.getElementById('selectedCount');
    selectedCount.textContent = selectedColumns.size;
}

// เลือกคอลัมน์ทั้งหมด
function selectAllColumns() {
    selectedColumns = new Set(allColumns);
    
    // อัปเดต checkbox ทั้งหมด
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        checkbox.checked = true;
        const columnItem = checkbox.closest('.column-item');
        columnItem.classList.add('selected');
    });
    
    updateSelectedCount();
    showMessage('เลือกคอลัมน์ทั้งหมดสำเร็จ', 'success');
}

// ไม่เลือกคอลัมน์ทั้งหมด
function deselectAllColumns() {
    selectedColumns.clear();
    
    // อัปเดต checkbox ทั้งหมด
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        const columnItem = checkbox.closest('.column-item');
        columnItem.classList.remove('selected');
    });
    
    updateSelectedCount();
    showMessage('ยกเลิกการเลือกคอลัมน์ทั้งหมด', 'warning');
}

// ============================================
// ฟังก์ชันแสดงข้อมูลตัวอย่าง
// ============================================

function showPreviewWithSelectedColumns() {
    if (selectedColumns.size === 0) {
        showMessage('กรุณาเลือกอย่างน้อย 1 คอลัมน์', 'error');
        return;
    }
    
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
        
        // แสดงการ์ดตัวอย่าง
        document.getElementById('previewCard').style.display = 'block';
        
        // อัปเดตสรุปข้อมูล
        document.getElementById('totalRowsPreview').textContent = formatNumber(totalRows);
        document.getElementById('totalColsPreview').textContent = totalColumns;
        document.getElementById('selectedColsPreview').textContent = selectedColumns.size;
        document.getElementById('fileEncodingPreview').textContent = 
            document.getElementById('inputEncoding').options[document.getElementById('inputEncoding').selectedIndex].text;
        
        // สร้าง array ของคอลัมน์ที่เลือก
        const selectedColumnsArray = Array.from(selectedColumns);
        
        // หาดัชนีของคอลัมน์ที่เลือก
        const columnIndices = [];
        selectedColumnsArray.forEach(col => {
            const index = headers.indexOf(col);
            if (index !== -1) {
                columnIndices.push(index);
            }
        });
        
        // สร้างตารางตัวอย่าง (แสดงแค่ 10 แถวแรก)
        let tableHTML = '<table class="preview-table">';
        
        // Header
        tableHTML += '<thead><tr>';
        selectedColumnsArray.forEach(header => {
            tableHTML += `<th>${escapeHtml(header)}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Data (แสดงแค่ 10 แถวแรก)
        tableHTML += '<tbody>';
        const previewRows = Math.min(10, lines.length - headerLineIndex - 1);
        let displayedRows = 0;
        
        for (let i = 1; i <= previewRows + 5; i++) {
            const lineIndex = headerLineIndex + i;
            if (!lines[lineIndex] || !lines[lineIndex].trim()) continue;
            
            const cells = lines[lineIndex].split(delimiter);
            
            tableHTML += '<tr>';
            columnIndices.forEach(index => {
                let cellValue = '';
                if (index < cells.length) {
                    cellValue = cells[index].trim();
                }
                tableHTML += `<td>${escapeHtml(cellValue)}</td>`;
            });
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
        
        // แสดงข้อความสำเร็จ
        showMessage(
            `✓ เลือกคอลัมน์แล้ว ${selectedColumns.size} คอลัมน์<br>
             ✓ พร้อมกรองข้อมูล ${formatNumber(totalRows)} แถว`,
            'success'
        );
        
    } catch (error) {
        console.error('Error showing preview:', error);
        showMessage('ไม่สามารถแสดงข้อมูลตัวอย่าง: ' + error.message, 'error');
    }
}

// ============================================
// ฟังก์ชันกรองและแสดงข้อมูล CSV
// ============================================

function processAndDisplayCSV() {
    if (selectedColumns.size === 0) {
        showMessage('กรุณาเลือกอย่างน้อย 1 คอลัมน์', 'error');
        return;
    }
    
    if (!currentCSVData) {
        showMessage('กรุณาเลือกไฟล์ CSV ก่อน', 'error');
        return;
    }
    
    // แสดงสถานะกำลังประมวลผล
    setProcessingState(true, 'filterBtn');
    
    // ใช้ setTimeout เพื่อไม่ให้ block UI
    setTimeout(() => {
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
            
            // สร้าง array ของคอลัมน์ที่เลือก
            filteredHeaders = Array.from(selectedColumns);
            
            // หาดัชนีของคอลัมน์ที่เลือก
            const columnIndices = [];
            filteredHeaders.forEach(col => {
                const index = headers.indexOf(col);
                if (index !== -1) {
                    columnIndices.push(index);
                }
            });
            
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
                • จำนวนแถวที่กรอง: ${formatNumber(filteredData.length)} แถว<br>
                • คอลัมน์ที่เลือก: ${filteredHeaders.length} คอลัมน์<br>
                ${skippedRows > 0 ? `• ข้ามแถวที่ไม่สมบูรณ์: ${formatNumber(skippedRows)} แถว` : ''}`,
                'success'
            );
            
        } catch (error) {
            console.error('Error processing CSV:', error);
            showMessage('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error');
        } finally {
            setProcessingState(false, 'filterBtn');
        }
    }, 50);
}

// ============================================
// ฟังก์ชันยูทิลิตี้
// ============================================

// แสดงข้อมูลไฟล์
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    fileInfo.style.display = 'flex';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
}

// หา delimiter ที่ใช้ในไฟล์
function getDelimiter() {
    const delimiterValue = document.getElementById('delimiter').value;
    return delimiterValue === '\\t' ? '\t' : delimiterValue;
}

// กลับไปเลือกคอลัมน์
function goBackToColumnSelection() {
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('columnSelectionCard').style.display = 'block';
}

// รีเซ็ตเพื่อไฟล์ใหม่
function resetToNewFile() {
    resetUI();
    document.getElementById('csvFileInput').value = '';
    showMessage('พร้อมสำหรับไฟล์ใหม่', 'info');
}

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
    document.getElementById('settingsCard').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('columnSelectionCard').style.display = 'none';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('resultTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'none';
    
    const previewTable = document.getElementById('previewTable');
    const previewNoData = document.getElementById('previewNoData');
    previewTable.innerHTML = '';
    previewNoData.style.display = 'block';
    
    // รีเซ็ตตัวแปร
    currentCSVData = null;
    currentHeaders = [];
    filteredData = [];
    filteredHeaders = [];
    selectedColumns.clear();
    allColumns = [];
    totalRows = 0;
    totalColumns = 0;
    
    // รีเซ็ต search box
    document.getElementById('columnSearch').value = '';
}

// ตั้งค่าสถานะกำลังประมวลผล
function setProcessingState(isProcessing, buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isProcessing) {
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span>กำลังประมวลผล...`;
    } else {
        button.disabled = false;
        if (buttonId === 'filterBtn') {
            button.innerHTML = `<i class="fas fa-filter me-2"></i>กรองข้อมูลและดาวน์โหลด`;
        }
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

// รูปแบบตัวเลข (เพิ่ม comma)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Escape HTML
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ฟังก์ชันแสดงผลลัพธ์
// ============================================

function displayFilteredResults(headers, data, originalColumnCount, skippedRows) {
    // แสดงการ์ดผลลัพธ์
    document.getElementById('resultCard').style.display = 'block';
    
    // อัปเดตสรุปผล
    document.getElementById('totalRowsResult').textContent = formatNumber(data.length);
    document.getElementById('filteredColumnsResult').textContent = headers.length;
    document.getElementById('originalColumnsResult').textContent = originalColumnCount;
    document.getElementById('fileEncodingResult').textContent = 
        document.getElementById('inputEncoding').options[document.getElementById('inputEncoding').selectedIndex].text;
    
    // สร้างตาราง HTML
    let tableHTML = '<table class="table table-hover">';
    
    // Header
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${escapeHtml(header)}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Data (แสดงแค่ 100 แถวแรกถ้ามีมาก)
    tableHTML += '<tbody>';
    const displayRows = Math.min(100, data.length);
    
    if (data.length === 0) {
        tableHTML += `<tr><td colspan="${headers.length}" class="text-center text-muted py-4">
            <i class="fas fa-exclamation-circle me-2"></i>ไม่พบข้อมูลที่กรองได้
        </td></tr>`;
    } else {
        for (let i = 0; i < displayRows; i++) {
            const row = data[i];
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${escapeHtml(cell)}</td>`;
            });
            tableHTML += '</tr>';
        }
        
        // ถ้ามีข้อมูลมากกว่าแสดงแค่บางส่วน
        if (data.length > displayRows) {
            tableHTML += `<tr><td colspan="${headers.length}" class="text-center text-muted py-3">
                <i class="fas fa-info-circle me-2"></i>
                แสดง ${displayRows} จาก ${formatNumber(data.length)} แถว
            </td></tr>`;
        }
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
}

// ============================================
// ฟังก์ชันดาวน์โหลดและคัดลอก
// ============================================

function copyFilteredData() {
    if (filteredData.length === 0) {
        showMessage('ไม่มีข้อมูลที่จะคัดลอก', 'error');
        return;
    }
    
    try {
        // สร้างข้อความ CSV (เฉพาะ 1000 แถวแรกถ้ามีข้อมูลมาก)
        const dataToCopy = filteredData.length > 1000 ? filteredData.slice(0, 1000) : filteredData;
        
        let csvText = filteredHeaders.join(',') + '\n';
        dataToCopy.forEach(row => {
            csvText += row.join(',') + '\n';
        });
        
        if (filteredData.length > 1000) {
            csvText += `\n...และอีก ${formatNumber(filteredData.length - 1000)} แถว`;
        }
        
        // คัดลอกไปยัง clipboard
        navigator.clipboard.writeText(csvText).then(() => {
            showMessage(`คัดลอกข้อมูลสำเร็จ! (${dataToCopy.length} แถว)`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showMessage('ไม่สามารถคัดลอกข้อมูลได้', 'error');
        });
        
    } catch (error) {
        console.error('Error copying data:', error);
        showMessage('เกิดข้อผิดพลาดในการคัดลอกข้อมูล', 'error');
    }
}

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
        const timeStr = now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0');
        a.href = url;
        a.download = `CSV_กรองแล้ว_${dateStr}_${timeStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // ล้าง URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showMessage(`ดาวน์โหลดไฟล์ CSV สำเร็จ! (${formatNumber(filteredData.length)} แถว)`, 'success');
        
    } catch (error) {
        console.error('Error downloading CSV:', error);
        showMessage('เกิดข้อผิดพลาดในการดาวน์โหลด: ' + error.message, 'error');
    }
}
