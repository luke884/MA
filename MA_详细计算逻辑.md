# MA（移動平均）系統詳細計算邏輯

## 1️⃣ SMA/EMA/WMA 計算函數（核心算法）

```javascript
/**
 * SMA: 簡單移動平均 - 最近 period 天收盤價的算術平均
 * EMA: 指數移動平均 - 賦予最近數據更高權重
 * WMA: 加權移動平均 - 線性遞增權重
 * 
 * @param {Array} data - 價格數組
 * @param {Number} period - 計算週期（例如 20 日、60 日）
 * @param {String} type - 'SMA' | 'EMA' | 'WMA'
 * @return {Array} MA 值數組（前 period-1 個為 null）
 */
function calculateMovingAverage(data, period, type) {
    const result = [];
    
    // ===== SMA（簡單均線） =====
    if (type === 'SMA') {
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);  // 不足 period 天時為 null
            } else {
                // 取過去 period 天的平均值
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / period);
            }
        }
    } 
    // ===== EMA（指數均線） =====
    else if (type === 'EMA') {
        const multiplier = 2 / (period + 1);  // EMA 平滑係數
        let ema = null;
        
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);  // 不足 period 天時為 null
            } else if (i === period - 1) {
                // 第 period 天時：用前 period 天的 SMA 作為初始值
                const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
                ema = sum / period;
                result.push(ema);
            } else {
                // 之後每日遞推：EMA = (當日價 - 前日EMA) × 平滑係數 + 前日EMA
                ema = (data[i] - ema) * multiplier + ema;
                result.push(ema);
            }
        }
    } 
    // ===== WMA（加權均線） =====
    else if (type === 'WMA') {
        // 權重分母 = 1 + 2 + ... + period = period × (period + 1) / 2
        const denominator = (period * (period + 1)) / 2;
        
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);  // 不足 period 天時為 null
            } else {
                // 最舊的日期權重 = 1，最新的日期權重 = period
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
```

---

## 2️⃣ 短線/長線 MA 參數設定

```javascript
// 在回測參數中設定：
const params = {
    short_ma: 20,        // 短線 MA 週期（例如 20 日）
    long_ma: 60,         // 長線 MA 週期（例如 60 日）
    ma_type: 'SMA',      // 或 'EMA' 或 'WMA'
    initial_capital: 10000,
    trade_fee: 0.08      // 手續費 0.08%
};

// 計算短線和長線 MA
const shortMA = calculateMovingAverage(closes, params.short_ma, params.ma_type);
// shortMA[i] = 第 i 日的短線 MA 值（15、20、50 日等）

const longMA = calculateMovingAverage(closes, params.long_ma, params.ma_type);
// longMA[i] = 第 i 日的長線 MA 值（60、120、240 日等）
```

---

## 3️⃣ 交易日取值位置

在生成交易信號時，**取當日（i）的 MA 值進行判斷**：

```javascript
function generateMASignals(closes, params) {
    const shortMA = calculateMovingAverage(closes, params.short_ma, params.ma_type);
    const longMA = calculateMovingAverage(closes, params.long_ma, params.ma_type);
    
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (shortMA[i] && longMA[i]) {  // 确保两条线都已计算出值
            // ✅ 取 shortMA[i] 和 longMA[i]（当日数据）
            const shortValue = shortMA[i];  // 第 i 日的短线 MA
            const longValue = longMA[i];    // 第 i 日的長線 MA
            
            // 判斷上一日的關係
            const prevShort = shortMA[i-1];  // 前一日短線
            const prevLong = longMA[i-1];    // 前一日長線
            
            // 用於比較和判斷信號...
        }
    }
}
```

---

## 4️⃣ "往前抓"天數邏輯（Period 參數）

**系統使用固定的 `period` 參數來決定往前看幾天**

```javascript
/**
 * "往前抓"邏輯示例：
 * 若今天是第 30 天，period = 20
 * 則往前抓 20 天 = 第 11 到 30 天的資料
 */

// 在 calculateMovingAverage 中的 SMA 計算：
if (i < period - 1) {
    result.push(null);  // 前 period-1 天（無法計算）
} else {
    // data.slice(i - period + 1, i + 1)
    // 取：第 (i - period + 1) 到 i 天的資料，共 period 天
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
}

/**
 * 具體例子（SMA 20）：
 * i = 20（第 21 日，因為索引從 0 開始）
 * data.slice(20 - 20 + 1, 20 + 1) = data.slice(1, 21)
 * 取第 1 到 20 日的資料（共 20 天）
 */
```

**注意：系統不使用 `startIdx` 參數，而是通過 `period` 隱含控制往前天數**

---

## 5️⃣ 完整交易信號判斷代碼

```javascript
/**
 * MA 交叉策略信號生成
 * 黃金交叉（短線上穿長線）= 買入信號
 * 死亡交叉（短線下穿長線）= 賣出信號
 * 
 * 支持三種交叉情況：
 * 1. 直接交叉（無重疊）：立即信號
 * 2. 重疊期（短/長線相等）：隔一天確認
 * 3. 特殊避免：防止多次信號和負數情況
 */
function generateMASignals(closes, params) {
    const shortMA = calculateMovingAverage(closes, params.short_ma, params.ma_type);
    const longMA = calculateMovingAverage(closes, params.long_ma, params.ma_type);
    
    const signals = [{buy: false, sell: false}];  // 第一日沒有信號
    
    let inPosition = false;              // 是否持倉
    let overlapBuyDay = -1;              // 記錄黃金交叉重疊日期
    let overlapSellDay = -1;             // 記錄死亡交叉重疊日期
    let beforeOverlapRelBuy = 0;         // 重疊前短/長線關係（買入用）
    let beforeOverlapRelSell = 0;        // 重疊前短/長線關係（賣出用）
    let overlapVal = 0;                  // 重疊時的值
    
    for (let i = 1; i < closes.length; i++) {
        let buy = false, sell = false;
        
        if (shortMA[i] && longMA[i]) {
            // ========== 判斷目前和前一日的漲跌關係 ==========
            // currRel = 1: 短線 > 長線（上升狀態）
            // currRel = -1: 短線 < 長線（下降狀態）
            // currRel = 0: 短線 = 長線（重疊）
            const currRel = shortMA[i] > longMA[i] ? 1 : shortMA[i] < longMA[i] ? -1 : 0;
            const prevRel = shortMA[i-1] > longMA[i-1] ? 1 : shortMA[i-1] < longMA[i-1] ? -1 : 0;
            
            // ===== 黃金交叉（買入信號） =====
            // 上日：短線 < 長線（prevRel = -1）
            // 當日：短線 = 長線（currRel = 0）
            // → 記錄重疊日期，等待下一日確認
            if (prevRel === -1 && currRel === 0) {
                // 情況1：當天重疊（短線=長線）
                overlapBuyDay = i;
                beforeOverlapRelBuy = -1;
                overlapVal = +shortMA[i].toFixed(9);
            } 
            // 前次重疊是買入重疊（beforeOverlapRelBuy = -1）
            // 隔一天後（i === overlapBuyDay + 1）
            // 如果短線 > 長線（currRel > 0），則進行買入
            else if (overlapBuyDay > 0 && i === overlapBuyDay + 1 && beforeOverlapRelBuy === -1) {
                // 情況2：隔一天確認，如果短線 > 長線 -> 買入
                if (currRel > 0 && !inPosition && i < closes.length - 1) {
                    buy = true;
                    inPosition = true;
                }
                overlapBuyDay = -1;
            } 
            // 上日：短線 < 長線（prevRel = -1）
            // 當日：短線 > 長線（currRel > 0）
            // → 直接交叉，立即買入
            else if (prevRel === -1 && currRel > 0 && overlapBuyDay === -1 && !inPosition && i < closes.length - 1) {
                // 情況3：直接交叉（無重疊期），立即買入
                buy = true;
                inPosition = true;
            }
            
            // ===== 死亡交叉（賣出信號） =====
            // 上日：短線 > 長線（prevRel = 1）
            // 當日：短線 = 長線（currRel = 0）
            // → 記錄重疊日期，等待下一日確認
            if (prevRel === 1 && currRel === 0) {
                // 情況1：當天重疊
                overlapSellDay = i;
                beforeOverlapRelSell = 1;
                overlapVal = +shortMA[i].toFixed(9);
            } 
            // 前次重疊是賣出重疊（beforeOverlapRelSell = 1）
            // 隔一天後（i === overlapSellDay + 1）
            // 如果短線 < 長線（currRel < 0），則進行賣出
            else if (overlapSellDay > 0 && i === overlapSellDay + 1 && beforeOverlapRelSell === 1) {
                // 情況2：隔一天確認，如果短線 < 長線 -> 賣出
                if (currRel < 0 && inPosition) {
                    sell = true;
                    inPosition = false;
                }
                overlapSellDay = -1;
            } 
            // 上日：短線 > 長線（prevRel = 1）
            // 當日：短線 < 長線（currRel < 0）
            // → 直接交叉，立即賣出
            else if (prevRel === 1 && currRel < 0 && overlapSellDay === -1 && inPosition) {
                // 情況3：直接交叉，立即賣出
                sell = true;
                inPosition = false;
            }
        }
        
        signals.push({buy, sell});
    }
    return signals;
}
```

---

## 6️⃣ 實際交易執行邏輯

```javascript
/**
 * 根據信號進行買入/賣出的實時回測
 * 在此處進行手續費計算、持倉管理等
 */
function executeRealBacktest(closes, dates, signals, params) {
    const COMMISSION = params.trade_fee / 100;  // 0.08% → 0.0008
    
    const trades = [];                          // 所有交易記錄
    let position = 0;                           // 當前持倉股數
    let entryPrice = 0;                         // 進場價格
    let entryDate = 0;                          // 進場日期索引
    let cash = params.initial_capital;          // 可用現金
    let tradeCount = 0;                         // 交易總數
    
    // 遍歷每一日
    for (let i = 1; i < closes.length; i++) {
        const currentPrice = closes[i];
        
        // ===== 買入信號 =====
        if (position === 0 && signals[i].buy) {
            // 可買股數 = 現金 / (價格 × (1 + 手續費))
            const shares = Math.floor(cash / (currentPrice * (1 + COMMISSION)));
            
            if (shares > 0) {
                const cost = shares * currentPrice * (1 + COMMISSION);
                position = shares;
                entryPrice = currentPrice;
                entryDate = i;
                cash -= cost;
                tradeCount++;
                
                console.log(
                    `🟢 買入: ${dates[i]} | ` +
                    `價格: $${currentPrice.toFixed(2)} | ` +
                    `股數: ${shares} | ` +
                    `成本: $${cost.toFixed(2)}`
                );
            }
        }
        
        // ===== 賣出信號 =====
        else if (position > 0 && signals[i].sell) {
            // 賣出所得 = 股數 × 價格 × (1 - 手續費)
            const sellValue = position * currentPrice * (1 - COMMISSION);
            const entryProfit = sellValue - (position * entryPrice);
            const profitRatio = (entryProfit / (position * entryPrice)) * 100;
            
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
            
            console.log(
                `🔴 賣出: ${dates[i]} | ` +
                `價格: $${currentPrice.toFixed(2)} | ` +
                `獲利: $${entryProfit.toFixed(2)} | ` +
                `利率: ${profitRatio.toFixed(2)}%`
            );
            
            cash += sellValue;
            position = 0;
            tradeCount++;
        }
    }
    
    // 如果最後仍持倉，強制平倉
    if (position > 0) {
        const exitPrice = closes[closes.length - 1];
        const sellValue = position * exitPrice * (1 - COMMISSION);
        const entryProfit = sellValue - (position * entryPrice);
        
        trades.push({
            entryDate: dates[entryDate],
            exitDate: dates[dates.length - 1],
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            shares: position,
            profit: entryProfit,
            profitRate: (entryProfit / (position * entryPrice)) * 100,
            holdDays: closes.length - 1 - entryDate
        });
        
        cash += sellValue;
        tradeCount++;
    }
    
    // ===== 績效計算 =====
    const finalEquity = cash;
    const totalProfit = finalEquity - params.initial_capital;
    const returnRate = (totalProfit / params.initial_capital) * 100;
    
    // 勝率
    const winTrades = trades.filter(t => t.profit > 0);
    const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;
    
    // 平均獲利/虧損
    const avgWin = winTrades.length > 0 ? 
        winTrades.reduce((sum, t) => sum + t.profit, 0) / winTrades.length : 0;
    const lossTrades = trades.filter(t => t.profit <= 0);
    const avgLoss = lossTrades.length > 0 ? 
        lossTrades.reduce((sum, t) => sum + t.profit, 0) / lossTrades.length : 0;
    
    return {
        trades: trades,
        tradeCount: tradeCount,
        winRate: winRate,
        avgWin: avgWin,
        avgLoss: avgLoss,
        profit: totalProfit,
        finalEquity: finalEquity,
        returnRate: returnRate
    };
}
```

---

## 📊 完整調用流程

```javascript
// 1. 讀取和解析 CSV/Excel 檔案
const closes = [...];           // 收盤價數組
const dates = [...];             // 日期數組

// 2. 設置回測參數
const params = {
    short_ma: 20,
    long_ma: 60,
    ma_type: 'SMA',              // 可選 'EMA' 或 'WMA'
    initial_capital: 10000,
    trade_fee: 0.08
};

// 3. 生成交易信號
const signals = generateMASignals(closes, params);

// 4. 執行回測
const result = executeRealBacktest(closes, dates, signals, params);

// 5. 輸出結果
console.log(`總獲利: $${result.profit.toFixed(2)}`);
console.log(`勝率: ${result.winRate.toFixed(2)}%`);
console.log(`交易次數: ${result.tradeCount}`);
```

---

## 🔑 關鍵要點總結

| 項目 | 說明 |
|------|------|
| **MA 計算** | 使用 calculateMovingAverage(data, period, type) 函數 |
| **參數設定** | short_ma、long_ma、ma_type('SMA'/'EMA'/'WMA') |
| **取值位置** | 在當日計算時取 shortMA[i] 和 longMA[i] |
| **往前天數** | 通過 period 參數隱含控制（無 startIdx） |
| **買入信號** | 短線上穿長線（黃金交叉）→ buy = true |
| **賣出信號** | 短線下穿長線（死亡交叉）→ sell = true |
| **交叉類型** | 支持重疊確認和直接交叉兩種情況 |
| **手續費** | 在 executeRealBacktest 中計算，影響買入股數和賣出所得 |

