import * as Lo from "./functions/loads.js";

function displayFile(file) {
  const image = document.querySelector("#target-image")
  const pdf = document.querySelector("#target-pdf")
  const text = document.querySelector("#text")
  const download = document.querySelector("#download-file")
  const extension = Lo.getFileExtension(file.filePath)
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
    image.src = Lo.base64ToBlobUrl(file.data, imageTypes.get(extension))
    image.style.display = "block"
  } else if (extension === "pdf") {
    pdf.src = Lo.base64ToBlobUrl(file.data, "application/pdf")
    pdf.style.display = "block"
  } else if (textExtensions.has(extension)) {
    text.innerText = Lo.base64ToText(file.data)
    text.style.display = "block"
  } else {
    download.href = Lo.base64ToBlobUrl(file.data, "application/octet-stream")
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

  let res = await Lo.faileGet(fileName)

  console.log(`読み込み 終了`)

  if(res.is){
    try {
      if (Lo.getFileExtension(res.filePath) === "bin") {
        res = await Lo.decryptBinFile(res)
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