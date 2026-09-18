// 画面読み込み時の初期化処理
export function initReader() {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    // タッチデバイス（スマホ・タブレット）用のリスナー登録
    setupTouchEvents();
  } else {
    // マウスデバイス（PC）用のリスナー登録
    // setupMouseEvents();
  }
}

// --------------------------------------------------
// 1. スマホ・タブレット（タッチ操作）向け処理
// --------------------------------------------------
export function setupTouchEvents() {
  const container = document.getElementById('reader');

  // 【ページ送り】スワイプジェスチャー判定 (touchstart / touchend)
  let touchStartX = 0;
  let touchStartY = 0;
  
  let touchPreviousX = 0;
  let touchPreviousY = 0;

  let oneTapIs = false;
  let oneTapTime = 0;
  let moveIs = false;

  let startNode = null;
  let startOffset = 0;

  container.addEventListener('touchstart', (e) => {
    e.preventDefault()

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    touchPreviousX = touchStartX;
    touchPreviousY = touchStartY;
  
    // console.log('タップ位置:', { x: e.touches[0].clientX, y: e.touches[0].clientY });
    const currentPoint = getCaretPoint(e.touches[0].clientX, e.touches[0].clientY);
    startNode = currentPoint.node;
    startOffset = currentPoint.offset;

    if((Date.now() - oneTapTime < 300)) {
      // 2回目のタップ（ダブルタップ）を検知
      console.log('ダブルタップ検知');
      // ダブルタップ時の処理をここに記述
      oneTapIs = false; // フラグをリセット
      moveIs = true;
    }
    else {
      oneTapIs = true;
      moveIs = false;
    }
    oneTapTime = Date.now();
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    e.preventDefault()

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchPreviousX;
    // console.log(touch);
    // console.log(`touchmove event: deltaX=${deltaX}, deltaY=${touch.clientY - touchStartY}`);
      // console.log(`指の移動を検知: ${Math.sqrt((touch.clientX - touchStartX)**2 + (touch.clientY - touchStartY)**2)}px`);

    if(!moveIs && Math.sqrt((touch.clientX - touchStartX)**2 + (touch.clientY - touchStartY)**2) >= 3){
      moveIs = true;
    }

    if(!moveIs && oneTapIs && (Date.now() - oneTapTime > 800)){
      oneTapIs = false;
    }

    if(oneTapIs) {
      // 指の移動量に合わせて横方向へスクロールする
      container.scrollBy({ left: -deltaX, behavior: 'instant' });
    }
    else{
      const currentPoint = getCaretPoint(touch.clientX, touch.clientY);
      if (!currentPoint) return;

      const range = new Range();

      // 起点と現在の移動位置の前後関係を判定してセット
      const position = startNode.compareDocumentPosition(currentPoint.node);
      
      if (position & Node.DOCUMENT_POSITION_FOLLOWING || 
        (startNode === currentPoint.node && startOffset <= currentPoint.offset)) {
        // 通常方向（上から下・左から右）の選択
        range.setStart(startNode, startOffset);
        range.setEnd(currentPoint.node, currentPoint.offset);
      } else {
        // 逆方向（下から上・右から左）の選択
        range.setStart(currentPoint.node, currentPoint.offset);
        range.setEnd(startNode, startOffset);
      }

      // 画面上の選択ハイライトを更新
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    touchPreviousX = touch.clientX;
    touchPreviousY = touch.clientY;
  }, { passive: false });

  
  container.addEventListener('touchend', (e) => {
    e.preventDefault()

    oneTapIs = false
    moveIs = false;
  }, { passive: false });
  // container.addEventListener('touchend', (e) => {
  //   const touchEndX = e.changedTouches[0].clientX;
  //   const touchEndY = e.changedTouches[0].clientY;

  //   const deltaX = touchEndX - touchStartX;
  //   const deltaY = touchEndY - touchStartY;

  //   // テキスト選択（長押しドラッグ）とスワイプの誤作動を防ぐため、選択領域がない場合のみ発動
  //   if (window.getSelection().toString().length > 0) return;

  //   // 水平方向のスワイプを優先検知（縦書きの場合、ページ送りは横移動）
  //   if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
  //     if (deltaX < 0) {
  //       // 右から左へスワイプ（次ページへスクロール等）
  //       nextPage();
  //     } else {
  //       // 左から右へスワイプ（前ページへ）
  //       prevPage();
  //     }
  //   }
  // }, { passive: true });

  // 【テキストの選択・コピー】
  // スマホは標準の「長押し選択（selectionchange）」を利用するのが最も自然
  // document.addEventListener('selectionchange', handleTextSelection);
}

function getCaretPoint(x, y) {
  if (document.caretRangeFromPoint) { // Chrome, Safari等
    const range = document.caretRangeFromPoint(x, y);
    return range ? { node: range.startContainer, offset: range.startOffset } : null;
  } else if (document.caretPositionFromPoint) { // Firefox
    const pos = document.caretPositionFromPoint(x, y);
    return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
  }
  return null;
}

// --------------------------------------------------
// 2. PC（マウス・キーボード操作）向け処理
// --------------------------------------------------
export function setupMouseEvents() {
  const container = document.getElementById('reader');
  const content = document.getElementById('content');

  // 【ページ送り】ホイール操作・キーボード・クリック操作

  // スクロールの方向と大きさ
  let scrollDirection = null;
  let scrollMagnitude = 0;

  // scrollMagnitude の減衰率
  let mgDecayRate = 0.9;

  let lastScrollTime = 0;

  container.addEventListener('wheel', (e) => {
    e.preventDefault();

  //   console.log(`wheel event: deltaY=${e.deltaY}, deltaX=${e.deltaX}, deltaMode=${e.deltaMode}`);
  //   // 縦書きコンテンツでは、縦ホイール（deltaY）を横スクロールに変換する制御が有効
  //   const nowDirection = e.deltaY > 0 ? 1 : -1;
  //   const nowTime = Date.now();

  //   if (nowTime - lastScrollTime > 500) {
  //     scrollDirection = nowDirection;
  //     scrollMagnitude = 5;
  //   }
  //   else if (nowDirection === scrollDirection) {
  //     scrollMagnitude += 2;
  //   }
  //   else {
  //     scrollMagnitude -= 2;
  //   }

  //   lastScrollTime = nowTime;

  //   scrollLoop();
  // }, { passive: false });

  // function scrollLoop() {
  //   if (scrollMagnitude < 0.1) {
  //     scrollDirection = null;
  //     scrollMagnitude = 0;


  //   }
  //   console.log(`x: ${scrollDirection * scrollMagnitude} scrollDirection: ${scrollDirection}, scrollMagnitude: ${scrollMagnitude}`);
  //   const getRect = content.getBoundingClientRect();

  //   console.log(getRect)

  //   // container.scrollBy({ left: scrollDirection * scrollMagnitude * 50, behavior: 'smooth' });

  //   const currentAnimation = container.animate(
  //     [
  //       { transform: `translateX(${0}px)` }, // A: 現在地からスタート
  //       { transform: `translateX(${scrollDirection * scrollMagnitude}px)` }  // B: 新しいスクロール目標位置
  //     ],
  //     {
  //       duration: 2000,     // 常に2秒かけて追従
  //       easing: 'ease-out',
  //       // fill: 'forwards'
  //     }
  //   );


    // document.getElementById('reader').scrollBy({ left: scrollDirection * scrollMagnitude, behavior: 'smooth' });
    // scrollMagnitude *= mgDecayRate;
  
    content.scrollBy({ left: scrollDirection * scrollMagnitude, behavior: 'smooth' });

  })    


  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'PageDown') nextPage();
    if (e.key === 'ArrowRight' || e.key === 'PageUp') prevPage();
  });

  // 【テキストのドラッグ＆ドロップ・コピー】
  // PC用のmouseup/copyイベント制御
  container.addEventListener('mouseup', () => {
    handleTextSelection();
  });

  // ドラッグ＆ドロップによる選択テキストの抽出（必要に応じたカスタムDrag処理）
  container.addEventListener('dragstart', (e) => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      // e.dataTransfer.setData('text/plain', selectedText);
    }
  });
}

// --------------------------------------------------
// 共通のテキスト選択処理・ページ送り処理
// --------------------------------------------------
export function handleTextSelection() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    console.log('選択されたテキスト:', selectedText);
    // ここでコピー用ポップアップを表示するなどのカスタム処理を実施
  }
}

export function nextPage() {
  document.getElementById('reader').scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
}

export function prevPage() {
  document.getElementById('reader').scrollBy({ left: window.innerWidth, behavior: 'smooth' });
}
