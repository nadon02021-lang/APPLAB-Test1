document.addEventListener('DOMContentLoaded', () => {
  // --- Storage Keys & Data Models ---
  const STORAGE_PROJECTS = 'applab_projects_library';
  const STORAGE_FOLDERS = 'applab_folders_list';
  const STORAGE_SETTINGS = 'applab_user_settings';

  let isDirty = false;
  function markDirty() { isDirty = true; }
  function markClean() { isDirty = false; }

  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes.';
    }
  });

  function getStoredFolders() {
    try {
      const data = localStorage.getItem(STORAGE_FOLDERS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    const defaults = ['General', 'Prototypes', 'Games', 'Tools'];
    try { localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(defaults)); } catch (e) {}
    return defaults;
  }

  function getStoredProjects() {
    try {
      const data = localStorage.getItem(STORAGE_PROJECTS);
      if (data) return JSON.parse(data);
    } catch (e) {}

    const defaultData = [
      {
        id: 'proj_starter',
        projectName: 'Neon Glass App',
        folder: 'General',
        viewport: 'phone',
        canvasBg: '#0e0a1a',
        lastModified: new Date().toLocaleDateString(),
        pages: [
          {
            id: 'screen_1',
            name: 'Home Screen',
            elements: [
              {
                id: 'elem_hero_btn',
                name: 'Action Button',
                type: 'button',
                x: 95,
                y: 280,
                width: 150,
                height: 48,
                text: 'Tap Me',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 15,
                fontWeight: '600',
                textAlign: 'center',
                textColor: '#ffffff',
                bgColor: '#7b2cbf',
                borderColor: '#9d4edd',
                borderWidth: 1,
                shape: 'pill',
                borderRadius: 9999,
                backdropBlur: 10,
                glowSize: 16,
                glowColor: '#9d4edd',
                opacity: 1,
                rotation: 0,
                animation: 'pulse',
                animDuration: 1.5,
                codeMode: 'blocks',
                customJs: "app.showAlert('Running script on: ' + element.innerText);\napp.playBeep();",
                logic: {
                  event: 'click',
                  actions: [
                    { type: 'alert', target: '', value: 'Welcome to AppLab Custom Dialogs!' }
                  ]
                }
              }
            ]
          }
        ]
      }
    ];
    try {
      localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(defaultData));
    } catch (e) {}
    return defaultData;
  }

  let userSettings = { theme: 'dark', mode: 'quality' };
  try {
    const s = localStorage.getItem(STORAGE_SETTINGS);
    if (s) userSettings = JSON.parse(s);
  } catch (e) {}

  let currentProject = JSON.parse(JSON.stringify(getStoredProjects()[0]));
  let activeScreenId = currentProject.pages[0].id;
  let activeElementId = currentProject.pages[0].elements[0]?.id || null;
  let isPreviewMode = false;
  let activeFolderFilter = 'all';
  let contextTargetElementId = null;

  let newProjConfig = {
    viewport: 'phone',
    canvasBg: '#0e0a1a',
    folder: 'General',
    template: 'blank'
  };

  const fontOptions = [
    { label: 'System Sans', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Poppins (Modern)', value: "'Poppins', sans-serif" },
    { label: 'Roboto (Clean)', value: "'Roboto', sans-serif" },
    { label: 'Fira Code (Code / Mono)', value: "'Fira Code', monospace" },
    { label: 'Playfair Display (Serif)', value: "'Playfair Display', serif" },
    { label: 'Impact (Heavy Title)', value: 'Impact, sans-serif' },
    { label: 'Comic Sans MS (Playful)', value: "'Comic Sans MS', cursive, sans-serif" }
  ];

  // DOM Elements
  const homeView = document.getElementById('homeView');
  const builderView = document.getElementById('builderView');
  const tutorialView = document.getElementById('tutorialView');
  const builderControls = document.getElementById('builderControls');

  const studioDesignPage = document.getElementById('studioDesignPage');
  const studioCodePage = document.getElementById('studioCodePage');
  const subnavDesignBtn = document.getElementById('subnavDesignBtn');
  const subnavCodeBtn = document.getElementById('subnavCodeBtn');

  const projectsGrid = document.getElementById('projectsGrid');
  const folderFilterContainer = document.getElementById('folderFilterContainer');
  const createFolderBtn = document.getElementById('createFolderBtn');

  const canvas = document.getElementById('canvas');
  const deviceFrame = document.getElementById('deviceFrame');
  const pagesList = document.getElementById('pagesList');
  const layersTree = document.getElementById('layersTree');
  const addPageBtn = document.getElementById('addPageBtn');
  const modeToggleBtn = document.getElementById('modeToggleBtn');
  const exportBtn = document.getElementById('exportBtn');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const currentProjectLabel = document.getElementById('currentProjectLabel');

  const codeLabTargetContainer = document.getElementById('codeLabTargetContainer');
  const codeModeBlocksBtn = document.getElementById('codeModeBlocksBtn');
  const codeModeJsBtn = document.getElementById('codeModeJsBtn');
  const codeBlocksPanel = document.getElementById('codeBlocksPanel');
  const codeJsPanel = document.getElementById('codeJsPanel');
  const blockEventContainer = document.getElementById('blockEventContainer');
  const blocksContainer = document.getElementById('blocksContainer');
  const addBlockStepBtn = document.getElementById('addBlockStepBtn');
  const realJsInput = document.getElementById('realJsInput');

  const elementContextMenu = document.getElementById('elementContextMenu');
  const ctxDuplicate = document.getElementById('ctxDuplicate');
  const ctxBringFront = document.getElementById('ctxBringFront');
  const ctxSendBack = document.getElementById('ctxSendBack');
  const ctxOpenCode = document.getElementById('ctxOpenCode');
  const ctxDelete = document.getElementById('ctxDelete');

  const startMenuToggleBtn = document.getElementById('startMenuToggleBtn');
  const startMenuPopup = document.getElementById('startMenuPopup');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const applySettingsBtn = document.getElementById('applySettingsBtn');

  const newProjectModal = document.getElementById('newProjectModal');
  const closeNewProjBtn = document.getElementById('closeNewProjBtn');
  const cancelNewProjBtn = document.getElementById('cancelNewProjBtn');
  const confirmCreateProjBtn = document.getElementById('confirmCreateProjBtn');
  const newProjTitle = document.getElementById('newProjTitle');
  const newProjFolderContainer = document.getElementById('newProjFolderContainer');
  const newProjTemplateContainer = document.getElementById('newProjTemplateContainer');

  const settingThemeContainer = document.getElementById('settingThemeContainer');
  const settingModeContainer = document.getElementById('settingModeContainer');

  const customDialogModal = document.getElementById('customDialogModal');
  const dialogIcon = document.getElementById('dialogIcon');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogMessage = document.getElementById('dialogMessage');
  const dialogInputGroup = document.getElementById('dialogInputGroup');
  const dialogInput = document.getElementById('dialogInput');
  const dialogFooter = document.getElementById('dialogFooter');

  const propertiesTab = document.getElementById('propertiesTab');
  const shapesTab = document.getElementById('shapesTab');
  const effectsTab = document.getElementById('effectsTab');
  const animationsTab = document.getElementById('animationsTab');

  // Academy Course Elements
  const trackMenu = document.getElementById('trackMenu');
  const courseStage = document.getElementById('courseStage');

  function applyGlobalSettings() {
    document.documentElement.setAttribute('data-theme', userSettings.theme);
    document.documentElement.setAttribute('data-mode', userSettings.mode);
  }
  applyGlobalSettings();

  setInterval(() => {
    const d = new Date();
    const clk = document.getElementById('systemClock');
    if (clk) clk.innerText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, 1000);

  // ================= UNIVERSAL CUSTOM SELECT COMPONENT =================
  function createCustomSelect(container, options, initialValue, onSelectCallback) {
    if (!container) return;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    let selectedOption = options.find(o => o.value === initialValue);
    if (!selectedOption) selectedOption = options[0] || { label: 'Select...', value: '' };

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `
      <span class="selected-text">${selectedOption.label}</span>
      <span class="arrow-icon">▼</span>
    `;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    options.forEach(opt => {
      const optDiv = document.createElement('div');
      optDiv.className = `custom-select-option ${opt.value === selectedOption.value ? 'selected' : ''}`;
      optDiv.dataset.val = opt.value;
      optDiv.innerText = opt.label;

      optDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsContainer.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
        optDiv.classList.add('selected');
        trigger.querySelector('.selected-text').innerText = opt.label;
        wrapper.classList.remove('open');
        if (onSelectCallback) onSelectCallback(opt.value);
      });

      optionsContainer.appendChild(optDiv);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsContainer);
    container.appendChild(wrapper);
  }

  window.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
  });

  // Custom Modal Dialogs
  const AppLab = {
    alert: (message, title = 'Notice', icon = '🔔') => {
      return new Promise((resolve) => {
        dialogIcon.innerText = icon;
        dialogTitle.innerText = title;
        dialogMessage.innerText = message;
        dialogInputGroup.classList.add('hidden');
        dialogFooter.innerHTML = '<button class="btn-top btn-primary" id="dlgOkBtn">Acknowledge</button>';
        customDialogModal.classList.remove('hidden');

        document.getElementById('dlgOkBtn').onclick = () => {
          customDialogModal.classList.add('hidden');
          resolve();
        };
      });
    },

    confirm: (message, title = 'Confirm Action', icon = '❓') => {
      return new Promise((resolve) => {
        dialogIcon.innerText = icon;
        dialogTitle.innerText = title;
        dialogMessage.innerText = message;
        dialogInputGroup.classList.add('hidden');
        dialogFooter.innerHTML = `
          <button class="btn-top" id="dlgCancelBtn">Cancel</button>
          <button class="btn-top btn-primary" id="dlgYesBtn">Proceed</button>
        `;
        customDialogModal.classList.remove('hidden');

        document.getElementById('dlgCancelBtn').onclick = () => {
          customDialogModal.classList.add('hidden');
          resolve(false);
        };
        document.getElementById('dlgYesBtn').onclick = () => {
          customDialogModal.classList.add('hidden');
          resolve(true);
        };
      });
    },

    prompt: (message, defaultValue = '', title = 'Input Required', icon = '✏️') => {
      return new Promise((resolve) => {
        dialogIcon.innerText = icon;
        dialogTitle.innerText = title;
        dialogMessage.innerText = message;
        dialogInput.value = defaultValue;
        dialogInputGroup.classList.remove('hidden');
        dialogFooter.innerHTML = `
          <button class="btn-top" id="dlgPromptCancel">Cancel</button>
          <button class="btn-top btn-primary" id="dlgPromptOk">Submit</button>
        `;
        customDialogModal.classList.remove('hidden');
        dialogInput.focus();

        document.getElementById('dlgPromptCancel').onclick = () => {
          customDialogModal.classList.add('hidden');
          resolve(null);
        };
        document.getElementById('dlgPromptOk').onclick = () => {
          const val = dialogInput.value;
          customDialogModal.classList.add('hidden');
          resolve(val);
        };
      });
    },

    unsavedChangesGuard: async () => {
      if (!isDirty) return true;
      return new Promise((resolve) => {
        dialogIcon.innerText = '⚠️';
        dialogTitle.innerText = 'Unsaved Changes';
        dialogMessage.innerText = 'You have unsaved changes in your project. Do you want to save first, discard changes, or stay?';
        dialogInputGroup.classList.add('hidden');
        dialogFooter.innerHTML = `
          <button class="btn-top" id="dlgStayBtn">Stay Here</button>
          <button class="btn-top" id="dlgDiscardBtn" style="color:#ff6b6b">Discard</button>
          <button class="btn-top btn-primary" id="dlgSaveExitBtn">Save & Exit</button>
        `;
        customDialogModal.classList.remove('hidden');

        document.getElementById('dlgStayBtn').onclick = () => {
          customDialogModal.classList.add('hidden');
          resolve(false);
        };
        document.getElementById('dlgDiscardBtn').onclick = () => {
          markClean();
          customDialogModal.classList.add('hidden');
          resolve(true);
        };
        document.getElementById('dlgSaveExitBtn').onclick = () => {
          saveProjectToStorage();
          customDialogModal.classList.add('hidden');
          resolve(true);
        };
      });
    }
  };

  // View Routing
  async function switchMainView(viewId) {
    if (viewId === 'homeView' && isDirty) {
      const canLeave = await AppLab.unsavedChangesGuard();
      if (!canLeave) return;
    }

    [homeView, builderView, tutorialView].forEach(v => {
      if (v) v.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewId);
    });

    if (viewId === 'builderView') {
      if (builderControls) builderControls.classList.remove('hidden');
      switchStudioSubpage('design');
    } else if (viewId === 'tutorialView') {
      if (builderControls) builderControls.classList.add('hidden');
      renderCourseWorkspace();
    } else {
      if (builderControls) builderControls.classList.add('hidden');
      if (viewId === 'homeView') renderProjectsDashboard();
    }
  }

  function switchStudioSubpage(subpage) {
    if (subpage === 'design') {
      if (studioDesignPage) studioDesignPage.classList.remove('hidden');
      if (studioCodePage) studioCodePage.classList.add('hidden');
      if (subnavDesignBtn) subnavDesignBtn.classList.add('active');
      if (subnavCodeBtn) subnavCodeBtn.classList.remove('active');
      const dev = document.getElementById('deviceSwitcher');
      if (dev) dev.style.display = 'flex';
      renderPagesList();
      renderCanvas();
      renderLayersTree();
      buildInspector();
    } else {
      if (studioDesignPage) studioDesignPage.classList.add('hidden');
      if (studioCodePage) studioCodePage.classList.remove('hidden');
      if (subnavDesignBtn) subnavDesignBtn.classList.remove('active');
      if (subnavCodeBtn) subnavCodeBtn.classList.add('active');
      const dev = document.getElementById('deviceSwitcher');
      if (dev) dev.style.display = 'none';
      renderCodeLab();
    }
  }

  if (subnavDesignBtn) subnavDesignBtn.addEventListener('click', () => switchStudioSubpage('design'));
  if (subnavCodeBtn) subnavCodeBtn.addEventListener('click', () => switchStudioSubpage('code'));

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => switchMainView(btn.dataset.view));
  });

  const navHomeBtn = document.getElementById('navHomeBtn');
  if (navHomeBtn) navHomeBtn.addEventListener('click', () => switchMainView('homeView'));
  const heroStartBtn = document.getElementById('heroStartBtn');
  if (heroStartBtn) heroStartBtn.addEventListener('click', () => switchMainView('builderView'));
  const heroTutorialBtn = document.getElementById('heroTutorialBtn');
  if (heroTutorialBtn) heroTutorialBtn.addEventListener('click', () => switchMainView('tutorialView'));
  const dashNewBtn = document.getElementById('dashNewBtn');
  if (dashNewBtn) dashNewBtn.addEventListener('click', () => openNewProjectModal());

  // Dashboard Render
  function renderFolderOptions() {
    if (!folderFilterContainer) return;
    const folders = getStoredFolders();
    const folderOpts = [
      { label: '📁 All Folders', value: 'all' },
      ...folders.map(f => ({ label: `📂 ${f}`, value: f }))
    ];

    createCustomSelect(folderFilterContainer, folderOpts, activeFolderFilter, (selectedVal) => {
      activeFolderFilter = selectedVal;
      renderProjectsDashboard();
    });
  }

  if (createFolderBtn) {
    createFolderBtn.addEventListener('click', async () => {
      const name = await AppLab.prompt('Enter new folder name:', '', 'Create Project Folder');
      if (name && name.trim()) {
        const trimmed = name.trim();
        const folders = getStoredFolders();
        if (!folders.includes(trimmed)) {
          folders.push(trimmed);
          try {
            localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
          } catch (e) {}
          renderFolderOptions();
          await AppLab.alert(`Folder "${trimmed}" created successfully!`, 'Folder Created', '📁');
        } else {
          await AppLab.alert(`A folder named "${trimmed}" already exists.`, 'Duplicate Folder', '⚠️');
        }
      }
    });
  }

  function renderProjectsDashboard() {
    renderFolderOptions();
    if (!projectsGrid) return;
    const list = getStoredProjects();
    projectsGrid.innerHTML = '';

    const filtered = activeFolderFilter === 'all' ? list : list.filter(p => p.folder === activeFolderFilter);

    filtered.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-header">
          <span class="project-card-title">${proj.projectName}</span>
          <span class="project-card-meta">📂 ${proj.folder || 'General'}</span>
        </div>
        <p class="project-card-meta">${proj.pages.length} screen(s) • Modified: ${proj.lastModified || 'Today'}</p>
        <div class="project-card-actions">
          <button class="btn-top" style="padding: 4px 10px; font-size: 0.78rem;">Open Studio</button>
          <button class="btn-card-delete" data-id="${proj.id}">Delete</button>
        </div>
      `;

      card.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-card-delete')) {
          e.stopPropagation();
          deleteStoredProject(proj.id);
          return;
        }
        if (isDirty) {
          const canLeave = await AppLab.unsavedChangesGuard();
          if (!canLeave) return;
        }
        currentProject = JSON.parse(JSON.stringify(proj));
        activeScreenId = currentProject.pages[0].id;
        if (currentProjectLabel) currentProjectLabel.innerText = currentProject.projectName;
        markClean();
        switchMainView('builderView');
      });

      projectsGrid.appendChild(card);
    });
  }

  async function deleteStoredProject(id) {
    const confirmed = await AppLab.confirm('Are you sure you want to permanently delete this project?', 'Delete Project', '🗑️');
    if (confirmed) {
      let list = getStoredProjects().filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
      } catch (e) {}
      renderProjectsDashboard();
    }
  }

  function openNewProjectModal() {
    const folders = getStoredFolders();
    const folderOpts = folders.map(f => ({ label: `📂 ${f}`, value: f }));
    createCustomSelect(newProjFolderContainer, folderOpts, newProjConfig.folder, (val) => {
      newProjConfig.folder = val;
    });

    const templateOpts = [
      { label: 'Blank Canvas', value: 'blank' },
      { label: 'Mobile Landing Page', value: 'starter_app' },
      { label: 'Social Media Feed Card', value: 'card_feed' }
    ];
    createCustomSelect(newProjTemplateContainer, templateOpts, newProjConfig.template, (val) => {
      newProjConfig.template = val;
    });

    if (newProjectModal) newProjectModal.classList.remove('hidden');
  }

  if (closeNewProjBtn) closeNewProjBtn.onclick = () => newProjectModal.classList.add('hidden');
  if (cancelNewProjBtn) cancelNewProjBtn.onclick = () => newProjectModal.classList.add('hidden');

  document.querySelectorAll('[data-viewport]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-viewport]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      newProjConfig.viewport = btn.dataset.viewport;
    };
  });

  document.querySelectorAll('[data-canvasbg]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-canvasbg]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      newProjConfig.canvasBg = btn.dataset.canvasbg;
    };
  });

  if (confirmCreateProjBtn) {
    confirmCreateProjBtn.onclick = async () => {
      if (isDirty) {
        const canLeave = await AppLab.unsavedChangesGuard();
        if (!canLeave) return;
      }

      const title = newProjTitle ? (newProjTitle.value.trim() || 'Untitled Project') : 'Untitled Project';
      const folder = newProjConfig.folder || 'General';
      const template = newProjConfig.template || 'blank';

      let initialPages = [{ id: 'screen_1', name: 'Home Screen', elements: [] }];

      if (template === 'starter_app') {
        initialPages = [{
          id: 'screen_1',
          name: 'Landing Page',
          elements: [
            {
              id: 'elem_lbl_' + Date.now(),
              name: 'App Header',
              type: 'label',
              x: 40,
              y: 60,
              width: 260,
              height: 40,
              text: 'Welcome to ' + title,
              fontFamily: "'Poppins', sans-serif",
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              textColor: '#ffffff',
              bgColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: 0,
              shape: 'rect',
              borderRadius: 0,
              backdropBlur: 0,
              glowSize: 0,
              glowColor: '#9d4edd',
              opacity: 1,
              rotation: 0,
              animation: 'slideUp',
              animDuration: 0.8,
              codeMode: 'blocks',
              customJs: '',
              logic: { event: 'click', actions: [] }
            },
            {
              id: 'elem_btn_' + Date.now(),
              name: 'Primary Button',
              type: 'button',
              x: 85,
              y: 320,
              width: 170,
              height: 48,
              text: 'Get Started',
              fontFamily: "'Poppins', sans-serif",
              fontSize: 15,
              fontWeight: '600',
              textAlign: 'center',
              textColor: '#ffffff',
              bgColor: '#7b2cbf',
              borderColor: '#9d4edd',
              borderWidth: 1,
              shape: 'pill',
              borderRadius: 9999,
              backdropBlur: 0,
              glowSize: 18,
              glowColor: '#9d4edd',
              opacity: 1,
              rotation: 0,
              animation: 'pulse',
              animDuration: 1.5,
              codeMode: 'blocks',
              customJs: '',
              logic: { event: 'click', actions: [{ type: 'alert', target: '', value: 'Button clicked!' }] }
            }
          ]
        }];
      } else if (template === 'card_feed') {
        initialPages = [{
          id: 'screen_1',
          name: 'Feed Screen',
          elements: [
            {
              id: 'elem_card_' + Date.now(),
              name: 'Feed Card',
              type: 'card',
              x: 20,
              y: 90,
              width: 300,
              height: 200,
              text: 'Exclusive Creator Content Card\nExplore rich UI layout structures.',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: '400',
              textAlign: 'center',
              textColor: '#f3f3f7',
              bgColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 1,
              shape: 'rounded',
              borderRadius: 16,
              backdropBlur: 20,
              glowSize: 10,
              glowColor: 'rgba(157, 78, 221, 0.3)',
              opacity: 1,
              rotation: 0,
              animation: 'scalePop',
              animDuration: 0.8,
              codeMode: 'blocks',
              customJs: '',
              logic: { event: 'click', actions: [] }
            }
          ]
        }];
      }

      currentProject = {
        id: 'proj_' + Date.now(),
        projectName: title,
        folder: folder,
        viewport: newProjConfig.viewport,
        canvasBg: newProjConfig.canvasBg,
        lastModified: new Date().toLocaleDateString(),
        pages: initialPages
      };

      activeScreenId = currentProject.pages[0].id;
      activeElementId = currentProject.pages[0].elements[0]?.id || null;
      if (currentProjectLabel) currentProjectLabel.innerText = title;

      document.querySelectorAll('.device-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.device === currentProject.viewport);
      });
      if (deviceFrame) {
        deviceFrame.className = `device-mockup device-${currentProject.viewport}`;
        deviceFrame.style.background = currentProject.canvasBg || '#0e0a1a';
      }

      newProjectModal.classList.add('hidden');
      markClean();
      switchMainView('builderView');
    };
  }

  function saveProjectToStorage() {
    currentProject.lastModified = new Date().toLocaleDateString();
    let list = getStoredProjects();
    const idx = list.findIndex(p => p.id === currentProject.id);
    if (idx >= 0) list[idx] = JSON.parse(JSON.stringify(currentProject));
    else list.unshift(JSON.parse(JSON.stringify(currentProject)));
    try {
      localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
    } catch (e) {}
    markClean();
  }

  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', async () => {
      saveProjectToStorage();
      await AppLab.alert(`Project "${currentProject.projectName}" saved successfully!`, 'Save Complete', '💾');
    });
  }

  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentProject.viewport = btn.dataset.device;
      if (deviceFrame) deviceFrame.className = `device-mockup device-${btn.dataset.device}`;
      markDirty();
    });
  });

  function getCurrentPage() {
    return currentProject.pages.find(p => p.id === activeScreenId) || currentProject.pages[0];
  }

  function getActiveElementModel() {
    const page = getCurrentPage();
    return page ? page.elements.find(el => el.id === activeElementId) : null;
  }

  function applyShapeAndEffects(node, el) {
    node.style.clipPath = 'none';
    node.style.borderRadius = '0px';

    const shape = el.shape || 'rounded';
    const isPolygon = (shape === 'diamond' || shape === 'hexagon');

    if (shape === 'rect') {
      node.style.borderRadius = '0px';
    } else if (shape === 'rounded') {
      node.style.borderRadius = `${el.borderRadius || 8}px`;
    } else if (shape === 'pill') {
      node.style.borderRadius = '9999px';
    } else if (shape === 'circle') {
      node.style.borderRadius = '50%';
    } else if (shape === 'diamond') {
      node.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    } else if (shape === 'hexagon') {
      node.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    }

    if (el.glowSize > 0) {
      const glow = `${el.glowColor || 'rgba(157,78,221,0.5)'}`;
      if (isPolygon) {
        node.style.boxShadow = 'none';
        node.style.filter = `drop-shadow(0px 0px ${el.glowSize}px ${glow})`;
      } else {
        node.style.filter = 'none';
        node.style.boxShadow = `0 0 ${el.glowSize}px ${glow}`;
      }
    } else {
      node.style.boxShadow = 'none';
      node.style.filter = 'none';
    }

    if (el.backdropBlur > 0) {
      node.style.backdropFilter = `blur(${el.backdropBlur}px)`;
      node.style.webkitBackdropFilter = `blur(${el.backdropBlur}px)`;
    } else {
      node.style.backdropFilter = 'none';
      node.style.webkitBackdropFilter = 'none';
    }
  }

  function renderCanvas() {
    if (!canvas) return;
    canvas.innerHTML = '';
    const page = getCurrentPage();
    if (!page) return;

    if (deviceFrame) deviceFrame.style.background = currentProject.canvasBg || '#0e0a1a';

    page.elements.forEach(el => {
      let node = el.type === 'button' ? document.createElement('button')
               : el.type === 'input' ? document.createElement('input')
               : document.createElement('div');

      if (el.type === 'image') {
        const img = document.createElement('img');
        img.src = el.text;
        img.onerror = () => { img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%232b1b4d%22/><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23c77dff%22 font-family=%22sans-serif%22 font-size=%2214%22>No Image</text></svg>'; };
        node.appendChild(img);
      } else if (el.type === 'input') {
        node.placeholder = el.text;
      } else {
        node.innerText = el.text;
      }

      node.id = el.id;
      node.className = `placed-item ${el.id === activeElementId ? 'selected' : ''}`;

      node.style.left = `${el.x}px`;
      node.style.top = `${el.y}px`;
      node.style.width = `${el.width}px`;
      node.style.height = `${el.height}px`;

      node.style.backgroundColor = el.bgColor;
      node.style.color = el.textColor;
      node.style.borderColor = el.borderColor;
      node.style.borderWidth = `${el.borderWidth || 1}px`;
      node.style.borderStyle = 'solid';
      node.style.fontFamily = el.fontFamily || 'inherit';
      node.style.fontSize = `${el.fontSize}px`;
      node.style.fontWeight = el.fontWeight || 'normal';
      node.style.textAlign = el.textAlign || 'center';

      applyShapeAndEffects(node, el);

      node.style.opacity = el.opacity !== undefined ? el.opacity : 1;
      node.style.transform = `rotate(${el.rotation || 0}deg)`;

      if (el.animation && el.animation !== 'none') {
        node.classList.add(`anim-${el.animation}`);
        node.style.animationDuration = `${el.animDuration || 1.5}s`;
      }

      if (!isPreviewMode) {
        attachMovement(node, el);
        attachResizer(node, el);
        attachContextMenu(node, el);
      }

      attachRuntimeExecution(node, el);

      node.addEventListener('click', (e) => {
        if (!isPreviewMode) {
          e.stopPropagation();
          selectElement(el.id);
        }
      });

      canvas.appendChild(node);
    });
  }

  function attachMovement(node, model) {
    let isMoving = false, startX, startY, initX, initY;
    node.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.classList.contains('resize-handle')) return;
      isMoving = true;
      startX = e.clientX; startY = e.clientY;
      initX = model.x; initY = model.y;

      function onMove(ev) {
        if (!isMoving) return;
        model.x = Math.max(0, initX + (ev.clientX - startX));
        model.y = Math.max(0, initY + (ev.clientY - startY));
        node.style.left = `${model.x}px`;
        node.style.top = `${model.y}px`;
        markDirty();
      }

      function onUp() {
        isMoving = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  function attachResizer(node, model) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    node.appendChild(handle);

    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const sx = e.clientX, sy = e.clientY, sw = model.width, sh = model.height;

      function onDrag(ev) {
        model.width = Math.max(30, sw + (ev.clientX - sx));
        model.height = Math.max(20, sh + (ev.clientY - sy));
        node.style.width = `${model.width}px`;
        node.style.height = `${model.height}px`;
        markDirty();
      }

      function onStop() {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', onStop);
      }

      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', onStop);
    });
  }

  function attachContextMenu(node, model) {
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectElement(model.id);
      contextTargetElementId = model.id;

      if (elementContextMenu) {
        elementContextMenu.style.left = `${e.clientX}px`;
        elementContextMenu.style.top = `${e.clientY}px`;
        elementContextMenu.classList.remove('hidden');
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (elementContextMenu && !elementContextMenu.contains(e.target)) {
      elementContextMenu.classList.add('hidden');
    }
  });

  if (ctxDuplicate) {
    ctxDuplicate.addEventListener('click', () => {
      const page = getCurrentPage();
      const target = page.elements.find(i => i.id === contextTargetElementId);
      if (target) {
        const clone = JSON.parse(JSON.stringify(target));
        clone.id = 'el_' + Date.now().toString().slice(-4);
        clone.name = clone.name + ' (Copy)';
        clone.x += 20;
        clone.y += 20;
        page.elements.push(clone);
        markDirty();
        selectElement(clone.id);
      }
      if (elementContextMenu) elementContextMenu.classList.add('hidden');
    });
  }

  if (ctxBringFront) {
    ctxBringFront.addEventListener('click', () => {
      const page = getCurrentPage();
      const idx = page.elements.findIndex(i => i.id === contextTargetElementId);
      if (idx >= 0) {
        const [item] = page.elements.splice(idx, 1);
        page.elements.push(item);
        markDirty();
        renderCanvas();
        renderLayersTree();
      }
      if (elementContextMenu) elementContextMenu.classList.add('hidden');
    });
  }

  if (ctxSendBack) {
    ctxSendBack.addEventListener('click', () => {
      const page = getCurrentPage();
      const idx = page.elements.findIndex(i => i.id === contextTargetElementId);
      if (idx >= 0) {
        const [item] = page.elements.splice(idx, 1);
        page.elements.unshift(item);
        markDirty();
        renderCanvas();
        renderLayersTree();
      }
      if (elementContextMenu) elementContextMenu.classList.add('hidden');
    });
  }

  if (ctxOpenCode) {
    ctxOpenCode.addEventListener('click', () => {
      activeElementId = contextTargetElementId;
      if (elementContextMenu) elementContextMenu.classList.add('hidden');
      switchStudioSubpage('code');
    });
  }

  if (ctxDelete) {
    ctxDelete.addEventListener('click', () => {
      const page = getCurrentPage();
      page.elements = page.elements.filter(i => i.id !== contextTargetElementId);
      if (activeElementId === contextTargetElementId) activeElementId = null;
      markDirty();
      renderCanvas();
      renderLayersTree();
      buildInspector();
      if (elementContextMenu) elementContextMenu.classList.add('hidden');
    });
  }

  function attachRuntimeExecution(node, model) {
    node.addEventListener(model.logic?.event === 'hover' ? 'mouseenter' : 'click', () => {
      if (!isPreviewMode) return;

      if (model.codeMode === 'realCode' && model.customJs) {
        try {
          const scriptFn = new Function('element', 'app', 'canvas', model.customJs);
          scriptFn(node, {
            navigateTo: (id) => { activeScreenId = id; renderCanvas(); renderPagesList(); },
            showAlert: (msg) => AppLab.alert(msg, 'App Message', '📱'),
            playBeep: () => {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator(); osc.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.15);
              } catch (e) {}
            }
          }, canvas);
        } catch (err) {
          AppLab.alert(err.message, 'JavaScript Error', '⚠️');
        }
      } else if (model.logic && model.logic.actions) {
        model.logic.actions.forEach(act => {
          if (act.type === 'alert') AppLab.alert(act.value || 'Action trigger!', 'App Message', '📱');
          if (act.type === 'navigate') { activeScreenId = act.target; renderCanvas(); renderPagesList(); }
          if (act.type === 'setText') {
            const target = document.getElementById(act.target);
            if (target) target.innerText = act.value;
          }
          if (act.type === 'setBg') {
            const target = document.getElementById(act.target);
            if (target) target.style.backgroundColor = act.value;
          }
        });
      }
    });
  }

  function selectElement(id) {
    activeElementId = id;
    renderCanvas();
    renderLayersTree();
    buildInspector();
  }

  document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.remove('hidden');
    });
  });

  function buildInspector() {
    const el = getActiveElementModel();
    if (!el) {
      if (propertiesTab) propertiesTab.innerHTML = '<p class="empty-state">Select an element to customize styling.</p>';
      if (shapesTab) shapesTab.innerHTML = '<p class="empty-state">Select an element to customize shapes.</p>';
      if (effectsTab) effectsTab.innerHTML = '<p class="empty-state">Select an element to customize effects.</p>';
      if (animationsTab) animationsTab.innerHTML = '<p class="empty-state">Select an element to configure animations.</p>';
      return;
    }

    // 1. UI Tab
    if (propertiesTab) {
      propertiesTab.innerHTML = `
        <div class="control-group">
          <label>Layer Name</label>
          <input type="text" class="control-input" id="propName" value="${el.name}">
        </div>
        <div class="control-group">
          <label>Text Content / Placeholder</label>
          <input type="text" class="control-input" id="propText" value="${el.text}">
        </div>
        <div class="control-group">
          <label>Font Family</label>
          <div id="propFontContainer"></div>
        </div>
        <div class="control-row">
          <div class="control-group">
            <label>Font Size (px)</label>
            <input type="number" class="control-input" id="propFontSize" value="${el.fontSize || 14}">
          </div>
          <div class="control-group">
            <label>Weight</label>
            <div id="propWeightContainer"></div>
          </div>
        </div>
        <div class="control-group">
          <label>Text Alignment</label>
          <div id="propAlignContainer"></div>
        </div>
        <div class="control-group">
          <label>Text Color</label>
          <div class="color-picker-row">
            <input type="color" id="propTextColorPicker" value="${rgbToHex(el.textColor)}">
            <input type="text" class="control-input" id="propTextColor" value="${el.textColor}">
          </div>
        </div>
        <div class="control-group">
          <label>Background Color</label>
          <div class="color-picker-row">
            <input type="color" id="propBgColorPicker" value="${rgbToHex(el.bgColor)}">
            <input type="text" class="control-input" id="propBgColor" value="${el.bgColor}">
          </div>
        </div>
        <div class="control-group">
          <label>Border Color</label>
          <div class="color-picker-row">
            <input type="color" id="propBorderColorPicker" value="${rgbToHex(el.borderColor)}">
            <input type="text" class="control-input" id="propBorderColor" value="${el.borderColor}">
          </div>
        </div>
        <button class="btn-top" style="color:#ff6b6b; margin-top:10px;" id="delElemBtn">Remove Element</button>
      `;

      createCustomSelect(
        document.getElementById('propFontContainer'),
        fontOptions,
        el.fontFamily || fontOptions[0].value,
        (val) => { el.fontFamily = val; markDirty(); renderCanvas(); }
      );

      const weightOpts = [
        { label: 'Regular (400)', value: '400' },
        { label: 'Semi-Bold (600)', value: '600' },
        { label: 'Bold (700)', value: '700' }
      ];
      createCustomSelect(
        document.getElementById('propWeightContainer'),
        weightOpts,
        el.fontWeight || '400',
        (val) => { el.fontWeight = val; markDirty(); renderCanvas(); }
      );

      const alignOpts = [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ];
      createCustomSelect(
        document.getElementById('propAlignContainer'),
        alignOpts,
        el.textAlign || 'center',
        (val) => { el.textAlign = val; markDirty(); renderCanvas(); }
      );

      document.getElementById('propName').oninput = (e) => { el.name = e.target.value; markDirty(); renderLayersTree(); };
      document.getElementById('propText').oninput = (e) => { el.text = e.target.value; markDirty(); renderCanvas(); };
      document.getElementById('propFontSize').oninput = (e) => { el.fontSize = parseInt(e.target.value) || 14; markDirty(); renderCanvas(); };

      bindColorPair('propTextColorPicker', 'propTextColor', (v) => { el.textColor = v; markDirty(); renderCanvas(); });
      bindColorPair('propBgColorPicker', 'propBgColor', (v) => { el.bgColor = v; markDirty(); renderCanvas(); });
      bindColorPair('propBorderColorPicker', 'propBorderColor', (v) => { el.borderColor = v; markDirty(); renderCanvas(); });

      document.getElementById('delElemBtn').onclick = () => {
        getCurrentPage().elements = getCurrentPage().elements.filter(i => i.id !== el.id);
        activeElementId = null;
        markDirty();
        renderCanvas(); renderLayersTree(); buildInspector();
      };
    }

    // 2. Shapes Tab
    if (shapesTab) {
      shapesTab.innerHTML = `
        <div class="control-group">
          <label>Preset Geometry</label>
          <div class="shape-preset-grid">
            <button class="shape-btn ${el.shape === 'rect' ? 'active' : ''}" data-shape="rect">⏹️ Rectangle</button>
            <button class="shape-btn ${el.shape === 'rounded' ? 'active' : ''}" data-shape="rounded">🔲 Rounded</button>
            <button class="shape-btn ${el.shape === 'pill' ? 'active' : ''}" data-shape="pill">💊 Capsule</button>
            <button class="shape-btn ${el.shape === 'circle' ? 'active' : ''}" data-shape="circle">⚪ Circle / Oval</button>
            <button class="shape-btn ${el.shape === 'diamond' ? 'active' : ''}" data-shape="diamond">💠 Diamond</button>
            <button class="shape-btn ${el.shape === 'hexagon' ? 'active' : ''}" data-shape="hexagon">⬡ Hexagon</button>
          </div>
        </div>
        <div class="control-group">
          <label>Corner Radius (px)</label>
          <input type="range" min="0" max="60" value="${el.borderRadius || 8}" class="control-input" id="propRadiusRange">
        </div>
      `;

      document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.onclick = () => {
          el.shape = btn.dataset.shape;
          markDirty();
          buildInspector();
          renderCanvas();
        };
      });

      document.getElementById('propRadiusRange').oninput = (e) => {
        el.borderRadius = parseInt(e.target.value);
        el.shape = 'rounded';
        markDirty();
        renderCanvas();
      };
    }

    // 3. Effects Tab
    if (effectsTab) {
      effectsTab.innerHTML = `
        <div class="control-group">
          <label>Glass Backdrop Blur (px)</label>
          <input type="range" min="0" max="40" value="${el.backdropBlur || 0}" class="control-input" id="propBlur">
        </div>
        <div class="control-group">
          <label>Neon Glow / Shadow Spread (px)</label>
          <input type="range" min="0" max="50" value="${el.glowSize || 0}" class="control-input" id="propGlowSize">
        </div>
        <div class="control-group">
          <label>Glow / Shadow Color</label>
          <div class="color-picker-row">
            <input type="color" id="propGlowColorPicker" value="${rgbToHex(el.glowColor || '#9d4edd')}">
            <input type="text" class="control-input" id="propGlowColorText" value="${el.glowColor || '#9d4edd'}">
          </div>
        </div>
        <div class="control-group">
          <label>Opacity (0 to 1)</label>
          <input type="range" min="0.1" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" class="control-input" id="propOpacity">
        </div>
        <div class="control-group">
          <label>Rotation Angle (degrees)</label>
          <input type="range" min="0" max="360" value="${el.rotation || 0}" class="control-input" id="propRotation">
        </div>
      `;

      document.getElementById('propBlur').oninput = (e) => { el.backdropBlur = parseInt(e.target.value); markDirty(); renderCanvas(); };
      document.getElementById('propGlowSize').oninput = (e) => { el.glowSize = parseInt(e.target.value); markDirty(); renderCanvas(); };
      bindColorPair('propGlowColorPicker', 'propGlowColorText', (v) => { el.glowColor = v; markDirty(); renderCanvas(); });
      document.getElementById('propOpacity').oninput = (e) => { el.opacity = parseFloat(e.target.value); markDirty(); renderCanvas(); };
      document.getElementById('propRotation').oninput = (e) => { el.rotation = parseInt(e.target.value); markDirty(); renderCanvas(); };
    }

    // 4. Standard Animation Tab
    if (animationsTab) {
      animationsTab.innerHTML = `
        <div class="control-group">
          <label>Animation Style</label>
          <div id="animStyleContainer"></div>
        </div>

        <div class="control-group" style="margin-top: 6px;">
          <label>Duration (Seconds)</label>
          <input type="number" step="0.1" min="0.1" max="10" class="control-input" id="propAnimDur" value="${el.animDuration || 1.5}">
        </div>

        <button class="btn-top btn-primary" id="replayAnimBtn" style="margin-top: 10px;">▶️ Test Animation Live</button>
      `;

      const animOpts = [
        { label: '🚫 None', value: 'none' },
        { label: '✨ Fade In', value: 'fadeIn' },
        { label: '⬆️ Slide Up', value: 'slideUp' },
        { label: '💥 Scale Pop', value: 'scalePop' },
        { label: '💓 Pulse (Loop)', value: 'pulse' },
        { label: '🏀 Bounce (Loop)', value: 'bounce' },
        { label: '🎈 Float (Loop)', value: 'float' },
        { label: '🔄 Spin (Loop)', value: 'spin' },
        { label: '🔮 Glow Pulse (Loop)', value: 'glowPulse' },
        { label: '📳 Shake', value: 'shake' }
      ];

      createCustomSelect(
        document.getElementById('animStyleContainer'),
        animOpts,
        el.animation || 'none',
        (val) => {
          el.animation = val;
          markDirty();
          renderCanvas();
        }
      );

      document.getElementById('propAnimDur').oninput = (e) => {
        el.animDuration = parseFloat(e.target.value) || 1.5;
        markDirty();
        renderCanvas();
      };

      document.getElementById('replayAnimBtn').onclick = () => {
        const node = document.getElementById(el.id);
        if (node && el.animation !== 'none') {
          node.classList.remove(`anim-${el.animation}`);
          void node.offsetWidth;
          node.classList.add(`anim-${el.animation}`);
        }
      };
    }
  }

  // Code Lab Custom Dropdowns
  function renderCodeLab() {
    const page = getCurrentPage();

    if (codeLabTargetContainer && page) {
      const targetOpts = [
        { label: '-- Choose Element to Script --', value: '' },
        ...page.elements.map(el => ({ label: `[${el.type.toUpperCase()}] ${el.name}`, value: el.id }))
      ];

      createCustomSelect(codeLabTargetContainer, targetOpts, activeElementId || '', (val) => {
        activeElementId = val;
        renderCodeLab();
      });
    }

    const activeEl = getActiveElementModel();
    if (!activeEl) {
      if (blocksContainer) blocksContainer.innerHTML = '<p class="empty-state">Select an element above to configure blocks.</p>';
      if (realJsInput) realJsInput.value = '';
      return;
    }

    if (activeEl.codeMode === 'realCode') {
      if (codeModeBlocksBtn) codeModeBlocksBtn.classList.remove('active');
      if (codeModeJsBtn) codeModeJsBtn.classList.add('active');
      if (codeBlocksPanel) codeBlocksPanel.classList.add('hidden');
      if (codeJsPanel) codeJsPanel.classList.remove('hidden');
    } else {
      if (codeModeBlocksBtn) codeModeBlocksBtn.classList.add('active');
      if (codeModeJsBtn) codeModeJsBtn.classList.remove('active');
      if (codeBlocksPanel) codeBlocksPanel.classList.remove('hidden');
      if (codeJsPanel) codeJsPanel.classList.add('hidden');
    }

    const eventOpts = [
      { label: 'When Clicked / Tapped', value: 'click' },
      { label: 'When Hovered with Mouse', value: 'hover' }
    ];
    createCustomSelect(blockEventContainer, eventOpts, activeEl.logic?.event || 'click', (val) => {
      if (!activeEl.logic) activeEl.logic = { event: 'click', actions: [] };
      activeEl.logic.event = val;
      markDirty();
    });

    renderBlockStack(activeEl);
    if (realJsInput) realJsInput.value = activeEl.customJs || "// Example:\n// app.showAlert('Action fired!');\n// element.style.backgroundColor = '#ff0055';\n// app.navigateTo('screen_id');";
  }

  if (codeModeBlocksBtn) {
    codeModeBlocksBtn.addEventListener('click', () => {
      const el = getActiveElementModel();
      if (el) { el.codeMode = 'blocks'; markDirty(); }
      renderCodeLab();
    });
  }

  if (codeModeJsBtn) {
    codeModeJsBtn.addEventListener('click', () => {
      const el = getActiveElementModel();
      if (el) { el.codeMode = 'realCode'; markDirty(); }
      renderCodeLab();
    });
  }

  if (realJsInput) {
    realJsInput.addEventListener('input', (e) => {
      const el = getActiveElementModel();
      if (el) { el.customJs = e.target.value; markDirty(); }
    });
  }

  function renderBlockStack(el) {
    if (!blocksContainer) return;
    if (!el.logic || !el.logic.actions || el.logic.actions.length === 0) {
      blocksContainer.innerHTML = '<p class="empty-state">No action blocks configured. Click "Add Action Step" below.</p>';
      return;
    }

    const pageOptions = currentProject.pages.map(p => ({ label: `Screen: ${p.name}`, value: p.id }));
    const elemOptions = getCurrentPage().elements.filter(i => i.id !== el.id).map(i => ({ label: `Layer: ${i.name}`, value: i.id }));

    blocksContainer.innerHTML = '';
    el.logic.actions.forEach((act, idx) => {
      const step = document.createElement('div');
      step.className = 'block-step';

      step.innerHTML = `
        <button class="btn-remove-step" data-index="${idx}">&times; Remove Step</button>
        <div class="control-group">
          <label>Action (${idx + 1})</label>
          <div id="stepTypeContainer_${idx}"></div>
        </div>
        ${['navigate', 'setText', 'setBg'].includes(act.type) ? `
          <div class="control-group">
            <label>Target</label>
            <div id="stepTargetContainer_${idx}"></div>
          </div>
        ` : ''}
        <div class="control-group">
          <label>Parameter Value</label>
          <input type="text" class="control-input step-val" data-index="${idx}" value="${act.value || ''}" placeholder="Enter parameter...">
        </div>
      `;

      blocksContainer.appendChild(step);

      const actionTypeOpts = [
        { label: 'Show Alert Pop-up', value: 'alert' },
        { label: 'Navigate to Screen', value: 'navigate' },
        { label: 'Set Layer Text', value: 'setText' },
        { label: 'Set Layer Background Color', value: 'setBg' }
      ];
      createCustomSelect(
        document.getElementById(`stepTypeContainer_${idx}`),
        actionTypeOpts,
        act.type,
        (val) => {
          el.logic.actions[idx].type = val;
          markDirty();
          renderBlockStack(el);
        }
      );

      const targetContainer = document.getElementById(`stepTargetContainer_${idx}`);
      if (targetContainer) {
        const availableTargets = [
          { label: '-- Choose Target --', value: '' },
          ...(act.type === 'navigate' ? pageOptions : elemOptions)
        ];
        createCustomSelect(
          targetContainer,
          availableTargets,
          act.target || '',
          (val) => {
            el.logic.actions[idx].target = val;
            markDirty();
          }
        );
      }
    });

    document.querySelectorAll('.step-val').forEach(inp => {
      inp.oninput = (e) => {
        const idx = inp.dataset.index;
        el.logic.actions[idx].value = e.target.value;
        markDirty();
      };
    });

    document.querySelectorAll('.btn-remove-step').forEach(btn => {
      btn.onclick = () => {
        el.logic.actions.splice(btn.dataset.index, 1);
        markDirty();
        renderBlockStack(el);
      };
    });
  }

  if (addBlockStepBtn) {
    addBlockStepBtn.addEventListener('click', () => {
      const el = getActiveElementModel();
      if (!el) {
        AppLab.alert('Please select an element first.', 'Selection Required', '⚠️');
        return;
      }
      if (!el.logic) el.logic = { event: 'click', actions: [] };
      el.logic.actions.push({ type: 'alert', target: '', value: 'Action Step' });
      markDirty();
      renderBlockStack(el);
    });
  }

  // Component Drag & Drop
  document.querySelectorAll('.draggable-card').forEach(card => {
    card.ondragstart = (e) => e.dataTransfer.setData('type', card.dataset.type);
  });

  if (canvas) {
    canvas.ondragover = (e) => e.preventDefault();
    canvas.ondrop = (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('type');
      if (!type) return;
      const rect = canvas.getBoundingClientRect();
      const newEl = {
        id: 'el_' + Date.now().toString().slice(-4),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
        type: type,
        x: Math.max(10, e.clientX - rect.left - 40),
        y: Math.max(10, e.clientY - rect.top - 20),
        width: 140,
        height: 44,
        text: type === 'button' ? 'Click Me' : 'New ' + type,
        textColor: '#ffffff',
        bgColor: '#7b2cbf',
        borderColor: '#9d4edd',
        borderWidth: 1,
        shape: 'rounded',
        borderRadius: 10,
        fontSize: 14,
        fontFamily: fontOptions[0].value,
        fontWeight: '500',
        textAlign: 'center',
        backdropBlur: 0,
        glowSize: 0,
        glowColor: '#9d4edd',
        opacity: 1,
        rotation: 0,
        animation: 'none',
        animDuration: 1.5,
        codeMode: 'blocks',
        customJs: '',
        logic: { event: 'click', actions: [] }
      };
      getCurrentPage().elements.push(newEl);
      markDirty();
      selectElement(newEl.id);
    };
  }

  function renderPagesList() {
    if (!pagesList) return;
    pagesList.innerHTML = '';
    currentProject.pages.forEach(p => {
      const it = document.createElement('div');
      it.className = `page-item ${p.id === activeScreenId ? 'active' : ''}`;
      it.innerText = `📄 ${p.name}`;
      it.onclick = () => { activeScreenId = p.id; renderPagesList(); renderCanvas(); };
      pagesList.appendChild(it);
    });
  }

  function renderLayersTree() {
    if (!layersTree) return;
    layersTree.innerHTML = '';
    getCurrentPage().elements.forEach(el => {
      const l = document.createElement('div');
      l.className = `layer-item ${el.id === activeElementId ? 'selected' : ''}`;
      l.innerText = el.name;
      l.onclick = () => selectElement(el.id);
      layersTree.appendChild(l);
    });
  }

  if (addPageBtn) {
    addPageBtn.onclick = () => {
      const pId = 'scr_' + Date.now().toString().slice(-4);
      currentProject.pages.push({ id: pId, name: 'Screen ' + (currentProject.pages.length + 1), elements: [] });
      activeScreenId = pId;
      markDirty();
      renderPagesList(); renderCanvas();
    };
  }

  if (modeToggleBtn) {
    modeToggleBtn.onclick = () => {
      isPreviewMode = !isPreviewMode;
      modeToggleBtn.innerText = isPreviewMode ? '⏹️ Stop' : '▶️ Preview';
      document.body.classList.toggle('preview-mode', isPreviewMode);
      renderCanvas();
    };
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const jsonStr = JSON.stringify(currentProject, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.projectName.toLowerCase().replace(/\s+/g, '_')}.applab`;
      a.click();
    });
  }

  if (startMenuToggleBtn) {
    startMenuToggleBtn.onclick = () => {
      if (startMenuPopup) startMenuPopup.classList.toggle('hidden');
    };
  }

  document.addEventListener('click', (e) => {
    if (startMenuToggleBtn && startMenuPopup && !startMenuToggleBtn.contains(e.target) && !startMenuPopup.contains(e.target)) {
      startMenuPopup.classList.add('hidden');
    }
  });

  const smHomeBtn = document.getElementById('smHomeBtn');
  if (smHomeBtn) smHomeBtn.onclick = () => { switchMainView('homeView'); if (startMenuPopup) startMenuPopup.classList.add('hidden'); };
  const smStudioBtn = document.getElementById('smStudioBtn');
  if (smStudioBtn) smStudioBtn.onclick = () => { switchMainView('builderView'); if (startMenuPopup) startMenuPopup.classList.add('hidden'); };
  const smNewProjectBtn = document.getElementById('smNewProjectBtn');
  if (smNewProjectBtn) smNewProjectBtn.onclick = () => { openNewProjectModal(); if (startMenuPopup) startMenuPopup.classList.add('hidden'); };
  const smTutorialBtn = document.getElementById('smTutorialBtn');
  if (smTutorialBtn) smTutorialBtn.onclick = () => { switchMainView('tutorialView'); if (startMenuPopup) startMenuPopup.classList.add('hidden'); };

  const smSettingsBtn = document.getElementById('smSettingsBtn');
  if (smSettingsBtn) {
    smSettingsBtn.onclick = () => {
      if (startMenuPopup) startMenuPopup.classList.add('hidden');

      const themeOpts = [
        { label: '🌙 Dark Glassmorphism', value: 'dark' },
        { label: '☀️ Clean Daylight (Light)', value: 'light' }
      ];
      createCustomSelect(settingThemeContainer, themeOpts, userSettings.theme, (val) => {
        userSettings.theme = val;
      });

      const modeOpts = [
        { label: '✨ Quality Mode (Full Blurs & Glows)', value: 'quality' },
        { label: '⚡ Performance Mode (Fast FPS)', value: 'performance' }
      ];
      createCustomSelect(settingModeContainer, modeOpts, userSettings.mode, (val) => {
        userSettings.mode = val;
      });

      if (settingsModal) settingsModal.classList.remove('hidden');
    };
  }

  if (closeSettingsBtn) closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');
  if (applySettingsBtn) {
    applySettingsBtn.onclick = () => {
      try {
        localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(userSettings));
      } catch (e) {}
      applyGlobalSettings();
      settingsModal.classList.add('hidden');
    };
  }

  function bindColorPair(pickerId, textId, callback) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (!picker || !text) return;
    picker.oninput = (e) => { text.value = e.target.value; callback(e.target.value); };
    text.oninput = (e) => { callback(e.target.value); if (/^#[0-9A-F]{6}$/i.test(e.target.value)) picker.value = e.target.value; };
  }

  function rgbToHex(val) {
    if (!val || val === 'transparent') return '#000000';
    if (val.startsWith('#')) return val;
    const nums = val.match(/\d+/g);
    if (!nums || nums.length < 3) return '#000000';
    return '#' + nums.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  }

  // ================= DEEP MULTI-PAGE ACADEMY CURRICULUM =================
  let activeTrackId = 'track_shapes';
  let currentCoursePageIndex = 0;

  const courseTracks = [
    {
      id: 'track_canvas',
      title: '1. Canvas, Layouts & Responsiveness',
      desc: 'Coordinate clamping, boundary physics, device viewports & screen trees',
      pages: [
        {
          title: 'Chapter 1: Hardware Boundaries & Pixel Spaces',
          desc: 'AppLab operates on an absolute coordinate matrix constrained within hardware device frames. Selecting Phone (340×680), Tablet (680×500), or Desktop (840×520) alters the viewport bezel while locking element coordinates to prevent layout drift.',
          type: 'theory',
          codeSnippet: `// Hardware Bounds Matrix:\n// Phone:   340px W × 680px H\n// Tablet:  680px W × 500px H\n// Desktop: 840px W × 520px H`,
          quiz: null
        },
        {
          title: 'Chapter 2: Interactive Practice: Coordinate Clamping',
          desc: 'Test real-time boundary clamping. Click the control buttons to move the sample component chip. Observe how coordinate calculations prevent elements from drifting off-canvas.',
          type: 'practice_canvas',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Chapter 3: Dynamic Alignment & Centering Math',
          desc: 'When positioning cards and dialogue popups across variable device factors, calculate relative offsets dynamically using the container bounding rectangle.',
          type: 'theory',
          codeSnippet: `// Horizontal centering equation:\nconst centeredLeft = (canvas.offsetWidth - element.offsetWidth) / 2;\nelement.style.left = centeredLeft + 'px';`,
          quiz: null
        },
        {
          title: 'Chapter 4: Multi-Screen Page Tree Architecture',
          desc: 'Each screen maintains its own isolated DOM layer stack. Navigating across screens unmounts inactive layers without dumping their configuration models from memory.',
          type: 'theory',
          codeSnippet: `// Programmatically navigate to target screen ID:\napp.navigateTo('screen_2');`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: Canvas Architecture',
          desc: 'Verify your mastery over coordinate geometry and hardware frames.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'What happens to element dimensions when toggling between Phone and Tablet viewports?',
            options: [
              'Elements automatically stretch to fill 100% width',
              'Elements maintain their absolute pixel dimensions and coordinates',
              'All placed elements are cleared from memory'
            ],
            correctIndex: 1,
            explanation: 'AppLab preserves your exact element coordinates and pixel dimensions so layout structures remain intact across device frame previews.'
          }
        }
      ]
    },
    {
      id: 'track_shapes',
      title: '2. Shapes, Contours & Glassmorphism',
      desc: 'Geometric clip paths, glow contours, glass blurs & specular highlights',
      pages: [
        {
          title: 'Chapter 1: The Geometry Engine: Beyond Rectangles',
          desc: 'Interfaces in AppLab break free from standard rectangles. Using SVG polygon vector arrays in CSS clip-path, components morph into smooth Capsules, Circles, Diamonds, and Hexagons.',
          type: 'theory',
          codeSnippet: `/* Diamond Polygon Contour */\nclip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);`,
          quiz: null
        },
        {
          title: 'Chapter 2: Drop-Shadow Alpha Contour Wrapping',
          desc: 'Standard CSS box-shadow fails on clipped geometry because clip-path clips away pixels outside the polygon. AppLab dynamically applies CSS `filter: drop-shadow(...)` to follow polygonal vertices.',
          type: 'theory',
          codeSnippet: `/* Correct Polygon Shadow Wrapping */\nfilter: drop-shadow(0 0 16px #9d4edd);`,
          quiz: null
        },
        {
          title: 'Chapter 3: Interactive Practice: Contour & Shape Shifter',
          desc: 'Click each shape preset below to observe how polygon vector points and neon drop-shadow contours react live on the sample component.',
          type: 'practice_shapes',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Chapter 4: Multi-Layer Glassmorphism & Blurs',
          desc: 'Achieve true frosted-glass realism by layering translucent tints with high-radius backdrop blur filters and luminous specular borders.',
          type: 'theory',
          codeSnippet: `/* Obsidian Glass Stack */\nbackground: rgba(255, 255, 255, 0.05);\nbackdrop-filter: blur(20px);\nborder: 1px solid rgba(157, 78, 221, 0.25);`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: Contours & Glass',
          desc: 'Confirm your understanding of CSS polygon rendering.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'Why does AppLab use filter: drop-shadow instead of box-shadow for Hexagons and Diamonds?',
            options: [
              'box-shadow is deprecated in modern browsers',
              'clip-path cuts off any pixels outside the polygon, including standard box-shadow',
              'filter: drop-shadow runs faster on low-end processors'
            ],
            correctIndex: 1,
            explanation: 'CSS clip-path establishes a new geometric mask that clips rectangular box-shadows. Filter drop-shadow computes shadow around alpha channels.'
          }
        }
      ]
    },
    {
      id: 'track_blocks',
      title: '3. Visual Block Automation',
      desc: 'Event triggers, sequential execution stacks & parameter payloads',
      pages: [
        {
          title: 'Chapter 1: The Event-Action Mental Model',
          desc: 'Every interactive application operates on triggers and reactions. The Code Lab organizes interactions into an event listener (Click, Hover) followed by an ordered execution stack.',
          type: 'theory',
          codeSnippet: `[WHEN: User Clicks Element]\n  Step 1: Emit Sound\n  Step 2: Mutate Visual State\n  Step 3: Transition Page`,
          quiz: null
        },
        {
          title: 'Chapter 2: Multi-Action Block Chaining',
          desc: 'Multiple actions can be stacked on a single component. When fired, the runtime loops down the action stack sequentially, applying mutations to target layers.',
          type: 'theory',
          codeSnippet: `// Sequential block chain execution:\nfor (const action of blockStack) {\n  executeAction(action);\n}`,
          quiz: null
        },
        {
          title: 'Chapter 3: Interactive Practice: Block Stack Simulator',
          desc: 'Stack and test visual actions live in the simulation lab. Watch the target chip re-color and announce the execution sequence.',
          type: 'practice_blocks',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Chapter 4: Parameter Payloads & Layer Cross-Talk',
          desc: 'Actions can send payloads to modify other components on the canvas—such as updating text in a title label or changing the background of a container card.',
          type: 'theory',
          codeSnippet: `// Cross-layer payload targeting:\nconst targetLayer = document.getElementById(action.targetId);\ntargetLayer.innerText = action.payload;`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: Block Logic',
          desc: 'Test your grasp of block execution sequencing.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'In what order do actions execute within an AppLab Action Stack?',
            options: [
              'Random asynchronous order',
              'Sequentially from top to bottom',
              'Reverse order from bottom to top'
            ],
            correctIndex: 1,
            explanation: 'AppLab processes action blocks in a top-to-bottom pipeline so prerequisite states apply before transitions fire.'
          }
        }
      ]
    },
    {
      id: 'track_javascript',
      title: '4. JavaScript Runtime & Sandbox APIs',
      desc: 'Scoped execution, DOM manipulation, Web Audio synthesis & modals',
      pages: [
        {
          title: 'Chapter 1: The Sandbox Execution Environment',
          desc: 'When using Real JavaScript in Code Lab, code executes inside an isolated sandbox with direct access to three primary objects: `element`, `app`, and `canvas`.',
          type: 'theory',
          codeSnippet: `// Scoped sandbox constructor:\nconst runner = new Function('element', 'app', 'canvas', userCode);`,
          quiz: null
        },
        {
          title: 'Chapter 2: Audio Synthesis & Web Audio API',
          desc: 'Trigger custom UI sound effects without external MP3 dependencies using the built-in oscillator synthesis hook.',
          type: 'theory',
          codeSnippet: `// Synthesize audio bleep:\napp.playBeep();`,
          quiz: null
        },
        {
          title: 'Chapter 3: Interactive Practice: Live Script Runner',
          desc: 'Test the live script runner below to trigger Web Audio synthesis and element state mutation.',
          type: 'practice_js',
          codeSnippet: `element.style.backgroundColor = '#9d4edd';\napp.playBeep();\napp.showAlert('Sandbox executed successfully!');`,
          quiz: null
        },
        {
          title: 'Chapter 4: Custom Modal Dialog Hooks',
          desc: 'Replace disruptive browser-native popups by triggering AppLab\'s async purple glass dialog system from script.',
          type: 'theory',
          codeSnippet: `// Open non-blocking custom modal:\napp.showAlert('Payment confirmed!');`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: JavaScript Sandbox',
          desc: 'Verify your knowledge of the scoped runtime APIs.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'Which argument passed into the script function references the target element DOM node?',
            options: [
              '`element`',
              '`this.dom`',
              '`window.node`'
            ],
            correctIndex: 0,
            explanation: 'The `element` parameter directly references the active DOM node, allowing instant style and attribute updates.'
          }
        }
      ]
    },
    {
      id: 'track_dynamics',
      title: '5. Component Dynamics & Inputs',
      desc: 'Live value binding, placeholder logic, input gathering & states',
      pages: [
        {
          title: 'Chapter 1: Input Fields & Keystroke Harvesting',
          desc: 'User text inputs gather runtime data. Form fields store user text in their `placeholder` or `value` properties, allowing other elements to read from them.',
          type: 'theory',
          codeSnippet: `// Extract input field value:\nconst userInput = document.querySelector('input.placed-item').value;`,
          quiz: null
        },
        {
          title: 'Chapter 2: Interactive Practice: Live Data Binding',
          desc: 'Type into the sample input below and click "Bind Value" to watch the target display update live in the sandbox.',
          type: 'practice_binding',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Chapter 3: Component State & Disabled Flags',
          desc: 'Buttons and inputs can toggle interactive states during runtime execution to prevent duplicate button submissions.',
          type: 'theory',
          codeSnippet: `// Toggle button interactive state:\nelement.disabled = true;\nelement.style.opacity = '0.5';`,
          quiz: null
        },
        {
          title: 'Chapter 4: Z-Index Layer Ordering Dynamics',
          desc: 'Elements stack in order of placement. Using the Windows-style context menu, layers can be brought to front or sent to back to manage overlays and modals.',
          type: 'theory',
          codeSnippet: `// Re-order active layer:\ncanvas.appendChild(targetElement); // Brings to front`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: Inputs & State',
          desc: 'Confirm your understanding of dynamic component data handling.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'How do you prevent rapid double-clicks on an action button in script?',
            options: [
              'Delete the button immediately from DOM',
              'Set element.disabled = true on the initial click event',
              'Change the screen resolution to Desktop'
            ],
            correctIndex: 1,
            explanation: 'Disabling the button on the first event prevents multiple trigger executions while actions run.'
          }
        }
      ]
    },
    {
      id: 'track_performance',
      title: '6. Production Architecture & Performance',
      desc: 'GPU backdrop blurs, rendering modes & production bundling',
      pages: [
        {
          title: 'Chapter 1: GPU Backdrop Filter Profiling',
          desc: 'Backdrop blur filters are GPU-intensive. In large projects with dozens of overlapping cards, heavy blurs can cause frame stutter.',
          type: 'theory',
          codeSnippet: `/* High Performance Mode */\n[data-mode="performance"] * {\n  backdrop-filter: none !important;\n}`,
          quiz: null
        },
        {
          title: 'Chapter 2: Interactive Practice: Quality vs Performance Toggle',
          desc: 'Toggle the rendering mode on the live chip below to see how GPU filters are cleanly bypassed for high-framerate rendering.',
          type: 'practice_perf',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Chapter 3: Dirty State & Unsaved Edits Detection',
          desc: 'AppLab tracks unsaved mutations via an `isDirty` flag, safeguarding against accidental browser tab closures or view shifts.',
          type: 'theory',
          codeSnippet: `// Window unload protection:\nwindow.addEventListener('beforeunload', (e) => {\n  if (isDirty) e.returnValue = 'Unsaved changes';\n});`,
          quiz: null
        },
        {
          title: 'Chapter 4: Schema Serialization & .applab Bundles',
          desc: 'Projects serialize into portable JSON schemas. Exporting a `.applab` file packages all screens, coordinate vectors, and code stacks into a single bundle.',
          type: 'theory',
          codeSnippet: `// Project JSON payload structure:\n{\n  "projectName": "My App",\n  "pages": [{ "id": "screen_1", "elements": [...] }]\n}`,
          quiz: null
        },
        {
          title: 'Chapter 5: Master Quiz: Performance & Bundles',
          desc: 'Test your understanding of optimization and project portability.',
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'What optimization does Performance Mode apply across the UI?',
            options: [
              'Converts all colors to black and white',
              'Disables heavy GPU backdrop blur filters and box-shadow calculations',
              'Deletes the Code Lab runtime'
            ],
            correctIndex: 1,
            explanation: 'Performance Mode bypasses expensive GPU blur filters and drop-shadow calculations to maintain a smooth 60 FPS on all hardware.'
          }
        }
      ]
    }
  ];

  function renderCourseWorkspace() {
    if (!trackMenu || !courseStage) return;

    // 1. Render Left Track Items
    trackMenu.innerHTML = '';
    courseTracks.forEach(track => {
      const item = document.createElement('div');
      item.className = `track-item ${track.id === activeTrackId ? 'active' : ''}`;
      item.innerHTML = `
        <h4>${track.title}</h4>
        <span class="track-meta">${track.pages.length} Pages • ${track.desc}</span>
      `;
      item.onclick = () => {
        activeTrackId = track.id;
        currentCoursePageIndex = 0;
        renderCourseWorkspace();
      };
      trackMenu.appendChild(item);
    });

    // 2. Render Active Track Page
    renderActiveCoursePage();
  }

  function renderActiveCoursePage() {
    const track = courseTracks.find(t => t.id === activeTrackId);
    if (!track) return;

    const page = track.pages[currentCoursePageIndex];
    if (!page) return;

    // Dots indicator
    let dotsHtml = track.pages.map((p, idx) => `
      <div class="page-dot ${idx === currentCoursePageIndex ? 'active' : ''}" data-page-idx="${idx}"></div>
    `).join('');

    let interactiveHtml = '';

    if (page.type === 'practice_canvas') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: Coordinate Clamping</span></div>
          <div class="lab-stage" id="canvasLabStage" style="position: relative; height: 120px; overflow: hidden;">
            <div id="canvasLabChip" class="lab-target-chip" style="position: absolute; left: 80px; top: 35px;">📦 Coordinate Chip</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="moveChipLeft">⬅️ Left (-30px)</button>
            <button class="btn-top" id="moveChipRight">Right (+30px) ➡️</button>
            <button class="btn-top" id="resetChipPos">Reset Position</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_shapes') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: Geometric Contours</span></div>
          <div class="lab-stage">
            <div id="courseShapeChip" class="lab-target-chip" style="clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); filter: drop-shadow(0 0 14px #9d4edd); border-radius:0;">💠 Diamond</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="shapePillBtn">💊 Capsule</button>
            <button class="btn-top" id="shapeDiamondBtn">💠 Diamond</button>
            <button class="btn-top" id="shapeHexagonBtn">⬡ Hexagon</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_blocks') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: Block Stack Simulator</span></div>
          <div class="lab-stage">
            <div id="blockSimChip" class="lab-target-chip">⏹️ Idle Layer</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top btn-primary" id="runBlockSimBtn">▶️ Trigger Action Stack</button>
            <button class="btn-top" id="resetBlockSimBtn">Reset</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_js') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: Live Script Runner</span></div>
          <div class="lab-stage">
            <div id="jsLabTarget" class="lab-target-chip">⚡ Script Target</div>
          </div>
          <button class="btn-top btn-primary" id="runCourseJsBtn" style="align-self: center;">▶️ Execute Sandbox Code</button>
        </div>
      `;
    } else if (page.type === 'practice_binding') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: Live Data Binding</span></div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            <input type="text" class="control-input" id="bindingInput" value="Hello AppLab" style="max-width: 200px;">
            <button class="btn-top btn-primary" id="applyBindingBtn">Bind Value</button>
          </div>
          <div class="lab-stage">
            <div id="bindingTargetChip" class="lab-target-chip">Hello AppLab</div>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_perf') {
      interactiveHtml = `
        <div class="lab-card">
          <div class="lab-title-bar"><span>🧪 Interactive Lab: GPU Filter Profiler</span></div>
          <div class="lab-stage">
            <div id="perfTargetChip" class="lab-target-chip" style="backdrop-filter: blur(20px); box-shadow: 0 0 25px var(--accent-glow);">✨ Quality Glass (Blur Active)</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top" id="perfToggleQuality">✨ Quality Mode</button>
            <button class="btn-top" id="perfToggleFast">⚡ Performance Mode</button>
          </div>
        </div>
      `;
    } else if (page.type === 'quiz' && page.quiz) {
      const q = page.quiz;
      const optsHtml = q.options.map((opt, i) => `
        <button class="quiz-option-btn" data-opt-idx="${i}">
          <span style="opacity: 0.6;">[${String.fromCharCode(65 + i)}]</span> ${opt}
        </button>
      `).join('');

      interactiveHtml = `
        <div class="quiz-card">
          <div class="quiz-question">${q.question}</div>
          <div class="quiz-options" id="quizOptionsContainer">${optsHtml}</div>
          <div class="quiz-feedback" id="quizFeedbackBox">${q.explanation}</div>
        </div>
      `;
    }

    courseStage.innerHTML = `
      <div class="course-paper">
        <div class="course-paper-header">
          <span class="page-indicator-pill">${track.title.toUpperCase()} • PAGE ${currentCoursePageIndex + 1} OF ${track.pages.length}</span>
          <div class="page-dots">${dotsHtml}</div>
        </div>

        <div class="lesson-headline">
          <h2>${page.title}</h2>
          <p>${page.desc}</p>
        </div>

        ${page.codeSnippet ? `
          <div class="code-snippet-box">
            <button class="btn-copy-code" data-code="${encodeURIComponent(page.codeSnippet)}">Copy Snippet</button>
            <pre>${page.codeSnippet}</pre>
          </div>
        ` : ''}

        ${interactiveHtml}

        <div class="course-pagination-footer">
          <button class="btn-top" id="prevCoursePageBtn" ${currentCoursePageIndex === 0 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>&larr; Previous Page</button>
          <button class="btn-top btn-primary" id="nextCoursePageBtn">
            ${currentCoursePageIndex === track.pages.length - 1 ? 'Open Studio Builder 🚀' : 'Next Page &rarr;'}
          </button>
        </div>
      </div>
    `;

    // Pagination Click Bindings
    document.querySelectorAll('.page-dot').forEach(dot => {
      dot.onclick = () => {
        currentCoursePageIndex = parseInt(dot.dataset.pageIdx);
        renderActiveCoursePage();
      };
    });

    const prevBtn = document.getElementById('prevCoursePageBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentCoursePageIndex > 0) {
          currentCoursePageIndex--;
          renderActiveCoursePage();
        }
      };
    }

    const nextBtn = document.getElementById('nextCoursePageBtn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentCoursePageIndex < track.pages.length - 1) {
          currentCoursePageIndex++;
          renderActiveCoursePage();
        } else {
          switchMainView('builderView');
        }
      };
    }

    // Copy Snippet Buttons
    document.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.onclick = () => {
        const text = decodeURIComponent(btn.dataset.code);
        navigator.clipboard.writeText(text);
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy Snippet', 1500);
      };
    });

    // Practice Lab 1: Canvas Coordinates
    const chip = document.getElementById('canvasLabChip');
    if (chip) {
      document.getElementById('moveChipLeft').onclick = () => {
        let left = parseInt(chip.style.left) || 80;
        chip.style.left = `${Math.max(10, left - 30)}px`;
      };
      document.getElementById('moveChipRight').onclick = () => {
        let left = parseInt(chip.style.left) || 80;
        chip.style.left = `${Math.min(260, left + 30)}px`;
      };
      document.getElementById('resetChipPos').onclick = () => {
        chip.style.left = '80px';
      };
    }

    // Practice Lab 2: Geometric Shapes
    const shapeChip = document.getElementById('courseShapeChip');
    if (shapeChip) {
      document.getElementById('shapePillBtn').onclick = () => {
        shapeChip.style.clipPath = 'none';
        shapeChip.style.borderRadius = '9999px';
        shapeChip.style.boxShadow = '0 0 20px var(--accent-glow)';
        shapeChip.style.filter = 'none';
        shapeChip.innerText = '💊 Capsule';
      };
      document.getElementById('shapeDiamondBtn').onclick = () => {
        shapeChip.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        shapeChip.style.borderRadius = '0';
        shapeChip.style.boxShadow = 'none';
        shapeChip.style.filter = 'drop-shadow(0 0 14px #9d4edd)';
        shapeChip.innerText = '💠 Diamond';
      };
      document.getElementById('shapeHexagonBtn').onclick = () => {
        shapeChip.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        shapeChip.style.borderRadius = '0';
        shapeChip.style.boxShadow = 'none';
        shapeChip.style.filter = 'drop-shadow(0 0 14px #9d4edd)';
        shapeChip.innerText = '⬡ Hexagon';
      };
    }

    // Practice Lab 3: Block Simulator
    const blockSimChip = document.getElementById('blockSimChip');
    if (blockSimChip) {
      document.getElementById('runBlockSimBtn').onclick = () => {
        blockSimChip.innerText = '⚡ Step 1: Recoloring...';
        blockSimChip.style.backgroundColor = '#00f2fe';
        blockSimChip.style.boxShadow = '0 0 25px #00f2fe';
        setTimeout(() => {
          blockSimChip.innerText = '✨ Step 2: Pulsing...';
          blockSimChip.className = 'lab-target-chip anim-pulse';
        }, 600);
      };
      document.getElementById('resetBlockSimBtn').onclick = () => {
        blockSimChip.className = 'lab-target-chip';
        blockSimChip.style.backgroundColor = '';
        blockSimChip.style.boxShadow = '';
        blockSimChip.innerText = '⏹️ Idle Layer';
      };
    }

    // Practice Lab 4: JavaScript Sandbox
    const runJsBtn = document.getElementById('runCourseJsBtn');
    if (runJsBtn) {
      runJsBtn.onclick = () => {
        const jsTarget = document.getElementById('jsLabTarget');
        jsTarget.style.backgroundColor = '#ff0077';
        jsTarget.style.boxShadow = '0 0 25px #ff0077';
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator(); osc.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
        AppLab.alert('Sandbox code executed: Element recolored & audio tone synthesized!', 'Code Lab Live Runner', '⚡');
      };
    }

    // Practice Lab 5: Live Data Binding
    const applyBindingBtn = document.getElementById('applyBindingBtn');
    if (applyBindingBtn) {
      applyBindingBtn.onclick = () => {
        const inputVal = document.getElementById('bindingInput').value;
        const target = document.getElementById('bindingTargetChip');
        target.innerText = inputVal || '(Empty)';
        target.classList.add('anim-scalePop');
        setTimeout(() => target.classList.remove('anim-scalePop'), 600);
      };
    }

    // Practice Lab 6: Performance vs Quality
    const perfChip = document.getElementById('perfTargetChip');
    if (perfChip) {
      document.getElementById('perfToggleQuality').onclick = () => {
        perfChip.style.backdropFilter = 'blur(20px)';
        perfChip.style.boxShadow = '0 0 25px var(--accent-glow)';
        perfChip.innerText = '✨ Quality Glass (Blur Active)';
      };
      document.getElementById('perfToggleFast').onclick = () => {
        perfChip.style.backdropFilter = 'none';
        perfChip.style.boxShadow = 'none';
        perfChip.innerText = '⚡ Performance Mode (Zero Blur GPU Load)';
      };
    }

    // Interactive Quiz Option Clicks
    if (page.type === 'quiz' && page.quiz) {
      const q = page.quiz;
      const feedbackBox = document.getElementById('quizFeedbackBox');
      document.querySelectorAll('.quiz-option-btn').forEach(optBtn => {
        optBtn.onclick = () => {
          const chosenIdx = parseInt(optBtn.dataset.optIdx);
          document.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.classList.remove('correct', 'incorrect');
            b.disabled = true;
          });

          if (chosenIdx === q.correctIndex) {
            optBtn.classList.add('correct');
            feedbackBox.className = 'quiz-feedback show success';
            feedbackBox.innerText = '✅ Correct! ' + q.explanation;
          } else {
            optBtn.classList.add('incorrect');
            const correctBtn = document.querySelector(`[data-opt-idx="${q.correctIndex}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
            feedbackBox.className = 'quiz-feedback show fail';
            feedbackBox.innerText = '❌ Incorrect. ' + q.explanation;
          }
        };
      });
    }
  }

  // Initial Load
  switchMainView('homeView');
});
