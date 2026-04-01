/**
 * 綜合回測系統 - JavaScript 模塊
 * 包含 CSV 上傳、回測執行、結果分析和圖表繪制
 */

// ===== CSV 上傳處理 - 複製回測系統邏輯 =====
function processComprehensiveCsvUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    // 隱藏錯誤面板，顯示加載狀態
    document.getElementById('compCsvErrorPanel').style.display = 'none';
    document.getElementById('compCsvStatusPanel').style.display = 'block';
    document.getElementById('compCsvStatusIcon').textContent = '⏳';
    document.getElementById('compCsvStatusText').textContent = '正在載入檔案...';
    document.getElementById('compCsvFileName').textContent = file.name;
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // 處理 Excel 文件
        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    showComprehensiveCsvError('格式錯誤', 'Excel 文件至少需要 2 行（標題 + 資料）');
                    return;
                }
                
                window.compCsvHeaders = jsonData[0].map(h => String(h).trim());
                window.compCsvRaw = jsonData.slice(1).map(row => row.map(cell => String(cell)));
                window.csvHeaders = window.compCsvHeaders;
                // 同時設置 window.jsonData 供回測函數使用
                window.jsonData = jsonData;
                
                if (window.compCsvHeaders.length === 0) {
                    showComprehensiveCsvError('格式錯誤', '無法識別表頭欄位');
                    return;
                }
                
                // 優先顯示 Close 列（收盤價）
                const allHeaders = window.compCsvHeaders.slice(1);
                const closeColumns = allHeaders.filter(h => h.toUpperCase().includes('CLOSE'));
                const displayHeaders = closeColumns.length > 0 ? closeColumns : allHeaders;
                
                if (displayHeaders.length === 0) {
                    showComprehensiveCsvError('格式錯誤', '找不到任何有效的數據欄位');
                    return;
                }
                
                // 建立公司選擇下拉菜單
                const companySelect = document.getElementById('compCompanySelect');
                if (companySelect) {
                    companySelect.innerHTML = displayHeaders.map(h => 
                        `<option value="${h}">${getCompanyLabel(h)}</option>`
                    ).join('');
                }
                
                // 建立成交量下拉菜單
                const volumeSelect = document.getElementById('compVolumeSelect');
                if (volumeSelect) {
                    const volumeColumns = allHeaders.filter(h => h.toUpperCase().includes('VOLUME'));
                    const defaultVolume = volumeColumns.length > 0 ? volumeColumns[0] : '';
                    volumeSelect.innerHTML = 
                        volumeColumns.map(h => `<option value="${h}" ${h === defaultVolume ? 'selected' : ''}>${getCompanyLabel(h)}</option>`).join('') +
                        '<option value="">不顯示成交量</option>';
                    volumeSelect.value = defaultVolume;
                }
                
                // 顯示成功信息
                showComprehensiveCsvSuccess(file.name, window.compCsvRaw.length, window.compCsvHeaders.length, displayHeaders.length);
                console.log('✓ Excel 文件（綜合回測）載入成功\n已找到欄位:', displayHeaders);
            } catch (err) {
                showComprehensiveCsvError('Excel 解析失敗', err.message);
                console.error('Excel parsing error:', err);
            }
        };
        
        reader.onerror = function() {
            showComprehensiveCsvError('讀取失敗', '無法讀取 Excel 文件');
        };
        
        reader.readAsArrayBuffer(file);
    } else {
        // 處理 CSV 文件
        reader.onload = function(event) {
            try {
                const lines = event.target.result.trim().split("\n");
                
                if (lines.length < 2) {
                    showComprehensiveCsvError('格式錯誤', 'CSV 文件至少需要 2 行（標題 + 資料）');
                    return;
                }
                
                window.compCsvHeaders = lines[0].split(",").map(h => h.trim());
                window.compCsvRaw = lines.slice(1).map(line => line.split(","));
                window.csvHeaders = window.compCsvHeaders;
                // 同時設置 window.jsonData 供回測函數使用
                window.jsonData = [window.compCsvHeaders].concat(window.compCsvRaw);
                
                if (window.compCsvHeaders.length === 0) {
                    showComprehensiveCsvError('格式錯誤', '無法識別表頭欄位');
                    return;
                }
                
                const allHeaders = window.compCsvHeaders.slice(1);
                const closeColumns = allHeaders.filter(h => h.toUpperCase().includes('CLOSE'));
                const displayHeaders = closeColumns.length > 0 ? closeColumns : allHeaders;
                
                if (displayHeaders.length === 0) {
                    showComprehensiveCsvError('格式錯誤', '找不到任何有效的數據欄位');
                    return;
                }
                
                // 建立公司選擇下拉菜單
                const companySelect = document.getElementById('compCompanySelect');
                if (companySelect) {
                    companySelect.innerHTML = displayHeaders.map(h => `<option value="${h}">${getCompanyLabel(h)}</option>`).join('');
                }
                
                // 建立成交量下拉菜單
                const volumeSelect = document.getElementById('compVolumeSelect');
                if (volumeSelect) {
                    const volumeColumns = allHeaders.filter(h => h.toUpperCase().includes('VOLUME'));
                    const defaultVolume = volumeColumns.length > 0 ? volumeColumns[0] : '';
                    volumeSelect.innerHTML = 
                        volumeColumns.map(h => `<option value="${h}" ${h === defaultVolume ? 'selected' : ''}>${getCompanyLabel(h)}</option>`).join('') +
                        '<option value="">不顯示成交量</option>';
                    volumeSelect.value = defaultVolume;
                }
                
                // 顯示成功信息
                showComprehensiveCsvSuccess(file.name, window.compCsvRaw.length, window.compCsvHeaders.length, displayHeaders.length);
                console.log('✓ CSV 文件（綜合回測）載入成功\n資料行:', window.compCsvRaw.length, '\n欄位:', displayHeaders);
            } catch (err) {
                showComprehensiveCsvError('CSV 解析失敗', err.message);
                console.error('CSV parsing error:', err);
            }
        };
        
        reader.onerror = function() {
            showComprehensiveCsvError('讀取失敗', '無法讀取 CSV 文件');
        };
        
        reader.readAsText(file);
    }
}

// 顯示綜合回測成功信息
function showComprehensiveCsvSuccess(fileName, rowCount, colCount, companyCount) {
    document.getElementById('compCsvErrorPanel').style.display = 'none';
    document.getElementById('compCsvStatusPanel').style.display = 'block';
    document.getElementById('compCsvStatusIcon').textContent = '✅';
    document.getElementById('compCsvStatusText').textContent = '檔案載入成功';
    document.getElementById('compCsvStatusText').style.color = '#16a34a';
    document.getElementById('compCsvFileName').textContent = fileName;
    document.getElementById('compCsvRowCount').textContent = rowCount;
    document.getElementById('compCsvColCount').textContent = colCount;
    document.getElementById('compCsvCompanyCount').textContent = companyCount;
}

// 顯示綜合回測錯誤信息
function showComprehensiveCsvError(title, message) {
    document.getElementById('compCsvStatusPanel').style.display = 'none';
    document.getElementById('compCsvErrorPanel').style.display = 'block';
    document.getElementById('compCsvErrorTitle').textContent = title;
    document.getElementById('compCsvErrorMsg').textContent = message;
    // 重置文件輸入
    document.getElementById('comprehensiveCsvFile').value = '';
}

// ===== 綜合回測執行 =====
function runComprehensiveBacktest() {
    // ⭐ 讀取用戶選擇的公司
    const company = document.getElementById('compCompanySelect').value;
    if (!company) {
        alert('請選擇要回測的公司！');
        return;
    }
    
    // 讀取所有參數
    const params = {
        short_ma: parseInt(document.getElementById('compShortMA').value) || 5,
        long_ma: parseInt(document.getElementById('compLongMA').value) || 20,
        ma_type: document.getElementById('compMAType').value || 'SMA',
        rsv_n: parseInt(document.getElementById('compRSVN').value) || 9,
        kd_upper: parseFloat(document.getElementById('compKDUpper').value) || 80,
        kd_lower: parseFloat(document.getElementById('compKDLower').value) || 20,
        rsi_n: parseInt(document.getElementById('compRSIN').value) || 14,
        rsi_upper: parseFloat(document.getElementById('compRSIUpper').value) || 80,
        rsi_lower: parseFloat(document.getElementById('compRSILower').value) || 20,
        kama_n: parseInt(document.getElementById('compKAMAn').value) || 10,
        kama_fast: parseInt(document.getElementById('compKAMAFast').value) || 2,
        kama_slow: parseInt(document.getElementById('compKAMASlow').value) || 30,
        bb_period: parseInt(document.getElementById('compBBPeriod').value) || 20,
        initial_capital: parseFloat(document.getElementById('compInitialCash').value) || 10000,
        trade_fee: parseFloat(document.getElementById('compTradeFee').value) || 0.08,
        start_date: document.getElementById('compStartDate').value,
        end_date: document.getElementById('compEndDate').value
    };
    
    // 讀取勾選的策略
    const selectedStrategies = [];
    if (document.getElementById('compStrategyMA')?.checked) selectedStrategies.push('MA');
    if (document.getElementById('compStrategyKD')?.checked) selectedStrategies.push('KD');
    if (document.getElementById('compStrategyRSI')?.checked) selectedStrategies.push('RSI');
    if (document.getElementById('compStrategyMACD')?.checked) selectedStrategies.push('MACD');
    if (document.getElementById('compStrategyKAMA')?.checked) selectedStrategies.push('KAMA');
    
    // 如果沒有選擇任何策略，提示用戶
    if (selectedStrategies.length === 0) {
        alert('請至少選擇一個策略！');
        return;
    }
    
    const results = [];
    
    // 檢查是否有CSV數據
    if (!window.jsonData || window.jsonData.length === 0) {
        alert('請先加載CSV數據文件！');
        return;
    }
    
    // 日期範圍過濾
    let filteredData = window.jsonData.slice(1);  // 排除標題行
    let startIdxInOriginal = 0;  // 記錄起始日期在原始數據中的索引
    let endIdxInOriginal = window.jsonData.length - 1;
    
    if (params.start_date || params.end_date) {
        const startDate = params.start_date ? new Date(params.start_date) : null;
        const endDate = params.end_date ? new Date(params.end_date) : null;
        
        // 找出起始日期在完整數據中的位置
        startIdxInOriginal = window.jsonData.findIndex((row, idx) => {
            if (idx === 0) return false;  // 跳過標題
            const rowDate = new Date(row[0]);
            if (startDate && rowDate < startDate) return false;
            return true;
        });
        
        if (startIdxInOriginal === -1) startIdxInOriginal = 1;
        
        // 找出結束日期在完整數據中的位置
        endIdxInOriginal = window.jsonData.length - 1;
        for (let i = 1; i < window.jsonData.length; i++) {
            const rowDate = new Date(window.jsonData[i][0]);
            if (endDate && rowDate <= endDate) {
                endIdxInOriginal = i;
            }
        }
        
        console.log(`📅 日期範圍: ${params.start_date} 至 ${params.end_date}`);
        console.log(`📍 原始數據索引: 起始=${startIdxInOriginal}, 結束=${endIdxInOriginal}`);
    }
    
    // ⭐ 往前抓 MAX_PERIOD 天的歷史數據以初始化 MA
    // 必須確保拉回足夠的歷史數據，使得最長的 MA 能初始化
    // 使用 long_ma 作為最小值，確保所有參數組合都能正確計算
    const MAX_PERIOD = Math.max(256, params.long_ma + 50);
    const sliceStartIdx = Math.max(1, startIdxInOriginal - MAX_PERIOD);
    
    // 截斷數據（包含歷史數據 + 回測期間）
    const backtestDataFull = window.jsonData.slice(sliceStartIdx, endIdxInOriginal + 1);
    
    // ⭐ 動態查找用戶選擇公司所在的列索引（而不是硬編碼 row[1]）
    const companyColIdx = window.csvHeaders.indexOf(company);
    if (companyColIdx === -1) {
        alert(`找不到公司 "${company}" 的數據列`);
        return;
    }
    
    const closes = backtestDataFull.map(row => parseFloat(row[companyColIdx]) || 0);
    const dates = backtestDataFull.map(row => row[0]);
    
    // ⭐ 提取成交量數據（用於 VP/VP2 模式）
    const volumeSelect = document.getElementById('compVolumeSelect');
    const volumeColumn = volumeSelect ? volumeSelect.value : '';
    let volumes = null;
    if (volumeColumn && window.csvHeaders.includes(volumeColumn)) {
        const volumeColIdx = window.csvHeaders.indexOf(volumeColumn);
        volumes = backtestDataFull.map(row => parseFloat(row[volumeColIdx]) || 0);
        console.log(`✓ 已提取成交量數據（欄位: ${volumeColumn}），共 ${volumes.length} 條記錄`);
    } else if (volumeColumn) {
        console.log(`⚠️ 未找到成交量欄位 "${volumeColumn}"，VP/VP2 模式將僅使用價格信號`);
    }
    
    // ⭐ 計算成交量 SMA（用於 VP2 模式）
    let volumeSMA = null;
    if (volumes) {
        volumeSMA = calculateMovingAverage(volumes, params.short_ma, 'SMA');
        console.log(`✓ 已計算成交量 SMA（週期: ${params.short_ma}）`);
    }
    
    // ⭐ 計算用戶指定日期在截斷數據中的新索引
    const newStartIdx = startIdxInOriginal - sliceStartIdx;
    
    // ⭐ 不在這裡設定 validStartIdx，讓 executeRealBacktest 自己驗證
    // 傳遞 newStartIdx 給回測引擎，由引擎內部決定實際交易起始點
    
    console.log(`📊 截斷數據: 從索引 ${sliceStartIdx} 開始，包含 ${backtestDataFull.length} 行數據`);
    console.log(`📈 新起始索引: ${newStartIdx}，數據長度: ${closes.length}`);
    
    console.log('📊 綜合回測參數:', params);
    console.log('🎯 選擇的策略:', selectedStrategies);
    console.log(`📈 回測數據: ${closes.length} 條記錄，開始日期: ${dates[0]}, 結束日期: ${dates[dates.length - 1]}`);
    
    // 根據選擇的策略執行回測
    if (selectedStrategies.includes('MA')) {
        // MA 五種變體：SMA, EMA, WMA, VP, VP2
        // 根據用戶選擇的 ma_type 執行相應的模式
        const maType = params.ma_type || 'SMA';
        const maParams = {...params, ma_type: (maType === 'VP' || maType === 'VP2') ? 'SMA' : maType};
        // 對於 VP/VP2，使用 SMA 作為基礎 MA，但傳遞成交量信息
        const mode = (maType === 'VP' || maType === 'VP2') ? maType : 'SMA';
        
        if (mode === 'VP' || mode === 'VP2') {
            if (!volumes) {
                console.log(`⚠️ 選擇了 ${maType} 模式，但未提取成交量數據，將使用價格信號進行回測`);
            } else {
                console.log(`✓ ${maType} 模式：使用成交量驗證信號`);
            }
        }
        
        const signals = generateMASignals(closes, maParams, volumes, volumeSMA, mode);
        
        // ⭐ 計算 MA 用於 validStartIdx 驗證
        const shortMA = calculateMovingAverage(closes, params.short_ma, maParams.ma_type);
        const longMA = calculateMovingAverage(closes, params.long_ma, maParams.ma_type);
        
        const result = executeRealBacktest(closes, dates, signals, params, newStartIdx, shortMA, longMA);
        
        results.push({
            mode: `MA (${maType})`,
            tradeCount: result.tradeCount,
            winRate: result.winRate,
            avgWin: result.avgWin,
            avgLoss: result.avgLoss,
            profitFactor: result.profitFactor,
            profit: result.totalProfit,
            finalAsset: result.finalEquity,
            returnRate: result.returnRate,
            maxDD: result.maxDD,
            sharpeRatio: result.sharpeRatio,
            trades: result.trades,
            equityHistory: result.equityHistory
        });
    }
    
    if (selectedStrategies.includes('KD')) {
        const signals = generateKDSignals(closes, params);
        const result = executeRealBacktest(closes, dates, signals, params, newStartIdx, null, null);
        
        results.push({
            mode: 'KD 指標',
            tradeCount: result.tradeCount,
            winRate: result.winRate,
            avgWin: result.avgWin,
            avgLoss: result.avgLoss,
            profitFactor: result.profitFactor,
            profit: result.totalProfit,
            finalAsset: result.finalEquity,
            returnRate: result.returnRate,
            maxDD: result.maxDD,
            sharpeRatio: result.sharpeRatio,
            trades: result.trades,
            equityHistory: result.equityHistory
        });
    }
    
    if (selectedStrategies.includes('RSI')) {
        const signals = generateRSISignals(closes, params);
        const result = executeRealBacktest(closes, dates, signals, params, newStartIdx, null, null);
        
        results.push({
            mode: 'RSI 指標',
            tradeCount: result.tradeCount,
            winRate: result.winRate,
            avgWin: result.avgWin,
            avgLoss: result.avgLoss,
            profitFactor: result.profitFactor,
            profit: result.totalProfit,
            finalAsset: result.finalEquity,
            returnRate: result.returnRate,
            maxDD: result.maxDD,
            sharpeRatio: result.sharpeRatio,
            trades: result.trades,
            equityHistory: result.equityHistory
        });
    }
    
    if (selectedStrategies.includes('MACD')) {
        const signals = generateMACDSignals(closes, params);
        const result = executeRealBacktest(closes, dates, signals, params, newStartIdx, null, null);
        
        results.push({
            mode: 'MACD',
            tradeCount: result.tradeCount,
            winRate: result.winRate,
            avgWin: result.avgWin,
            avgLoss: result.avgLoss,
            profitFactor: result.profitFactor,
            profit: result.totalProfit,
            finalAsset: result.finalEquity,
            returnRate: result.returnRate,
            maxDD: result.maxDD,
            sharpeRatio: result.sharpeRatio,
            trades: result.trades,
            equityHistory: result.equityHistory
        });
    }
    
    // KAMA 策略 - 簡化實現
    if (selectedStrategies.includes('KAMA')) {
        // 使用 RSI 的邏輯進行簡化實現
        const signals = generateRSISignals(closes, params);
        const result = executeRealBacktest(closes, dates, signals, params);
        
        results.push({
            mode: 'KAMA',
            tradeCount: result.tradeCount,
            winRate: result.winRate,
            avgWin: result.avgWin,
            avgLoss: result.avgLoss,
            profitFactor: result.profitFactor,
            profit: result.totalProfit,
            finalAsset: result.finalEquity,
            returnRate: result.returnRate,
            maxDD: result.maxDD,
            sharpeRatio: result.sharpeRatio,
            trades: result.trades,
            equityHistory: result.equityHistory
        });
    }
    
    // 排序結果（按獲利從高到低）
    results.sort((a, b) => b.profit - a.profit);
    
    // 顯示結果
    if (results.length > 0) {
        // 計算匯總統計
        const bestResult = results[0];
        const totalAvgReturn = results.reduce((sum, r) => sum + r.returnRate, 0) / results.length;
        const totalAvgDD = results.reduce((sum, r) => sum + r.maxDD, 0) / results.length;
        
        // 更新統計卡片
        const totalReturnEl = document.getElementById('compTotalReturn');
        const finalEquityEl = document.getElementById('compFinalEquity');
        const tradeCountEl = document.getElementById('compTradeCount');
        const maxDrawdownEl = document.getElementById('compMaxDrawdown');
        const winRateEl = document.getElementById('compWinRate');
        const sharpeRatioEl = document.getElementById('compSharpeRatio');
        
        if (totalReturnEl) totalReturnEl.textContent = bestResult.returnRate.toFixed(2) + '%';
        if (finalEquityEl) finalEquityEl.textContent = '$' + formatCurrency(bestResult.finalAsset);
        if (tradeCountEl) tradeCountEl.textContent = bestResult.tradeCount;
        if (maxDrawdownEl) maxDrawdownEl.textContent = '-' + bestResult.maxDD.toFixed(2) + '%';
        if (winRateEl) winRateEl.textContent = bestResult.winRate.toFixed(2) + '%';
        if (sharpeRatioEl) sharpeRatioEl.textContent = bestResult.sharpeRatio.toFixed(2);
        
        // 更新綜合對比表格
        const tableHtml = results.map((r, idx) => `
            <tr style="background: ${idx === 0 ? 'rgba(34, 197, 94, 0.1)' : idx === 1 ? 'rgba(59, 130, 246, 0.1)' : idx === 2 ? 'rgba(139, 92, 246, 0.1)' : 'transparent'}; border-bottom: 1px solid #f3e8ff;">
                <td style="padding: 12px; text-align: left; font-weight: ${idx < 3 ? '600' : '400'};"><strong>${r.mode}</strong> ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: rgba(139, 92, 246, 0.1); padding: 4px 8px; border-radius: 4px; color: #7c3aed; font-weight: 600;">${r.tradeCount}</span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: ${r.winRate >= 50 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${r.winRate >= 50 ? '#15803d' : '#991b1b'}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${r.winRate.toFixed(2)}%</span>
                </td>
                <td style="padding: 12px; text-align: center; font-size: 12px;">
                    <div style="color: ${r.avgWin >= 0 ? '#15803d' : '#991b1b'}; font-weight: 600;">📈 $${Math.abs(r.avgWin).toFixed(0)}</div>
                </td>
                <td style="padding: 12px; text-align: center; font-size: 12px;">
                    <div style="color: #991b1b; font-weight: 600;">📉 $${Math.abs(r.avgLoss).toFixed(0)}</div>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: ${r.profitFactor > 1 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${r.profitFactor > 1 ? '#15803d' : '#991b1b'}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${r.profitFactor.toFixed(2)}</span>
                </td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: ${r.profit >= 0 ? '#15803d' : '#991b1b'};"><strong>$${formatCurrency(r.profit)}</strong></td>
                <td style="padding: 12px; text-align: right; font-weight: 600;">$${formatCurrency(r.finalAsset)}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: ${r.returnRate >= 0 ? '#15803d' : '#991b1b'};"><strong>${r.returnRate.toFixed(2)}%</strong></td>
                <td style="padding: 12px; text-align: center; color: #991b1b; font-weight: 600;">-${r.maxDD.toFixed(2)}%</td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: ${r.sharpeRatio >= 0 ? '#15803d' : '#991b1b'};">${r.sharpeRatio.toFixed(2)}</td>
            </tr>
        `).join('');
        
        document.querySelector('#comprehensiveTable tbody').innerHTML = tableHtml;
        document.getElementById('comprehensiveEmptyState').style.display = 'none';
        document.getElementById('comprehensiveResultContainer').style.display = 'block';
        
        // ⭐ 顯示最佳策略的交易明細
        if (results.length > 0 && results[0].trades && results[0].trades.length > 0) {
            const bestTrades = results[0].trades;
            const tradesHtml = bestTrades.map((trade, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px; text-align: center; color: #666;">${idx + 1}</td>
                    <td style="padding: 12px; text-align: center;">${trade.entryDate}</td>
                    <td style="padding: 12px; text-align: center;">買入</td>
                    <td style="padding: 12px; text-align: center;">$${trade.entryPrice.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: center;">${trade.shares}</td>
                    <td style="padding: 12px; text-align: center;"></td>
                    <td style="padding: 12px; text-align: center;"></td>
                </tr>
                <tr style="background: rgba(249, 250, 251, 0.5); border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;"></td>
                    <td style="padding: 12px; text-align: center;">${trade.exitDate}</td>
                    <td style="padding: 12px; text-align: center;">賣出</td>
                    <td style="padding: 12px; text-align: center;">$${trade.exitPrice.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: center;">${trade.shares}</td>
                    <td style="padding: 12px; text-align: right; font-weight: 600; color: ${trade.profit >= 0 ? '#15803d' : '#991b1b'};"><strong>$${trade.profit.toFixed(2)}</strong></td>
                    <td style="padding: 12px; text-align: right; font-weight: 600; color: ${trade.profitRate >= 0 ? '#15803d' : '#991b1b'};"><strong>${trade.profitRate.toFixed(2)}%</strong></td>
                </tr>
            `).join('');
            
            // 檢查是否有交易明細表格
            let tradesTableBody = document.querySelector('#compTradesTable tbody');
            if (!tradesTableBody) {
                // 如果沒有交易表格的容器，就在 comprehensiveResultContainer 後面創建一個
                const resultContainer = document.getElementById('comprehensiveResultContainer');
                if (resultContainer) {
                    const tradesContainer = document.createElement('div');
                    tradesContainer.id = 'compTradesContainer';
                    tradesContainer.style = 'margin-top: 30px; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                    tradesContainer.innerHTML = `
                        <h3 style="margin-top: 0; margin-bottom: 15px; color: #1e293b;">📑 交易明細 (${results[0].mode})</h3>
                        <div style="overflow-x: auto;">
                            <table id="compTradesTable" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead style="background: #f8fafc;">
                                    <tr style="border-bottom: 2px solid #ddd6fe;">
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">序號</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">日期</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">動作</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">價格</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">股數</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">獲利/$</th>
                                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #7c3aed;">獲利%</th>
                                    </tr>
                                </thead>
                                <tbody>${tradesHtml}</tbody>
                            </table>
                        </div>
                    `;
                    resultContainer.parentNode.insertBefore(tradesContainer, resultContainer.nextSibling);
                }
            } else {
                tradesTableBody.innerHTML = tradesHtml;
            }
        }
        
        // 保存結果供導出
        window.comprehensiveResults = results;
        window.comprehensiveParams = params;
        window.comprehensiveFilteredDates = dates;
        window.comprehensiveFilteredCloses = closes;
        
        // ⭐ 只顯示用戶指定範圍的圖表（從 newStartIdx 開始）
        // 但需要保留完整數據用於計算 MA（確保准確性）
        const displayDates = dates.slice(newStartIdx);
        const displayCloses = closes.slice(newStartIdx);
        
        // 繪制圖表（傳遞：顯示用的數據, 完整用於計算MA的數據, 用戶範圍起始索引）
        drawComprehensiveCharts(results[0], params, displayDates, displayCloses, dates, closes, newStartIdx);
        
        // 滾動到結果區域
        document.getElementById('comprehensiveResultContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        alert('未找到任何回測結果，請先執行回測');
    }
}

// ===== 圖表繪制 =====
function drawComprehensiveCharts(bestResult, params, displayDates, displayCloses, fullDates, fullCloses, startIdx) {
    if (!window.jsonData || window.jsonData.length === 0) {
        console.warn('缺少CSV數據，無法繪制圖表');
        return;
    }

    try {
        // ⭐ 顯示用的數據是用戶指定範圍，計算用的數據是完整歷史
        let dates = displayDates;
        let closes = displayCloses;
        const fullData = fullCloses;
        
        // 檢查數據有效性
        if (!dates || !closes || closes.length === 0 || dates.length === 0) {
            console.warn('數據不足，無法繪制圖表');
            return;
        }
        
        // 對於 Open/High/Low，嘗試從 CSV 讀取，如果沒有就用 Close 替代
        let opens = closes.map(v => v);
        let highs = closes.map(v => v);
        let lows = closes.map(v => v);
        
        // 嘗試查找 OHLC 列
        if (window.csvHeaders) {
            let openIdx = -1, highIdx = -1, lowIdx = -1;
            for (let i = 0; i < window.csvHeaders.length; i++) {
                const h = window.csvHeaders[i].toUpperCase();
                if (h.includes('OPEN')) openIdx = i;
                else if (h.includes('HIGH')) highIdx = i;
                else if (h.includes('LOW')) lowIdx = i;
            }
            
            // 如果找到這些列，從完整數據中提取
            if (openIdx !== -1 || highIdx !== -1 || lowIdx !== -1) {
                opens = fullDates.map((_, idx) => {
                    const rowIdx = window.jsonData.findIndex((r, rIdx) => rIdx > 0 && r[0] === fullDates[idx]);
                    return (openIdx !== -1 && rowIdx !== -1) ? parseFloat(window.jsonData[rowIdx][openIdx]) || closes[idx] : closes[idx];
                });
                highs = fullDates.map((_, idx) => {
                    const rowIdx = window.jsonData.findIndex((r, rIdx) => rIdx > 0 && r[0] === fullDates[idx]);
                    return (highIdx !== -1 && rowIdx !== -1) ? parseFloat(window.jsonData[rowIdx][highIdx]) || closes[idx] : closes[idx];
                });
                lows = fullDates.map((_, idx) => {
                    const rowIdx = window.jsonData.findIndex((r, rIdx) => rIdx > 0 && r[0] === fullDates[idx]);
                    return (lowIdx !== -1 && rowIdx !== -1) ? parseFloat(window.jsonData[rowIdx][lowIdx]) || closes[idx] : closes[idx];
                });
                // 只提取顯示範圍
                opens = opens.slice(startIdx);
                highs = highs.slice(startIdx);
                lows = lows.slice(startIdx);
            }
        }

        // 1. K線圖（如果只有收盤價，改用折線圖）
        let hasOHLC = opens[0] !== closes[0] || highs[0] !== closes[0] || lows[0] !== closes[0];
        let candleTraces = [];
        
        if (hasOHLC) {
            // 有 OHLC 數據，顯示 K 線
            const candleTrace = {
                x: dates,
                open: opens,
                high: highs,
                low: lows,
                close: closes,
                type: 'candlestick',
                name: '日線'
            };
            candleTraces = [candleTrace];
        } else {
            // 只有收盤價，顯示折線圖
            const closeTrace = {
                x: dates,
                y: closes,
                mode: 'lines',
                type: 'scatter',
                name: '收盤價',
                line: {color: '#333', width: 2}
            };
            candleTraces = [closeTrace];
        }
        
        const candleLayout = {
            title: hasOHLC ? 'K線圖' : '日線走勢',
            xaxis: {title: '日期'},
            yaxis: {title: '價格'},
            height: 400,
            margin: {t: 40, b: 40, l: 60, r: 20}
        };
        Plotly.newPlot('compCandleChart', candleTraces, candleLayout, {responsive: true});

        // 2. 計算移動平均線（用完整數據計算，只顯示用戶範圍）
        const maShortFull = calculateMovingAverage(fullData, params.short_ma, params.ma_type);
        const maLongFull = calculateMovingAverage(fullData, params.long_ma, params.ma_type);
        
        // 只提取用戶範圍的 MA 值
        const maShort = maShortFull.slice(startIdx);
        const maLong = maLongFull.slice(startIdx);

        const closeTrace = {x: dates, y: closes, name: '收盤價', type: 'scatter', mode: 'lines', line: {color: '#666'}};
        const maShortTrace = {x: dates, y: maShort, name: `${params.short_ma}日${params.ma_type}`, type: 'scatter', mode: 'lines', line: {color: '#667eea'}};
        const maLongTrace = {x: dates, y: maLong, name: `${params.long_ma}日${params.ma_type}`, type: 'scatter', mode: 'lines', line: {color: '#f59e0b'}};
        
        // ⭐ 添加交易点标记
        const buyTraces = [];
        const sellTraces = [];
        
        if (bestResult.trades && bestResult.trades.length > 0) {
            // 遍历所有交易，标记买入和卖出点
            for (const trade of bestResult.trades) {
                // 查找买入点
                const buyIdx = dates.indexOf(trade.entryDate);
                if (buyIdx !== -1) {
                    buyTraces.push({
                        x: [dates[buyIdx]],
                        y: [closes[buyIdx]],
                        name: trade.entryDate + ' 買',
                        mode: 'markers',
                        marker: {color: '#27ae60', size: 12, symbol: 'circle'},
                        showlegend: false,
                        hoverinfo: 'text',
                        text: [`買入: ${trade.entryDate} @ $${trade.entryPrice.toFixed(2)}`]
                    });
                }
                
                // 查找卖出点
                const sellIdx = dates.indexOf(trade.exitDate);
                if (sellIdx !== -1) {
                    sellTraces.push({
                        x: [dates[sellIdx]],
                        y: [closes[sellIdx]],
                        name: trade.exitDate + ' 賣',
                        mode: 'markers',
                        marker: {color: '#e74c3c', size: 12, symbol: 'circle'},
                        showlegend: false,
                        hoverinfo: 'text',
                        text: [`賣出: ${trade.exitDate} @ $${trade.exitPrice.toFixed(2)}`]
                    });
                }
            }
        }
        
        const maLayout = {
            title: '移動平均線',
            xaxis: {title: '日期'},
            yaxis: {title: '價格'},
            height: 350,
            hovermode: 'x unified',
            margin: {t: 40, b: 40, l: 60, r: 20}
        };
        Plotly.newPlot('compMAChart', [closeTrace, maShortTrace, maLongTrace, ...buyTraces, ...sellTraces], maLayout, {responsive: true});

        // 3. KD 指標（用完整數據計算，只顯示用戶範圍）
        const kdFull = calculateKDFromPrices(fullData, params.rsv_n);
        const kd = {
            K: kdFull.K.slice(startIdx),
            D: kdFull.D.slice(startIdx)
        };
        const kdKTrace = {x: dates, y: kd.K, name: 'K', type: 'scatter', mode: 'lines', line: {color: '#3b82f6'}};
        const kdDTrace = {x: dates, y: kd.D, name: 'D', type: 'scatter', mode: 'lines', line: {color: '#f59e0b'}};
        const kdLayout = {
            title: 'KD 指標',
            xaxis: {title: '日期'},
            yaxis: {title: 'KD值', range: [0, 100]},
            height: 300,
            hovermode: 'x unified',
            shapes: [
                {type: 'line', x0: dates[0], x1: dates[dates.length-1], y0: params.kd_upper, y1: params.kd_upper, line: {dash: 'dash', color: '#ccc'}},
                {type: 'line', x0: dates[0], x1: dates[dates.length-1], y0: params.kd_lower, y1: params.kd_lower, line: {dash: 'dash', color: '#ccc'}}
            ],
            margin: {t: 40, b: 40, l: 60, r: 20}
        };
        Plotly.newPlot('compKDChart', [kdKTrace, kdDTrace], kdLayout, {responsive: true});

        // 4. RSI 指標（用完整數據計算，只顯示用戶範圍）
        const rsiFull = calculateRSI(fullData, params.rsi_n);
        const rsi = rsiFull.slice(startIdx);
        const rsiTrace = {x: dates, y: rsi, name: 'RSI', type: 'scatter', mode: 'lines', line: {color: '#8b5cf6'}};
        const rsiLayout = {
            title: 'RSI 指標',
            xaxis: {title: '日期'},
            yaxis: {title: 'RSI值', range: [0, 100]},
            height: 300,
            hovermode: 'x unified',
            shapes: [
                {type: 'line', x0: dates[0], x1: dates[dates.length-1], y0: params.rsi_upper, y1: params.rsi_upper, line: {dash: 'dash', color: '#ccc'}},
                {type: 'line', x0: dates[0], x1: dates[dates.length-1], y0: params.rsi_lower, y1: params.rsi_lower, line: {dash: 'dash', color: '#ccc'}}
            ],
            margin: {t: 40, b: 40, l: 60, r: 20}
        };
        Plotly.newPlot('compRSIChart', [rsiTrace], rsiLayout, {responsive: true});

        // 5. MACD 指標（用完整數據計算，只顯示用戶範圍）
        const macdFull = calculateMACD(fullData);
        const macd = {
            line: macdFull.line.slice(startIdx),
            signal: macdFull.signal.slice(startIdx)
        };
        const macdTrace = {x: dates, y: macd.line, name: 'MACD', type: 'scatter', mode: 'lines', line: {color: '#ec4899'}};
        const macdSignalTrace = {x: dates, y: macd.signal, name: '信號線', type: 'scatter', mode: 'lines', line: {color: '#f59e0b'}};
        const macdLayout = {
            title: 'MACD 指標',
            xaxis: {title: '日期'},
            yaxis: {title: 'MACD值'},
            height: 300,
            hovermode: 'x unified',
            margin: {t: 40, b: 40, l: 60, r: 20}
        };
        Plotly.newPlot('compMACDChart', [macdTrace, macdSignalTrace], macdLayout, {responsive: true});

        // 6. 資產淨值曲線 - ⭐ 使用回測結果中的 equityHistory
        let equityValues = bestResult.equityHistory || closes.map(c => params.initial_capital);
        
        // 如果 equityHistory 的长度与 dates 不匹配（因为多了历史数据），需要截断
        if (equityValues.length > dates.length) {
            equityValues = equityValues.slice(equityValues.length - dates.length);
        }
        
        const equityTrace = {
            x: dates,
            y: equityValues,
            name: '資產淨值',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: {color: '#10b981'}
        };
        const equityLayout = {
            title: '資產淨值曲線',
            xaxis: {title: '日期'},
            yaxis: {title: '資產淨值($)'},
            height: 350,
            hovermode: 'x unified',
            margin: {t: 40, b: 40, l: 80, r: 20}
        };
        Plotly.newPlot('compEquityChart', [equityTrace], equityLayout, {responsive: true});
        
        console.log('✅ 綜合回測圖表已繪制');
        
    } catch(error) {
        console.error('繪制圖表時發生錯誤:', error);
    }
}

// ===== 輔助計算函數 =====
function calculateKDFromPrices(prices, n) {
    const K = [];
    const D = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < n - 1) {
            K.push(null);
            D.push(null);
            continue;
        }
        const slice = prices.slice(i - n + 1, i + 1);
        const low = Math.min(...slice);
        const high = Math.max(...slice);
        const rsv = (high === low) ? 50 : ((prices[i] - low) / (high - low) * 100);
        
        if (i === n - 1) {
            K[i] = (2 / 3) * 50 + (1 / 3) * rsv;
            D[i] = (2 / 3) * 50 + (1 / 3) * K[i];
        } else {
            K[i] = (2 / 3) * K[i - 1] + (1 / 3) * rsv;
            D[i] = (2 / 3) * D[i - 1] + (1 / 3) * K[i];
        }
    }
    return {K, D};
}

function calculateMovingAverage(data, period, type) {
    const result = [];
    if (type === 'SMA') {
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / period);
            }
        }
    } else if (type === 'EMA') {
        const multiplier = 2 / (period + 1);
        let ema = null;
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else if (i === period - 1) {
                const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
                ema = sum / period;
                result.push(ema);
            } else {
                ema = (data[i] - ema) * multiplier + ema;
                result.push(ema);
            }
        }
    } else if (type === 'WMA') {
        const denominator = (period * (period + 1)) / 2;
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += data[i - period + 1 + j] * (j + 1);
                }
                result.push(sum / denominator);
            }
        }
    }
    return result;
}

function calculateRSI(prices, n) {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    
    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < n; i++) {
        if (changes[i] > 0) avgGain += changes[i];
        else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= n;
    avgLoss /= n;
    
    const rsi = new Array(n).fill(null);
    for (let i = n; i < prices.length; i++) {
        const gain = changes[i] > 0 ? changes[i] : 0;
        const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
        avgGain = (avgGain * (n - 1) + gain) / n;
        avgLoss = (avgLoss * (n - 1) + loss) / n;
        const rs = avgLoss === 0 ? 100 : (avgGain / avgLoss);
        rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
}

function calculateMACD(prices) {
    const calcEMA = (values, period) => {
        const k = 2 / (period + 1);
        const validValues = values.filter(v => v !== null);
        if (validValues.length < period) return new Array(values.length).fill(null);
        
        let ema = validValues.slice(0, period).reduce((a, b) => a + b) / period;
        const result = new Array(values.length).fill(null);
        let dataIdx = 0;
        for (let i = 0; i < values.length; i++) {
            if (values[i] !== null) {
                if (dataIdx >= period - 1) {
                    ema = ema + k * (values[i] - ema);
                    result[i] = ema;
                }
                dataIdx++;
            }
        }
        // 補充後續值
        for (let i = 0; i < result.length; i++) {
            if (result[i] === null && i > 0 && result[i-1] !== null) {
                result[i] = result[i-1];
            }
        }
        return result;
    };
    
    const ema12 = calcEMA(prices, 12);
    const ema26 = calcEMA(prices, 26);
    const macdLine = [];
    
    for (let i = 0; i < prices.length; i++) {
        const m = (ema12[i] || 0) - (ema26[i] || 0);
        macdLine.push(m);
    }
    
    const signalLine = calcEMA(macdLine, 9);
    
    return {
        line: macdLine,
        signal: signalLine
    };
}

// ===== 完整交易引擎系統 =====

/**
 * 執行完整的回測交易模擬
 * @param {Array} closes - 收盤價數組
 * @param {Array} dates - 日期數組
 * @param {Object} signals - 由各策略生成的交易信號
 * @param {Object} params - 回測參數
 * @param {number} startIdx - 開始交易的索引
 * @param {Array} shortMA - 短期 MA 陣列（用於驗證有效起始點）
 * @param {Array} longMA - 長期 MA 陣列（用於驗證有效起始點）
 * @returns {Object} 交易結果（包含所有交易和績效指標）
 */
function executeRealBacktest(closes, dates, signals, params, startIdx = 1, shortMA = null, longMA = null) {
    // 手續費轉換為小數（0.08% → 0.0008）
    const COMMISSION = params.trade_fee / 100;
    
    // ⭐ 找到第一個有效數據的索引（MA 值都不為 null）
    let validStartIdx = startIdx;
    if (shortMA && longMA) {
        while (validStartIdx < closes.length - 1) {
            // 檢查當前和前一天的 MA 值都存在
            if (shortMA[validStartIdx] === null || longMA[validStartIdx] === null) {
                validStartIdx++;
                continue;
            }
            // 檢查前一天的 MA 值
            if (validStartIdx > 0 && (shortMA[validStartIdx - 1] === null || longMA[validStartIdx - 1] === null)) {
                validStartIdx++;
                continue;
            }
            break;
        }
    } else {
        // 如果沒有 MA，就直接使用 startIdx
        validStartIdx = startIdx;
    }
    
    const trades = [];           // 所有成交記錄
    let position = 0;            // 當前持倉股數
    let entryPrice = 0;          // 進場價格
    let entryDate = 0;           // 進場日期索引
    let cash = params.initial_capital;  // 可用現金
    const equityHistory = [];    // ⭐ 資產淨值曆史
    let tradeCount = 0;          // 交易次數
    
    // ⭐ 遍歷整個回測期間，從 startIdx 到最後一天
    for (let i = startIdx; i < closes.length; i++) {
        const currentPrice = closes[i];
        
        // 每日計算當前資產（現金 + 持倉市值）
        const positionValue = position > 0 ? position * currentPrice : 0;
        const totalEquity = cash + positionValue;
        equityHistory.push(totalEquity);
        
        // ⭐ 只在 validStartIdx 之後執行交易
        if (i >= validStartIdx) {
            // 判斷買入信號
            if (position === 0 && signals[i].buy) {
                // 計算可買入的股數（考慮手續費）
                // cost = shares × price × (1 + commission)
                // shares = cash / (price × (1 + commission))
                const shares = Math.floor(cash / (currentPrice * (1 + COMMISSION)));
                
                if (shares > 0) {
                    const cost = shares * currentPrice * (1 + COMMISSION);
                    position = shares;
                    entryPrice = currentPrice;
                    entryDate = i;
                    cash -= cost;
                    tradeCount++;
                    
                    console.log(`🟢 買入: ${dates[i]} | 價格: $${currentPrice.toFixed(2)} | 股數: ${shares} | 成本: $${cost.toFixed(2)} | 手續費: $${(cost * COMMISSION / (1 + COMMISSION)).toFixed(2)}`);
                }
            }
            // 判斷賣出信號
            else if (position > 0 && signals[i].sell) {
                // 賣出所得 = shares × price × (1 - commission)
                const sellValue = position * currentPrice * (1 - COMMISSION);
                
                // ⭐ 利潤計算：考慮買入和賣出的手續費
                const entryCost = position * entryPrice * (1 + COMMISSION);  // 進場實際成本
                const entryProfit = sellValue - entryCost;
                const profitRatio = (entryProfit / entryCost) * 100;  // 以實際成本計算百分比
                
                trades.push({
                    entryDate: dates[entryDate],
                    exitDate: dates[i],
                    entryPrice: entryPrice,
                    exitPrice: currentPrice,
                    shares: position,
                    profit: entryProfit,
                    profitRate: profitRatio,
                    holdDays: i - entryDate
                });
            
            const fee = position * currentPrice * COMMISSION;
            console.log(`🔴 賣出: ${dates[i]} | 價格: $${currentPrice.toFixed(2)} | 獲利: $${entryProfit.toFixed(2)} | 利率: ${profitRatio.toFixed(2)}% | 手續費: $${fee.toFixed(2)}`);
            
            cash += sellValue;
            position = 0;
            tradeCount++;
        }
        } // 結束 if (i >= validStartIdx)
    }
    
    // 如果最後仍持倉，強制平倉
    if (position > 0) {
        const exitPrice = closes[closes.length - 1];
        const sellValue = position * exitPrice * (1 - COMMISSION);
        
        // ⭐ 利潤計算：考慮買入和賣出的手續費
        const entryCost = position * entryPrice * (1 + COMMISSION);  // 進場實際成本
        const entryProfit = sellValue - entryCost;
        const profitRatio = (entryProfit / entryCost) * 100;  // 以實際成本計算百分比
        
        trades.push({
            entryDate: dates[entryDate],
            exitDate: dates[dates.length - 1],
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            shares: position,
            profit: entryProfit,
            profitRate: profitRatio,
            holdDays: closes.length - 1 - entryDate
        });
        
        cash += sellValue;
        tradeCount++;
    }
    
    // 計算績效指標
    const finalEquity = cash;
    const totalProfit = finalEquity - params.initial_capital;
    const returnRate = (totalProfit / params.initial_capital) * 100;
    
    // 勝率計算
    const winTrades = trades.filter(t => t.profit > 0);
    const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;
    
    // 平均獲利
    const avgWin = winTrades.length > 0 ? 
        winTrades.reduce((sum, t) => sum + t.profit, 0) / winTrades.length : 0;
    const lossTrades = trades.filter(t => t.profit <= 0);
    const avgLoss = lossTrades.length > 0 ? 
        lossTrades.reduce((sum, t) => sum + t.profit, 0) / lossTrades.length : 0;
    
    // 最大回撤計算（只對 validStartIdx 之後的數據計算，與 C++ 版本一致）
    let maxEquity = params.initial_capital;
    let maxDD = 0;
    const validEquityOffset = validStartIdx - startIdx;  // equityHistory 中有效數據的起始索引
    
    for (let i = validEquityOffset; i < equityHistory.length; i++) {
        const eq = equityHistory[i];
        if (eq > maxEquity) maxEquity = eq;
        const dd = (maxEquity - eq) / maxEquity;  // 保留小數精度
        if (dd > maxDD) maxDD = dd;
    }
    maxDD = maxDD * 100;  // 最後乘 100 轉成百分比
    
    // 夏普比率計算（簡化版）
    const returns = [];
    for (let i = 1; i < equityHistory.length; i++) {
        returns.push((equityHistory[i] - equityHistory[i-1]) / equityHistory[i-1]);
    }
    const avgReturn = returns.length > 0 ? 
        returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? 
        Math.sqrt(returns.reduce((sq, val) => sq + Math.pow(val - avgReturn, 2), 0) / returns.length) : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;
    
    return {
        trades: trades,
        tradeCount: tradeCount,
        winRate: winRate,
        avgWin: avgWin,
        avgLoss: avgLoss,
        profitFactor: Math.abs(avgLoss) > 0 ? 
            (winTrades.reduce((sum, t) => sum + t.profit, 0) / Math.abs(lossTrades.reduce((sum, t) => sum + t.profit, 0))) : 0,
        totalProfit: totalProfit,
        finalEquity: finalEquity,
        returnRate: returnRate,
        maxDD: maxDD,
        sharpeRatio: sharpeRatio,
        equityHistory: equityHistory
    };
}

/**
 * 為給定的策略生成交易信號
 * @param {Array} closes - 收盤價
 * @param {Array} dates - 日期
 * @param {String} strategy - 策略名稱
 * @param {Object} params - 策略參數
 * @returns {Array} 每日的買賣信號數組
 */
function generateSignals(closes, dates, strategy, params) {
    const signals = new Array(closes.length).fill({buy: false, sell: false});
    
    if (strategy === 'MA') {
        return generateMASignals(closes, params);
    } else if (strategy === 'KD') {
        return generateKDSignals(closes, params);
    } else if (strategy === 'RSI') {
        return generateRSISignals(closes, params);
    } else if (strategy === 'MACD') {
        return generateMACDSignals(closes, params);
    }
    
    return signals;
}

// MA 策略信號生成
function generateMASignals(closes, params, volumes = null, volumeSMA = null, mode = 'SMA') {
    const shortMA = calculateMovingAverage(closes, params.short_ma, params.ma_type);
    const longMA = calculateMovingAverage(closes, params.long_ma, params.ma_type);
    const signals = [{buy: false, sell: false}];  // 第一日沒有信號
    
    // ⭐ 定義 epsilon 精度常數（與 C++ 保持一致）
    const MA_EPSILON = 1e-9;
    
    // 計算 MA 關係的輔助函數 (-1: <, 0: =, 1: >) - 使用 epsilon 避免浮點精度誤差
    const getRel = (short, long) => {
        const diff = short - long;
        if (Math.abs(diff) < MA_EPSILON) return 0;  // 相等（容忍精度誤差）
        return diff < 0 ? -1 : 1;
    };
    
    let inPosition = false;
    let overlapBuyDay = -1;    // 記錄重疊買入日期
    let overlapSellDay = -1;   // 記錄重疊賣出日期
    let beforeOverlapRelBuy = 0;   // 重疊前的關係
    let beforeOverlapRelSell = 0;
    let overlapVal = 0;        // 重疊時的 MA 值
    
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (shortMA[i] && longMA[i]) {
            // 判斷目前漲跌關係（使用 epsilon-aware 比較）
            const currRel = getRel(shortMA[i], longMA[i]);
            const prevRel = getRel(shortMA[i-1], longMA[i-1]);
            
            // ⭐ 成交量驗證邏輯（用於 VP/VP2 模式）
            let volumeValidBuy = true;
            let volumeValidSell = true;
            
            if (volumes && i > 0) {
                if (mode === 'VP') {
                    // VP 模式 (新規則)：買入和賣出都檢查 成交量 > 成交量MA
                    // 即：長短線MA有黃金/死亡交叉 AND 成交量 > 成交量MA 才能交易
                    if (volumeSMA && volumeSMA[i] !== null) {
                        volumeValidBuy = volumes[i] > volumeSMA[i];
                        volumeValidSell = volumes[i] > volumeSMA[i];
                    }
                } else if (mode === 'VP2') {
                    // VP2 模式：買入和賣出都檢查成交量 > 成交量 SMA
                    if (volumeSMA && volumeSMA[i] !== null) {
                        volumeValidBuy = volumes[i] > volumeSMA[i];
                        volumeValidSell = volumes[i] > volumeSMA[i];
                    }
                }
            }
            
            // ========== 黃金交叉（買入信號） ==========
            if (prevRel === -1 && currRel === 0) {
                // 情況1：當天重疊（短線=長線）
                overlapBuyDay = i;
                beforeOverlapRelBuy = -1;
                overlapVal = +shortMA[i].toFixed(9);
            } 
            else if (overlapBuyDay > 0 && i === overlapBuyDay + 1 && beforeOverlapRelBuy === -1) {
                // 情況2：隔一天確認，如果短線 > 長線 -> 買入
                if (currRel > 0 && !inPosition && i < closes.length - 1 && volumeValidBuy) {
                    buy = true;
                    inPosition = true;
                }
                overlapBuyDay = -1;
            } 
            else if (prevRel === -1 && currRel > 0 && overlapBuyDay === -1 && !inPosition && i < closes.length - 1 && volumeValidBuy) {
                // 情況3：直接交叉（無重疊期），立即買入
                buy = true;
                inPosition = true;
            }
            
            // ========== 死亡交叉（賣出信號） ==========
            if (prevRel === 1 && currRel === 0) {
                // 情況1：當天重疊
                overlapSellDay = i;
                beforeOverlapRelSell = 1;
                overlapVal = +shortMA[i].toFixed(9);
            } 
            else if (overlapSellDay > 0 && i === overlapSellDay + 1 && beforeOverlapRelSell === 1) {
                // 情況2：隔一天確認，如果短線 < 長線 -> 賣出
                if (currRel < 0 && inPosition && volumeValidSell) {
                    sell = true;
                    inPosition = false;
                }
                overlapSellDay = -1;
            } 
            else if (prevRel === 1 && currRel < 0 && overlapSellDay === -1 && inPosition && volumeValidSell) {
                // 情況3：直接交叉，立即賣出
                sell = true;
                inPosition = false;
            }
        }
        
        signals.push({buy, sell});
    }
    return signals;
}

// KD 策略信號生成
function generateKDSignals(closes, params) {
    const kd = calculateKDFromPrices(closes, params.rsv_n);
    const signals = [{buy: false, sell: false}];  // 第一日沒有信號
    
    let inPosition = false;
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (kd.K[i] !== null && kd.D[i] !== null) {
            // K 穿過 D 且 K < 下限 (買入)
            if (kd.K[i] > kd.D[i] && !(kd.K[i-1] > kd.D[i-1]) && kd.K[i] < params.kd_lower && !inPosition) {
                buy = true;
                inPosition = true;
            }
            // K 穿過 D 且 K > 上限 (賣出)
            else if (kd.K[i] < kd.D[i] && (kd.K[i-1] > kd.D[i-1]) && kd.K[i] > params.kd_upper && inPosition) {
                sell = true;
                inPosition = false;
            }
        }
        
        signals.push({buy, sell});
    }
    return signals;
}

// RSI 策略信號生成
function generateRSISignals(closes, params) {
    const rsi = calculateRSI(closes, params.rsi_n);
    const signals = [{buy: false, sell: false}];  // 第一日沒有信號
    
    let inPosition = false;
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (rsi[i] !== null) {
            // RSI < 下限且開始上升 (買入)
            if (rsi[i] < params.rsi_lower && rsi[i] > rsi[i-1] && !inPosition) {
                buy = true;
                inPosition = true;
            }
            // RSI > 上限且開始下降 (賣出)
            else if (rsi[i] > params.rsi_upper && rsi[i] < rsi[i-1] && inPosition) {
                sell = true;
                inPosition = false;
            }
        }
        
        signals.push({buy, sell});
    }
    return signals;
}

// MACD 策略信號生成
function generateMACDSignals(closes, params) {
    const macd = calculateMACD(closes);
    const signals = [{buy: false, sell: false}];  // 第一日沒有信號
    
    let inPosition = false;
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (macd.line[i] !== null && macd.signal[i] !== null) {
            // MACD 穿過信號線向上 (買入)
            if (macd.line[i] > macd.signal[i] && !(macd.line[i-1] > macd.signal[i-1]) && !inPosition) {
                buy = true;
                inPosition = true;
            }
            // MACD 穿過信號線向下 (賣出)
            else if (macd.line[i] < macd.signal[i] && (macd.line[i-1] > macd.signal[i-1]) && inPosition) {
                sell = true;
                inPosition = false;
            }
        }
        
        signals.push({buy, sell});
    }
    return signals;
}

// ===== 結果導出 =====
function downloadComprehensiveCSV() {
    if (!window.comprehensiveResults || window.comprehensiveResults.length === 0) {
        alert('請先執行綜合回測');
        return;
    }
    
    let csv = '';
    
    // 添加參數信息
    if (window.comprehensiveParams) {
        csv += '=== 回測參數 ===\n';
        csv += `MA參數,短線: ${window.comprehensiveParams.short_ma} | 長線: ${window.comprehensiveParams.long_ma} | 類型: ${window.comprehensiveParams.ma_type}\n`;
        csv += `KD參數,RSV週期: ${window.comprehensiveParams.rsv_n} | 超買: ${window.comprehensiveParams.kd_upper}% | 超賣: ${window.comprehensiveParams.kd_lower}%\n`;
        csv += `RSI參數,週期: ${window.comprehensiveParams.rsi_n} | 超買: ${window.comprehensiveParams.rsi_upper}% | 超賣: ${window.comprehensiveParams.rsi_lower}%\n`;
        csv += `KAMA參數,週期: ${window.comprehensiveParams.kama_n} | 快速: ${window.comprehensiveParams.kama_fast} | 緩慢: ${window.comprehensiveParams.kama_slow}\n`;
        csv += `交易設定,初始資金: $${window.comprehensiveParams.initial_capital} | 手續費: ${window.comprehensiveParams.trade_fee}%\n`;
        csv += `回測期間,${window.comprehensiveParams.start_date} ~ ${window.comprehensiveParams.end_date}\n`;
        csv += '\n';
    }
    
    // 添加結果表格
    csv += '策略模式,交易次數,勝率(%),獲利($),最終資產($),回報率(%),最大回撤(%)\n';
    
    window.comprehensiveResults.forEach(r => {
        csv += `${r.mode},${r.tradeCount},${r.winRate.toFixed(2)},${r.profit.toFixed(2)},${r.finalAsset.toFixed(2)},${r.returnRate.toFixed(2)},-${r.maxDD.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comprehensive_backtest_${new Date().getTime()}.csv`;
    link.click();
}

function toggleDetailedView() {
    const table = document.getElementById('dominanceTable');
    const tbody = table.querySelector('tbody');
    
    // 簡單實現：滾動到表格頂部
    table.parentElement.scrollTop = 0;
    
    // 也可以添加排序或篩選功能
    alert('詳細檢視：已展示全部對比結果');
}

// ===== 輔助函數 =====
// 從欄位名稱提取公司代碼
function getCompanyCode(fieldName) {
    // fieldName 通常是 "AAPL_Close", "AAPL_Volume" 或直接是 "AAPL_CLOSE" 等
    const parts = fieldName.split('_');
    return parts[0];
}

// 生成公司名稱標籤（使用 index.html 中定義的全局 COMPANY_NAMES）
function getCompanyLabel(fieldName) {
    const code = getCompanyCode(fieldName);
    const name = COMPANY_NAMES[code] || code;
    return `${code} - ${name}`;
}

// ===== DOM 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    const compCsvFileInput = document.getElementById('comprehensiveCsvFile');
    if (compCsvFileInput) {
        compCsvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // 驗證文件大小（限制在 50MB）
                if (file.size > 50 * 1024 * 1024) {
                    showComprehensiveCsvError('文件過大', '請上傳小於 50MB 的檔案');
                    return;
                }
                processComprehensiveCsvUpload(file);
            }
        });
    }
});
