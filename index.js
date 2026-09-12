import { Octokit } from "https://esm.sh/octokit";
import { scrypt } from "https://esm.sh/@noble/hashes@1.8.0/scrypt";

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

async function decryptBinFile(file) {
  const encrypted = Uint8Array.from(atob(file.data), character => character.charCodeAt(0))
  if (encrypted.length < 28) {
    throw new Error(".binファイルのサイズが不正です。")
  }

  const iv = encrypted.subarray(0, 12)
  const authTag = encrypted.subarray(12, 28)
  const encryptedData = encrypted.subarray(28)
  const password = new TextEncoder().encode("my-super-secret-password")
  const salt = new TextEncoder().encode("salt")
  const secretKey = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 32 })
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )

  // Node.js stores the authentication tag before the ciphertext. Web Crypto expects it after.
  const ciphertextWithTag = new Uint8Array(encryptedData.length + authTag.length)
  ciphertextWithTag.set(encryptedData)
  ciphertextWithTag.set(authTag, encryptedData.length)
  const decrypted = new Uint8Array(await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertextWithTag
  ))

  const fileType = detectFileType(decrypted)
  return {
    is: true,
    data: bytesToBase64(decrypted),
    filePath: file.filePath.replace(/\.bin$/i, fileType.extension),
  }
}

function bytesToBase64(bytes) {
  let binary = ""
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function detectFileType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: ".jpg" }
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { extension: ".png" }
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { extension: ".gif" }
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { extension: ".pdf" }
  }
  throw new Error("復号後のファイル形式を判定できません。")
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

  let res = await faileGet(fileName)

  console.log(`読み込み 終了`)

  if(res.is){
    try {
      if (getFileExtension(res.filePath) === "bin") {
        res = await decryptBinFile(res)
      }
      console.log(`成功`)
      displayFile(res)
    } catch (error) {
      console.error("復号エラー:", error)
      document.querySelector("#text").innerText = "ファイルの復号に失敗しました。"
      document.querySelector("#text").style.display = "block"
    }
  }

})