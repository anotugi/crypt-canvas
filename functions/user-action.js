// 画面読み込み時の初期化処理
export function initReader() {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    // タッチデバイス（スマホ・タブレット）用のリスナー登録
    setupTouchEvents();
  } else {
    // マウスデバイス（PC）用のリスナー登録
    setupMouseEvents();
  }
}

const oneScroll = window.innerWidth * 1
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

  // マウス初期のX方向のスクロールのタメ
  let scrolltank = 0;

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
      scrolltank = 0;
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

    // console.log(`指の移動量: X=${Math.abs(touch.clientX - touchStartX)}px, Y=${Math.abs(touch.clientY - touchStartY)}px`);
    // console.log(`is x: ${Math.abs(touch.clientX - touchStartX) > 10}, y: ${Math.abs(touch.clientY - touchStartY) > 20}`)

    if(!moveIs && oneTapIs && (Date.now() - oneTapTime > 800)){
      oneTapIs = false;
      console.log(`文字選択として判定`)
    }

    if(!moveIs && ( Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10)){
      moveIs = true;
      console.log('指が動いた');
    }

    if(oneTapIs) {
      // 指の移動量に合わせて横方向へスクロールする

      if(scrolltank > 10 || scrolltank < -10){
        container.scrollBy({ left: -deltaX, behavior: 'instant' });
      }
      else{
        scrolltank += deltaX;
        console.log('まだ、スクロール判定のない範囲の動き');
      }
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
    scrolltank = 0;
    touchPreviousX = null;
    touchPreviousY = null;

  }, { passive: false });
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

  const lens = 10
  const times = Array(lens).fill(null); // 過去5回のスクロールイベントのタイムスタンプを保持
  let nowIndex = 0;

  let cancelAnimeId = null
  function smoothScrollTo(element, _targetX) {
    // console.log(`smoothScrollTo seting id: ${cancelAnimeId}`);
    const targetX = Math.max(-element.scrollWidth + element.clientWidth, Math.min(_targetX, 0));
    if (cancelAnimeId !== null) {
      cancelAnimationFrame(cancelAnimeId);
      cancelAnimeId = null
      console.log(`old reset`);
    }
    function step() {
      const currentX = element.scrollLeft;
      const diff = targetX - currentX;
      // console.log(`smoothScrollTo diff： ${diff}`);

      cancelAnimationFrame(cancelAnimeId);
      // 目標地点に十分近づいたら停止
      if (Math.abs(diff) < 5) {
        element.scrollLeft = targetX;
        cancelAnimeId = null;
        console.log(`finish`);
        return;
      }

      // 徐々に目標に近づける (0.1 は減衰率)
      element.scrollLeft = currentX + diff * 0.1;

      cancelAnimeId = requestAnimationFrame(step);
    }
    cancelAnimeId = requestAnimationFrame(step);
  }

  container.addEventListener('wheel', (e) => {
    console.log(`wheel event: deltaY=${e.deltaY}, deltaX=${e.deltaX}, deltaMode=${e.deltaMode}`);
    // マウスホイールの判定
    if(e.deltaX == 0 && (e.deltaY == -100 || e.deltaY == 100)){
      e.preventDefault();

      times[nowIndex] = [Math.sign(e.deltaY), Date.now()];

      const nears = times.filter(t => t && times[nowIndex][0] === t[0] && times[nowIndex][1] - 100 < t[1]);

      console.log(`wheel event:  nears=${nears.length}`);

      // container.scrollBy({ left: -nears[0][0] * nears.length / lens * oneScroll, behavior: 'smooth' });

      smoothScrollTo(container, container.scrollLeft - nears[0][0] * nears.length / lens * oneScroll);

      nowIndex = (nowIndex + 1) % times.length;
    }
    else{
      console.log(`wheel event:  無効なホイール操作`);
    }

  })

  console.log()

  // document.addEventListener('keydown', (e) => {
  //   if (e.key === 'ArrowLeft' || e.key === 'PageDown') nextPage();
  //   if (e.key === 'ArrowRight' || e.key === 'PageUp') prevPage();
  // });

  // // 【テキストのドラッグ＆ドロップ・コピー】
  // // PC用のmouseup/copyイベント制御
  // container.addEventListener('mouseup', () => {
  //   handleTextSelection();
  // });

  // // ドラッグ＆ドロップによる選択テキストの抽出（必要に応じたカスタムDrag処理）
  // container.addEventListener('dragstart', (e) => {
  //   const selectedText = window.getSelection().toString();
  //   if (selectedText) {
  //     // e.dataTransfer.setData('text/plain', selectedText);
  //   }
  // });
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
