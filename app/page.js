'use client';

import * as Lo from "@/lib/github";
import { useState } from 'react';

export default function Home() {
  // 状態管理（State）
  const [pat, setPat] = useState('');
  const [status, setStatus] = useState('待機中');
  const [fileContent, setFileContent] = useState(null);

  async function loadTextData() {
    const octokit = Lo.getOctokitClient()
    const repositoryInfo = Lo.getRepositoryInfo()
    
    let res = await Lo.faileGet("test-data/A_is_for_Angel.bin", octokit, repositoryInfo)

    if(res.is){
      try {
        if (Lo.getFileExtension(res.filePath) === "bin") {
          res = await Lo.decryptBinFile(res, repositoryInfo)
        }
        console.log(`成功`)
        
      } catch (error) {
        console.error("復号エラー:", error)
        
        setStatus(`エラーが発生しました: ${error.message}`);
        return
      }
    }
    
    setStatus('ファイル取得成功！(復号処理待ち)');
    setFileContent(`取得サイズ: ${Lo.base64ToText(res.data).slice(0, 50)}`);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ヘッダーエリア */}
      <header className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white">プライベートファイルビューワー</h1>
        <p className="text-sm text-gray-400 mt-1">
          GitHub Private リポジトリの暗号化ファイルをクライアントサイドで復号して表示します。
        </p>
      </header>

      {/* 設定・認証エリア */}
      <section className="bg-gray-800 p-4 rounded-lg space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">1. GitHub 認証設定</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="github_pat_..."
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={loadTextData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white transition-colors"
        >
          ファイル取得テスト
        </button>
      </section>

      {/* ステータス・プレビューエリア */}
      <section className="bg-gray-800 p-4 rounded-lg space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">2. ステータス & プレビュー</h2>
        <div className="text-sm text-yellow-400 font-mono">
          状態: {status}
        </div>
        {fileContent && (
          <div className="p-3 bg-gray-900 rounded font-mono text-sm border border-gray-700">
            {fileContent}
          </div>
        )}
      </section>
    </main>
  );
}