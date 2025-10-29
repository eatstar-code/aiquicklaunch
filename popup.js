document.addEventListener('DOMContentLoaded', () => {

  // 1. AI 서비스 데이터 정의 (사용자가 수정한 최종 버전)
  const ALL_LLMS = [
    // 메이저
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', logo: 'logos/chatgpt.svg', isMajor: true, defaultOn: true },
    { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com/', logo: 'logos/gemini.webp', isMajor: true, defaultOn: true },
    { id: 'grok', name: 'Grok', url: 'https://grok.com/', logo: 'logos/grok.svg', isMajor: true, defaultOn: true },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/', logo: 'logos/claude.svg', isMajor: true, defaultOn: true },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: 'logos/perplexity.png', isMajor: true, defaultOn: false },
    { id: 'copilot', name: 'MS Copilot', url: 'https://copilot.microsoft.com/', logo: 'logos/copilot.svg', isMajor: true, defaultOn: false },
    { id: 'minimax', name: 'minimax', url: 'https://agent.minimax.io/', logo: 'logos/minimax.svg', isMajor: true, defaultOn: false },
    { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', logo: 'logos/deepseek.svg', isMajor: true, defaultOn: false },
    // 기타
    { id: 'qwen', name: 'Qwen', url: 'https://qwen.ai/', logo: 'logos/qwen.webp', isMajor: false, defaultOn: false },
    { id: 'zai', name: 'Z.ai (GLM)', url: 'https://chat.z.ai/', logo: 'logos/zai.svg', isMajor: false, defaultOn: false },
    { id: 'lechat', name: 'Le Chat', url: 'https://chat.mistral.ai/', logo: 'logos/mistral.png', isMajor: false, defaultOn: false },
    { id: 'wrtn', nameKey: 'llmNameWrtn', url: 'https://wrtn.ai/', logo: 'logos/wrtn.svg', isMajor: false, defaultOn: false }, // i18n(nameKey) 유지
    { id: 'clovax', name: 'CLOVA X', url: 'https://clova-x.naver.com/', logo: 'logos/clovax.svg', isMajor: false, defaultOn: false },
    { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn/', logo: 'logos/kimi.webp', isMajor: false, defaultOn: false },
    { id: 'goover', name: 'goover', url: 'https://goover.ai/', logo: 'logos/goover.png', isMajor: false, defaultOn: false },
    { id: 'upstage', name: 'Upstage', url: 'https://console.upstage.ai/playground/chat', logo: 'logos/upstage.svg', isMajor: false, defaultOn: false },
  ];

  // 2. HTML 요소 가져오기
  const majorListEl = document.getElementById('major-list');
  const otherListEl = document.getElementById('other-list');
  const launchButton = document.getElementById('launchButton');
  const toggleOtherButton = document.getElementById('toggle-other-llms');
  const pinTabsCheckbox = document.getElementById('pinTabsCheckbox'); // (신규) 핀 체크박스

  let currentSettings = [];

  // 3. (핵심) 저장된 설정 불러오기 및 UI 렌더링
  async function initialize() {
    // (수정) 'pinTabsState'도 함께 불러옴
    const result = await chrome.storage.sync.get(['llmSettings', 'pinTabsState']);
    const storedSettings = result.llmSettings;

    // (신규) 체크박스 상태 설정 (없으면 false)
    pinTabsCheckbox.checked = result.pinTabsState || false;

    // A. 저장된 설정이 있고, 개수가 일치할 때 (기존 사용자)
    if (storedSettings && storedSettings.length === ALL_LLMS.length) {
      currentSettings = storedSettings.map(setting => {
        const llmData = ALL_LLMS.find(llm => llm.id === setting.id);
        return { ...llmData, ...setting };
      });
    } 
    // B. 첫 실행이거나, AI 목록이 업데이트 되었을 때 (신규/업데이트)
    else {
      currentSettings = ALL_LLMS.map(llm => ({
        ...llm,
        isOn: llm.defaultOn
      }));
    }

    renderLists();
    setupDragAndDrop();
    await saveSettings(); 
  }

  // 4. (핵심) 목록을 화면에 그리는 함수
  function renderLists() {
    majorListEl.innerHTML = '';
    otherListEl.innerHTML = '';

    currentSettings.forEach(setting => {
      const listItem = createListItem(setting);
      if (setting.isMajor) {
        majorListEl.appendChild(listItem);
      } else {
        otherListEl.appendChild(listItem);
      }
    });

    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('change', handleToggleChange);
    });
  }

  // 5. (핵심) 리스트 아이템(li) 생성 함수 (i18n 적용됨)
  function createListItem(setting) {
    const listItem = document.createElement('li');
    listItem.className = 'ai-list-item';
    listItem.dataset.id = setting.id;

    const name = setting.nameKey ? chrome.i18n.getMessage(setting.nameKey) : setting.name;
    const dragTitle = chrome.i18n.getMessage("dragHandleTitle");

    listItem.innerHTML = `
      <span class="drag-handle" title="${dragTitle}">☰</span>
      <img src="${setting.logo}" alt="${name}" class="ai-logo">
      <span class="ai-name">${name}</span>
      <label class="switch">
        <input type="checkbox" class="toggle-switch" data-id="${setting.id}" ${setting.isOn ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    `;
    return listItem;
  }

  // 6. (핵심) 드래그 앤 드롭 기능 설정 (Sortable.js)
  function setupDragAndDrop() {
    const options = {
      handle: '.drag-handle',
      animation: 150,
      onEnd: updateOrder,
      group: 'ai-list-group'
    };
    new Sortable(majorListEl, options);
    new Sortable(otherListEl, options);
  }

  // 7. (핵심) 드래그 완료 시 순서 업데이트 함수
  function updateOrder() {
    const majorOrder = Array.from(majorListEl.children).map(li => li.dataset.id);
    const otherOrder = Array.from(otherListEl.children).map(li => li.dataset.id);
    
    const newOrder = [...majorOrder, ...otherOrder];
    
    currentSettings.sort((a, b) => {
      return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
    });

    saveSettings();
  }

  // 8. (핵심) 토글 상태 변경 시 호출되는 함수
  function handleToggleChange(e) {
    const id = e.target.dataset.id;
    const setting = currentSettings.find(s => s.id === id);
    if (setting) {
      setting.isOn = e.target.checked;
      saveSettings();
    }
  }

  // 9. (핵심) 현재 설정을 chrome.storage.sync에 저장
  async function saveSettings() {
    const settingsToSave = currentSettings.map(s => ({
      id: s.id,
      isOn: s.isOn
    }));
    await chrome.storage.sync.set({ llmSettings: settingsToSave });
  }

  // 10. '기타 LLM' 버튼 클릭 이벤트 (i18n 적용됨)
  toggleOtherButton.addEventListener('click', () => {
    const isHidden = otherListEl.classList.toggle('hidden');
    toggleOtherButton.textContent = isHidden 
      ? chrome.i18n.getMessage("toggleOtherButtonShow") 
      : chrome.i18n.getMessage("toggleOtherButtonHide");
  });

  // 11. '선택한 AI 실행' 버튼 클릭 이벤트 (수정됨)
  launchButton.addEventListener('click', () => {
    const urlsToOpen = currentSettings
      .filter(setting => setting.isOn)
      .map(setting => setting.url);
    
    // (신규) 핀 고정 체크박스 상태 확인
    const shouldPin = pinTabsCheckbox.checked;

    urlsToOpen.forEach((url, index) => {
      chrome.tabs.create({ 
        url: url, 
        active: index === 0,
        pinned: shouldPin // (신규) 핀 상태 적용
      });
    });
  });

  // (신규) 12. 핀 체크박스 상태 저장 이벤트
  async function savePinState() {
    await chrome.storage.sync.set({ pinTabsState: pinTabsCheckbox.checked });
  }
  pinTabsCheckbox.addEventListener('change', savePinState);

  // 13. HTML 내부의 텍스트를 i18n API로 설정 (수정됨)
  function localizeHtml() {
    document.getElementById('popupTitleElement').textContent = chrome.i18n.getMessage("popupTitle");
    document.getElementById('launchButton').textContent = chrome.i18n.getMessage("launchButton");
    
    // (신규) 핀 체크박스 라벨 설정
    document.getElementById('pinTabsLabelElement').textContent = chrome.i18n.getMessage("pinTabsCheckboxLabel");
    
    const isHidden = otherListEl.classList.contains('hidden');
    toggleOtherButton.textContent = isHidden 
      ? chrome.i18n.getMessage("toggleOtherButtonShow") 
      : chrome.i18n.getMessage("toggleOtherButtonHide");
  }

  // --- 스크립트 실행 시작 ---
  localizeHtml();
  initialize();

});