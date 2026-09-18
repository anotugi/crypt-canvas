import * as Lo from "./../functions/loads.js";
import * as Ua from "./../functions/user-action.js";


// 状態管理
let fontSize = 18;
let uiVisible = false;
let isDark = false;

const tapZone = document.getElementById('tapZone');
const uiLayer = document.getElementById('uiLayer');
const content = document.getElementById('content');
const docTitle = document.getElementById('docTitle');
const reader = document.getElementById('reader');

tapZone.style.display = "none"

// UI表示のトグル
tapZone.addEventListener('click', () => {
  if (!uiVisible) {
    uiLayer.classList.add('visible');
    uiVisible = true;
  } else {
    console.log('UI表示中にも関わらず tapZone でクリックされる');
  }
});

// UI表示のトグル
uiLayer.addEventListener('click', () => {
  if (uiVisible) {
    uiLayer.classList.remove('visible');
    uiVisible = false;
  } else {
    console.log('UI否表示中にも関わらず uiLayer でクリックされる');
  }
});

// 文字サイズの変更
document.getElementById('incFont').addEventListener('click', (e) => {
  e.stopPropagation();
  fontSize = Math.min(fontSize + 2, 32);
  document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
});

document.getElementById('decFont').addEventListener('click', (e) => {
  e.stopPropagation();
  fontSize = Math.max(fontSize - 2, 12);
  document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
});

// 背景テーマ切り替え
document.getElementById('toggleTheme').addEventListener('click', (e) => {
  e.stopPropagation();
  if (isDark) {
    isDark = !isDark;
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#d4d4d4';
  } else {
    document.body.style.backgroundColor = '#fcfaf2';
    document.body.style.color = '#2b2b2b';
  }
});

// 擬似的なサーバーデータの取得関数 (Fetch)
async function loadTextData() {
  
  let res = await Lo.faileGet("test-data/A_is_for_Angel.bin")

  if(res.is){
    try {
      if (Lo.getFileExtension(res.filePath) === "bin") {
        res = await Lo.decryptBinFile(res)
      }
      console.log(`成功`)
    } catch (error) {
      console.error("復号エラー:", error)
      document.querySelector("#text").innerText = "ファイルの復号に失敗しました。"
      document.querySelector("#text").style.display = "block"
    }
  }
  
  // HTMLの生成
  content.innerHTML = `<h1>Ａは<ruby>天使<rt>エンジェル</rt></ruby>のＡ</h1>` + 
    Lo.base64ToText(res.data)
    .replace(
      /\$([^/]+)\/([^$]+)\$/g,
      '<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>'
    )
    .split("\n")
    .map(p => `<p>${p}</p>`)
    .join('');

}


document.getElementById('fetchBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  loadTextData();
});

// 初期化
loadTextData();

// 初期化呼び出し
window.addEventListener('DOMContentLoaded', (e)=> {
  console.log("読み込み完了")

  Ua.initReader()
});