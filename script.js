document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const processBtn = document.getElementById('processBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    const previewSection = document.getElementById('previewSection');
    const previewTable = document.getElementById('previewTable');
    const encodingOptions = document.getElementById('encodingOptions');
    const delimiterOptions = document.getElementById('delimiterOptions');
    
    let csvData = null;
    let headers = null;
    let filteredData = null;

    // คอลัมน์ที่ต้องการเก็บ (เหมือนในโค้ด Python)
    const COLUMNS_TO_KEEP = ["รหัสนักเกษตร", "ชื่อนักเกษตร", "โซน", "ชื่อประเภทอ้อย", "พื้นที่"];

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // รีเซ็ตสถานะ
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';
        previewSection.style.display = 'none';
        processBtn.disabled = true;
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showError('กรุณาเลือกไฟล์ CSV เท่านั้น');
            return;
        }

        // แสดงตัวเลือก encoding และ delimiter
        encodingOptions.style.display = 'block';
        delimiterOptions.style.display = 'block';
        
        // อ่านไฟล์ด้วย encoding เริ่มต้น
        readFileWithEncoding(file, 'utf-8');
    });

    // เมื่อเลือก encoding ใหม่
    document.getElementById('encodingSelect').addEventListener('change', function() {
        if (!fileInput.files[0]) return;
        readFileWithEncoding(fileInput.files[0], this.value);
    });

    // เมื่อเลือก delimiter ใหม่
    document.getElementById('delimiterSelect').addEventListener('change', function() {
        if (!csvData) return;
        parseCSVData(csvData, this.value);
    });

    function readFileWithEncoding(file, encoding) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                csvData = e.target.result;
                const delimiter = document.getElementById('delimiterSelect').value;
                parseCSVData(csvData, delimiter);
            } catch (error) {
                showError('ไม่สามารถอ่านไฟล์ได้: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            showError('ไม่สามารถอ่านไฟล์ได้');
        };
        
        // อ่านไฟล์ตาม encoding ที่เลือก
        if (encoding === 'utf-8-sig' || encoding === 'utf-8') {
            reader.readAsText(file, 'UTF-8');
        } else {
            // สำหรับ encoding อื่นๆ ใช้ TextDecoder
            reader.readAsArrayBuffer(file);
            reader.onload = function(e) {
                try {
                    const decoder = new TextDecoder(encoding);
                    csvData = decoder.decode(e.target.result);
                    const delimiter = document.getElementById('delimiterSelect').value;
                    parseCSVData(csvData, delimiter);
                } catch (error) {
                    showError('ไม่สามารถอ่านไฟล์ได้: ' + error.message);
                }
            };
        }
    }

    function parseCSVData(data, delimiter) {
        try {
            // แปลง delimiter จาก string
            const actualDelimiter = delimiter === '\\t' ? '\t' : delimiter;
            
            // แยกบรรทัด
            const lines = data.split(/\r\n|\n/);
            if (lines.length < 2) {
                showError('ไฟล์ CSV ไม่มีข้อมูล');
                return;
            }

            // หา headers
            headers = lines[0].split(actualDelimiter);
            
            // ตรวจสอบว่ามีคอลัมน์ที่ต้องการหรือไม่
            const hasRequiredColumns = COLUMNS_TO_KEEP.some(col => 
                headers.some(header => header.trim() === col)
            );
            
            if (!hasRequiredColumns) {
                showError('ไม่พบคอลัมน์ที่ต้องการในไฟล์ CSV');
                return;
            }

            // แสดงตัวอย่างข้อมูล
            showPreview(lines, actualDelimiter);
            processBtn.disabled = false;
            successAlert.style.display = 'block';
            successAlert.textContent = `✓ โหลดไฟล์สำเร็จ: พบ ${lines.length-1} แถวข้อมูล`;
            
        } catch (error) {
            showError('ไม่สามารถแยกข้อมูล CSV: ' + error.message);
        }
    }

    function showPreview(lines, delimiter) {
        // สร้างตาราง HTML
        let tableHTML = '<table class="table table-striped table-sm">';
        
        // หาคอลัมน์ที่ต้องการ
        const columnIndices = [];
        const filteredHeaders = [];
        
        for (let i = 0; i < headers.length; i++) {
            if (COLUMNS_TO_KEEP.includes(headers[i].trim())) {
                columnIndices.push(i);
                filteredHeaders.push(headers[i].trim());
            }
        }
        
        // สร้าง header ของตาราง
        tableHTML += '<thead><tr>';
        filteredHeaders.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // สร้าง body ของตาราง (แสดงแค่ 5 แถวแรก)
        tableHTML += '<tbody>';
        for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
            if (!lines[i].trim()) continue;
            
            const cells = lines[i].split(delimiter);
            tableHTML += '<tr>';
            
            columnIndices.forEach(index => {
                if (index < cells.length) {
                    tableHTML += `<td>${cells[index].trim()}</td>`;
                } else {
                    tableHTML += '<td></td>';
                }
            });
            
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';
        
        previewTable.innerHTML = tableHTML;
        previewSection.style.display = 'block';
    }

    // เมื่อกดปุ่มประมวลผล
    processBtn.addEventListener('click', function() {
        if (!csvData) {
            showError('กรุณาเลือกไฟล์ก่อน');
            return;
        }

        // แสดง loading
        btnText.textContent = 'กำลังประมวลผล...';
        loadingSpinner.style.display = 'inline-block';
        processBtn.disabled = true;

        // รอสักครู่เพื่อแสดงผลลัพธ์
        setTimeout(processCSV, 500);
    });

    function processCSV() {
        try {
            const delimiter = document.getElementById('delimiterSelect').value;
            const actualDelimiter = delimiter === '\\t' ? '\t' : delimiter;
            
            const lines = csvData.split(/\r\n|\n/);
            const headers = lines[0].split(actualDelimiter);
            
            // หาดัชนีของคอลัมน์ที่ต้องการ
            const columnIndices = [];
            const filteredHeaders = [];
            
            for (let i = 0; i < headers.length; i++) {
                if (COLUMNS_TO_KEEP.includes(headers[i].trim())) {
                    columnIndices.push(i);
                    filteredHeaders.push(headers[i].trim());
                }
            }
            
            // กรองข้อมูล
            const filteredRows = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const cells = lines[i].split(actualDelimiter);
                const filteredCells = [];
                
                columnIndices.forEach(index => {
                    if (index < cells.length) {
                        filteredCells.push(cells[index].trim());
                    } else {
                        filteredCells.push('');
                    }
                });
                
                filteredRows.push(filteredCells);
            }
            
            // สร้าง CSV ใหม่
            let outputCSV = filteredHeaders.join(',') + '\n';
            filteredRows.forEach(row => {
                outputCSV += row.join(',') + '\n';
            });
            
            // สร้างไฟล์สำหรับดาวน์โหลด
            const blob = new Blob([outputCSV], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'result.csv');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // แสดงผลสำเร็จ
            btnText.textContent = 'เริ่มกรองข้อมูล';
            loadingSpinner.style.display = 'none';
            processBtn.disabled = false;
            
            successAlert.style.display = 'block';
            successAlert.innerHTML = `
                ✓ บันทึกไฟล์ result.csv สำเร็จ<br>
                ✓ คอลัมน์: ${filteredHeaders.join(', ')}<br>
                ✓ จำนวนแถว: ${filteredRows.length}
            `;
            
        } catch (error) {
            showError('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message);
            btnText.textContent = 'เริ่มกรองข้อมูล';
            loadingSpinner.style.display = 'none';
            processBtn.disabled = false;
        }
    }

    function showError(message) {
        errorAlert.textContent = '❌ ' + message;
        errorAlert.style.display = 'block';
        processBtn.disabled = true;
    }
});
