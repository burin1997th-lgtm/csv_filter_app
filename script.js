// CSV Filter App - เพิ่มฟีเจอร์เลือกคอลัมน์เองได้

// ตัวแปร global
let currentCSVData = null;
let currentHeaders = [];
let currentFileData = null;
let filteredData = [];
let filteredHeaders = [];
let totalRows = 0;
let totalColumns = 0;
let selectedColumns = new Set(); // เก็บคอลัมน์ที่เลือก
let allColumns = []; // เก็บคอลัมน์ทั้งหมด

// เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ฟังก์ชันเริ่มต้นแอป
function initApp() {
    console.log('CSV Filter App เริ่มต้นแล้ว - เลือกคอลัมน์เองได้');
    
    // อ้างอิงถึง DOM elements
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInput = document.getElementById('csvFile');
    const previewBtn = document.getElementById('previewBtn');
    const showPreviewBtn = document.getElementById('showPreviewBtn');
    const filterBtn = document.getElementById('filterBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    const backToColumnsBtn = document.getElementById('backToColumnsBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const columnSearch = document.getElementById('columnSearch');
    const inputEncoding = document.getElementById('inputEncoding');
    const delimiterSelect = document.getElementById('delimiter');
    
    // เมื่อคลิกปุ่มเลือกไฟล์
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // เมื่อเลือกไฟล์
    fileInput.addEventListener('change', handleFileSelect);
    
    // เมื่อคลิกปุ่มดูคอลัมน์ทั้งหมด
    previewBtn.addEventListener('click', showAllColumns);
    
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
    
    // เมื่อเปลี่ยน encoding หรือ delimiter
    inputEncoding.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            handleFileSelect({ target: fileInput });
        }
    });
    
    delimiterSelect.addEventListener('change', function() {
        if (currentCSVData) {
            parseAndShowColumns();
        }
    });
    
    // ตั้งค่า Drag & Drop
    setupDragAndDrop();
    
    console.log('แอปพร้อมใช้งานแล้ว - เลือกคอลัมน์เองได้');
}

// ============================================
// ฟังก์ชันจัดการเมื่อเลือกไฟล์
// ============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('ไฟล์ที่เลือก:', file.name, 'ขนาด:', formatFileSize(file.size));
    
    // รีเซ็ตสถานะ
    resetUI();
    
    // ตรวจสอบว่าเป็นไฟล์ CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('กรุณาเลือกไฟล์ CSV เท่านั้น (.csv)', 'error');
        return;
    }
    
    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 100MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
        showMessage(`ไฟล์ขนาดใหญ่เกินไป (${formatFileSize(file.size)}) กรุณาเลือกไฟล์ที่เล็กกว่า 100MB`, 'error');
        return;
    }
    
    // แสดงข้อมูลไฟล์
    showFileInfo(file);
    
    // อ่านไฟล์ด้วย Progress
    readFileWithProgress(file);
}

// อ่านไฟล์ CSV แสดง Progress
function readFileWithProgress(file) {
    const encoding = document.getElementById('inputEncoding').value;
    
    // แสดง progress bar
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const speedText = document.getElementById('speedText');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    speedText.textContent = '';
    
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    
    const reader = new FileReader();
    
    reader.onprogress = function(e) {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            progressBar.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
            
            // คำนวณความเร็ว
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // เป็นวินาที
            if (timeDiff >= 1) {
                const loadedDiff = e.loaded - lastLoaded;
                const speed = loadedDiff / timeDiff; // bytes per second
                speedText.textContent = formatFileSize(speed) + '/วินาที';
                lastLoaded = e.loaded;
                lastTime = currentTime;
            }
        }
    };
    
    reader.onload = function(e) {
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        
        try {
            let content = e.target.result;
            
            console.log('อ่านไฟล์สำเร็จใน', totalTime.toFixed(2), 'วินาที');
            
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
            
            // ซ่อน progress bar
            progressContainer.style.display = 'none';
            
            // แสดงการตั้งค่า
            document.getElementById('settingsPanel').style.display = 'block';
            
            // แสดงข้อความสำเร็จ
            showMessage(`✓ โหลดไฟล์สำเร็จ: ${file.name} (${formatFileSize(file.size)})`, 'success');
            
            // อัปเดตสถานะไฟล์
            document.getElementById('fileStatus').textContent = 'พร้อมเลือกคอลัมน์';
            document.getElementById('fileStatus').style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            
        } catch (error) {
            console.error('Error reading file:', error);
            showMessage('ไม่สามารถอ่านไฟล์ได้: ' + error.message, 'error');
            progressContainer.style.display = 'none';
        }
    };
    
    reader.onerror = function() {
        showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
        progressContainer.style.display = 'none';
    };
    
    // อ่านไฟล์ตาม encoding
    console.log('กำลังอ่านไฟล์ด้วย encoding:', encoding);
    if (encoding === 'utf-8' || encoding === 'utf-8-sig') {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// ============================================
// ฟังก์ชันแสดงคอลัมน์ทั้งหมด
// ============================================

function showAllColumns() {
    if (!currentCSVData) {
        showMessage('กรุณาเลือกไฟล์ CSV ก่อน', 'error');
        return;
    }
    
    parseAndShowColumns();
}

// แยกและแสดงคอลัมน์ทั้งหมด
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
        
        // แสดงสรุปข้อมูล
        showMessage(
            `✓ พบคอลัมน์ทั้งหมด ${totalColumns} คอลัมน์<br>
             ✓ จำนวนแถวทั้งหมด: ${formatNumber(totalRows)} แถว`,
            'success'
        );
        
    } catch (error) {
        console.error('Error parsing columns:', error);
        showMessage('ไม่สามารถแสดงคอลัมน์: ' + error.message, 'error');
    }
}

// สร้างรายการคอลัมน์
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
            <span class="column-index">คอลัมน์ ${index + 1}</span>
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
            
            // สำหรับไฟล์ใหญ่ (> 50,000 แถว) ให้แสดงความคืบหน้า
            const totalRowsToProcess = lines.length - headerLineIndex - 1;
            const showProgress = totalRowsToProcess > 50000;
            
            if (showProgress) {
                showMessage(`กำลังกรองข้อมูล... (0/${formatNumber(totalRowsToProcess)} แถว)`, 'info');
            }
            
            // กรองข้อมูลทั้งหมด
            filteredData = [];
            let processedRows = 0;
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
                processedRows++;
                
                // อัปเดตความคืบหน้าทุก 1000 แถว
                if (showProgress && processedRows % 1000 === 0) {
                    showMessage(`กำลังกรองข้อมูล... (${formatNumber(processedRows)}/${formatNumber(totalRowsToProcess)} แถว)`, 'info');
                }
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

// แสดงผลลัพธ์ที่กรองแล้ว
function displayFilteredResults(headers, data, originalColumnCount, skippedRows) {
    // แสดงการ์ดผลลัพธ์
    document.getElementById('resultCard').style.display = 'block';
    
    // อัปเดตสรุปผล
    document.getElementById('totalRowsResult').textContent = formatNumber(data.length);
    document.getElementById('filteredColumnsResult').textContent = headers.length;
    document.getElementById('originalColumnsResult').textContent = originalColumnCount;
    document.getElementById('fileEncodingResult').textContent = 
        document.getElementById('inputEncoding').options[document.getElementById('inputEncoding').selectedIndex].text;
    
    // สำหรับไฟล์ใหญ่ (> 1000 แถว) แสดงแค่ 100 แถวแรก
    const displayRows = data.length > 1000 ? 100 : data.length;
    
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
        for (let i = 0; i < Math.min(displayRows, data.length); i++) {
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
                แสดง ${displayRows} จาก ${formatNumber(data.length)} แถว (กรองข้อมูลสำเร็จแล้ว)
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
    
    // เพิ่มสีสลับแถว
    const tableRows = resultTable.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        if (index % 2 === 0) {
            row.style.backgroundColor = 'rgba(179, 229, 252, 0.05)';
        }
    });
}

// ============================================
// ฟังก์ชันยูทิลิตี้ (เหมือนเดิม แต่เพิ่มบางส่วน)
// ============================================

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
    document.getElementById('csvFile').value = '';
    showMessage('พร้อมสำหรับไฟล์ใหม่', 'info');
}

// ตั้งค่า Drag & Drop
function setupDragAndDrop() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('csvFile');
    
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
    document.getElementById('settingsPanel').style.display = 'none';
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
// ฟังก์ชันดาวน์โหลดและคัดลอก (เหมือนเดิม)
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
            showMessage(`คัดลอกข้อมูลสำเร็จ! (${dataToCopy.length} แถว) คุณสามารถวางใน Excel หรือโปรแกรมอื่นได้`, 'success');
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
        // แสดงสถานะกำลังประมวลผล
        showMessage('กำลังเตรียมไฟล์สำหรับดาวน์โหลด...', 'info');
        
        // สร้างข้อความ CSV
        let csvText = '\uFEFF'; // UTF-8 BOM สำหรับภาษาไทย
        csvText += filteredHeaders.join(',') + '\r\n';
        
        // สำหรับไฟล์ใหญ่ให้สร้างแบบ chunk
        const CHUNK_SIZE = 50000;
        
        if (filteredData.length > CHUNK_SIZE) {
            // สร้างแบบ chunk สำหรับไฟล์ใหญ่
            const chunks = [];
            for (let i = 0; i < filteredData.length; i += CHUNK_SIZE) {
                const chunk = filteredData.slice(i, i + CHUNK_SIZE);
                const chunkText = chunk.map(row => {
                    const escapedRow = row.map(cell => {
                        if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
                            return '"' + cell.replace(/"/g, '""') + '"';
                        }
                        return cell;
                    });
                    return escapedRow.join(',');
                }).join('\r\n');
                
                chunks.push(chunkText);
            }
            
            csvText += chunks.join('\r\n');
        } else {
            // สำหรับไฟล์เล็ก
            filteredData.forEach(row => {
                const escapedRow = row.map(cell => {
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
                        return '"' + cell.replace(/"/g, '""') + '"';
                    }
                    return cell;
                });
                csvText += escapedRow.join(',') + '\r\n';
            });
        }
        
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
        a.download = `CSV_กรองแล้ว_${dateStr}_${timeStr}_${filteredHeaders.length}คอลัมน์_${formatNumber(filteredData.length)}แถว.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // ล้าง URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showMessage(`ดาวน์โหลดไฟล์ CSV สำเร็จ! (${formatNumber(filteredData.length)} แถว, ${filteredHeaders.length} คอลัมน์)`, 'success');
        
    } catch (error) {
        console.error('Error downloading CSV:', error);
        showMessage('เกิดข้อผิดพลาดในการดาวน์โหลด: ' + error.message, 'error');
    }
}
