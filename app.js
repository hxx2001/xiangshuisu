// AETHERIAL 灵魂萃取 - Web版

const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

// 应用状态
const app = {
  data: {
    page: 'landing',
    userInfo: { avatarUrl: defaultAvatar, nickName: '' },
    hasAvatar: false,
    starOpacity: 1,
    typeTextMain: '',
    typeTextSub: '',
    currentIdx: 0,
    currentQuestion: null,
    currentQuote: '',
    quizMeta: 'TOP NOTES',
    statusZh: '',
    statusEn: '',
    result: null,
    analysis: null,
    starAnim: {},
    resonanceStarOpacity: 0,
    randomStartX: 0,
    randomStartY: 0,
    liquidHeight: 0,
    starPhase: 1,
    starCollapse: 1,
    activeIdx: -1,
    selectedFullText: false,
    activeNote: 'top',
    activeSection: 'insight',
    fateInfo: null
  },

  audioCtx: null,
  stars: [],
  scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
  userChoices: [],
  _timer: null,
  starCanvas: null,
  starCtx: null,
  bottleCanvas: null,
  bottleCtx: null,
  animationFrameId: null
};

// 初始化
function init() {
  // 获取 DOM 元素
  app.starCanvas = document.getElementById('starCanvas');
  app.bottleCanvas = document.getElementById('bottleCanvas');

  // 初始化数据
  app.data.currentQuestion = questions[0];
  app.data.currentQuote = quotesData.quotes[0];
  app.data.hasAvatar = true; // Web版默认使用默认头像

  // 显示默认头像
  const avatarImg = document.getElementById('avatarImg');
  const avatarTip = document.getElementById('avatarTip');
  if (avatarImg && avatarTip) {
    avatarImg.src = defaultAvatar;
    avatarImg.style.display = 'block';
    avatarTip.style.display = 'none';
  }

  // 初始化星星背景
  initStarField();

  // 循环播放名言
  loopQuotes();

  // 初始化音频
  initAudio();

  // 绑定事件
  bindEvents();
}

// 绑定事件
function bindEvents() {
  // 头像选择
  const avatarInput = document.getElementById('avatarInput');
  avatarInput.addEventListener('change', handleAvatarChange);

  // 昵称输入
  const nicknameInput = document.getElementById('nicknameInput');
  nicknameInput.addEventListener('input', handleNicknameChange);

  // 进入按钮
  document.getElementById('btnEnter').addEventListener('click', handleEnter);

  // 宇宙重启
  document.getElementById('btnRestart').addEventListener('click', handleRestart);

  // 深度解析
  document.getElementById('btnAnalysis').addEventListener('click', handleAnalysis);

  // 返回按钮
  document.getElementById('btnBack').addEventListener('click', handleBack);
  document.getElementById('btnBackResult').addEventListener('click', handleBackResult);

  // 香调切换
  document.querySelectorAll('.note-tab').forEach(tab => {
    tab.addEventListener('click', (e) => switchNote(e.target.dataset.type));
  });

  // 模块切换
  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', (e) => switchSection(e.target.dataset.section));
  });
}

// 处理头像选择
function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      app.data.userInfo.avatarUrl = event.target.result;
      app.data.hasAvatar = true;

      const avatarImg = document.getElementById('avatarImg');
      const avatarTip = document.getElementById('avatarTip');
      avatarImg.src = app.data.userInfo.avatarUrl;
      avatarImg.style.display = 'block';
      avatarTip.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

// 处理昵称输入
function handleNicknameChange(e) {
  app.data.userInfo.nickName = e.target.value;
}

// 处理进入
function handleEnter() {
  // Web版允许使用默认头像，直接检查昵称
  if (!app.data.userInfo.nickName) {
    showToast('请在横线处输入灵感昵称');
    return;
  }
  if (app.audioCtx) {
    try {
      app.audioCtx.play().catch(() => {});
      app.audioCtx.pause();
    } catch(e) {}
  }
  if (app.data.currentIdx === 0) {
    setData({ starOpacity: 0.2 });
  }
  setTimeout(() => {
    setData({ page: 'intro', typeTextMain: '', typeTextSub: '' });
    const m = "即将探索你的香水塑人格...";
    const s = "START YOUR OLFACTORY ODYSSEY";
    runTypeWriter(m, s);
  }, 600);
}

// 显示提示
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

// 打字机效果
function runTypeWriter(main, sub) {
  if (app._timer) clearInterval(app._timer);
  let i = 0, j = 0;
  app._timer = setInterval(() => {
    let updated = false;
    if (i < main.length) {
      i++;
      setData({ typeTextMain: main.substring(0, i) });
      updated = true;
    }
    if (i > 3 && j < sub.length) {
      j++;
      setData({ typeTextSub: sub.substring(0, j) });
      updated = true;
    }
    if (!updated) {
      clearInterval(app._timer);
      setTimeout(() => {
        setData({ starOpacity: 1, page: 'quiz' });
        showQuestion();
      }, 1200);
    }
  }, 120);
}

// 显示问题
function showQuestion() {
  const idx = app.data.currentIdx;
  let meta = idx < 4 ? 'TOP' : (idx < 8 ? 'HEART' : (idx < 12 ? 'BASE' : 'FINAL'));

  setData({
    page: 'quiz',
    currentQuestion: questions[idx],
    quizMeta: meta + ' NOTES',
    starPhase: idx < 4 ? 1 : (idx < 8 ? 2 : (idx < 12 ? 3 : 4)),
    activeIdx: -1,
    selectedFullText: false
  });

  // 渲染选项
  renderOptions();
}

// 渲染选项
function renderOptions() {
  const idx = app.data.currentIdx;
  const question = questions[idx];
  const isFinal = idx === 12;

  // 进度显示
  const progressEl = document.getElementById('quizProgress');
  if (idx < 12) {
    progressEl.textContent = `${idx + 1}/12`;
    progressEl.style.display = 'block';
  } else {
    progressEl.style.display = 'none';
  }

  // 标题
  document.getElementById('qTitle').textContent = question.title;
  document.getElementById('qTitle').className = isFinal ? 'q-title final-title' : 'q-title';

  // 元信息
  const metaEl = document.getElementById('quizMeta');
  if (isFinal) {
    metaEl.textContent = '✦ 终极拷问 ✦';
    metaEl.className = 'q-meta final-meta';
  } else {
    metaEl.textContent = app.data.quizMeta;
    metaEl.className = 'q-meta';
  }

  // 选项容器
  const optionsGrid = document.getElementById('optionsGrid');
  const finalOptions = document.getElementById('finalOptions');
  const finalSingle = document.getElementById('finalSingle');

  optionsGrid.innerHTML = '';
  finalOptions.innerHTML = '';

  if (isFinal) {
    optionsGrid.style.display = 'none';
    if (!app.data.selectedFullText) {
      finalOptions.style.display = 'flex';
      finalSingle.style.display = 'none';

      question.options.forEach((opt, optIdx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'final-opt-wrapper';
        const btn = document.createElement('div');
        btn.className = 'final-opt-btn';
        btn.textContent = opt.text;
        btn.dataset.index = optIdx;
        btn.addEventListener('click', () => handleSelect(optIdx));
        wrapper.appendChild(btn);
        finalOptions.appendChild(wrapper);
      });
    } else {
      finalOptions.style.display = 'none';
      finalSingle.style.display = 'block';
      document.getElementById('expandedText').textContent = question.options[app.data.activeIdx].fullText;
    }
  } else {
    optionsGrid.style.display = 'flex';
    finalOptions.style.display = 'none';
    finalSingle.style.display = 'none';

    question.options.forEach((opt, optIdx) => {
      const cell = document.createElement('div');
      cell.className = 'opt-cell';
      const btn = document.createElement('div');
      btn.className = 'opt-btn';
      btn.textContent = opt.text;
      btn.dataset.index = optIdx;
      btn.addEventListener('click', () => handleSelect(optIdx));
      cell.appendChild(btn);
      optionsGrid.appendChild(cell);
    });
  }
}

// 处理选择
function handleSelect(index) {
  const currentQ = questions[app.data.currentIdx];
  const selectedOption = currentQ.options[index];

  // 终极拷问处理
  if (app.data.currentIdx === 12) {
    if (!app.data.selectedFullText) {
      setData({ activeIdx: index, selectedFullText: true });

      app.userChoices.push({
        questionIdx: app.data.currentIdx,
        optionIndex: index,
        scores: selectedOption.scores,
        isSSRTrigger: selectedOption.isSSRTrigger || null
      });

      const scoreMap = selectedOption.scores;
      for (let key in scoreMap) {
        if (app.scores[key] !== undefined) {
          app.scores[key] += scoreMap[key];
        }
      }

      // 重新渲染显示展开的文案
      renderOptions();

      // 等待动画完成后跳转
      setTimeout(() => {
        setData({ currentIdx: 13 });
        runResonance();
      }, 4000);
      return;
    }
  }

  setData({ activeIdx: index });

  app.userChoices.push({
    questionIdx: app.data.currentIdx,
    optionIndex: index,
    scores: selectedOption.scores,
    isSSRTrigger: selectedOption.isSSRTrigger || null
  });

  const scoreMap = selectedOption.scores;
  for (let key in scoreMap) {
    if (app.scores[key] !== undefined) {
      app.scores[key] += scoreMap[key];
    }
  }

  setTimeout(() => {
    const nextIdx = app.data.currentIdx + 1;
    if (nextIdx === 4) showProgress('top', 53);
    else if (nextIdx === 8) showProgress('heart', 106);
    else if (nextIdx === 12) showProgress('base', 160);
    else if (nextIdx === 13) {
      setData({ currentIdx: 13 });
      runResonance();
    } else {
      setData({ currentIdx: nextIdx, selectedFullText: false });
      showQuestion();
    }
  }, 350);
}

// 显示进度
function showProgress(stage, targetH) {
  const heartTexts = ['核心香调正于灵魂深处共振...', '中调成分正在重构嗅觉逻辑...', '感性的中调正在香氛中苏醒...'];
  const baseTexts = ['漫长的后调正在寻找永恒落点...', '基底深处的记忆正在被唤醒...', '后调韵脚正在书写最终告白...'];
  let zh = '', en = '';
  if (stage === 'top') { zh = '前调似乎已经生成？'; en = 'TOP NOTES CRYSTALLIZING'; }
  else if (stage === 'heart') { zh = heartTexts[Math.floor(Math.random() * 3)]; en = 'HEART NOTES RESONATING'; }
  else { zh = baseTexts[Math.floor(Math.random() * 3)]; en = 'BASE NOTES LINGERING'; }

  const nextPhase = stage === 'top' ? 2 : (stage === 'heart' ? 3 : 4);
  setData({ page: 'progress', statusZh: zh, statusEn: en, starPhase: nextPhase });

  document.getElementById('statusZh').textContent = zh;
  document.getElementById('statusEn').textContent = en;

  animateBottle(targetH, () => {
    setTimeout(() => {
      if (stage === 'base') {
        setData({ currentIdx: 12 });
        const m = quotesData.resonanceQuotes[Math.floor(Math.random() * quotesData.resonanceQuotes.length)];
        toIntro(m, "THE FINAL RESONANCE");
      } else {
        setData({ currentIdx: app.data.currentIdx + 1 });
        showQuestion();
      }
    }, 1200);
  });
}

// 打字机跳转
function toIntro(msg, sub) {
  setData({ page: 'intro', typeTextMain: '', typeTextSub: '' });
  let m = (typeof msg === 'string') ? msg : "即将探索你的香水塑人格...";
  let s = (typeof sub === 'string') ? sub : "START YOUR OLFACTORY ODYSSEY";
  runTypeWriter(m, s);
}

// 共鸣动画
function runResonance() {
  // 先显示进度页面
  setData({ page: 'progress', statusZh: '灵魂契约达成中...', statusEn: 'FINAL RESONANCE...', starPhase: 4 });
  document.getElementById('statusZh').textContent = '灵魂契约达成中...';
  document.getElementById('statusEn').textContent = 'FINAL RESONANCE...';

  // 等待页面显示后再获取元素位置
  setTimeout(() => {
    const starEl = document.getElementById('resonanceStar');
    const bottleEl = document.getElementById('bottleAnchor');

    if (starEl && bottleEl) {
      const bottleRect = bottleEl.getBoundingClientRect();
      const winW = window.innerWidth;

      // 星辰从屏幕上方任意位置飞入瓶子位置
      const startX = Math.random() * winW; // 屏幕上方的任意X位置
      const startY = -50; // 屏幕上方可见区域外
      const endX = bottleRect.left + bottleRect.width / 2;
      const endY = bottleRect.top + 30;

      // 设置初始位置（屏幕上方）
      starEl.style.transition = 'none';
      starEl.style.left = startX + 'px';
      starEl.style.top = startY + 'px';
      starEl.style.transform = 'scale(1)';
      starEl.style.opacity = '1';

      // 强制重绘
      starEl.offsetHeight;

      // 飞向瓶子
      setTimeout(() => {
        starEl.style.transition = 'all 1.2s ease-in';
        starEl.style.left = endX + 'px';
        starEl.style.top = endY + 'px';
        starEl.style.transform = 'scale(3)';

        // 飞入瓶子后缩小消失并填充
        setTimeout(() => {
          starEl.style.transition = 'all 0.3s ease';
          starEl.style.transform = 'scale(0)';
          starEl.style.opacity = '0';

          // 开始瓶子填充动画
          setTimeout(() => {
            try {
              if (app.audioCtx) app.audioCtx.pause();
            } catch(e) {}

            animateBottle(180, () => {
              setTimeout(() => {
                setData({ page: 'shaping' });
                document.getElementById('shapingName').textContent = '"' + app.data.userInfo.nickName + '"';
                setTimeout(() => calculateFinalResult(), 2500);
              }, 800);
            });
          }, 300);
        }, 1200);
      }, 50);
    } else {
      // 如果元素不存在，直接跳过动画
      proceedToNext();
    }
  }, 100);
}

function proceedToNext() {
  try {
    if (app.audioCtx) app.audioCtx.pause();
  } catch(e) {}

  animateBottle(180, () => {
    setTimeout(() => {
      setData({ page: 'shaping' });
      document.getElementById('shapingName').textContent = '"' + app.data.userInfo.nickName + '"';
      setTimeout(() => calculateFinalResult(), 2500);
    }, 800);
  });
}

// 初始化音频
function initAudio() {
  if (app.audioCtx) return;
  app.audioCtx = new Audio();
  app.audioCtx.src = 'https://636c-cloud1-4gtujyjt90515197-1404297504.tcb.qcloud.la/pour.mp3';
  app.audioCtx.loop = true;
}

// 初始化星星背景
function initStarField() {
  if (!app.starCanvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = app.starCanvas.getBoundingClientRect();

  app.starCanvas.width = rect.width * dpr;
  app.starCanvas.height = rect.height * dpr;
  app.starCanvas.style.width = rect.width + 'px';
  app.starCanvas.style.height = rect.height + 'px';

  app.starCtx = app.starCanvas.getContext('2d');
  app.starCtx.scale(dpr, dpr);

  app.stars = Array(800).fill(0).map((_, i) => ({
    x: (Math.random() - 0.5) * rect.width * 2,
    y: (Math.random() - 0.5) * rect.height * 2,
    z: Math.random() * rect.width,
    class: (i % 20 === 0) ? 'alpha' : ((i % 6 === 0) ? 'beta' : 'gamma')
  }));

  renderStars();
}

// 渲染星星
function renderStars() {
  if (!app.starCtx || !app.starCanvas) return;

  const rect = app.starCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  app.starCtx.fillStyle = '#000000';
  app.starCtx.fillRect(0, 0, width, height);

  const phase = app.data.starPhase;
  const collapse = app.data.starCollapse || 1;

  app.stars.forEach(s => {
    s.z -= 0.15;
    if (s.z <= 0) s.z = width;

    let x = (s.x / s.z) * 100 + width / 2;
    let y = (s.y / s.z) * 100 + height / 2;

    if (collapse > 1) {
      const cx = width / 2;
      const cy = height / 2;
      x = cx + (x - cx) / collapse;
      y = cy + (y - cy) / collapse;
    }

    const a = (1 - s.z / width);
    let size = a * 0.8, glow = 0, op = a * 0.5;

    if (phase >= 2) { if (s.class === 'beta') { size = a * 2.0; glow = 6; op = a * 1.0; } }
    if (phase >= 3) { if (s.class === 'gamma') { size = a * 1.2; op = a * 0.9; } }
    if (phase >= 4) { if (s.class === 'alpha') { size = a * 4.5; glow = 20; op = 1.0; } }

    if (collapse > 1) { size = size * 0.6; op = Math.min(1, op * 1.5); }

    app.starCtx.save();
    if (glow > 0) {
      app.starCtx.shadowBlur = glow * a;
      app.starCtx.shadowColor = '#fff';
    }
    app.starCtx.fillStyle = `rgba(255,255,255,${op})`;
    app.starCtx.beginPath();
    app.starCtx.arc(x, y, size, 0, Math.PI * 2);
    app.starCtx.fill();
    app.starCtx.restore();
  });

  app.animationFrameId = requestAnimationFrame(renderStars);
}

// 瓶子动画
function animateBottle(targetH, cb) {
  if (!app.bottleCanvas) {
    // 如果canvas不存在，跳过动画
    if (cb) cb();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  let rect = app.bottleCanvas.getBoundingClientRect();

  // 如果 canvas 尺寸为 0（隐藏状态），使用默认值
  if (rect.width === 0 || rect.height === 0) {
    rect = { width: 180, height: 300 };
    app.bottleCanvas.width = rect.width * dpr;
    app.bottleCanvas.height = rect.height * dpr;
    app.bottleCanvas.style.width = rect.width + 'px';
    app.bottleCanvas.style.height = rect.height + 'px';
  } else {
    app.bottleCanvas.width = rect.width * dpr;
    app.bottleCanvas.height = rect.height * dpr;
    app.bottleCanvas.style.width = rect.width + 'px';
    app.bottleCanvas.style.height = rect.height + 'px';
  }

  app.bottleCtx = app.bottleCanvas.getContext('2d');
  app.bottleCtx.scale(dpr, dpr);

  let curH = app.data.liquidHeight;

  if (app.audioCtx) {
    try {
      app.audioCtx.currentTime = 0;
      app.audioCtx.play().catch(() => {});
    } catch(e) {}
  }

  const step = () => {
    if (curH < targetH) {
      curH += 1.5;
      drawBottleFrame(app.bottleCtx, rect.width, rect.height, curH);
      requestAnimationFrame(step);
    } else {
      setData({ liquidHeight: targetH });
      try {
        if (app.audioCtx) app.audioCtx.pause();
      } catch(e) {}
      if (cb) cb();
    }
  };
  step();
}

// 绘制瓶子
function drawBottleFrame(ctx, w, h, lh) {
  ctx.clearRect(0, 0, w, h);
  const bx = (w - 100) / 2;
  const path = (c) => {
    c.beginPath();
    c.moveTo(bx + 5, 180);
    c.lineTo(bx + 95, 180);
    c.lineTo(bx + 100, 70);
    c.lineTo(bx + 80, 70);
    c.lineTo(bx + 80, 30);
    c.lineTo(bx + 20, 30);
    c.lineTo(bx + 20, 70);
    c.lineTo(bx + 0, 70);
    c.closePath();
  };
  path(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.save();
  path(ctx);
  ctx.clip();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 180 - lh, w, lh + 50);
  ctx.restore();
  path(ctx);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// 计算最终结果
function calculateFinalResult() {
  const s = app.scores;

  // MBTI
  const mbti = (s.E >= s.I ? 'E' : 'I') +
               (s.S >= s.N ? 'S' : 'N') +
               (s.T >= s.F ? 'T' : 'F') +
               (s.J >= s.P ? 'J' : 'P');

  const finalChoice = app.userChoices[app.userChoices.length - 1];
  const ssrTrigger = finalChoice ? finalChoice.isSSRTrigger : null;

  let resultKey = mbti;

  // SSR 判定
  if (ssrTrigger) {
    if (ssrTrigger === 'dark') {
      if (mbti.includes('E')) resultKey = 'SSR_EVIL';
      else if (mbti.includes('T')) resultKey = 'SSR_TABOO';
    } else if (ssrTrigger === 'holy') {
      if (mbti.includes('N')) resultKey = 'SSR_INFJ';
      else resultKey = 'SSR_SWEET';
    } else if (ssrTrigger === 'cold') {
      if (mbti.includes('I') && mbti.includes('T')) {
        if (mbti.includes('N')) resultKey = 'SSR_FIRE_ICE';
        else resultKey = 'SSR_ABYSS';
      } else if (mbti.includes('S')) {
        resultKey = 'SSR_BLANK';
      }
    }
  }

  const result = perfumes[resultKey] || perfumes['INTJ'];
  const analysis = analysisData[resultKey] || analysisData['INTJ'];
  const fateInfo = calculateFateInfo(resultKey);

  setData({ page: 'result', result: result, analysis: analysis, fateInfo: fateInfo });

  // 渲染结果页
  renderResult(result, analysis, fateInfo);
}

// 计算宿命余香
function calculateFateInfo(resultKey) {
  const similarityMap = {
    'INTJ': { similar: ['INTP', 'ENTJ'], similarRatio: [87, 72], opposite: 'ENFP' },
    'INTP': { similar: ['INTJ', 'ENTP'], similarRatio: [87, 75], opposite: 'ESFJ' },
    'ENTJ': { similar: ['INTJ', 'ENTP'], similarRatio: [72, 68], opposite: 'INFP' },
    'ENTP': { similar: ['INTP', 'ENTJ'], similarRatio: [75, 68], opposite: 'ISFJ' },
    'INFJ': { similar: ['INFP', 'ENFJ'], similarRatio: [85, 76], opposite: 'ESTP' },
    'INFP': { similar: ['INFJ', 'ISFP'], similarRatio: [85, 78], opposite: 'ESTJ' },
    'ENFJ': { similar: ['INFJ', 'ENFP'], similarRatio: [76, 74], opposite: 'ISTP' },
    'ENFP': { similar: ['INFP', 'ENFJ'], similarRatio: [74, 74], opposite: 'INTJ' },
    'ISTJ': { similar: ['ISFJ', 'ESTJ'], similarRatio: [82, 71], opposite: 'ENFP' },
    'ISFJ': { similar: ['ISTJ', 'ESFJ'], similarRatio: [82, 77], opposite: 'ENTP' },
    'ESTJ': { similar: ['ISTJ', 'ESFJ'], similarRatio: [71, 77], opposite: 'INFP' },
    'ESFJ': { similar: ['ISFJ', 'ESTJ'], similarRatio: [77, 77], opposite: 'INTP' },
    'ISTP': { similar: ['ISFP', 'ESTP'], similarRatio: [79, 73], opposite: 'ENFJ' },
    'ISFP': { similar: ['INFP', 'ISTP'], similarRatio: [78, 79], opposite: 'ENTJ' },
    'ESTP': { similar: ['ISTP', 'ESFP'], similarRatio: [73, 76], opposite: 'INFJ' },
    'ESFP': { similar: ['ESTP', 'ENFP'], similarRatio: [76, 71], opposite: 'INTJ' },
    'SSR_INFJ': { similar: ['INFJ', 'SSR_FIRE_ICE'], similarRatio: [88, 65], opposite: 'ESTP' },
    'SSR_FIRE_ICE': { similar: ['INTJ', 'SSR_INFJ'], similarRatio: [70, 65], opposite: 'ESFJ' },
    'SSR_EVIL': { similar: ['ENTP', 'ESTP'], similarRatio: [78, 72], opposite: 'SSR_SWEET' },
    'SSR_ABYSS': { similar: ['INTJ', 'INTP'], similarRatio: [82, 79], opposite: 'ENFP' },
    'SSR_BLANK': { similar: ['ISTJ', 'ISFJ'], similarRatio: [80, 75], opposite: 'ENFP' },
    'SSR_TABOO': { similar: ['ENTJ', 'SSR_EVIL'], similarRatio: [74, 68], opposite: 'SSR_SWEET' },
    'SSR_SWEET': { similar: ['ENFP', 'ESFJ'], similarRatio: [76, 72], opposite: 'SSR_EVIL' },
    'SSR_ARTIST': { similar: ['INFP', 'ISFP'], similarRatio: [83, 79], opposite: 'ESTJ' }
  };

  const info = similarityMap[resultKey] || similarityMap['INTJ'];

  return {
    similar1: { key: info.similar[0], ...perfumes[info.similar[0]] },
    similar2: { key: info.similar[1], ...perfumes[info.similar[1]] },
    similarRatio1: info.similarRatio[0],
    similarRatio2: info.similarRatio[1],
    opposite: { key: info.opposite, ...perfumes[info.opposite] }
  };
}

// 渲染结果页
function renderResult(result, analysis, fateInfo) {
  document.getElementById('resultAvatar').src = app.data.userInfo.avatarUrl;
  document.getElementById('resultNickname').textContent = app.data.userInfo.nickName + ' 的灵魂回响';
  document.getElementById('resEn').textContent = result.en;
  document.getElementById('resZh').textContent = result.zh;
  document.getElementById('resTop').textContent = result.top;
  document.getElementById('resHeart').textContent = result.heart;
  document.getElementById('resBase').textContent = result.base;
  document.getElementById('resSoul').textContent = result.soul;
}

// 处理分析
function handleAnalysis() {
  setData({ page: 'analysis', activeNote: 'top', activeSection: 'insight' });

  const result = app.data.result;
  const analysis = app.data.analysis;
  const fateInfo = app.data.fateInfo;

  // 香调内容
  document.getElementById('noteContent').textContent = analysis.top;

  // 灵魂总评
  document.getElementById('insightContent').textContent = analysis.insight;

  // 宿命余香
  document.getElementById('similar1En').textContent = fateInfo.similar1.en;
  document.getElementById('similar1Zh').textContent = fateInfo.similar1.zh;
  document.getElementById('similar1Top').textContent = '前：' + fateInfo.similar1.top;
  document.getElementById('similar1Heart').textContent = '中：' + fateInfo.similar1.heart;
  document.getElementById('similar1Base').textContent = '后：' + fateInfo.similar1.base;
  document.getElementById('similar1Text').textContent = fateInfo.similarRatio1 + '% 相似';

  document.getElementById('similar2En').textContent = fateInfo.similar2.en;
  document.getElementById('similar2Zh').textContent = fateInfo.similar2.zh;
  document.getElementById('similar2Top').textContent = '前：' + fateInfo.similar2.top;
  document.getElementById('similar2Heart').textContent = '中：' + fateInfo.similar2.heart;
  document.getElementById('similar2Base').textContent = '后：' + fateInfo.similar2.base;
  document.getElementById('similar2Text').textContent = fateInfo.similarRatio2 + '% 相似';

  document.getElementById('oppositeEn').textContent = fateInfo.opposite.en;
  document.getElementById('oppositeZh').textContent = fateInfo.opposite.zh;
  document.getElementById('oppositeTop').textContent = '前：' + fateInfo.opposite.top;
  document.getElementById('oppositeHeart').textContent = '中：' + fateInfo.opposite.heart;
  document.getElementById('oppositeBase').textContent = '后：' + fateInfo.opposite.base;

  // 延迟显示进度条
  setTimeout(() => {
    document.getElementById('similar1Bar').style.width = fateInfo.similarRatio1 + '%';
    document.getElementById('similar2Bar').style.width = fateInfo.similarRatio2 + '%';
  }, 300);
}

// 切换香调
function switchNote(type) {
  setData({ activeNote: type });

  document.querySelectorAll('.note-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });

  const analysis = app.data.analysis;
  const noteLabel = document.getElementById('noteLabel');
  const noteContent = document.getElementById('noteContent');

  if (type === 'top') {
    noteLabel.textContent = 'TOP NOTES';
    noteContent.textContent = analysis.top;
  } else if (type === 'heart') {
    noteLabel.textContent = 'HEART NOTES';
    noteContent.textContent = analysis.heart;
  } else {
    noteLabel.textContent = 'BASE NOTES';
    noteContent.textContent = analysis.base;
  }
}

// 切换模块
function switchSection(section) {
  setData({ activeSection: section });

  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.section === section);
  });

  document.getElementById('insightCard').style.display = section === 'insight' ? 'block' : 'none';
  document.getElementById('fateCard').style.display = section === 'fate' ? 'block' : 'none';
}

// 返回
function handleBack() {
  setData({ page: 'result' });
}

function handleBackResult() {
  setData({ page: 'result' });
}

// 循环名言
function loopQuotes() {
  setInterval(() => {
    const i = Math.floor(Math.random() * quotesData.quotes.length);
    app.data.currentQuote = quotesData.quotes[i];
    document.getElementById('quoteText').textContent = app.data.currentQuote;
  }, 5000);
}

// 宇宙重启
function handleRestart() {
  let collapse = 1;
  const collapseTimer = setInterval(() => {
    collapse += 0.15;
    setData({ starCollapse: collapse });
    if (collapse >= 3) {
      clearInterval(collapseTimer);
      if (app.audioCtx) app.audioCtx.stop();
      setTimeout(() => {
        location.reload();
      }, 600);
    }
  }, 50);
}

// 更新数据并渲染
function setData(newData) {
  Object.assign(app.data, newData);

  // 更新页面显示
  const pages = ['landing', 'intro', 'quiz', 'progress', 'shaping', 'result', 'analysis'];
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) {
      el.style.display = p === app.data.page ? 'flex' : 'none';
    }
  });

  // 更新星星透明度
  if (app.starCanvas) {
    app.starCanvas.style.opacity = app.data.starOpacity;
  }

  // 更新打字机文本
  const typeMain = document.getElementById('typeMain');
  const typeSub = document.getElementById('typeSub');
  if (typeMain) typeMain.textContent = app.data.typeTextMain;
  if (typeSub) typeSub.textContent = app.data.typeTextSub;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
