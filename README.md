# Tarot Research · 私人三系統塔羅研究室

這是純前端 PWA，支援手機與電腦。**沒有帳號、遠端伺服器或自動跨裝置同步。** 所有紀錄只存於目前瀏覽器的 IndexedDB，請定期下載 JSON 備份。

## 功能
- 三套完整 78 張牌：托特 Thoth、偉特 Rider–Waite–Smith、馬賽 Tarot de Marseille
- 各系統單獨洗牌：使用 Web Crypto 亂數、交錯洗牌、分疊、180° 旋轉部分牌疊、切牌
- 原始問題輸入後洗好一整副牌，固定牌序、正逆方向與底牌；然後從頂端依牌位抽出
- **托特與馬賽即使預設不使用逆位解牌，仍會記錄實際物理正逆方向**
- 補牌預設：**先輸入補問 → 重新洗該系統剩餘牌 → 再抽一張**。原牌與底牌不放回；可選擇不洗牌而接續抽下一張
- 每次補牌記錄隸屬位置、原問題、系統、洗牌模式、時間和實際牌面
- 可追加解讀與後續驗證紀錄，不覆蓋原牌／原問題
- IndexedDB 歷史搜尋，JSON 完整備份、Markdown 全紀錄、CSV 索引；JSON 匯入跳過相同 ID
- PWA 安裝及離線操作（需先經 HTTPS 正常載入）

## 部署方式（建議 GitHub Pages）

1. 新建 GitHub repository，例如 `tarot-research-private`。若採 GitHub Pages，**發布出來的網站內容可能公開**，但占卜記錄本身不會被上傳；不要把備份 JSON、私人對話或密碼提交到 repository。
2. 將這個資料夾裡的 `index.html`、`*.js`、`styles.css`、`icon*`、`manifest.webmanifest`、`sw.js` 放入 repository 根目錄。
3. 進入 Settings → Pages → Build and deployment → Deploy from a branch → main / root。
4. 等 GitHub Pages 顯示 HTTPS 連結後，於 iPhone 的 Safari 開啟網站。使用「分享」→「加入主畫面」以 PWA 方式啟動。
5. 從網站「備份」下載完整 JSON，妥善保存在私人的雲端硬碟或電腦。

## 電腦本機測試

不建議直接在檔案管理員點開 `index.html`，因為 ES modules 及 IndexedDB 的 `file://` 支援不一致。請以簡易 HTTP Server 開啟：

```bash
cd tarot-research-private
python -m http.server 8080
```

再開啟 http://localhost:8080 。

## 注意事項

- 程式內建自製文字版卡面，不使用尚未取得授權的托特牌圖。
- 「三套系統」是 **3 次獨立洗牌與抽牌**，不是同一張隨機牌的 3 種圖片。
- 網頁雖模擬實體牌的順序與正逆，仍無法實現人手洗牌的觸覺與全部物理細節；洗牌公平性基礎使用 Web Crypto 隨機數。
- 使用新裝置、清除網站資料、Safari 清除空間／解除安裝、無痕模式都有資料遺失風險。
- 已存在的補牌不會被覆寫；若要重問同一問題，請建立新的補牌或新的占卜。
- 程式不自動解讀牌義，也不將占卜視為真實第三人的心理證據。
