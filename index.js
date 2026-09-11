import { Octokit } from "https://esm.sh/octokit";

const octokit = new Octokit({
  auth: localStorage.getItem("token")
});

export async function faileGet(filePath) {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: "anotugi",
      repo: "save-data",
      path: filePath,
    });

    console.log("取得成功:", response)
    // レスポンスからBase64文字列を取得してデコード
    if ("content" in response.data && response.data.content != "") {
      const base64Content = response.data.content;
      return {
        is: true,
        data: base64Content.replace(/\n/g, ''),
        filePath
      }
    }
    else if("content" in response.data && response.data.content == ""){
      const blobResponse = await octokit.rest.git.getBlob({
        owner: "anotugi",
        repo: "save-data",
        file_sha: response.data.sha,
      });
      return {
        is: true,
        data: blobResponse.data.content.replace(/\n/g, ""),
        filePath
      }
    }
    console.error("取得エラー: contentが空です。");
    return {
      is: false,
    }
  } catch (error) {
    console.error("取得エラー:", error);
    return {
      is: false,
    }
  }
    
}

function base64ToBlobUrl(base64Content, contentType) {
  const binary = atob(base64Content)
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  const blob = new Blob([bytes], { type: contentType })
  return URL.createObjectURL(blob)
}

function base64ToText(base64Content) {
  const binary = atob(base64Content)
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function getFileExtension(filePath) {
  return filePath.split("?")[0].split("#").pop().split(".").pop().toLowerCase()
}

function displayFile(file) {
  const image = document.querySelector("#target-image")
  const pdf = document.querySelector("#target-pdf")
  const text = document.querySelector("#text")
  const download = document.querySelector("#download-file")
  const extension = getFileExtension(file.filePath)
  const imageTypes = new Map([
    ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"],
    ["gif", "image/gif"], ["webp", "image/webp"], ["svg", "image/svg+xml"]
  ])
  const textExtensions = new Set(["txt", "md", "json", "csv", "html", "htm", "js", "css"])

  image.style.display = "none"
  pdf.style.display = "none"
  text.style.display = "none"
  download.style.display = "none"

  if (imageTypes.has(extension)) {
    image.src = base64ToBlobUrl(file.data, imageTypes.get(extension))
    image.style.display = "block"
  } else if (extension === "pdf") {
    pdf.src = base64ToBlobUrl(file.data, "application/pdf")
    pdf.style.display = "block"
  } else if (textExtensions.has(extension)) {
    text.innerText = base64ToText(file.data)
    text.style.display = "block"
  } else {
    download.href = base64ToBlobUrl(file.data, "application/octet-stream")
    download.download = file.filePath.split("/").pop()
    download.style.display = "inline"
  }
}

const buttom = document.querySelector("#get-buttom")
buttom.addEventListener("click", async (el)=>{

  console.log(`読み込み 開始`)

  const fileName = document.querySelector("#file-name").value.trim()
  if (!fileName) {
    document.querySelector("#text").innerText = "ファイル名を入力してください。"
    return
  }

  const res = await faileGet(fileName)

  console.log(`読み込み 終了`)

  if(res.is){
    console.log(`成功`)
    displayFile(res)
  }

})

// // === 設定情報（実際の情報に置き換えてください） ===
// const GITHUB_TOKEN = `Bearer ${localStorage.getItem("token")}`; // fine-grained PAT (Contents: Read-only)
// const OWNER = 'anotugi';
// const REPO = 'save-data';                  // Privateリポジトリ名
// const BRANCH = 'main';
// const FILE_PATH = `${localStorage.getItem("path")}`;          

// console.log("処理の開始")
// // GitHub REST API のエンドポイント
// // const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
// const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
// console.log({url, GITHUB_TOKEN})

// try {
//   const response = await fetch(url, {
//     headers: {
//       'Authorization': `${GITHUB_TOKEN}`,
//       // 'raw' を指定することで、Base64ではなく生のバイナリデータとして取得
//       'Accept': 'application/vnd.github.v3.raw'
//     }
//   });

//   if (!response.ok) {const errorJson = await response.json();
//     console.log('GitHubエラー詳細:', errorJson);
//   }

//   // // 1. 画像データを Blob（バイナリ大きなオブジェクト）として取得
//   // const imageBlob = await response.blob();

//   // // 2. ブラウザ内で一時的に参照できる Blob URL を生成
//   // const objectUrl = URL.createObjectURL(imageBlob);

//   // // 3. <img> タグの src にセットして表示
//   // const imgElement = document.getElementById('target-image');
//   // imgElement.src = objectUrl;
//   // imgElement.style.display = 'block';

  
//   const text = await response.blob();
//   console.log(text)
//   // const textEl = document.getElementById("text")
//   // textEl.innerText = text

// } catch (error) {
//   console.error('画像の取得に失敗しました:', error);
//   alert('画像の取得に失敗しました。トークンやパスを確認してください。');
// }