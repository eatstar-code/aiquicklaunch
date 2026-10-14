document.addEventListener('DOMContentLoaded', () => {

  // 1. AI 서비스 데이터 정의
  const ALL_LLMS = [
    // ---------------- [ 메이저: 파운데이션 모델 ] ----------------
    { id: 'claude', name: 'Claude', model: 'Opus 5.5 / Fable 5.1 / Sonnet 5.5', url: 'https://claude.ai/', logo: 'logos/claude.svg', isMajor: true, defaultOn: true, category: 'foundation' },
    { id: 'chatgpt', name: 'ChatGPT', model: 'GPT-6 Astra, Luna / GPT-6.1 Sol', url: 'https://chat.openai.com/', logo: 'logos/chatgpt.svg', isMajor: true, defaultOn: true, category: 'foundation' },
    { id: 'gemini', name: 'Google Gemini', model: 'Gemini 4 Argon / Gemini 3.8 Flash', url: 'https://gemini.google.com/', logo: 'logos/gemini.webp', isMajor: true, defaultOn: true, category: 'foundation' },

    // ---------------- [ 메이저: AI 검색 및 서비스 ] ----------------
    { id: 'copilot', name: 'MS Copilot', url: 'https://copilot.microsoft.com/', logo: 'logos/copilot.svg', isMajor: true, defaultOn: false, category: 'service' },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: 'logos/perplexity.png', isMajor: true, defaultOn: false, category: 'service' },

    // ---------------- [ 기타 목록: 파운데이션 모델 ] ----------------
    { id: 'kimi', name: 'Kimi', model: 'K3', url: 'https://kimi.moonshot.cn/', logo: 'logos/kimi.webp', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'qwen', name: 'Qwen', model: '3.8-Max', url: 'https://qwen.ai/', logo: 'logos/qwen.webp', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'step5', name: 'Step 5', model: 'Preview', url: 'https://studio.stepfun.ai/', logo: 'logos/stepfun.png', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'zai', name: 'Z.ai (GLM)', model: 'GLM-5.3', url: 'https://chat.z.ai/', logo: 'logos/zai.svg', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'mimi', name: 'Xiaomi MiMo', model: 'V2.6', url: 'https://aistudio.xiaomimimo.com/#/c', logo: 'logos/Xiaomi_logo.svg', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'grok', name: 'Grok', model: 'Grok 4.6', url: 'https://grok.com/', logo: 'logos/grok.svg', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'muse', name: 'Meta Muse', model: 'Wonder / Spark 1.2', url: 'https://www.meta.ai', logo: 'logos/Muse_icon.svg', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'deepseek', name: 'DeepSeek', model: 'V4.1 Flash', url: 'https://chat.deepseek.com/', logo: 'logos/deepseek.svg', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'hy4', name: 'Tencent Hy4', model: 'Preview', url: 'https://aistudio.tencent.com/?lang=eh&utm_source=hy', logo: 'logos/hy4.png', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'lechat', name: 'Mistral', model: 'Large 4', url: 'https://chat.mistral.ai/', logo: 'logos/mistral.png', isMajor: false, defaultOn: false, category: 'foundation' },
    { id: 'minimax', name: 'Minimax', model: 'M3', url: 'https://agent.minimax.io/', logo: 'logos/minimax.svg', isMajor: false, defaultOn: false, category: 'foundation' }
  ];

  // 2. HTML 요소 가져오기
  const majorListEl = document.getElementById('major-list');
  const otherListEl = document.getElementById('other-list');
  const launchButton = document.getElementById('launchButton');
  const toggleOtherButton = document.getElementById('toggle-other-llms');
  const pinTabsCheckbox = document.getElementById('pinTabsCheckbox');

  let currentSettings = [];

  // 3. 저장된 설정 불러오기 및 UI 렌더링
  async function initialize() {
    const result = await chrome.storage.sync.get(['llmSettings', 'pinTabsState']);
    const storedSettings = result.llmSettings;

    if (pinTabsCheckbox) {
      pinTabsCheckbox.checked = result.pinTabsState || false;
    }

    if (storedSettings && storedSettings.length === ALL_LLMS.length) {
      currentSettings = storedSettings.map(setting => {
        const llmData = ALL_LLMS.find(llm => llm.id === setting.id);
        return { ...llmData, ...setting };
      });
    } else {
      currentSettings = ALL_LLMS.map(llm => ({
        ...llm,
        isOn: llm.defaultOn
      }));
    }

    renderLists();
    setupDragAndDrop();
    await saveSettings();
  }

  // 소제목 요소 생성 함수
  function createSectionHeader(title) {
    const headerLi = document.createElement('li');
    headerLi.className = 'list-section-header';
    headerLi.textContent = title;
    return headerLi;
  }

  // 4. 목록 화면 렌더링
  function renderLists() {
    majorListEl.innerHTML = '';
    otherListEl.innerHTML = '';

    // [메이저 1그룹] 파운데이션 모델
    const majorFoundations = currentSettings.filter(s => s.isMajor && s.category === 'foundation');
    if (majorFoundations.length > 0) {
      majorListEl.appendChild(createSectionHeader(chrome.i18n.getMessage("sectionFoundation")));
      majorFoundations.forEach(setting => majorListEl.appendChild(createListItem(setting)));
    }

    // [메이저 2그룹] AI 검색 및 서비스
    const majorServices = currentSettings.filter(s => s.isMajor && s.category === 'service');
    if (majorServices.length > 0) {
      majorListEl.appendChild(createSectionHeader(chrome.i18n.getMessage("sectionService")));
      majorServices.forEach(setting => majorListEl.appendChild(createListItem(setting)));
    }

    // [기타 그룹] 기타 파운데이션 모델
    const others = currentSettings.filter(s => !s.isMajor);
    if (others.length > 0) {
      otherListEl.appendChild(createSectionHeader(chrome.i18n.getMessage("sectionOtherFoundation")));
      others.forEach(setting => otherListEl.appendChild(createListItem(setting)));
    }

    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('change', handleToggleChange);
    });
  }
  // 5. 리스트 아이템(li) 생성 함수
  function createListItem(setting) {
    const listItem = document.createElement('li');
    listItem.className = 'ai-list-item';
    listItem.dataset.id = setting.id;

    const name = setting.nameKey ? chrome.i18n.getMessage(setting.nameKey) : setting.name;
    const dragTitle = chrome.i18n.getMessage("dragHandleTitle");
    const modelHtml = setting.model ? `<span class="ai-model">${setting.model}</span>` : '';

    listItem.innerHTML = `
      <span class="drag-handle" title="${dragTitle}">☰</span>
      <img src="${setting.logo}" alt="${name}" class="ai-logo">
      <div class="ai-name-wrapper">
        <span class="ai-name">${name}</span>
        ${modelHtml}
      </div>
      <label class="switch">
        <input type="checkbox" class="toggle-switch" data-id="${setting.id}" ${setting.isOn ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    `;
    return listItem;
  }

  // 6. 드래그 앤 드롭 (Sortable)
  function setupDragAndDrop() {
    const options = {
      handle: '.drag-handle',
      draggable: '.ai-list-item',        // 헤더(.list-section-header)는 드래그 대상에서 제외
      animation: 150,
      onEnd: updateOrder,
      group: 'ai-list-group'
    };
    new Sortable(majorListEl, options);
    new Sortable(otherListEl, options);
  }

  // 7. 순서 변경 저장
  function updateOrder() {
    // 실제 AI 항목(.ai-list-item)의 dataset.id만 순서대로 추출
    const majorOrder = Array.from(majorListEl.querySelectorAll('.ai-list-item')).map(li => li.dataset.id);
    const otherOrder = Array.from(otherListEl.querySelectorAll('.ai-list-item')).map(li => li.dataset.id);
    const newOrder = [...majorOrder, ...otherOrder];

    currentSettings.sort((a, b) => {
      return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
    });

    saveSettings();
  }

  // 8. 토글 변경 처리
  function handleToggleChange(e) {
    const id = e.target.dataset.id;
    const setting = currentSettings.find(s => s.id === id);
    if (setting) {
      setting.isOn = e.target.checked;
      saveSettings();
    }
  }

  // 9. 설정 저장
  async function saveSettings() {
    const settingsToSave = currentSettings.map(s => ({
      id: s.id,
      isOn: s.isOn
    }));
    await chrome.storage.sync.set({ llmSettings: settingsToSave });
  }

  // 10. '기타 LLM' 토글 버튼
  toggleOtherButton.addEventListener('click', () => {
    const isHidden = otherListEl.classList.toggle('hidden');
    toggleOtherButton.textContent = isHidden
      ? chrome.i18n.getMessage("toggleOtherButtonShow")
      : chrome.i18n.getMessage("toggleOtherButtonHide");
  });

  // 11. 실행 버튼
  launchButton.addEventListener('click', () => {
    const urlsToOpen = currentSettings
      .filter(setting => setting.isOn)
      .map(setting => setting.url);

    const shouldPin = pinTabsCheckbox ? pinTabsCheckbox.checked : false;

    urlsToOpen.forEach((url, index) => {
      chrome.tabs.create({
        url: url,
        active: index === 0,
        pinned: shouldPin
      });
    });
  });

  // 12. 핀 고정 체크박스 저장
  async function savePinState() {
    if (pinTabsCheckbox) {
      await chrome.storage.sync.set({ pinTabsState: pinTabsCheckbox.checked });
    }
  }
  if (pinTabsCheckbox) {
    pinTabsCheckbox.addEventListener('change', savePinState);
  }

  // 13. i18n 언어 설정 및 타이틀 세팅
  function localizeHtml() {
    const titleEl = document.getElementById('popupTitleElement');
    if (titleEl) titleEl.textContent = chrome.i18n.getMessage("popupTitle");

    const versionEl = document.getElementById('popupVersionElement');
    if (versionEl) versionEl.textContent = `v${chrome.runtime.getManifest().version}`;

    const launchBtn = document.getElementById('launchButton');
    if (launchBtn) launchBtn.textContent = chrome.i18n.getMessage("launchButton");

    const pinLabel = document.getElementById('pinTabsLabelElement');
    if (pinLabel) pinLabel.textContent = chrome.i18n.getMessage("pinTabsCheckboxLabel");

    const isHidden = otherListEl.classList.contains('hidden');
    toggleOtherButton.textContent = isHidden
      ? chrome.i18n.getMessage("toggleOtherButtonShow")
      : chrome.i18n.getMessage("toggleOtherButtonHide");
  }

  // --- 스크립트 실행 시작 ---
  localizeHtml();
  initialize();

});
