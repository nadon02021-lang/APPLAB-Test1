document.addEventListener('DOMContentLoaded', () => {
  // --- Storage Keys & Data Models ---
  const STORAGE_PROJECTS = 'applab_projects_library';
  const STORAGE_FOLDERS = 'applab_folders_list';
  const STORAGE_SETTINGS = 'applab_user_settings';

  let isDirty = false;
  function markDirty() { isDirty = true; }
  function markClean() { isDirty = false; }

  let clipboardStyles = null;
  let clipboardElement = null;

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
                letterSpacing: 0.5,
                lineHeight: 1.2,
                textTransform: 'none',
                textDecoration: 'none',
                textAlign: 'center',
                padding: 10,
                textColor: '#ffffff',
                bgColor: '#7b2cbf',
                borderColor: '#9d4edd',
                borderWidth: 1,
                borderStyle: 'solid',
                shape: 'pill',
                borderRadius: 9999,
                backdropBlur: 10,
                glowSize: 16,
                glowColor: '#9d4edd',
                opacity: 1,
                rotation: 0,
                animation: 'pulse',
                animDuration: 1.5,
                animDelay: 0,
                animIteration: 'infinite',
                animEasing: 'ease-in-out',
                animDirection: 'alternate',
                animTrigger: 'ambient',
                tooltip: 'Primary button for starting actions',
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
  let contextTargetProjectId = null;
  let contextClickPos = { x: 50, y: 50 };

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

  let elementContextMenu = document.getElementById('elementContextMenu');

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

  const trackMenu = document.getElementById('trackMenu');
  const courseStage = document.getElementById('courseStage');

  // ================= 2-SECOND HOVER TOOLTIP SYSTEM (FOLLOWS MOUSE) =================
  let tooltipElem = document.querySelector('.app-tooltip');
  if (!tooltipElem) {
    tooltipElem = document.createElement('div');
    tooltipElem.className = 'app-tooltip hidden';
    document.body.appendChild(tooltipElem);
  }

  tooltipElem.style.position = 'fixed';
  tooltipElem.style.zIndex = '999999';
  tooltipElem.style.pointerEvents = 'none';

  let hoverTimer = null;
  let currentMouseX = 0;
  let currentMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
  });

  function updateTooltipPosition(clientX, clientY) {
    const offset = 14;
    let targetX = clientX + offset;
    let targetY = clientY + offset;

    const tooltipWidth = tooltipElem.offsetWidth || 180;
    const tooltipHeight = tooltipElem.offsetHeight || 40;

    if (targetX + tooltipWidth > window.innerWidth) {
      targetX = clientX - tooltipWidth - offset;
    }
    if (targetY + tooltipHeight > window.innerHeight) {
      targetY = clientY - tooltipHeight - offset;
    }

    tooltipElem.style.left = `${Math.max(10, targetX)}px`;
    tooltipElem.style.top = `${Math.max(10, targetY)}px`;
  }

  function setupTooltips(node, model) {
    node.addEventListener('mouseenter', (e) => {
      const desc = model.tooltip || `Layer: ${model.name} (${model.type})`;
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;

      if (hoverTimer) clearTimeout(hoverTimer);

      hoverTimer = setTimeout(() => {
        tooltipElem.innerText = desc;
        tooltipElem.classList.remove('hidden');
        updateTooltipPosition(currentMouseX, currentMouseY);
      }, 2000);
    });

    node.addEventListener('mousemove', (e) => {
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;
      if (!tooltipElem.classList.contains('hidden')) {
        updateTooltipPosition(currentMouseX, currentMouseY);
      }
    });

    node.addEventListener('mouseleave', () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      tooltipElem.classList.add('hidden');
    });

    node.addEventListener('mousedown', () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      tooltipElem.classList.add('hidden');
    });
  }

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
        if (!dialogIcon || !dialogTitle || !dialogMessage || !customDialogModal) {
          alert(message);
          resolve();
          return;
        }
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
        if (!customDialogModal) {
          resolve(confirm(message));
          return;
        }
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
        if (!customDialogModal) {
          resolve(prompt(message, defaultValue));
          return;
        }
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
      card.dataset.projectId = proj.id;
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

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openProjectCardContextMenu(e, proj.id);
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
      activeElementId = null;
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
      let node;
      if (el.type === 'button') {
        node = document.createElement('button');
        node.innerText = el.text || 'Button';
      } else if (el.type === 'input') {
        node = document.createElement('input');
        node.placeholder = el.text || 'Enter text...';
      } else if (el.type === 'textarea') {
        node = document.createElement('textarea');
        node.placeholder = el.text || 'Multi-line comments...';
        node.style.resize = 'none';
      } else if (el.type === 'image') {
        node = document.createElement('div');
        const img = document.createElement('img');
        img.src = el.text;
        img.style.objectFit = el.imageFit || 'cover';
        img.onerror = () => { img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%232b1b4d%22/><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23c77dff%22 font-family=%22sans-serif%22 font-size=%2214%22>No Image</text></svg>'; };
        node.appendChild(img);
      } else if (el.type === 'toggle') {
        node = document.createElement('div');
        const active = el.isChecked ? 'translate(26px, -50%)' : 'translate(0, -50%)';
        const bg = el.isChecked ? '#9d4edd' : 'rgba(255, 255, 255, 0.2)';
        node.innerHTML = `
          <div style="width: 52px; height: 26px; border-radius: 9999px; background: ${bg}; position: relative; pointer-events: none; transition: all 0.2s;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #fff; position: absolute; top: 50%; left: 2px; transform: ${active}; transition: transform 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
          </div>
        `;
      } else if (el.type === 'slider') {
        node = document.createElement('div');
        node.innerHTML = `
          <input type="range" min="${el.minVal || 0}" max="${el.maxVal || 100}" value="${el.currentVal || 50}" style="width: 100%; accent-color: #9d4edd; pointer-events: ${isPreviewMode ? 'auto' : 'none'};">
        `;
      } else if (el.type === 'progress') {
        node = document.createElement('div');
        const pct = Math.min(100, Math.max(0, el.currentVal || 65));
        node.innerHTML = `
          <div style="width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1); border-radius: inherit; overflow: hidden; position: relative;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #9d4edd, #c77dff); border-radius: inherit; transition: width 0.3s;"></div>
          </div>
        `;
      } else if (el.type === 'divider') {
        node = document.createElement('div');
        node.innerHTML = `<div style="width: 100%; height: 1px; background: ${el.borderColor || 'rgba(157, 78, 221, 0.4)'};"></div>`;
      } else if (el.type === 'icon') {
        node = document.createElement('div');
        node.innerText = el.text || '⭐';
      } else {
        node = document.createElement('div');
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
      node.style.borderWidth = `${el.borderWidth !== undefined ? el.borderWidth : 1}px`;
      node.style.borderStyle = el.borderStyle || 'solid';
      node.style.fontFamily = el.fontFamily || 'inherit';
      node.style.fontSize = `${el.fontSize}px`;
      node.style.fontWeight = el.fontWeight || 'normal';
      node.style.textAlign = el.textAlign || 'center';
      node.style.letterSpacing = `${el.letterSpacing || 0}px`;
      node.style.lineHeight = el.lineHeight || 1.2;
      node.style.textTransform = el.textTransform || 'none';
      node.style.textDecoration = el.textDecoration || 'none';
      node.style.padding = `${el.padding || 0}px`;

      applyShapeAndEffects(node, el);

      node.style.opacity = el.opacity !== undefined ? el.opacity : 1;
      node.style.transform = `rotate(${el.rotation || 0}deg)`;

      if (el.animation && el.animation !== 'none') {
        const trigger = el.animTrigger || 'ambient';
        if (trigger === 'ambient' || trigger === 'mount') {
          node.classList.add(`anim-${el.animation}`);
          node.style.animationDuration = `${el.animDuration || 1.5}s`;
          node.style.animationDelay = `${el.animDelay || 0}s`;
          node.style.animationIterationCount = el.animIteration || (trigger === 'mount' ? '1' : 'infinite');
          node.style.animationTimingFunction = el.animEasing || 'ease-in-out';
          node.style.animationDirection = el.animDirection || 'normal';
        } else if (trigger === 'hover') {
          node.addEventListener('mouseenter', () => {
            node.classList.add(`anim-${el.animation}`);
            node.style.animationDuration = `${el.animDuration || 1.5}s`;
            node.style.animationIterationCount = el.animIteration || '1';
            node.style.animationTimingFunction = el.animEasing || 'ease-in-out';
            node.style.animationDirection = el.animDirection || 'normal';
          });
          node.addEventListener('mouseleave', () => {
            node.classList.remove(`anim-${el.animation}`);
          });
        }
      }

      if (!isPreviewMode) {
        attachMovement(node, el);
        attachResizer(node, el);
        node.dataset.elementId = el.id;
      }

      setupTooltips(node, el);
      attachRuntimeExecution(node, el);

      node.addEventListener('click', (e) => {
        if (!isPreviewMode) {
          e.stopPropagation();
          selectElement(el.id);
        } else if (el.type === 'toggle') {
          el.isChecked = !el.isChecked;
          renderCanvas();
        }

        if (el.animation && el.animation !== 'none' && el.animTrigger === 'click') {
          node.classList.remove(`anim-${el.animation}`);
          void node.offsetWidth;
          node.classList.add(`anim-${el.animation}`);
          node.style.animationDuration = `${el.animDuration || 1.5}s`;
          node.style.animationIterationCount = el.animIteration || '1';
          node.style.animationTimingFunction = el.animEasing || 'ease-in-out';
          node.style.animationDirection = el.animDirection || 'normal';
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
        model.width = Math.max(20, sw + (ev.clientX - sx));
        model.height = Math.max(10, sh + (ev.clientY - sy));
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

  // ================= UNIVERSAL DESKTOP-STYLE CONTEXT MENU =================
  function showUniversalContextMenu(e, htmlContent, onReadyCallback) {
    if (!elementContextMenu) {
      elementContextMenu = document.createElement('div');
      elementContextMenu.id = 'elementContextMenu';
      elementContextMenu.className = 'context-menu hidden';
      document.body.appendChild(elementContextMenu);
    }

    elementContextMenu.innerHTML = htmlContent;

    const menuWidth = 220;
    const menuHeight = 380;
    const posX = (e.clientX + menuWidth > window.innerWidth) ? (e.clientX - menuWidth) : e.clientX;
    const posY = (e.clientY + menuHeight > window.innerHeight) ? (e.clientY - menuHeight) : e.clientY;

    elementContextMenu.style.left = `${posX}px`;
    elementContextMenu.style.top = `${posY}px`;
    elementContextMenu.classList.remove('hidden');

    if (onReadyCallback) onReadyCallback();
  }

  function hideContextMenu() {
    if (elementContextMenu) elementContextMenu.classList.add('hidden');
  }

  window.addEventListener('click', (e) => {
    if (elementContextMenu && !elementContextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // Global Context Menu Interceptor: Prevents default browser menu everywhere in the app
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    // 1. Right-clicking Palette card in sidebar
    const paletteCard = e.target.closest('.draggable-card');
    if (paletteCard && paletteCard.dataset.type) {
      openPaletteCardContextMenu(e, paletteCard.dataset.type);
      return;
    }

    // 2. Right-clicking Layer tree item in sidebar
    const layerItem = e.target.closest('.layer-item');
    if (layerItem && layerItem.dataset.layerId) {
      selectElement(layerItem.dataset.layerId);
      contextTargetElementId = layerItem.dataset.layerId;
      openElementContextMenu(e, layerItem.dataset.layerId);
      return;
    }

    // 3. Right-clicking placed element on canvas
    const placedItem = e.target.closest('.placed-item');
    if (placedItem && placedItem.dataset.elementId) {
      const elId = placedItem.dataset.elementId;
      selectElement(elId);
      contextTargetElementId = elId;
      openElementContextMenu(e, elId);
      return;
    }

    // 4. Right-clicking project card on dashboard
    const projCard = e.target.closest('.project-card');
    if (projCard && projCard.dataset.projectId) {
      openProjectCardContextMenu(e, projCard.dataset.projectId);
      return;
    }

    // 5. Right-clicking canvas viewport area
    const canvasArea = e.target.closest('#canvas') || e.target.closest('#deviceFrame');
    if (canvasArea) {
      const rect = canvas.getBoundingClientRect();
      contextClickPos = {
        x: Math.max(10, Math.round(e.clientX - rect.left)),
        y: Math.max(10, Math.round(e.clientY - rect.top))
      };
      openCanvasContextMenu(e);
      return;
    }

    // 6. Anywhere else
    openGlobalWorkspaceContextMenu(e);
  });

  // Context-Aware Element Menu
  function openElementContextMenu(e, elId) {
    const el = getActiveElementModel();
    if (!el) return;

    let typeSpecificActions = '';

    if (el.type === 'button') {
      typeSpecificActions = `
        <div class="context-item" id="ctxToggleBtnStyle">✨ Toggle Ghost/Solid Style</div>
        <div class="context-item" id="ctxTriggerClickSim">👆 Simulate Button Click</div>
      `;
    } else if (el.type === 'input' || el.type === 'textarea') {
      typeSpecificActions = `
        <div class="context-item" id="ctxClearField">🧹 Clear Placeholder Text</div>
        <div class="context-item" id="ctxToggleReadonly">🔒 Toggle Readonly State</div>
      `;
    } else if (el.type === 'image') {
      typeSpecificActions = `
        <div class="context-item" id="ctxToggleImageFit">🖼️ Toggle Fit (Cover / Contain)</div>
      `;
    } else if (el.type === 'toggle') {
      typeSpecificActions = `
        <div class="context-item" id="ctxToggleState">🎚️ Toggle On / Off</div>
      `;
    } else if (el.type === 'slider' || el.type === 'progress') {
      typeSpecificActions = `
        <div class="context-item" id="ctxSetHalfVal">⚖️ Set Value to 50%</div>
        <div class="context-item" id="ctxSetFullVal">💯 Set Value to 100%</div>
      `;
    }

    const menuHtml = `
      <div class="context-item" id="ctxDuplicate">📋 Duplicate ${el.name}</div>
      <div class="context-item" id="ctxCopyStyle">🎨 Copy Style</div>
      <div class="context-item" id="ctxPasteStyle">🖌️ Paste Style</div>
      ${typeSpecificActions ? `<div class="context-separator"></div>${typeSpecificActions}` : ''}
      <div class="context-separator"></div>
      <div class="context-item" id="ctxBringFront">🔼 Bring to Front</div>
      <div class="context-item" id="ctxSendBack">🔽 Send to Back</div>
      <div class="context-item" id="ctxLayerUp">⬆️ Step Up (+1)</div>
      <div class="context-item" id="ctxLayerDown">⬇️ Step Down (-1)</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxCenterH">↔️ Center Horizontally</div>
      <div class="context-item" id="ctxCenterV">↕️ Center Vertically</div>
      <div class="context-item" id="ctxCenterBoth">🎯 Center on Canvas</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxPlayAnim">▶️ Trigger Animation</div>
      <div class="context-item" id="ctxOpenCode">⚡ Open in Code Lab</div>
      <div class="context-separator"></div>
      <div class="context-item ctx-danger" id="ctxDelete">🗑️ Delete Element</div>
    `;

    showUniversalContextMenu(e, menuHtml, () => {
      document.getElementById('ctxToggleBtnStyle')?.addEventListener('click', () => {
        if (el.bgColor === 'transparent') {
          el.bgColor = '#7b2cbf';
          el.borderWidth = 1;
        } else {
          el.bgColor = 'transparent';
          el.borderWidth = 2;
        }
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxTriggerClickSim')?.addEventListener('click', () => {
        hideContextMenu();
        const node = document.getElementById(el.id);
        if (node) node.click();
      });

      document.getElementById('ctxClearField')?.addEventListener('click', () => {
        el.text = '';
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxToggleReadonly')?.addEventListener('click', () => {
        el.opacity = el.opacity === 0.5 ? 1 : 0.5;
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxToggleImageFit')?.addEventListener('click', () => {
        el.imageFit = el.imageFit === 'contain' ? 'cover' : 'contain';
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxToggleState')?.addEventListener('click', () => {
        el.isChecked = !el.isChecked;
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxSetHalfVal')?.addEventListener('click', () => {
        el.currentVal = 50;
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxSetFullVal')?.addEventListener('click', () => {
        el.currentVal = 100;
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxDuplicate')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const target = page.elements.find(i => i.id === elId);
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
        hideContextMenu();
      });

      document.getElementById('ctxCopyStyle')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target) {
          clipboardStyles = JSON.parse(JSON.stringify(target));
          clipboardElement = JSON.parse(JSON.stringify(target));
          AppLab.alert('Element & styles copied to clipboard buffer!', 'Copied', '🎨');
        }
        hideContextMenu();
      });

      document.getElementById('ctxPasteStyle')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target && clipboardStyles) {
          const forbidden = ['id', 'x', 'y', 'name'];
          Object.keys(clipboardStyles).forEach(k => {
            if (!forbidden.includes(k)) target[k] = clipboardStyles[k];
          });
          markDirty();
          renderCanvas();
          buildInspector();
        } else if (!clipboardStyles) {
          AppLab.alert('No element style copied yet!', 'Clipboard Empty', '⚠️');
        }
        hideContextMenu();
      });

      document.getElementById('ctxBringFront')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const idx = page.elements.findIndex(i => i.id === elId);
        if (idx >= 0) {
          const [item] = page.elements.splice(idx, 1);
          page.elements.push(item);
          markDirty();
          renderCanvas();
          renderLayersTree();
        }
        hideContextMenu();
      });

      document.getElementById('ctxSendBack')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const idx = page.elements.findIndex(i => i.id === elId);
        if (idx >= 0) {
          const [item] = page.elements.splice(idx, 1);
          page.elements.unshift(item);
          markDirty();
          renderCanvas();
          renderLayersTree();
        }
        hideContextMenu();
      });

      document.getElementById('ctxLayerUp')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const idx = page.elements.findIndex(i => i.id === elId);
        if (idx >= 0 && idx < page.elements.length - 1) {
          const temp = page.elements[idx];
          page.elements[idx] = page.elements[idx + 1];
          page.elements[idx + 1] = temp;
          markDirty();
          renderCanvas();
          renderLayersTree();
        }
        hideContextMenu();
      });

      document.getElementById('ctxLayerDown')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const idx = page.elements.findIndex(i => i.id === elId);
        if (idx > 0) {
          const temp = page.elements[idx];
          page.elements[idx] = page.elements[idx - 1];
          page.elements[idx - 1] = temp;
          markDirty();
          renderCanvas();
          renderLayersTree();
        }
        hideContextMenu();
      });

      document.getElementById('ctxCenterH')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target && canvas) {
          target.x = Math.max(0, Math.round((canvas.offsetWidth - target.width) / 2));
          markDirty();
          renderCanvas();
        }
        hideContextMenu();
      });

      document.getElementById('ctxCenterV')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target && canvas) {
          target.y = Math.max(0, Math.round((canvas.offsetHeight - target.height) / 2));
          markDirty();
          renderCanvas();
        }
        hideContextMenu();
      });

      document.getElementById('ctxCenterBoth')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target && canvas) {
          target.x = Math.max(0, Math.round((canvas.offsetWidth - target.width) / 2));
          target.y = Math.max(0, Math.round((canvas.offsetHeight - target.height) / 2));
          markDirty();
          renderCanvas();
        }
        hideContextMenu();
      });

      document.getElementById('ctxPlayAnim')?.addEventListener('click', () => {
        const target = getActiveElementModel();
        if (target && target.animation && target.animation !== 'none') {
          const n = document.getElementById(target.id);
          if (n) {
            n.classList.remove(`anim-${target.animation}`);
            void n.offsetWidth;
            n.classList.add(`anim-${target.animation}`);
          }
        }
        hideContextMenu();
      });

      document.getElementById('ctxOpenCode')?.addEventListener('click', () => {
        activeElementId = elId;
        hideContextMenu();
        switchStudioSubpage('code');
      });

      document.getElementById('ctxDelete')?.addEventListener('click', () => {
        const page = getCurrentPage();
        page.elements = page.elements.filter(i => i.id !== elId);
        if (activeElementId === elId) activeElementId = null;
        markDirty();
        renderCanvas();
        renderLayersTree();
        buildInspector();
        hideContextMenu();
      });
    });
  }

  // Right-Clicking Component Palette in Left Sidebar
  function openPaletteCardContextMenu(e, componentType) {
    const paletteMenuHtml = `
      <div class="context-item" id="ctxPaletteAddCenter">➕ Add to Canvas (Center)</div>
      <div class="context-item" id="ctxPaletteAddTop">↖️ Add to Canvas (Top-Left)</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxPaletteInspect">ℹ️ Palette Item: ${componentType.toUpperCase()}</div>
    `;

    showUniversalContextMenu(e, paletteMenuHtml, () => {
      document.getElementById('ctxPaletteAddCenter')?.addEventListener('click', () => {
        const centerX = canvas ? Math.max(10, Math.round((canvas.offsetWidth - 150) / 2)) : 80;
        const centerY = canvas ? Math.max(10, Math.round((canvas.offsetHeight - 50) / 2)) : 100;
        spawnElementByType(componentType, centerX, centerY);
        hideContextMenu();
      });

      document.getElementById('ctxPaletteAddTop')?.addEventListener('click', () => {
        spawnElementByType(componentType, 20, 20);
        hideContextMenu();
      });

      document.getElementById('ctxPaletteInspect')?.addEventListener('click', () => {
        AppLab.alert(`Component Type: ${componentType}\nClick or drag this element directly into your mobile canvas to build.`, 'Palette Inspector', 'ℹ️');
        hideContextMenu();
      });
    });
  }

  function openCanvasContextMenu(e) {
    const canvasMenuHtml = `
      <div class="context-item" id="ctxPasteElement">📋 Paste Copied Element</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxAddButton">🔘 Add Button Here</div>
      <div class="context-item" id="ctxAddLabel">📝 Add Label Here</div>
      <div class="context-item" id="ctxAddInput">⌨️ Add Text Field Here</div>
      <div class="context-item" id="ctxAddCard">🪟 Add Container Card Here</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxTogglePreview">▶️ Toggle Live Preview</div>
      <div class="context-item ctx-danger" id="ctxClearScreen">🗑️ Clear Screen Elements</div>
    `;

    showUniversalContextMenu(e, canvasMenuHtml, () => {
      document.getElementById('ctxPasteElement')?.addEventListener('click', () => {
        if (clipboardElement) {
          const clone = JSON.parse(JSON.stringify(clipboardElement));
          clone.id = 'el_' + Date.now().toString().slice(-4);
          clone.x = contextClickPos.x;
          clone.y = contextClickPos.y;
          getCurrentPage().elements.push(clone);
          markDirty();
          selectElement(clone.id);
        } else {
          AppLab.alert('No element copied yet!', 'Clipboard Empty', '⚠️');
        }
        hideContextMenu();
      });

      document.getElementById('ctxAddButton')?.addEventListener('click', () => { spawnElementByType('button', contextClickPos.x, contextClickPos.y); hideContextMenu(); });
      document.getElementById('ctxAddLabel')?.addEventListener('click', () => { spawnElementByType('label', contextClickPos.x, contextClickPos.y); hideContextMenu(); });
      document.getElementById('ctxAddInput')?.addEventListener('click', () => { spawnElementByType('input', contextClickPos.x, contextClickPos.y); hideContextMenu(); });
      document.getElementById('ctxAddCard')?.addEventListener('click', () => { spawnElementByType('card', contextClickPos.x, contextClickPos.y); hideContextMenu(); });

      document.getElementById('ctxTogglePreview')?.addEventListener('click', () => {
        modeToggleBtn.click();
        hideContextMenu();
      });

      document.getElementById('ctxClearScreen')?.addEventListener('click', async () => {
        hideContextMenu();
        const confirmed = await AppLab.confirm('Clear all elements on this screen?', 'Clear Screen', '🗑️');
        if (confirmed) {
          getCurrentPage().elements = [];
          activeElementId = null;
          markDirty();
          renderCanvas();
          renderLayersTree();
          buildInspector();
        }
      });
    });
  }

  function openProjectCardContextMenu(e, projId) {
    contextTargetProjectId = projId;
    const proj = getStoredProjects().find(p => p.id === projId);
    if (!proj) return;

    const projMenuHtml = `
      <div class="context-item" id="ctxOpenProj">🚀 Open in Studio</div>
      <div class="context-item" id="ctxDuplicateProj">📋 Duplicate Project</div>
      <div class="context-item" id="ctxRenameProj">✏️ Rename Project</div>
      <div class="context-separator"></div>
      <div class="context-item ctx-danger" id="ctxDeleteProj">🗑️ Delete Project</div>
    `;

    showUniversalContextMenu(e, projMenuHtml, () => {
      document.getElementById('ctxOpenProj')?.addEventListener('click', () => {
        hideContextMenu();
        currentProject = JSON.parse(JSON.stringify(proj));
        activeScreenId = currentProject.pages[0].id;
        if (currentProjectLabel) currentProjectLabel.innerText = currentProject.projectName;
        switchMainView('builderView');
      });

      document.getElementById('ctxDuplicateProj')?.addEventListener('click', () => {
        hideContextMenu();
        const clone = JSON.parse(JSON.stringify(proj));
        clone.id = 'proj_' + Date.now();
        clone.projectName = clone.projectName + ' (Copy)';
        clone.lastModified = new Date().toLocaleDateString();
        const list = getStoredProjects();
        list.unshift(clone);
        localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
        renderProjectsDashboard();
      });

      document.getElementById('ctxRenameProj')?.addEventListener('click', async () => {
        hideContextMenu();
        const newTitle = await AppLab.prompt('Enter new project title:', proj.projectName, 'Rename Project');
        if (newTitle && newTitle.trim()) {
          const list = getStoredProjects();
          const p = list.find(i => i.id === projId);
          if (p) {
            p.projectName = newTitle.trim();
            p.lastModified = new Date().toLocaleDateString();
            localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
            renderProjectsDashboard();
          }
        }
      });

      document.getElementById('ctxDeleteProj')?.addEventListener('click', () => {
        hideContextMenu();
        deleteStoredProject(projId);
      });
    });
  }

  function openGlobalWorkspaceContextMenu(e) {
    const globalMenuHtml = `
      <div class="context-item" id="ctxGlobalHome">🏠 Home Dashboard</div>
      <div class="context-item" id="ctxGlobalStudio">🚀 Studio Builder</div>
      <div class="context-item" id="ctxGlobalTutorials">📚 Tutorials</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxGlobalNewProj">📄 Create New Project</div>
      <div class="context-item" id="ctxGlobalSettings">⚙️ Open Settings</div>
    `;

    showUniversalContextMenu(e, globalMenuHtml, () => {
      document.getElementById('ctxGlobalHome')?.addEventListener('click', () => {
        hideContextMenu();
        switchMainView('homeView');
      });
      document.getElementById('ctxGlobalStudio')?.addEventListener('click', () => {
        hideContextMenu();
        switchMainView('builderView');
      });
      document.getElementById('ctxGlobalTutorials')?.addEventListener('click', () => {
        hideContextMenu();
        switchMainView('tutorialView');
      });
      document.getElementById('ctxGlobalNewProj')?.addEventListener('click', () => {
        hideContextMenu();
        openNewProjectModal();
      });
      document.getElementById('ctxGlobalSettings')?.addEventListener('click', () => {
        hideContextMenu();
        const smSettingsBtn = document.getElementById('smSettingsBtn');
        if (smSettingsBtn) smSettingsBtn.click();
      });
    });
  }

  // ================= DRAG & DROP AND CLICK-TO-ADD ELEMENT FACTORY =================
  function spawnElementByType(type, posX = 60, posY = 60) {
    let defaultWidth = 140;
    let defaultHeight = 44;
    let defaultText = 'Click Me';
    let defaultBg = '#7b2cbf';
    let defaultBorder = '#9d4edd';
    let defaultBorderWidth = 1;
    let defaultPadding = 8;
    let defaultShape = 'rounded';
    let defaultRadius = 10;
    let defaultIsChecked = false;
    let defaultCurrentVal = 50;

    if (type === 'label') {
      defaultWidth = 160;
      defaultHeight = 32;
      defaultText = 'Header Title';
      defaultBg = 'transparent';
      defaultBorder = 'transparent';
      defaultBorderWidth = 0;
      defaultPadding = 0;
    } else if (type === 'input') {
      defaultWidth = 180;
      defaultHeight = 40;
      defaultText = 'Type something...';
      defaultBg = 'rgba(255, 255, 255, 0.08)';
      defaultBorder = 'rgba(255, 255, 255, 0.2)';
    } else if (type === 'textarea') {
      defaultWidth = 200;
      defaultHeight = 80;
      defaultText = 'Enter long paragraph comments...';
      defaultBg = 'rgba(255, 255, 255, 0.08)';
      defaultBorder = 'rgba(255, 255, 255, 0.2)';
    } else if (type === 'toggle') {
      defaultWidth = 56;
      defaultHeight = 30;
      defaultBg = 'transparent';
      defaultBorder = 'transparent';
      defaultBorderWidth = 0;
      defaultPadding = 0;
      defaultIsChecked = true;
    } else if (type === 'slider') {
      defaultWidth = 180;
      defaultHeight = 30;
      defaultBg = 'transparent';
      defaultBorder = 'transparent';
      defaultBorderWidth = 0;
      defaultPadding = 0;
    } else if (type === 'progress') {
      defaultWidth = 200;
      defaultHeight = 16;
      defaultBg = 'rgba(255, 255, 255, 0.1)';
      defaultBorder = 'rgba(157, 78, 221, 0.3)';
      defaultBorderWidth = 1;
      defaultRadius = 8;
      defaultCurrentVal = 65;
    } else if (type === 'divider') {
      defaultWidth = 220;
      defaultHeight = 10;
      defaultBg = 'transparent';
      defaultBorder = '#9d4edd';
      defaultBorderWidth = 0;
      defaultPadding = 0;
    } else if (type === 'icon') {
      defaultWidth = 48;
      defaultHeight = 48;
      defaultText = '⭐';
      defaultBg = 'rgba(157, 78, 221, 0.2)';
      defaultBorder = '#9d4edd';
      defaultShape = 'circle';
      defaultRadius = 50;
    } else if (type === 'card') {
      defaultWidth = 220;
      defaultHeight = 120;
      defaultText = 'Card Container Box';
      defaultBg = 'rgba(255, 255, 255, 0.05)';
      defaultBorder = 'rgba(255, 255, 255, 0.12)';
      defaultPadding = 14;
    }

    const newEl = {
      id: 'el_' + Date.now().toString().slice(-4),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
      type: type,
      x: posX,
      y: posY,
      width: defaultWidth,
      height: defaultHeight,
      text: defaultText,
      textColor: '#ffffff',
      bgColor: defaultBg,
      borderColor: defaultBorder,
      borderWidth: defaultBorderWidth,
      borderStyle: 'solid',
      shape: defaultShape,
      borderRadius: defaultRadius,
      fontSize: 14,
      fontFamily: fontOptions[0].value,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      textDecoration: 'none',
      textAlign: 'center',
      padding: defaultPadding,
      backdropBlur: 0,
      glowSize: 0,
      glowColor: '#9d4edd',
      opacity: 1,
      rotation: 0,
      animation: 'none',
      animDuration: 1.5,
      animDelay: 0,
      animIteration: 'infinite',
      animEasing: 'ease-in-out',
      animDirection: 'normal',
      animTrigger: 'ambient',
      minVal: 0,
      maxVal: 100,
      currentVal: defaultCurrentVal,
      isChecked: defaultIsChecked,
      imageFit: 'cover',
      tooltip: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
      codeMode: 'blocks',
      customJs: '',
      logic: { event: 'click', actions: [] }
    };

    getCurrentPage().elements.push(newEl);
    markDirty();
    renderCanvas();
    renderLayersTree();
    selectElement(newEl.id);
  }

  function initDragAndDrop() {
    document.querySelectorAll('.draggable-card').forEach(card => {
      card.setAttribute('draggable', 'true');

      // Drag listener
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.type);
      });

      // Click-to-add support (instant spawn to avoid drag issues)
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const randX = Math.round(20 + Math.random() * 60);
        const randY = Math.round(40 + Math.random() * 80);
        spawnElementByType(card.dataset.type, randX, randY);
      });
    });

    if (canvas) {
      canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        if (!type) return;

        const rect = canvas.getBoundingClientRect();
        const dropX = Math.max(10, Math.round(e.clientX - rect.left - 40));
        const dropY = Math.max(10, Math.round(e.clientY - rect.top - 20));

        spawnElementByType(type, dropX, dropY);
      });
    }
  }

  initDragAndDrop();

  // Pages List & Layers Tree
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
      l.dataset.layerId = el.id;
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

  // ================= FIXED RIGHT SIDEBAR TAB SWITCHER =================
  document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sidebar-right .tab-content').forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
      }
    });
  });

  // ================= MAXIMUM CUSTOMIZABILITY PROPERTIES INSPECTOR =================
  function buildInspector() {
    const el = getActiveElementModel();
    if (!el) {
      if (propertiesTab) propertiesTab.innerHTML = '<p class="empty-state">Select an element to customize styling.</p>';
      if (shapesTab) shapesTab.innerHTML = '<p class="empty-state">Select an element to customize shapes.</p>';
      if (effectsTab) effectsTab.innerHTML = '<p class="empty-state">Select an element to customize effects.</p>';
      if (animationsTab) animationsTab.innerHTML = '<p class="empty-state">Select an element to configure animations.</p>';
      return;
    }

    if (propertiesTab) {
      let extraComponentControls = '';
      if (el.type === 'slider' || el.type === 'progress') {
        extraComponentControls = `
          <div class="control-row">
            <div class="control-group">
              <label>Min Value</label>
              <input type="number" class="control-input" id="propMinVal" value="${el.minVal || 0}">
            </div>
            <div class="control-group">
              <label>Max Value</label>
              <input type="number" class="control-input" id="propMaxVal" value="${el.maxVal || 100}">
            </div>
          </div>
          <div class="control-group">
            <label>Current Value</label>
            <input type="number" class="control-input" id="propCurVal" value="${el.currentVal || 50}">
          </div>
        `;
      } else if (el.type === 'image') {
        extraComponentControls = `
          <div class="control-group">
            <label>Image Fit Mode</label>
            <div id="propImageFitContainer"></div>
          </div>
        `;
      } else if (el.type === 'toggle') {
        extraComponentControls = `
          <div class="control-group">
            <label>Default State</label>
            <div id="propToggleStateContainer"></div>
          </div>
        `;
      }

      propertiesTab.innerHTML = `
        <div class="control-group">
          <label>Layer Label Identifier</label>
          <input type="text" class="control-input" id="propName" value="${el.name}">
        </div>

        <div class="control-group">
          <label>Tooltip Description (2s Hover)</label>
          <input type="text" class="control-input" id="propTooltip" value="${el.tooltip || ''}" placeholder="Description shown on hover...">
        </div>

        <div class="control-group">
          <label>${el.type === 'image' ? 'Image Source (URL or File)' : 'Text Content / Placeholder'}</label>
          <input type="text" class="control-input" id="propText" value="${el.text}">
        </div>

        ${extraComponentControls}

        <div class="control-group" style="margin-top: 6px;">
          <label>Font Family</label>
          <div id="propFontContainer"></div>
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>Font Size (px)</label>
            <input type="number" class="control-input" id="propFontSize" value="${el.fontSize || 14}">
          </div>
          <div class="control-group">
            <label>Font Weight</label>
            <div id="propWeightContainer"></div>
          </div>
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>Letter Spacing (px)</label>
            <input type="number" step="0.5" class="control-input" id="propLetterSpacing" value="${el.letterSpacing || 0}">
          </div>
          <div class="control-group">
            <label>Line Height</label>
            <input type="number" step="0.1" class="control-input" id="propLineHeight" value="${el.lineHeight || 1.2}">
          </div>
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>Text Transform</label>
            <div id="propTransformContainer"></div>
          </div>
          <div class="control-group">
            <label>Text Decoration</label>
            <div id="propDecorContainer"></div>
          </div>
        </div>

        <div class="control-group">
          <label>Text Alignment</label>
          <div id="propAlignContainer"></div>
        </div>

        <div class="control-group">
          <label>Inner Padding (px)</label>
          <input type="range" min="0" max="40" value="${el.padding || 0}" class="control-input" id="propPadding">
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>Border Width (px)</label>
            <input type="number" min="0" max="20" class="control-input" id="propBorderWidth" value="${el.borderWidth !== undefined ? el.borderWidth : 1}">
          </div>
          <div class="control-group">
            <label>Border Style</label>
            <div id="propBorderStyleContainer"></div>
          </div>
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

        <button class="btn-top" style="color:#ff6b6b; margin-top:14px;" id="delElemBtn">Remove Element</button>
      `;

      createCustomSelect(
        document.getElementById('propFontContainer'),
        fontOptions,
        el.fontFamily || fontOptions[0].value,
        (val) => { el.fontFamily = val; markDirty(); renderCanvas(); }
      );

      const weightOpts = [
        { label: 'Regular (400)', value: '400' },
        { label: 'Medium (500)', value: '500' },
        { label: 'Semi-Bold (600)', value: '600' },
        { label: 'Bold (700)', value: '700' },
        { label: 'Extra-Bold (800)', value: '800' }
      ];
      createCustomSelect(
        document.getElementById('propWeightContainer'),
        weightOpts,
        el.fontWeight || '400',
        (val) => { el.fontWeight = val; markDirty(); renderCanvas(); }
      );

      const transformOpts = [
        { label: 'None', value: 'none' },
        { label: 'UPPERCASE', value: 'uppercase' },
        { label: 'lowercase', value: 'lowercase' },
        { label: 'Capitalize', value: 'capitalize' }
      ];
      createCustomSelect(
        document.getElementById('propTransformContainer'),
        transformOpts,
        el.textTransform || 'none',
        (val) => { el.textTransform = val; markDirty(); renderCanvas(); }
      );

      const decorOpts = [
        { label: 'None', value: 'none' },
        { label: 'Underline', value: 'underline' },
        { label: 'Line-Through', value: 'line-through' }
      ];
      createCustomSelect(
        document.getElementById('propDecorContainer'),
        decorOpts,
        el.textDecoration || 'none',
        (val) => { el.textDecoration = val; markDirty(); renderCanvas(); }
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

      const borderStyleOpts = [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
        { label: 'Double', value: 'double' }
      ];
      createCustomSelect(
        document.getElementById('propBorderStyleContainer'),
        borderStyleOpts,
        el.borderStyle || 'solid',
        (val) => { el.borderStyle = val; markDirty(); renderCanvas(); }
      );

      if (el.type === 'image') {
        const fitOpts = [
          { label: 'Cover (Crop)', value: 'cover' },
          { label: 'Contain (Fit)', value: 'contain' },
          { label: 'Fill (Stretch)', value: 'fill' }
        ];
        createCustomSelect(
          document.getElementById('propImageFitContainer'),
          fitOpts,
          el.imageFit || 'cover',
          (val) => { el.imageFit = val; markDirty(); renderCanvas(); }
        );
      } else if (el.type === 'toggle') {
        const toggleOpts = [
          { label: 'Inactive / Off', value: 'false' },
          { label: 'Active / On', value: 'true' }
        ];
        createCustomSelect(
          document.getElementById('propToggleStateContainer'),
          toggleOpts,
          el.isChecked ? 'true' : 'false',
          (val) => { el.isChecked = (val === 'true'); markDirty(); renderCanvas(); }
        );
      } else if (el.type === 'slider' || el.type === 'progress') {
        document.getElementById('propMinVal').oninput = (e) => { el.minVal = parseInt(e.target.value) || 0; markDirty(); renderCanvas(); };
        document.getElementById('propMaxVal').oninput = (e) => { el.maxVal = parseInt(e.target.value) || 100; markDirty(); renderCanvas(); };
        document.getElementById('propCurVal').oninput = (e) => { el.currentVal = parseInt(e.target.value) || 50; markDirty(); renderCanvas(); };
      }

      document.getElementById('propName').oninput = (e) => { el.name = e.target.value; markDirty(); renderLayersTree(); };
      document.getElementById('propTooltip').oninput = (e) => { el.tooltip = e.target.value; markDirty(); };
      document.getElementById('propText').oninput = (e) => { el.text = e.target.value; markDirty(); renderCanvas(); };
      document.getElementById('propFontSize').oninput = (e) => { el.fontSize = parseInt(e.target.value) || 14; markDirty(); renderCanvas(); };
      document.getElementById('propLetterSpacing').oninput = (e) => { el.letterSpacing = parseFloat(e.target.value) || 0; markDirty(); renderCanvas(); };
      document.getElementById('propLineHeight').oninput = (e) => { el.lineHeight = parseFloat(e.target.value) || 1.2; markDirty(); renderCanvas(); };
      document.getElementById('propPadding').oninput = (e) => { el.padding = parseInt(e.target.value) || 0; markDirty(); renderCanvas(); };
      document.getElementById('propBorderWidth').oninput = (e) => { el.borderWidth = parseInt(e.target.value) || 0; markDirty(); renderCanvas(); };

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
          <input type="range" min="0" max="80" value="${el.borderRadius || 8}" class="control-input" id="propRadiusRange">
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

    // 4. Enhanced Animation Tab
    if (animationsTab) {
      animationsTab.innerHTML = `
        <div class="control-group">
          <label>Animation Preset</label>
          <div id="animStyleContainer"></div>
        </div>

        <div class="control-group" style="margin-top: 6px;">
          <label>Animation Trigger Condition</label>
          <div id="animTriggerContainer"></div>
        </div>

        <div class="control-row" style="margin-top: 6px;">
          <div class="control-group">
            <label>Duration (Seconds)</label>
            <input type="number" step="0.1" min="0.1" max="20" class="control-input" id="propAnimDur" value="${el.animDuration || 1.5}">
          </div>
          <div class="control-group">
            <label>Start Delay (Seconds)</label>
            <input type="number" step="0.1" min="0" max="10" class="control-input" id="propAnimDelay" value="${el.animDelay || 0}">
          </div>
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>Repeats / Loop Mode</label>
            <div id="animIterContainer"></div>
          </div>
          <div class="control-group">
            <label>Direction Mode</label>
            <div id="animDirectionContainer"></div>
          </div>
        </div>

        <div class="control-group" style="margin-top: 6px;">
          <label>Timing / Easing Curve</label>
          <div id="animEasingContainer"></div>
        </div>

        <button class="btn-top btn-primary" id="replayAnimBtn" style="margin-top: 14px;">▶️ Test Animation Trigger</button>
      `;

      const animOpts = [
        { label: '🚫 None', value: 'none' },
        { label: '✨ Fade In', value: 'fadeIn' },
        { label: '⬆️ Slide Up', value: 'slideUp' },
        { label: '💥 Scale Pop', value: 'scalePop' },
        { label: '💓 Pulse', value: 'pulse' },
        { label: '🏀 Bounce', value: 'bounce' },
        { label: '🎈 Float', value: 'float' },
        { label: '🔄 Spin', value: 'spin' },
        { label: '🔮 Glow Pulse', value: 'glowPulse' },
        { label: '📳 Shake', value: 'shake' }
      ];
      createCustomSelect(
        document.getElementById('animStyleContainer'),
        animOpts,
        el.animation || 'none',
        (val) => { el.animation = val; markDirty(); renderCanvas(); }
      );

      const triggerOpts = [
        { label: '🔁 Ambient Constant Loop', value: 'ambient' },
        { label: '🚀 On Screen Load / Mount', value: 'mount' },
        { label: '🖱️ On Mouse Hover', value: 'hover' },
        { label: '👆 On Click / Tap', value: 'click' }
      ];
      createCustomSelect(
        document.getElementById('animTriggerContainer'),
        triggerOpts,
        el.animTrigger || 'ambient',
        (val) => { el.animTrigger = val; markDirty(); renderCanvas(); }
      );

      const iterOpts = [
        { label: '🔁 Infinite Loop', value: 'infinite' },
        { label: '1 Time Only', value: '1' },
        { label: '2 Times', value: '2' },
        { label: '3 Times', value: '3' },
        { label: '5 Times', value: '5' }
      ];
      createCustomSelect(
        document.getElementById('animIterContainer'),
        iterOpts,
        el.animIteration || 'infinite',
        (val) => { el.animIteration = val; markDirty(); renderCanvas(); }
      );

      const directionOpts = [
        { label: 'Normal (Forward)', value: 'normal' },
        { label: 'Reverse (Backward)', value: 'reverse' },
        { label: 'Alternate (Ping-Pong)', value: 'alternate' },
        { label: 'Alternate Reverse', value: 'alternate-reverse' }
      ];
      createCustomSelect(
        document.getElementById('animDirectionContainer'),
        directionOpts,
        el.animDirection || 'normal',
        (val) => { el.animDirection = val; markDirty(); renderCanvas(); }
      );

      const easingOpts = [
        { label: 'Smooth (Ease-In-Out)', value: 'ease-in-out' },
        { label: 'Linear (Constant Speed)', value: 'linear' },
        { label: 'Snappy Entry (Ease-Out)', value: 'ease-out' },
        { label: 'Dramatic Acceleration (Ease-In)', value: 'ease-in' },
        { label: 'Bouncy Spring (Tactile)', value: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      ];
      createCustomSelect(
        document.getElementById('animEasingContainer'),
        easingOpts,
        el.animEasing || 'ease-in-out',
        (val) => { el.animEasing = val; markDirty(); renderCanvas(); }
      );

      document.getElementById('propAnimDur').oninput = (e) => {
        el.animDuration = parseFloat(e.target.value) || 1.5;
        markDirty();
        renderCanvas();
      };

      document.getElementById('propAnimDelay').oninput = (e) => {
        el.animDelay = parseFloat(e.target.value) || 0;
        markDirty();
        renderCanvas();
      };

      document.getElementById('replayAnimBtn').onclick = () => {
        const node = document.getElementById(el.id);
        if (node && el.animation !== 'none') {
          node.classList.remove(`anim-${el.animation}`);
          void node.offsetWidth;
          node.classList.add(`anim-${el.animation}`);
          node.style.animationDuration = `${el.animDuration || 1.5}s`;
          node.style.animationDelay = `${el.animDelay || 0}s`;
          node.style.animationIterationCount = el.animIteration || '1';
          node.style.animationTimingFunction = el.animEasing || 'ease-in-out';
          node.style.animationDirection = el.animDirection || 'normal';
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

  // ================= EXPANDED 8-TRACK MULTI-PAGE TUTORIALS =================
  const courseTracks = [
    {
      id: 'track_canvas',
      title: '1. Canvas & Layouts',
      desc: 'Screen sizes, coordinates & routing',
      pages: [
        {
          title: 'Viewport Frames & Coordinates',
          howItWorks: [
            'Each device frame (Phone, Tablet, Desktop) has a fixed pixel dimension.',
            'Elements are positioned using absolute coordinates: left (X) and top (Y).',
            'Switching viewports changes the bezel frame but never displaces your elements.'
          ],
          type: 'theory',
          codeSnippet: `// Coordinate bounds:\nconst maxX = canvas.offsetWidth - element.offsetWidth;\nconst maxY = canvas.offsetHeight - element.offsetHeight;`,
          quiz: null
        },
        {
          title: 'Practice: Coordinate Clamping',
          howItWorks: [
            'Elements are constrained within hardware borders.',
            'Coordinates clamp to 0 at the left and (frame width - element width) at the right.',
            'Click the arrows below to test clamping math live.'
          ],
          type: 'practice_canvas',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Quiz: Canvas Architecture',
          howItWorks: [
            'Test your understanding of AppLab viewport coordinates.'
          ],
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'What happens to element positions when switching from Phone to Tablet view?',
            options: [
              'Elements stay in their exact pixel coordinates',
              'Elements are deleted',
              'Elements stretch to 100% width'
            ],
            correctIndex: 0,
            explanation: 'AppLab preserves exact pixel coordinates so layouts stay intact across device previews.'
          }
        }
      ]
    },
    {
      id: 'track_shapes',
      title: '2. Shapes & Contours',
      desc: 'Polygons, clip-paths & neon glows',
      pages: [
        {
          title: 'Clip-Path Geometry',
          howItWorks: [
            'Custom geometry (Diamonds, Hexagons) is created using CSS clip-path.',
            'clip-path uses polygon percentages to cut element corners into shape.',
            'Standard box-shadow gets clipped off by polygon masks.'
          ],
          type: 'theory',
          codeSnippet: `/* Diamond Polygon */\nclip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);`,
          quiz: null
        },
        {
          title: 'Drop-Shadow Contour Wrapping',
          howItWorks: [
            'CSS filter: drop-shadow detects the alpha edges of clipped polygons.',
            'This allows neon glows to wrap cleanly around diamond and hexagon vertices.',
            'Toggle shapes below to test drop-shadow tracing in real time.'
          ],
          type: 'practice_shapes',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Quiz: Polygon Shadows',
          howItWorks: [
            'Check your knowledge of polygon shadow rendering.'
          ],
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'Why does AppLab use filter: drop-shadow instead of box-shadow for Diamonds?',
            options: [
              'box-shadow is cut off by the polygon clip-path',
              'box-shadow is deprecated in browsers',
              'filter: drop-shadow changes the element color'
            ],
            correctIndex: 0,
            explanation: 'clip-path masks out standard rectangular box-shadows. Filter drop-shadow computes glow around the actual shape outline.'
          }
        }
      ]
    },
    {
      id: 'track_blocks',
      title: '3. Visual Block Logic',
      desc: 'Action stacks & event automation',
      pages: [
        {
          title: 'The Event & Action Stack',
          howItWorks: [
            'Events (Click, Hover) trigger an action pipeline.',
            'Actions run sequentially from top to bottom.',
            'Actions can trigger popups, navigate screens, or alter layer styles.'
          ],
          type: 'theory',
          codeSnippet: `[WHEN: Click Event]\n  Step 1: Set Background Color\n  Step 2: Start Animation Pulse\n  Step 3: Route to Page 2`,
          quiz: null
        },
        {
          title: 'Practice: Action Stack Execution',
          howItWorks: [
            'Click "Trigger Action Stack" below to watch actions fire in order.',
            'Notice how step 1 recolors the chip and step 2 applies an animation.'
          ],
          type: 'practice_blocks',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Quiz: Block Execution',
          howItWorks: [
            'Verify your understanding of block pipeline ordering.'
          ],
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'In what order do actions run inside the Action Stack?',
            options: [
              'Sequentially from top to bottom',
              'Random order',
              'Simultaneously all at once'
            ],
            correctIndex: 0,
            explanation: 'AppLab runs action blocks in order from top to bottom so prerequisite states apply before transitions fire.'
          }
        }
      ]
    },
    {
      id: 'track_javascript',
      title: '4. JavaScript Sandbox',
      desc: 'Custom scripting, Web Audio & modals',
      pages: [
        {
          title: 'The Sandbox Scope',
          howItWorks: [
            'Real JavaScript runs in an isolated runtime scope.',
            'You get direct access to element (DOM node), app (helper methods), and canvas.',
            'Use app.showAlert() to trigger custom purple glass popups.'
          ],
          type: 'theory',
          codeSnippet: `element.style.backgroundColor = '#ff0077';\napp.playBeep();\napp.showAlert('Action fired!');`,
          quiz: null
        },
        {
          title: 'Practice: Live Script Runner',
          howItWorks: [
            'Execute real sandbox JavaScript live in the browser.',
            'Click below to synthesize an audio tone and trigger an alert.'
          ],
          type: 'practice_js',
          codeSnippet: null,
          quiz: null
        },
        {
          title: 'Quiz: Runtime APIs',
          howItWorks: [
            'Confirm your knowledge of AppLab script APIs.'
          ],
          type: 'quiz',
          codeSnippet: null,
          quiz: {
            question: 'Which method routes to a new screen inside JavaScript?',
            options: [
              'app.navigateTo(screenId)',
              'window.location.reload()',
              'element.changePage()'
            ],
            correctIndex: 0,
            explanation: 'app.navigateTo(id) tells the AppLab studio engine to switch the visible canvas page.'
          }
        }
      ]
    }
  ];

  function renderCourseWorkspace() {
    const trackMenuEl = document.getElementById('trackMenu');
    const courseStageEl = document.getElementById('courseStage');
    if (!trackMenuEl || !courseStageEl) return;

    trackMenuEl.innerHTML = '';
    courseTracks.forEach(track => {
      const item = document.createElement('div');
      item.className = `track-item ${track.id === activeTrackId ? 'active' : ''}`;
      item.innerHTML = `
        <h4>${track.title}</h4>
        <span class="track-meta">${track.pages.length} Chapters • ${track.desc}</span>
      `;
      item.onclick = () => {
        activeTrackId = track.id;
        currentCoursePageIndex = 0;
        renderCourseWorkspace();
      };
      trackMenuEl.appendChild(item);
    });

    renderActiveCoursePage();
  }

  function renderActiveCoursePage() {
    const courseStageEl = document.getElementById('courseStage');
    if (!courseStageEl) return;

    let track = courseTracks.find(t => t.id === activeTrackId);
    if (!track) {
      activeTrackId = courseTracks[0].id;
      track = courseTracks[0];
    }

    const page = track.pages[currentCoursePageIndex] || track.pages[0];
    if (!page) return;

    let dotsHtml = track.pages.map((p, idx) => `
      <div class="page-dot ${idx === currentCoursePageIndex ? 'active' : ''}" data-page-idx="${idx}"></div>
    `).join('');

    let howItWorksHtml = '';
    if (page.howItWorks && page.howItWorks.length > 0) {
      const items = page.howItWorks.map(step => `<li>${step}</li>`).join('');
      howItWorksHtml = `
        <div class="how-it-works-box" style="background: rgba(157, 78, 221, 0.12); border: 1px solid var(--glass-border); border-radius: 12px; padding: 14px 18px; margin-bottom: 6px;">
          <h4 style="font-size: 0.82rem; text-transform: uppercase; color: #c77dff; margin-bottom: 8px; letter-spacing: 0.05em;">💡 How it works</h4>
          <ul style="padding-left: 18px; font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
            ${items}
          </ul>
        </div>
      `;
    }

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

    courseStageEl.innerHTML = `
      <div class="course-paper">
        <div class="course-paper-header">
          <span class="page-indicator-pill">${track.title.toUpperCase()} • CHAPTER ${currentCoursePageIndex + 1} OF ${track.pages.length}</span>
          <div class="page-dots">${dotsHtml}</div>
        </div>

        <div class="lesson-headline">
          <h2>${page.title}</h2>
        </div>

        ${howItWorksHtml}

        ${page.codeSnippet ? `
          <div class="code-snippet-box">
            <button class="btn-copy-code" data-code="${encodeURIComponent(page.codeSnippet)}">Copy Snippet</button>
            <pre>${page.codeSnippet}</pre>
          </div>
        ` : ''}

        ${interactiveHtml}

        <div class="course-pagination-footer">
          <button class="btn-top" id="prevCoursePageBtn" ${currentCoursePageIndex === 0 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>&larr; Previous Chapter</button>
          <button class="btn-top btn-primary" id="nextCoursePageBtn">
            ${currentCoursePageIndex === track.pages.length - 1 ? 'Open Studio Builder 🚀' : 'Next Chapter &rarr;'}
          </button>
        </div>
      </div>
    `;

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

    document.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.onclick = () => {
        const text = decodeURIComponent(btn.dataset.code);
        navigator.clipboard.writeText(text);
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy Snippet', 1500);
      };
    });

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

  // Initial Boot
  switchMainView('homeView');
});
