// --- Storage Keys & Data Models ---
const STORAGE_PROJECTS = 'applab_projects_library';
const STORAGE_FOLDERS = 'applab_folders_list';
const STORAGE_SETTINGS = 'applab_user_settings';

// Unsaved changes tracker
let isDirty = false;
function markDirty() { isDirty = true; }
function markClean() { isDirty = false; }

// Window BeforeUnload Save Alert
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes in your AppLab project. Are you sure you want to leave?';
  }
});

function getStoredFolders() {
  const data = localStorage.getItem(STORAGE_FOLDERS);
  return data ? JSON.parse(data) : ['General', 'Prototypes', 'Games', 'Tools'];
}

function getStoredProjects() {
  const data = localStorage.getItem(STORAGE_PROJECTS);
  if (!data) {
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
                glowColor: '#9d4edd',
                glowSize: 16,
                opacity: 1,
                rotation: 0,
                // Advanced Animations
                animation: 'pulse',
                animDuration: 1.5,
                animDelay: 0,
                animIteration: 'infinite',
                animEasing: 'ease-in-out',
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
    localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
}

let userSettings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || JSON.stringify({
  theme: 'dark',
  mode: 'quality'
}));

let currentProject = JSON.parse(JSON.stringify(getStoredProjects()[0]));
let activeScreenId = currentProject.pages[0].id;
let activeElementId = currentProject.pages[0].elements[0]?.id || null;
let isPreviewMode = false;
let activeFolderFilter = 'all';
let contextTargetElementId = null;

// New Project Configuration State
let newProjConfig = {
  viewport: 'phone',
  canvasBg: '#0e0a1a'
};

// Font Catalog
const fontOptions = [
  { label: 'System Sans', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { label: 'Poppins (Modern)', value: "'Poppins', sans-serif" },
  { label: 'Roboto (Clean)', value: "'Roboto', sans-serif" },
  { label: 'Fira Code (Code / Mono)', value: "'Fira Code', monospace" },
  { label: 'Playfair Display (Serif)', value: "'Playfair Display', serif" },
  { label: 'Impact (Heavy Title)', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS (Playful)', value: "'Comic Sans MS', cursive, sans-serif" }
];

// DOM References
const homeView = document.getElementById('homeView');
const builderView = document.getElementById('builderView');
const tutorialView = document.getElementById('tutorialView');
const builderControls = document.getElementById('builderControls');

const studioDesignPage = document.getElementById('studioDesignPage');
const studioCodePage = document.getElementById('studioCodePage');
const subnavDesignBtn = document.getElementById('subnavDesignBtn');
const subnavCodeBtn = document.getElementById('subnavCodeBtn');

const projectsGrid = document.getElementById('projectsGrid');
const folderFilterSelect = document.getElementById('folderFilterSelect');
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

// In-Project Code Lab References
const codeLabTargetSelect = document.getElementById('codeLabTargetSelect');
const codeModeBlocksBtn = document.getElementById('codeModeBlocksBtn');
const codeModeJsBtn = document.getElementById('codeModeJsBtn');
const codeBlocksPanel = document.getElementById('codeBlocksPanel');
const codeJsPanel = document.getElementById('codeJsPanel');
const blockEventSelect = document.getElementById('blockEventSelect');
const blocksContainer = document.getElementById('blocksContainer');
const addBlockStepBtn = document.getElementById('addBlockStepBtn');
const realJsInput = document.getElementById('realJsInput');

// Windows-Style Context Menu
const elementContextMenu = document.getElementById('elementContextMenu');
const ctxDuplicate = document.getElementById('ctxDuplicate');
const ctxBringFront = document.getElementById('ctxBringFront');
const ctxSendBack = document.getElementById('ctxSendBack');
const ctxOpenCode = document.getElementById('ctxOpenCode');
const ctxDelete = document.getElementById('ctxDelete');

// Start Menu & Settings Modal References
const startMenuToggleBtn = document.getElementById('startMenuToggleBtn');
const startMenuPopup = document.getElementById('startMenuPopup');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const applySettingsBtn = document.getElementById('applySettingsBtn');

// New Project Modal References
const newProjectModal = document.getElementById('newProjectModal');
const closeNewProjBtn = document.getElementById('closeNewProjBtn');
const cancelNewProjBtn = document.getElementById('cancelNewProjBtn');
const confirmCreateProjBtn = document.getElementById('confirmCreateProjBtn');
const newProjTitle = document.getElementById('newProjTitle');
const newProjFolderSelect = document.getElementById('newProjFolderSelect');
const newProjTemplate = document.getElementById('newProjTemplate');

// Custom Dialog References
const customDialogModal = document.getElementById('customDialogModal');
const dialogIcon = document.getElementById('dialogIcon');
const dialogTitle = document.getElementById('dialogTitle');
const dialogMessage = document.getElementById('dialogMessage');
const dialogInputGroup = document.getElementById('dialogInputGroup');
const dialogInput = document.getElementById('dialogInput');
const dialogFooter = document.getElementById('dialogFooter');

// Inspector Tabs
const propertiesTab = document.getElementById('propertiesTab');
const shapesTab = document.getElementById('shapesTab');
const effectsTab = document.getElementById('effectsTab');
const animationsTab = document.getElementById('animationsTab');

// Apply Global Theme
function applyGlobalSettings() {
  document.documentElement.setAttribute('data-theme', userSettings.theme);
  document.documentElement.setAttribute('data-mode', userSettings.mode);
}
applyGlobalSettings();

// Real-Time System Clock
setInterval(() => {
  const d = new Date();
  document.getElementById('systemClock').innerText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}, 1000);

// ================= CUSTOM MODAL DIALOG ENGINE =================
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

// --- View Router ---
async function switchMainView(viewId) {
  if (viewId === 'homeView' && isDirty) {
    const canLeave = await AppLab.unsavedChangesGuard();
    if (!canLeave) return;
  }

  [homeView, builderView, tutorialView].forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });

  if (viewId === 'builderView') {
    builderControls.classList.remove('hidden');
    switchStudioSubpage('design');
  } else {
    builderControls.classList.add('hidden');
    if (viewId === 'homeView') renderProjectsDashboard();
  }
}

function switchStudioSubpage(subpage) {
  if (subpage === 'design') {
    studioDesignPage.classList.remove('hidden');
    studioCodePage.classList.add('hidden');
    subnavDesignBtn.classList.add('active');
    subnavCodeBtn.classList.remove('active');
    document.getElementById('deviceSwitcher').style.display = 'flex';
    renderPagesList();
    renderCanvas();
    renderLayersTree();
    buildInspector();
  } else {
    studioDesignPage.classList.add('hidden');
    studioCodePage.classList.remove('hidden');
    subnavDesignBtn.classList.remove('active');
    subnavCodeBtn.classList.add('active');
    document.getElementById('deviceSwitcher').style.display = 'none';
    renderCodeLab();
  }
}

subnavDesignBtn.addEventListener('click', () => switchStudioSubpage('design'));
subnavCodeBtn.addEventListener('click', () => switchStudioSubpage('code'));

document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => switchMainView(btn.dataset.view));
});

document.getElementById('navHomeBtn').addEventListener('click', () => switchMainView('homeView'));
document.getElementById('heroStartBtn').addEventListener('click', () => switchMainView('builderView'));
document.getElementById('heroTutorialBtn').addEventListener('click', () => switchMainView('tutorialView'));
document.getElementById('dashNewBtn').addEventListener('click', () => openNewProjectModal());

// --- Dashboard & Folders ---
function renderFolderOptions() {
  const folders = getStoredFolders();
  folderFilterSelect.innerHTML = '<option value="all">📁 All Folders</option>';
  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.innerText = `📂 ${f}`;
    if (f === activeFolderFilter) opt.selected = true;
    folderFilterSelect.appendChild(opt);
  });
}

folderFilterSelect.addEventListener('change', (e) => {
  activeFolderFilter = e.target.value;
  renderProjectsDashboard();
});

createFolderBtn.addEventListener('click', async () => {
  const name = await AppLab.prompt('Enter new folder name:', '', 'Create Project Folder');
  if (name && name.trim()) {
    const folders = getStoredFolders();
    if (!folders.includes(name.trim())) {
      folders.push(name.trim());
      localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
      renderFolderOptions();
    }
  }
});

function renderProjectsDashboard() {
  renderFolderOptions();
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
      currentProjectLabel.innerText = currentProject.projectName;
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
    localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
    renderProjectsDashboard();
  }
}

// --- Customizable New Project Modal Engine ---
function openNewProjectModal() {
  const folders = getStoredFolders();
  newProjFolderSelect.innerHTML = folders.map(f => `<option value="${f}">${f}</option>`).join('');
  newProjectModal.classList.remove('hidden');
}

closeNewProjBtn.onclick = () => newProjectModal.classList.add('hidden');
cancelNewProjBtn.onclick = () => newProjectModal.classList.add('hidden');

// Viewport and Canvas Background Presets
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

confirmCreateProjBtn.onclick = async () => {
  if (isDirty) {
    const canLeave = await AppLab.unsavedChangesGuard();
    if (!canLeave) return;
  }

  const title = newProjTitle.value.trim() || 'Untitled Project';
  const folder = newProjFolderSelect.value || 'General';
  const template = newProjTemplate.value;

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
          animDelay: 0,
          animIteration: '1',
          animEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
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
          animDelay: 0,
          animIteration: 'infinite',
          animEasing: 'ease-in-out',
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
          animDelay: 0,
          animIteration: '1',
          animEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
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
  currentProjectLabel.innerText = title;

  document.querySelectorAll('.device-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.device === currentProject.viewport);
  });
  deviceFrame.className = `device-mockup device-${currentProject.viewport}`;
  deviceFrame.style.background = currentProject.canvasBg || '#0e0a1a';

  newProjectModal.classList.add('hidden');
  markClean();
  switchMainView('builderView');
};

function saveProjectToStorage() {
  currentProject.lastModified = new Date().toLocaleDateString();
  let list = getStoredProjects();
  const idx = list.findIndex(p => p.id === currentProject.id);
  if (idx >= 0) list[idx] = JSON.parse(JSON.stringify(currentProject));
  else list.unshift(JSON.parse(JSON.stringify(currentProject)));
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
  markClean();
}

saveProjectBtn.addEventListener('click', async () => {
  saveProjectToStorage();
  await AppLab.alert(`Project "${currentProject.projectName}" saved successfully to browser storage!`, 'Save Complete', '💾');
});

// Device Switcher
document.querySelectorAll('.device-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentProject.viewport = btn.dataset.device;
    deviceFrame.className = `device-mockup device-${btn.dataset.device}`;
    markDirty();
  });
});

// --- State Helpers ---
function getCurrentPage() { return currentProject.pages.find(p => p.id === activeScreenId); }
function getActiveElementModel() {
  const page = getCurrentPage();
  return page ? page.elements.find(el => el.id === activeElementId) : null;
}

// --- Dynamic Shapes and Drop-Shadow Contour Engine ---
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

// --- Canvas Placement & Rendering Engine ---
function renderCanvas() {
  canvas.innerHTML = '';
  const page = getCurrentPage();
  if (!page) return;

  deviceFrame.style.background = currentProject.canvasBg || '#0e0a1a';

  page.elements.forEach(el => {
    let node = el.type === 'button' ? document.createElement('button')
             : el.type === 'input' ? document.createElement('input')
             : document.createElement('div');

    if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.text;
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

    // Animation Properties
    if (el.animation && el.animation !== 'none') {
      node.classList.add(`anim-${el.animation}`);
      node.style.animationDuration = `${el.animDuration || 1.5}s`;
      node.style.animationDelay = `${el.animDelay || 0}s`;
      node.style.animationIterationCount = el.animIteration || 'infinite';
      node.style.animationTimingFunction = el.animEasing || 'ease-in-out';
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

// Windows-Style Right-Click Context Menu Engine
function attachContextMenu(node, model) {
  node.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(model.id);
    contextTargetElementId = model.id;

    elementContextMenu.style.left = `${e.clientX}px`;
    elementContextMenu.style.top = `${e.clientY}px`;
    elementContextMenu.classList.remove('hidden');
  });
}

window.addEventListener('click', (e) => {
  if (!elementContextMenu.contains(e.target)) {
    elementContextMenu.classList.add('hidden');
  }
});

// Context Actions
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
  elementContextMenu.classList.add('hidden');
});

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
  elementContextMenu.classList.add('hidden');
});

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
  elementContextMenu.classList.add('hidden');
});

ctxOpenCode.addEventListener('click', () => {
  activeElementId = contextTargetElementId;
  elementContextMenu.classList.add('hidden');
  switchStudioSubpage('code');
});

ctxDelete.addEventListener('click', () => {
  const page = getCurrentPage();
  page.elements = page.elements.filter(i => i.id !== contextTargetElementId);
  if (activeElementId === contextTargetElementId) activeElementId = null;
  markDirty();
  renderCanvas();
  renderLayersTree();
  buildInspector();
  elementContextMenu.classList.add('hidden');
});

// Runtime Execution with Custom Alert Modal Integration
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
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); osc.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.15);
          }
        }, canvas);
      } catch (err) {
        AppLab.alert(err.message, 'JavaScript Execution Error', '⚠️');
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

// --- Inspector: UI, Shapes, Effects, & Advanced Animations ---
document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});

function buildInspector() {
  const el = getActiveElementModel();
  if (!el) {
    propertiesTab.innerHTML = '<p class="empty-state">Select an element to customize styling.</p>';
    shapesTab.innerHTML = '<p class="empty-state">Select an element to customize shapes.</p>';
    effectsTab.innerHTML = '<p class="empty-state">Select an element to customize effects.</p>';
    animationsTab.innerHTML = '<p class="empty-state">Select an element to configure advanced animations.</p>';
    return;
  }

  // 1. UI Tab
  const fontOpts = fontOptions.map(f => `<option value="${f.value}" ${el.fontFamily === f.value ? 'selected' : ''}>${f.label}</option>`).join('');
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
      <select class="control-input" id="propFont">${fontOpts}</select>
    </div>
    <div class="control-row">
      <div class="control-group">
        <label>Font Size (px)</label>
        <input type="number" class="control-input" id="propFontSize" value="${el.fontSize || 14}">
      </div>
      <div class="control-group">
        <label>Weight</label>
        <select class="control-input" id="propWeight">
          <option value="400" ${el.fontWeight === '400' ? 'selected' : ''}>Regular</option>
          <option value="600" ${el.fontWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
          <option value="700" ${el.fontWeight === '700' ? 'selected' : ''}>Bold</option>
        </select>
      </div>
    </div>
    <div class="control-group">
      <label>Text Alignment</label>
      <select class="control-input" id="propAlign">
        <option value="left" ${el.textAlign === 'left' ? 'selected' : ''}>Left</option>
        <option value="center" ${el.textAlign === 'center' ? 'selected' : ''}>Center</option>
        <option value="right" ${el.textAlign === 'right' ? 'selected' : ''}>Right</option>
      </select>
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

  document.getElementById('propName').oninput = (e) => { el.name = e.target.value; markDirty(); renderLayersTree(); };
  document.getElementById('propText').oninput = (e) => { el.text = e.target.value; markDirty(); renderCanvas(); };
  document.getElementById('propFont').onchange = (e) => { el.fontFamily = e.target.value; markDirty(); renderCanvas(); };
  document.getElementById('propFontSize').oninput = (e) => { el.fontSize = parseInt(e.target.value) || 14; markDirty(); renderCanvas(); };
  document.getElementById('propWeight').onchange = (e) => { el.fontWeight = e.target.value; markDirty(); renderCanvas(); };
  document.getElementById('propAlign').onchange = (e) => { el.textAlign = e.target.value; markDirty(); renderCanvas(); };

  bindColorPair('propTextColorPicker', 'propTextColor', (v) => { el.textColor = v; markDirty(); renderCanvas(); });
  bindColorPair('propBgColorPicker', 'propBgColor', (v) => { el.bgColor = v; markDirty(); renderCanvas(); });
  bindColorPair('propBorderColorPicker', 'propBorderColor', (v) => { el.borderColor = v; markDirty(); renderCanvas(); });

  document.getElementById('delElemBtn').onclick = () => {
    getCurrentPage().elements = getCurrentPage().elements.filter(i => i.id !== el.id);
    activeElementId = null;
    markDirty();
    renderCanvas(); renderLayersTree(); buildInspector();
  };

  // 2. Shapes Tab
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

  // 3. Effects Tab
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
      <input type="color" id="propGlowColor" value="${rgbToHex(el.glowColor || '#9d4edd')}">
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
  document.getElementById('propGlowColor').oninput = (e) => { el.glowColor = e.target.value; markDirty(); renderCanvas(); };
  document.getElementById('propOpacity').oninput = (e) => { el.opacity = parseFloat(e.target.value); markDirty(); renderCanvas(); };
  document.getElementById('propRotation').oninput = (e) => { el.rotation = parseInt(e.target.value); markDirty(); renderCanvas(); };

  // 4. Advanced Animations Pro Tab (Interactive Card Grid & Custom Selects)
  const animPresets = [
    { id: 'none', label: 'None', icon: '🚫' },
    { id: 'fadeIn', label: 'Fade In', icon: '✨' },
    { id: 'slideUp', label: 'Slide Up', icon: '⬆️' },
    { id: 'scalePop', label: 'Scale Pop', icon: '💥' },
    { id: 'pulse', label: 'Pulse', icon: '💓' },
    { id: 'bounce', label: 'Bounce', icon: '🏀' },
    { id: 'float', label: 'Float', icon: '🎈' },
    { id: 'spin', label: 'Spin', icon: '🔄' },
    { id: 'glowPulse', label: 'Glow', icon: '🔮' },
    { id: 'shake', label: 'Shake', icon: '📳' }
  ];

  const currentAnim = el.animation || 'none';
  const animChipsHtml = animPresets.map(p => `
    <button class="anim-chip-btn ${currentAnim === p.id ? 'active' : ''}" data-anim="${p.id}">
      <span class="chip-icon">${p.icon}</span>
      <span>${p.label}</span>
    </button>
  `).join('');

  animationsTab.innerHTML = `
    <div class="control-group">
      <label>Visual Animation Preset</label>
      <div class="anim-grid-picker" id="animGridPicker">
        ${animChipsHtml}
      </div>
    </div>

    <div class="control-row" style="margin-top: 6px;">
      <div class="control-group">
        <label>Duration (Seconds)</label>
        <input type="number" step="0.1" min="0.1" max="10" class="control-input" id="propAnimDur" value="${el.animDuration || 1.5}">
      </div>
      <div class="control-group">
        <label>Delay (Seconds)</label>
        <input type="number" step="0.1" min="0" max="10" class="control-input" id="propAnimDelay" value="${el.animDelay || 0}">
      </div>
    </div>

    <div class="control-row">
      <div class="control-group">
        <label>Iterations</label>
        <div class="custom-select-wrapper" id="customIterSelect">
          <div class="custom-select-trigger">
            <span class="selected-text">${el.animIteration === 'infinite' ? '🔁 Infinite Loop' : el.animIteration === '1' ? '1 Time' : el.animIteration + ' Times'}</span>
            <span class="arrow-icon">▼</span>
          </div>
          <div class="custom-select-options">
            <div class="custom-select-option ${el.animIteration === 'infinite' ? 'selected' : ''}" data-val="infinite">🔁 Infinite Loop</div>
            <div class="custom-select-option ${el.animIteration === '1' ? 'selected' : ''}" data-val="1">1 Time</div>
            <div class="custom-select-option ${el.animIteration === '2' ? 'selected' : ''}" data-val="2">2 Times</div>
            <div class="custom-select-option ${el.animIteration === '3' ? 'selected' : ''}" data-val="3">3 Times</div>
          </div>
        </div>
      </div>

      <div class="control-group">
        <label>Timing Curve</label>
        <div class="custom-select-wrapper" id="customEasingSelect">
          <div class="custom-select-trigger">
            <span class="selected-text">${el.animEasing?.includes('cubic') ? 'Bouncy Spring' : el.animEasing === 'linear' ? 'Linear' : 'Smooth (Ease)'}</span>
            <span class="arrow-icon">▼</span>
          </div>
          <div class="custom-select-options">
            <div class="custom-select-option ${el.animEasing === 'ease-in-out' ? 'selected' : ''}" data-val="ease-in-out">Smooth (Ease In-Out)</div>
            <div class="custom-select-option ${el.animEasing === 'linear' ? 'selected' : ''}" data-val="linear">Linear (Constant)</div>
            <div class="custom-select-option ${el.animEasing?.includes('cubic') ? 'selected' : ''}" data-val="cubic-bezier(0.16, 1, 0.3, 1)">Bouncy Spring</div>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-top btn-primary" id="replayAnimBtn" style="margin-top: 10px;">▶️ Test Animation Live</button>
  `;

  // Bind Animation Card Clicks
  document.querySelectorAll('.anim-chip-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.anim-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      el.animation = btn.dataset.anim;
      markDirty();
      renderCanvas();
    };
  });

  // Bind Custom Selects
  setupCustomDropdown('customIterSelect', (val) => {
    el.animIteration = val;
    markDirty();
    renderCanvas();
  });

  setupCustomDropdown('customEasingSelect', (val) => {
    el.animEasing = val;
    markDirty();
    renderCanvas();
  });

  document.getElementById('propAnimDur').oninput = (e) => { el.animDuration = parseFloat(e.target.value) || 1.5; markDirty(); renderCanvas(); };
  document.getElementById('propAnimDelay').oninput = (e) => { el.animDelay = parseFloat(e.target.value) || 0; markDirty(); renderCanvas(); };

  document.getElementById('replayAnimBtn').onclick = () => {
    const node = document.getElementById(el.id);
    if (node && el.animation !== 'none') {
      node.classList.remove(`anim-${el.animation}`);
      void node.offsetWidth; // Force reflow
      node.classList.add(`anim-${el.animation}`);
    }
  };
}

// --- Custom Dropdown Engine Helper ---
function setupCustomDropdown(wrapperId, onSelectCallback) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const trigger = wrapper.querySelector('.custom-select-trigger');
  const selectedText = trigger.querySelector('.selected-text');
  const options = wrapper.querySelectorAll('.custom-select-option');

  trigger.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
      if (w !== wrapper) w.classList.remove('open');
    });
    wrapper.classList.toggle('open');
  };

  options.forEach(opt => {
    opt.onclick = (e) => {
      e.stopPropagation();
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedText.innerText = opt.innerText;
      wrapper.classList.remove('open');
      if (onSelectCallback) onSelectCallback(opt.dataset.val);
    };
  });
}

// Global click dismiss for custom dropdowns
window.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
});

// --- IN-PROJECT CODE LAB RENDERING ---
function renderCodeLab() {
  const page = getCurrentPage();
  codeLabTargetSelect.innerHTML = '<option value="">-- Choose Element to Script --</option>';

  if (page) {
    page.elements.forEach(el => {
      const opt = document.createElement('option');
      opt.value = el.id;
      opt.innerText = `[${el.type.toUpperCase()}] ${el.name}`;
      if (el.id === activeElementId) opt.selected = true;
      codeLabTargetSelect.appendChild(opt);
    });
  }

  const activeEl = getActiveElementModel();
  if (!activeEl) {
    blocksContainer.innerHTML = '<p class="empty-state">Select an element above to configure blocks.</p>';
    realJsInput.value = '';
    return;
  }

  if (activeEl.codeMode === 'realCode') {
    codeModeBlocksBtn.classList.remove('active');
    codeModeJsBtn.classList.add('active');
    codeBlocksPanel.classList.add('hidden');
    codeJsPanel.classList.remove('hidden');
  } else {
    codeModeBlocksBtn.classList.add('active');
    codeModeJsBtn.classList.remove('active');
    codeBlocksPanel.classList.remove('hidden');
    codeJsPanel.classList.add('hidden');
  }

  blockEventSelect.value = activeEl.logic?.event || 'click';
  renderBlockStack(activeEl);
  realJsInput.value = activeEl.customJs || "// Example:\n// app.showAlert('Action fired!');\n// element.style.backgroundColor = '#ff0055';\n// app.navigateTo('screen_id');";
}

codeLabTargetSelect.addEventListener('change', (e) => {
  activeElementId = e.target.value;
  renderCodeLab();
});

codeModeBlocksBtn.addEventListener('click', () => {
  const el = getActiveElementModel();
  if (el) { el.codeMode = 'blocks'; markDirty(); }
  renderCodeLab();
});

codeModeJsBtn.addEventListener('click', () => {
  const el = getActiveElementModel();
  if (el) { el.codeMode = 'realCode'; markDirty(); }
  renderCodeLab();
});

blockEventSelect.addEventListener('change', (e) => {
  const el = getActiveElementModel();
  if (el) {
    if (!el.logic) el.logic = { event: 'click', actions: [] };
    el.logic.event = e.target.value;
    markDirty();
  }
});

realJsInput.addEventListener('input', (e) => {
  const el = getActiveElementModel();
  if (el) { el.customJs = e.target.value; markDirty(); }
});

function renderBlockStack(el) {
  if (!el.logic || !el.logic.actions || el.logic.actions.length === 0) {
    blocksContainer.innerHTML = '<p class="empty-state">No action blocks configured. Click "Add Action Step" below.</p>';
    return;
  }

  const pageOptions = currentProject.pages.map(p => `<option value="${p.id}">Screen: ${p.name}</option>`).join('');
  const elemOptions = getCurrentPage().elements.filter(i => i.id !== el.id).map(i => `<option value="${i.id}">Layer: ${i.name}</option>`).join('');

  blocksContainer.innerHTML = '';
  el.logic.actions.forEach((act, idx) => {
    const step = document.createElement('div');
    step.className = 'block-step';
    step.innerHTML = `
      <button class="btn-remove-step" data-index="${idx}">&times; Remove Step</button>
      <div class="control-group">
        <label>Action (${idx + 1})</label>
        <select class="control-input step-type" data-index="${idx}">
          <option value="alert" ${act.type === 'alert' ? 'selected' : ''}>Show Alert Pop-up</option>
          <option value="navigate" ${act.type === 'navigate' ? 'selected' : ''}>Navigate to Screen</option>
          <option value="setText" ${act.type === 'setText' ? 'selected' : ''}>Set Layer Text</option>
          <option value="setBg" ${act.type === 'setBg' ? 'selected' : ''}>Set Layer Background Color</option>
        </select>
      </div>
      ${['navigate', 'setText', 'setBg'].includes(act.type) ? `
        <div class="control-group">
          <label>Target</label>
          <select class="control-input step-target" data-index="${idx}">
            <option value="">-- Choose Target --</option>
            ${act.type === 'navigate' ? pageOptions : elemOptions}
          </select>
        </div>
      ` : ''}
      <div class="control-group">
        <label>Parameter Value</label>
        <input type="text" class="control-input step-val" data-index="${idx}" value="${act.value || ''}" placeholder="Enter parameter...">
      </div>
    `;

    blocksContainer.appendChild(step);
  });

  document.querySelectorAll('.step-target').forEach(sel => {
    const idx = sel.dataset.index;
    if (el.logic.actions[idx]) sel.value = el.logic.actions[idx].target || '';
    sel.onchange = (e) => { el.logic.actions[idx].target = e.target.value; markDirty(); };
  });

  document.querySelectorAll('.step-type').forEach(sel => {
    sel.onchange = (e) => {
      const idx = sel.dataset.index;
      el.logic.actions[idx].type = e.target.value;
      markDirty();
      renderBlockStack(el);
    };
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

// Drag & Drop
document.querySelectorAll('.draggable-card').forEach(card => {
  card.ondragstart = (e) => e.dataTransfer.setData('type', card.dataset.type);
});

canvas.ondragover = (e) => e.preventDefault();
canvas.ondrop = (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('type');
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
    animDelay: 0,
    animIteration: 'infinite',
    animEasing: 'ease-in-out',
    codeMode: 'blocks',
    customJs: '',
    logic: { event: 'click', actions: [] }
  };
  getCurrentPage().elements.push(newEl);
  markDirty();
  selectElement(newEl.id);
};

// Pages & Layers Tree
function renderPagesList() {
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
  layersTree.innerHTML = '';
  getCurrentPage().elements.forEach(el => {
    const l = document.createElement('div');
    l.className = `layer-item ${el.id === activeElementId ? 'selected' : ''}`;
    l.innerText = el.name;
    l.onclick = () => selectElement(el.id);
    layersTree.appendChild(l);
  });
}

addPageBtn.onclick = () => {
  const pId = 'scr_' + Date.now().toString().slice(-4);
  currentProject.pages.push({ id: pId, name: 'Screen ' + (currentProject.pages.length + 1), elements: [] });
  activeScreenId = pId;
  markDirty();
  renderPagesList(); renderCanvas();
};

// Preview Mode
modeToggleBtn.onclick = () => {
  isPreviewMode = !isPreviewMode;
  modeToggleBtn.innerText = isPreviewMode ? '⏹️ Stop' : '▶️ Preview';
  document.body.classList.toggle('preview-mode', isPreviewMode);
  renderCanvas();
};

// Export Layout
exportBtn.addEventListener('click', () => {
  const jsonStr = JSON.stringify(currentProject, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentProject.projectName.toLowerCase().replace(/\s+/g, '_')}.applab`;
  a.click();
});

// Start Menu & Settings Modal
startMenuToggleBtn.onclick = () => startMenuPopup.classList.toggle('hidden');
document.addEventListener('click', (e) => {
  if (!startMenuToggleBtn.contains(e.target) && !startMenuPopup.contains(e.target)) {
    startMenuPopup.classList.add('hidden');
  }
});

document.getElementById('smHomeBtn').onclick = () => { switchMainView('homeView'); startMenuPopup.classList.add('hidden'); };
document.getElementById('smStudioBtn').onclick = () => { switchMainView('builderView'); startMenuPopup.classList.add('hidden'); };
document.getElementById('smNewProjectBtn').onclick = () => { openNewProjectModal(); startMenuPopup.classList.add('hidden'); };
document.getElementById('smTutorialBtn').onclick = () => { switchMainView('tutorialView'); startMenuPopup.classList.add('hidden'); };

document.getElementById('smSettingsBtn').onclick = () => {
  startMenuPopup.classList.add('hidden');
  document.getElementById('settingTheme').value = userSettings.theme;
  document.getElementById('settingMode').value = userSettings.mode;
  settingsModal.classList.remove('hidden');
};

closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');
applySettingsBtn.onclick = () => {
  userSettings.theme = document.getElementById('settingTheme').value;
  userSettings.mode = document.getElementById('settingMode').value;
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(userSettings));
  applyGlobalSettings();
  settingsModal.classList.add('hidden');
};

// Utility Helpers
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

// Initial Boot
switchMainView('homeView');
