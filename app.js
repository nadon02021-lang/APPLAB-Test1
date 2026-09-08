document.addEventListener('DOMContentLoaded', () => {
  // --- Storage Keys & Data Models ---
  const STORAGE_PROJECTS = 'applab_projects_library';
  const STORAGE_FOLDERS = 'applab_folders_list';
  const STORAGE_SETTINGS = 'applab_user_settings';

  let isDirty = false;
  function markDirty() { isDirty = true; }
  function markClean() { isDirty = false; }

  // Clipboard buffers for copy/paste
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
                tooltip: 'Tap here to trigger the demo onboarding alert!',
                tooltipDuration: 3.5,
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

  // ================= EXPANDED 8-TRACK CURRICULUM (5+ PAGES PER TOPIC) =================
  let activeTrackId = 'track_layout';
  let currentCoursePageIndex = 0;

  const courseTracks = [
    {
      id: 'track_layout',
      title: 'Canvas Layout & Clamping',
      desc: 'Master boundary constraints, drag mechanics & responsive viewport clamping',
      icon: '📐',
      pages: [
        {
          title: 'Understanding Absolute Canvas Bounds',
          tag: 'Core Concept',
          desc: 'AppLab utilizes responsive absolute positioning relative to the device chassis origin (0, 0). Clamping coordinates guarantees elements cannot be dragged or pushed outside the viewport.',
          type: 'practice_canvas',
          codeSnippet: '// Boundary Clamping Formula:\nconst clampX = Math.max(0, Math.min(canvasWidth - elemWidth, targetX));\nconst clampY = Math.max(0, Math.min(canvasHeight - elemHeight, targetY));'
        },
        {
          title: 'Precision Positioning Quiz',
          tag: 'Knowledge Check',
          desc: 'Verify your understanding of spatial constraints on custom mobile viewports.',
          type: 'quiz',
          quiz: {
            question: 'Why must we constrain both Math.max(0, x) and Math.min(maxBound, x)?',
            options: [
              'To speed up CSS rendering in Chrome',
              'To keep the layer from escaping both the top-left and bottom-right edges',
              'To force the component to convert to a flex container',
              'To automatically resize text when the browser scales'
            ],
            correctIndex: 1,
            explanation: 'Math.max(0, x) safeguards against negative-overflow past the left/top edges, while Math.min stops the layer from disappearing off the right/bottom borders.'
          }
        },
        {
          title: 'Multi-Device Viewport Scaling',
          tag: 'Responsive Architecture',
          desc: 'When targeting phones, tablets, or desktop views, relative layout anchors help components adapt dynamically. Elements use pixel coordinates bounded by the current viewport frame width and height.',
          type: 'practice_viewport_scaler',
          codeSnippet: '// Viewport scaling toggle logic:\ndeviceFrame.style.width = isTablet ? "768px" : "380px";'
        },
        {
          title: 'Safe Margins & Collision Detection',
          tag: 'Precision Geometry',
          desc: 'Bounding box collision testing prevents layered components from overlapping unintentionally. The algorithm evaluates overlapping axes via AABB (Axis-Aligned Bounding Box) logic.',
          type: 'practice_aabb_collision',
          codeSnippet: 'function checkCollision(r1, r2) {\n  return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);\n}'
        },
        {
          title: 'Z-Index Stack Hierarchy',
          tag: 'Layer Ordering',
          desc: 'Canvas layers are painted in array sequence. The first element in the pages array is rendered on the bottom floor, while the final element sits at the very top of the stack.',
          type: 'practice_zindex_stack',
          codeSnippet: 'const [item] = elements.splice(index, 1);\nelements.push(item); // Brings to front'
        }
      ]
    },
    {
      id: 'track_shapes',
      title: 'Geometric Masks & Vector Contours',
      desc: 'Explore CSS polygon clip-paths, geometric contours and drop-shadow fallbacks',
      icon: '💎',
      pages: [
        {
          title: 'Polygon Clip-Path Masks',
          tag: 'CSS Shaders & Masks',
          desc: 'Non-rectangular geometries like diamonds and hexagons are rendered with CSS polygon clip-paths. Standard CSS box-shadow does not curve along polygon cuts; filter: drop-shadow must be used instead.',
          type: 'practice_shapes',
          codeSnippet: '/* Hexagonal Mask Contour */\nclip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);\nfilter: drop-shadow(0 0 16px rgba(157, 78, 221, 0.65));'
        },
        {
          title: 'Polygon Drop Shadows',
          tag: 'Quiz Challenge',
          desc: 'Test your grasp on how clipping masks impact browser compositor shadows.',
          type: 'quiz',
          quiz: {
            question: 'Why does standard box-shadow fail on elements shaped with clip-path?',
            options: [
              'Browsers disable shadows on high DPI screens',
              'box-shadow is drawn on the original square bounding box before clip-path truncates it',
              'clip-path changes the color mode of the layer to grayscale',
              'box-shadow requires an external image asset to function'
            ],
            correctIndex: 1,
            explanation: 'The clip-path cuts off standard box-shadows outside the polygon bounds. The CSS filter: drop-shadow() function generates shadows along the actual alpha contour.'
          }
        },
        {
          title: 'Custom Vertex Point Adjuster',
          tag: 'Vertex Editor',
          desc: 'Adjust individual polygon percentage sliders to dynamically twist and reshape vector masks.',
          type: 'practice_vertex_editor',
          codeSnippet: 'clip-path: polygon(v1X v1Y, v2X v2Y, v3X v3Y, v4X v4Y);'
        },
        {
          title: 'Pill & Capsule Curvature',
          tag: 'Border Radii',
          desc: 'Toggle border radius interpolation parameters to witness smooth morphing from rigid boxes to complete circles.',
          type: 'practice_radius_interpolator',
          codeSnippet: 'border-radius: ${radiusVal}px;'
        },
        {
          title: 'Vector Performance Analysis',
          tag: 'GPU Shading Quiz',
          desc: 'Evaluate the processing overhead between geometric clipping and border radius smoothing.',
          type: 'quiz',
          quiz: {
            question: 'Which styling method requires less GPU computation during smooth 60fps canvas dragging?',
            options: [
              'Standard border-radius with box-shadow',
              'Complex 12-point polygon clip-paths with multiple drop-shadow filters',
              'Both require the exact same amount of GPU cycles',
              'Neither uses the GPU at all'
            ],
            correctIndex: 0,
            explanation: 'Standard border-radius is handled directly by optimized compositor primitives, while complex polygon filters demand per-pixel alpha mask re-rasterization.'
          }
        }
      ]
    },
    {
      id: 'track_blocks',
      title: 'Visual Logic Pipelines',
      desc: 'Chain visual event triggers, screen transitions & reactive style blocks',
      icon: '🧱',
      pages: [
        {
          title: 'Event-Driven Block Stacks',
          tag: 'No-Code Architecture',
          desc: 'Block programs execute sequentially downward when the specified event fires. Test the live simulator below to preview state morphing and delayed execution chains.',
          type: 'practice_blocks',
          codeSnippet: 'logic: {\n  event: "click",\n  actions: [\n    { type: "setText", target: "label_1", value: "Active" },\n    { type: "setBg", target: "label_1", value: "#00f2fe" },\n    { type: "alert", value: "Workflow executed!" }\n  ]\n}'
        },
        {
          title: 'Asynchronous Action Order',
          tag: 'Architecture Check',
          desc: 'Confirm how AppLab handles sequenced event blocks.',
          type: 'quiz',
          quiz: {
            question: 'What occurs if an action block targets an element that has been deleted?',
            options: [
              'The entire application crashes to a blank screen',
              'The engine safely checks if the target exists before updating style or content',
              'The browser freezes in an infinite loop',
              'The action deletes the next element in the array'
            ],
            correctIndex: 1,
            explanation: 'AppLab guards every target update with existence checks (e.g. if (target) target.innerText = val), preventing null pointer exceptions.'
          }
        },
        {
          title: 'Visual Logic Builder Flow',
          tag: 'Drag & Connect Simulator',
          desc: 'Assemble a mini 3-block pipeline (Trigger -> Condition -> Action) and test execution validity.',
          type: 'practice_logic_builder',
          codeSnippet: 'if (trigger.fired) {\n  executeActions(pipelineStack);\n}'
        },
        {
          title: 'Conditional Branching Logic',
          tag: 'If/Else Stacks',
          desc: 'Test true/false branches in visual blocks where variable comparisons determine which child action executes.',
          type: 'practice_conditional_branch',
          codeSnippet: 'if (variable.score > 50) {\n  runActions(successBranch);\n} else {\n  runActions(retryBranch);\n}'
        },
        {
          title: 'Trigger Event Types',
          tag: 'Logic Quiz',
          desc: 'Review the operational differences between pointer events in visual scripting.',
          type: 'quiz',
          quiz: {
            question: 'Which trigger fires immediately when a cursor hovers over a component layer?',
            options: [
              'click',
              'hover (mouseenter)',
              'keydown',
              'mount'
            ],
            correctIndex: 1,
            explanation: 'The hover trigger listens to mouseenter events, running block logic as soon as the pointer crosses into the bounding box.'
          }
        }
      ]
    },
    {
      id: 'track_js',
      title: 'Sandbox JavaScript Engine',
      desc: 'Direct runtime execution with full sandbox API hooks & sound synthesis',
      icon: '⚡',
      pages: [
        {
          title: 'The AppLab Runtime Context',
          tag: 'Programmatic Power',
          desc: 'Custom JavaScript runs in a scoped sandbox providing element, app, and canvas arguments. This enables procedural graphics, sound synthesis, and external network interactions.',
          type: 'practice_js',
          codeSnippet: '// Interactive Sandbox Script:\napp.showAlert("Welcome: " + element.innerText);\napp.playBeep();\nelement.style.transform = "scale(1.1) rotate(-5deg)";'
        },
        {
          title: 'Sandboxed Scope Security',
          tag: 'Runtime Isolation',
          desc: 'Scripts execute inside an isolated Function constructor instance, giving developers access to safe app helper APIs without risking the host studio session.',
          type: 'practice_js',
          codeSnippet: 'const scriptFn = new Function("element", "app", "canvas", model.customJs);\nscriptFn(node, appApi, canvasNode);'
        },
        {
          title: 'Interactive Console Debugger',
          tag: 'Live REPL',
          desc: 'Type and evaluate custom JavaScript property assignments live on a test object in real-time.',
          type: 'practice_repl_console',
          codeSnippet: 'element.style.color = "#00f2fe";\nelement.style.borderRadius = "20px";'
        },
        {
          title: 'Custom Math Calculator Script',
          tag: 'Algorithm Runner',
          desc: 'Execute math formula scripts inside the virtual machine to calculate dynamic layout offsets.',
          type: 'practice_math_runner',
          codeSnippet: 'const radius = 50;\nconst area = Math.PI * Math.pow(radius, 2);\nreturn area;'
        },
        {
          title: 'Handling Runtime Errors',
          tag: 'Error Shielding Quiz',
          desc: 'Learn how sandboxed script exceptions are intercepted and displayed.',
          type: 'quiz',
          quiz: {
            question: 'What happens when a creator scripts invalid JavaScript syntax in Code Lab?',
            options: [
              'The editor catches the error in a try/catch block and displays a modal dialog',
              'The entire browser tab terminates',
              'All project local storage is wiped',
              'The script is automatically uploaded to GitHub'
            ],
            correctIndex: 0,
            explanation: 'Runtime execution is enclosed in a try/catch block that intercepts the Error object and presents a clean alert dialog with the line error.'
          }
        }
      ]
    },
    {
      id: 'track_binding',
      title: 'Dynamic State & Two-Way Binding',
      desc: 'Synchronize user keystrokes into live screen layers with reactive listeners',
      icon: '🔄',
      pages: [
        {
          title: 'Two-Way Input Reflection',
          tag: 'State Reactivity',
          desc: 'Connecting user text inputs directly to display headers gives users immediate visual validation. Try updating the input in the lab below.',
          type: 'practice_binding',
          codeSnippet: 'input.addEventListener("input", (e) => {\n  const val = e.target.value;\n  targetChip.innerText = val || "Placeholder";\n  targetChip.classList.add("anim-scalePop");\n});'
        },
        {
          title: 'Sanitizing Bound Text Content',
          tag: 'Data Integrity',
          desc: 'Always bind text using textContent or innerText rather than innerHTML to prevent script injection when rendering untrusted user strings.',
          type: 'practice_binding',
          codeSnippet: '// Safe binding:\ntargetLayer.innerText = userInputField.value;\n// Unsafe:\ntargetLayer.innerHTML = userInputField.value; // Vulnerable to XSS'
        },
        {
          title: 'Color Hex Code Synchronizer',
          tag: 'Style Binding Lab',
          desc: 'Type any valid CSS color hex code or name to instantly re-theme a live UI component.',
          type: 'practice_color_sync',
          codeSnippet: 'previewCard.style.backgroundColor = colorInput.value;'
        },
        {
          title: 'Slider Number Formatter',
          tag: 'Value Interpolation',
          desc: 'Bind a range slider to dynamically scale a numerical badge from 0% to 100% in real-time.',
          type: 'practice_slider_mirror',
          codeSnippet: 'badge.innerText = `${slider.value}% Completed`;\nbar.style.width = `${slider.value}%`;'
        },
        {
          title: 'Data Binding Principles',
          tag: 'Reactivity Quiz',
          desc: 'Test your understanding of model-view synchronization.',
          type: 'quiz',
          quiz: {
            question: 'Why is textContent preferred over innerHTML for live state mirroring?',
            options: [
              'It renders characters faster and prevents malicious HTML/script execution',
              'It makes the font size 50% larger',
              'It automatically converts strings to numerical floats',
              'It enables CSS keyframe animations'
            ],
            correctIndex: 0,
            explanation: 'textContent treats all user characters as raw string literals, preventing cross-site scripting (XSS) and executing with minimal DOM parsing overhead.'
          }
        }
      ]
    },
    {
      id: 'track_perf',
      title: 'GPU Glassmorphism & Shaders',
      desc: 'Balance expensive backdrop-filter fill rates with clean 60FPS mobile speeds',
      icon: '🚀',
      pages: [
        {
          title: 'Compositor Fill-Rate Optimization',
          tag: 'GPU Engine Profiling',
          desc: 'Backdrop blur involves multiple convolution blur passes over pixels rendered behind the element. Toggle between Quality and Performance mode to observe the computational trade-off.',
          type: 'practice_perf',
          codeSnippet: '/* Quality: GPU Convolution Blur */\nbackdrop-filter: blur(24px);\n/* Performance: Zero Shader Overhead */\nbackdrop-filter: none;\nbackground: rgba(18, 12, 34, 0.95);'
        },
        {
          title: 'Hardware Acceleration Promoters',
          tag: 'Compositor Layers',
          desc: 'Properties like transform: translateZ(0) and will-change: transform prompt the browser to isolate the element on its own dedicated GPU composite layer.',
          type: 'practice_perf',
          codeSnippet: 'will-change: transform, opacity;\ntransform: translateZ(0);'
        },
        {
          title: 'FPS Frame Rate Stress Tester',
          tag: 'Benchmark Lab',
          desc: 'Simulate high-load DOM painting stress tests with glowing elements to test browser compositing limits.',
          type: 'practice_fps_stress',
          codeSnippet: '// Simulating 100 animated glowing DOM nodes:\ncreateGlowNodes(100);'
        },
        {
          title: 'Quality vs Performance Modes',
          tag: 'Profiling Quiz',
          desc: 'Review how performance profiles are managed in production app builders.',
          type: 'quiz',
          quiz: {
            question: 'Which setting drastically reduces GPU power consumption on low-end mobile devices?',
            options: [
              'Increasing backdrop-filter to 50px',
              'Switching to Performance Mode to disable heavy convolution blurs',
              'Adding 10 box shadows per layer',
              'Using 4K resolution images on tiny icons'
            ],
            correctIndex: 1,
            explanation: 'Disabling backdrop-filter replaces multi-pass shader blurs with flat or semi-transparent background colors, dramatically dropping GPU load.'
          }
        },
        {
          title: 'Compositor Paint Invalidation',
          tag: 'Frame Budget',
          desc: 'Animating layout properties like width and height forces CPU reflow and repaint. Animating transform and opacity bypasses reflow entirely.',
          type: 'practice_perf',
          codeSnippet: '/* Fast (GPU compositor only) */\ntransform: scale(1.05);\n/* Slow (forces CPU reflow & relayout) */\nwidth: 150px;'
        }
      ]
    },
    {
      id: 'track_anim',
      title: 'Choreographed Keyframe Motion',
      desc: 'Spring physics, cubic-bezier timing curves and ambient tactile feedback',
      icon: '✨',
      pages: [
        {
          title: 'Tactile Physics & Bezier Curves',
          tag: 'Motion Design',
          desc: 'Linear easing feels rigid and robotic. Easing curves like cubic-bezier(0.16, 1, 0.3, 1) mimic natural spring physics with rapid snap entry and soft deceleration.',
          type: 'practice_anim',
          codeSnippet: 'transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);\nanimation: scalePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);'
        },
        {
          title: 'Animation Triggers (Ambient vs Event)',
          tag: 'Trigger Conditions',
          desc: 'Ambient animations loop infinitely in the background, whereas mount triggers fire once upon entering the screen, and click triggers fire on user taps.',
          type: 'practice_anim',
          codeSnippet: '/* Ambient Loop */\nanimation-iteration-count: infinite;\n/* Event Pulse */\nanimation-iteration-count: 1;'
        },
        {
          title: 'Interactive Spring Bounce Tester',
          tag: 'Spring Physics Lab',
          desc: 'Click the trigger box to test custom tension and friction spring curves.',
          type: 'practice_spring_tester',
          codeSnippet: 'transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);'
        },
        {
          title: 'Motion Design Accessibility',
          tag: 'Accessibility & Safety',
          desc: 'Users with vestibular conditions can experience motion sensitivity. Supporting prefers-reduced-motion ensures safe viewing across all platforms.',
          type: 'practice_anim',
          codeSnippet: '@media (prefers-reduced-motion: reduce) {\n  .anim-pulse, .anim-spin { animation: none !important; }\n}'
        },
        {
          title: 'Motion Choreography Quiz',
          tag: 'Timing Quiz',
          desc: 'Test your understanding of UI motion principles.',
          type: 'quiz',
          quiz: {
            question: 'What is the optimal animation duration range for micro-interactions like button clicks?',
            options: [
              '150ms to 350ms',
              '3000ms to 5000ms',
              '0ms (no duration)',
              '10 to 15 seconds'
            ],
            correctIndex: 0,
            explanation: 'Micro-interactions between 150ms and 350ms feel snappy, tactile, and responsive without dragging out the user interface workflow.'
          }
        }
      ]
    },
    {
      id: 'track_audio',
      title: 'Web Audio Procedural Synthesis',
      desc: 'Synthesize custom frequency waves, chords and alerts without audio files',
      icon: '🔊',
      pages: [
        {
          title: 'Oscillator Nodes & Envelopes',
          tag: 'Audio DSP',
          desc: 'The native Web Audio API allows synthesizing rich interface audio procedurally using sine and triangle oscillator nodes, eliminating heavy external MP3 download overhead.',
          type: 'practice_audio',
          codeSnippet: 'const ctx = new AudioContext();\nconst osc = ctx.createOscillator();\nconst gain = ctx.createGain();\nosc.connect(gain); gain.connect(ctx.destination);\ngain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);'
        },
        {
          title: 'Waveform Profiles (Sine, Square, Saw)',
          tag: 'Acoustic Timbre',
          desc: 'Sine waves produce soft pure tones, triangle waves sound warm and wooden, while sawtooth and square waves output punchy digital buzzy timbres suitable for alerts.',
          type: 'practice_audio',
          codeSnippet: 'osc.type = "sine";     // Smooth click\nosc.type = "triangle"; // Warm chime\nosc.type = "sawtooth"; // Warning buzzer'
        },
        {
          title: 'Custom Frequency Pitch Slider',
          tag: 'Frequency Synth Lab',
          desc: 'Drag the frequency slider to sweep an oscillator pitch live from 100Hz to 1200Hz.',
          type: 'practice_pitch_sweep',
          codeSnippet: 'oscillator.frequency.setValueAtTime(slider.value, audioCtx.currentTime);'
        },
        {
          title: 'Audio Gain Envelopes (ADSR)',
          tag: 'Sound Dynamics',
          desc: 'Abruptly cutting off audio oscillators creates harsh popping noises. Using exponentialRampToValueAtTime gently ramps the gain volume down to zero.',
          type: 'practice_audio',
          codeSnippet: 'gain.gain.setValueAtTime(0.2, ctx.currentTime);\ngain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);'
        },
        {
          title: 'Web Audio Architecture Quiz',
          tag: 'Audio DSP Quiz',
          desc: 'Review Web Audio synthesis mechanics.',
          type: 'quiz',
          quiz: {
            question: 'Why is procedural sound synthesis preferable to loading MP3 files for micro-interactions?',
            options: [
              'Zero network load, instant latency-free playback, and dynamic parameter pitch changes',
              'MP3 files are completely banned in modern browsers',
              'Procedural audio makes the computer screen brighter',
              'AudioContext does not require any CPU cycles'
            ],
            correctIndex: 0,
            explanation: 'Procedural synthesis generates sound waves mathematically on the fly, eliminating asset loading latency and reducing bundle sizes to 0KB.'
          }
        }
      ]
    }
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

  // ================= DUAL-PURPOSE TOOLTIP SYSTEM =================
  let tooltipElem = document.querySelector('.app-tooltip');
  if (!tooltipElem) {
    tooltipElem = document.createElement('div');
    tooltipElem.className = 'app-tooltip hidden';
    document.body.appendChild(tooltipElem);
  }

  Object.assign(tooltipElem.style, {
    position: 'fixed',
    zIndex: '9999999',
    pointerEvents: 'none',
    transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'left, top, transform, opacity',
    borderRadius: '10px',
    background: 'rgba(18, 12, 34, 0.94)',
    border: '1px solid rgba(157, 78, 221, 0.4)',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.6), 0 0 14px rgba(157, 78, 221, 0.25)',
    backdropFilter: 'blur(16px)',
    webkitBackdropFilter: 'blur(16px)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff'
  });

  let hoverShowTimer = null;
  let autoDismissTimer = null;
  let activeTooltipNode = null;
  let currentMouseX = 0;
  let currentMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
  }, { passive: true });

  function hideAppTooltip() {
    if (hoverShowTimer) { clearTimeout(hoverShowTimer); hoverShowTimer = null; }
    if (autoDismissTimer) { clearTimeout(autoDismissTimer); autoDismissTimer = null; }
    activeTooltipNode = null;
    tooltipElem.style.opacity = '0';
    tooltipElem.style.transform = 'translateY(5px) scale(0.96)';
    setTimeout(() => {
      if (!activeTooltipNode) tooltipElem.classList.add('hidden');
    }, 200);
  }

  function updateTooltipPosition(clientX, clientY) {
    const offset = 14;
    const padding = 12;

    const rect = tooltipElem.getBoundingClientRect();
    const width = rect.width || 200;
    const height = rect.height || 40;

    let targetX = clientX + offset;
    let targetY = clientY + offset;

    if (targetX + width > window.innerWidth - padding) {
      targetX = clientX - width - offset;
    }
    if (targetY + height > window.innerHeight - padding) {
      targetY = clientY - height - offset;
    }

    targetX = Math.max(padding, Math.min(targetX, window.innerWidth - width - padding));
    targetY = Math.max(padding, Math.min(targetY, window.innerHeight - height - padding));

    tooltipElem.style.left = `${Math.round(targetX)}px`;
    tooltipElem.style.top = `${Math.round(targetY)}px`;
  }

  const paletteComponentDocs = {
    button: { title: 'Action Button', desc: 'Interactive clickable button. Triggers JavaScript handlers, block stacks, or screen changes.', hint: 'Drag onto canvas or right-click to place' },
    label: { title: 'Text Label', desc: 'Typography layer for headers, sub-headings, or body notes with custom fonts and sizes.', hint: 'Drag onto canvas or right-click to place' },
    input: { title: 'Single-line Input', desc: 'Text field for collecting single-line user input, forms, and variables.', hint: 'Drag onto canvas or right-click to place' },
    textarea: { title: 'Multi-line Textarea', desc: 'Expanded text block for multi-line inputs, logs, descriptions, or comments.', hint: 'Drag onto canvas or right-click to place' },
    image: { title: 'Image Frame', desc: 'Renders remote URLs or SVG graphics with cover, contain, or fill cropping.', hint: 'Drag onto canvas or right-click to place' },
    toggle: { title: 'Toggle Switch', desc: 'Interactive switch flipping between true/false states on tap.', hint: 'Drag onto canvas or right-click to place' },
    slider: { title: 'Range Slider', desc: 'Linear scrubber for adjustable numbers between min and max bounds.', hint: 'Drag onto canvas or right-click to place' },
    progress: { title: 'Progress Bar', desc: 'Status indicator with a percentage fill bar for state or loading feedback.', hint: 'Drag onto canvas or right-click to place' },
    divider: { title: 'Layout Divider', desc: 'Visual accent rule to partition sections cleanly on your mobile layout.', hint: 'Drag onto canvas or right-click to place' },
    icon: { title: 'Emoji / Icon Badge', desc: 'Compact glyph or emoji badge with customizable shapes and glow highlights.', hint: 'Drag onto canvas or right-click to place' },
    card: { title: 'Container Card', desc: 'Frosted-glass background card with rounded corners to group layout elements.', hint: 'Drag onto canvas or right-click to place' }
  };

  function showStyledTooltip(html, durationSec = 3.5, minWidth = 160, maxWidth = 300) {
    tooltipElem.style.minWidth = `${minWidth}px`;
    tooltipElem.style.maxWidth = `${maxWidth}px`;
    tooltipElem.style.padding = '8px 12px';
    tooltipElem.innerHTML = html;

    tooltipElem.classList.remove('hidden');
    updateTooltipPosition(currentMouseX, currentMouseY);

    void tooltipElem.offsetWidth;
    tooltipElem.style.opacity = '1';
    tooltipElem.style.transform = 'translateY(0) scale(1)';

    const stayMs = Math.max(1.5, Math.min(10, durationSec)) * 1000;
    autoDismissTimer = setTimeout(() => {
      hideAppTooltip();
    }, stayMs);
  }

  function setupTooltips(node, model) {
    node._elementModel = model;

    node.addEventListener('mouseenter', () => {
      const live = node._elementModel || model;
      const customNotes = live.tooltip ? live.tooltip.trim() : '';

      if (isPreviewMode && !customNotes) return;

      hideAppTooltip();
      activeTooltipNode = node;

      hoverShowTimer = setTimeout(() => {
        if (activeTooltipNode !== node) return;

        let contentHtml = '';
        if (customNotes) {
          contentHtml = `<div style="font-size:0.8rem; line-height:1.45; color:#ffffff; font-weight:500;">${customNotes}</div>`;
        } else {
          contentHtml = `<div style="font-size:0.72rem; color:#aaa; font-style:italic;">No tooltip set. Add one in Inspector &rarr; Properties.</div>`;
        }

        const dur = parseFloat(live.tooltipDuration) || 3.5;
        showStyledTooltip(contentHtml, dur, 140, 260);
      }, 450);
    });

    node.addEventListener('mousemove', (e) => {
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;
      if (!tooltipElem.classList.contains('hidden') && activeTooltipNode === node) {
        updateTooltipPosition(currentMouseX, currentMouseY);
      }
    });

    node.addEventListener('mouseleave', hideAppTooltip);
    node.addEventListener('mousedown', hideAppTooltip);
  }

  function bindPaletteAndUiTooltips() {
    document.querySelectorAll('.draggable-card').forEach(card => {
      const type = card.dataset.type;
      const info = paletteComponentDocs[type];
      if (!info) return;

      card.addEventListener('mouseenter', () => {
        hideAppTooltip();
        activeTooltipNode = card;

        hoverShowTimer = setTimeout(() => {
          if (activeTooltipNode !== card) return;

          const html = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
              <span style="font-weight:700; font-size:0.82rem; color:#fff;">${info.title}</span>
              <span style="font-size:0.62rem; text-transform:uppercase; font-weight:700; padding:2px 5px; border-radius:4px; background:rgba(157,78,221,0.25); color:#d4a5ff; border:1px solid rgba(157,78,221,0.4);">Component</span>
            </div>
            <div style="font-size:0.74rem; line-height:1.42; color:rgba(255,255,255,0.85);">${info.desc}</div>
            <div style="margin-top:6px; font-size:0.68rem; color:#a29bfe; display:flex; align-items:center; gap:4px;">
              <span>🖐️</span> ${info.hint}
            </div>
          `;
          showStyledTooltip(html, 3.5, 220, 290);
        }, 350);
      });

      card.addEventListener('mousemove', (e) => {
        currentMouseX = e.clientX;
        currentMouseY = e.clientY;
        if (!tooltipElem.classList.contains('hidden') && activeTooltipNode === card) {
          updateTooltipPosition(currentMouseX, currentMouseY);
        }
      });

      card.addEventListener('mouseleave', hideAppTooltip);
      card.addEventListener('mousedown', hideAppTooltip);
    });

    document.querySelectorAll('[data-info]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        hideAppTooltip();
        activeTooltipNode = el;

        hoverShowTimer = setTimeout(() => {
          if (activeTooltipNode !== el) return;
          const title = el.getAttribute('data-title') || el.innerText.trim().slice(0, 20) || 'Control';
          const info = el.getAttribute('data-info');
          const hotkey = el.getAttribute('data-hotkey') || '';

          const html = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:3px;">
              <span style="font-weight:700; font-size:0.8rem; color:#fff;">${title}</span>
              <span style="font-size:0.62rem; text-transform:uppercase; font-weight:700; padding:1px 5px; border-radius:4px; background:rgba(255,255,255,0.1); color:#ccc;">Tool</span>
            </div>
            <div style="font-size:0.74rem; line-height:1.4; color:rgba(255,255,255,0.8);">${info}</div>
            ${hotkey ? `<div style="margin-top:5px; font-size:0.67rem; color:#a29bfe;">💡 ${hotkey}</div>` : ''}
          `;
          showStyledTooltip(html, 3.0, 180, 260);
        }, 400);
      });

      el.addEventListener('mousemove', (e) => {
        currentMouseX = e.clientX;
        currentMouseY = e.clientY;
        if (!tooltipElem.classList.contains('hidden') && activeTooltipNode === el) {
          updateTooltipPosition(currentMouseX, currentMouseY);
        }
      });

      el.addEventListener('mouseleave', hideAppTooltip);
      el.addEventListener('mousedown', hideAppTooltip);
    });
  }

  window.addEventListener('scroll', hideAppTooltip, { passive: true });
  window.addEventListener('blur', hideAppTooltip);

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
        if (dialogInputGroup) dialogInputGroup.classList.add('hidden');
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
        if (dialogInputGroup) dialogInputGroup.classList.add('hidden');
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
        if (dialogInputGroup) dialogInputGroup.classList.remove('hidden');
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
        if (dialogInputGroup) dialogInputGroup.classList.add('hidden');
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

    bindPaletteAndUiTooltips();
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
    bindPaletteAndUiTooltips();
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

  // ================= ADAPTIVE TARGET-AWARE CONTEXT MENU SYSTEM =================
  function showUniversalContextMenu(e, htmlContent, onReadyCallback) {
    if (!elementContextMenu) {
      elementContextMenu = document.createElement('div');
      elementContextMenu.id = 'elementContextMenu';
      elementContextMenu.className = 'context-menu hidden';
      document.body.appendChild(elementContextMenu);
    }

    elementContextMenu.innerHTML = htmlContent;

    const menuWidth = 220;
    const menuHeight = 360;
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

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const placedItem = e.target.closest('.placed-item');
    if (placedItem && placedItem.dataset.elementId) {
      const elId = placedItem.dataset.elementId;
      selectElement(elId);
      contextTargetElementId = elId;
      openElementContextMenu(e, elId);
      return;
    }

    const paletteItem = e.target.closest('.draggable-card');
    if (paletteItem && paletteItem.dataset.type) {
      openPaletteItemContextMenu(e, paletteItem.dataset.type);
      return;
    }

    const layerItem = e.target.closest('.layer-item');
    if (layerItem && layerItem.dataset.elementId) {
      openLayerTreeContextMenu(e, layerItem.dataset.elementId);
      return;
    }

    const pageItem = e.target.closest('.page-item');
    if (pageItem && pageItem.dataset.pageId) {
      openPageItemContextMenu(e, pageItem.dataset.pageId);
      return;
    }

    const projCard = e.target.closest('.project-card');
    if (projCard && projCard.dataset.projectId) {
      openProjectCardContextMenu(e, projCard.dataset.projectId);
      return;
    }

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

    openGlobalWorkspaceContextMenu(e);
  });

  function instantiateElement(type, text, x = 40, y = 80, w = 140, h = 44) {
    let defaultBg = '#7b2cbf';
    let defaultBorder = '#9d4edd';
    let defaultBorderWidth = 1;
    let defaultPadding = 8;
    let defaultShape = 'rounded';
    let defaultRadius = 10;
    let defaultIsChecked = false;
    let defaultCurrentVal = 50;

    if (type === 'label') {
      w = 160; h = 32; defaultBg = 'transparent'; defaultBorder = 'transparent'; defaultBorderWidth = 0; defaultPadding = 0;
    } else if (type === 'input') {
      w = 180; h = 40; defaultBg = 'rgba(255, 255, 255, 0.08)'; defaultBorder = 'rgba(255, 255, 255, 0.2)';
    } else if (type === 'textarea') {
      w = 200; h = 80; defaultBg = 'rgba(255, 255, 255, 0.08)'; defaultBorder = 'rgba(255, 255, 255, 0.2)';
    } else if (type === 'toggle') {
      w = 56; h = 30; defaultBg = 'transparent'; defaultBorder = 'transparent'; defaultBorderWidth = 0; defaultPadding = 0; defaultIsChecked = true;
    } else if (type === 'slider') {
      w = 180; h = 30; defaultBg = 'transparent'; defaultBorder = 'transparent'; defaultBorderWidth = 0; defaultPadding = 0;
    } else if (type === 'progress') {
      w = 200; h = 16; defaultBg = 'rgba(255, 255, 255, 0.1)'; defaultBorder = 'rgba(157, 78, 221, 0.3)'; defaultBorderWidth = 1; defaultRadius = 8; defaultCurrentVal = 65;
    } else if (type === 'divider') {
      w = 220; h = 10; defaultBg = 'transparent'; defaultBorder = '#9d4edd'; defaultBorderWidth = 0; defaultPadding = 0;
    } else if (type === 'icon') {
      w = 48; h = 48; defaultBg = 'rgba(157, 78, 221, 0.2)'; defaultBorder = '#9d4edd'; defaultShape = 'circle'; defaultRadius = 50;
    } else if (type === 'card') {
      w = 220; h = 120; defaultBg = 'rgba(255, 255, 255, 0.05)'; defaultBorder = 'rgba(255, 255, 255, 0.12)'; defaultPadding = 14;
    }

    return {
      id: 'el_' + Date.now().toString().slice(-4),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
      type: type,
      x: x,
      y: y,
      width: w,
      height: h,
      text: text,
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
      tooltip: '',
      tooltipDuration: 3.5,
      codeMode: 'blocks',
      customJs: '',
      logic: { event: 'click', actions: [] }
    };
  }

  function openPaletteItemContextMenu(e, type) {
    const doc = paletteComponentDocs[type] || { title: type.toUpperCase(), desc: '' };
    const menuHtml = `
      <div class="context-item" id="ctxPaletteAddCenter">🎯 Add to Canvas Center</div>
      <div class="context-item" id="ctxPaletteAddTop">↖️ Add to Canvas Top (0, 0)</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxPaletteInfo">ℹ️ View Component Docs</div>
      <div class="context-item" id="ctxPaletteCode">⚡ Create Script Template</div>
    `;

    showUniversalContextMenu(e, menuHtml, () => {
      document.getElementById('ctxPaletteAddCenter')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const centerX = canvas ? Math.max(10, Math.round((canvas.offsetWidth - 160) / 2)) : 60;
        const centerY = canvas ? Math.max(10, Math.round((canvas.offsetHeight - 48) / 2)) : 120;
        const newEl = instantiateElement(type, doc.title || 'New Item', centerX, centerY);
        page.elements.push(newEl);
        markDirty();
        selectElement(newEl.id);
        hideContextMenu();
      });

      document.getElementById('ctxPaletteAddTop')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const newEl = instantiateElement(type, doc.title || 'New Item', 20, 20);
        page.elements.push(newEl);
        markDirty();
        selectElement(newEl.id);
        hideContextMenu();
      });

      document.getElementById('ctxPaletteInfo')?.addEventListener('click', () => {
        hideContextMenu();
        AppLab.alert(`${doc.desc}\n\nDrag onto the canvas or right-click to place.`, doc.title, '🧩');
      });

      document.getElementById('ctxPaletteCode')?.addEventListener('click', () => {
        const page = getCurrentPage();
        const newEl = instantiateElement(type, doc.title || 'New Item', 40, 80);
        newEl.codeMode = 'realCode';
        newEl.customJs = `// ${type} event script\napp.showAlert('${doc.title} triggered!');\napp.playBeep();`;
        page.elements.push(newEl);
        markDirty();
        selectElement(newEl.id);
        hideContextMenu();
        switchStudioSubpage('code');
      });
    });
  }

  function openLayerTreeContextMenu(e, elId) {
    const page = getCurrentPage();
    const target = page.elements.find(i => i.id === elId);
    if (!target) return;

    selectElement(elId);

    const menuHtml = `
      <div class="context-item" id="ctxLayerRename">✏️ Rename Layer</div>
      <div class="context-item" id="ctxLayerDuplicate">📋 Duplicate Layer</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxLayerBringFront">🔼 Bring to Front</div>
      <div class="context-item" id="ctxLayerSendBack">🔽 Send to Back</div>
      <div class="context-item" id="ctxLayerToggleVis">👁️ Toggle Visibility</div>
      <div class="context-separator"></div>
      <div class="context-item ctx-danger" id="ctxLayerDelete">🗑️ Delete Layer</div>
    `;

    showUniversalContextMenu(e, menuHtml, () => {
      document.getElementById('ctxLayerRename')?.addEventListener('click', async () => {
        hideContextMenu();
        const newName = await AppLab.prompt('Enter layer name:', target.name, 'Rename Layer');
        if (newName && newName.trim()) {
          target.name = newName.trim();
          markDirty();
          renderLayersTree();
          buildInspector();
        }
      });

      document.getElementById('ctxLayerDuplicate')?.addEventListener('click', () => {
        const clone = JSON.parse(JSON.stringify(target));
        clone.id = 'el_' + Date.now().toString().slice(-4);
        clone.name = clone.name + ' (Copy)';
        clone.x += 15;
        clone.y += 15;
        page.elements.push(clone);
        markDirty();
        selectElement(clone.id);
        hideContextMenu();
      });

      document.getElementById('ctxLayerBringFront')?.addEventListener('click', () => {
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

      document.getElementById('ctxLayerSendBack')?.addEventListener('click', () => {
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

      document.getElementById('ctxLayerToggleVis')?.addEventListener('click', () => {
        target.opacity = (target.opacity === 0) ? 1 : 0;
        markDirty();
        renderCanvas();
        buildInspector();
        hideContextMenu();
      });

      document.getElementById('ctxLayerDelete')?.addEventListener('click', () => {
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

  function openPageItemContextMenu(e, pageId) {
    const page = currentProject.pages.find(p => p.id === pageId);
    if (!page) return;

    activeScreenId = pageId;
    renderPagesList();
    renderCanvas();

    const menuHtml = `
      <div class="context-item" id="ctxPageRename">✏️ Rename Screen</div>
      <div class="context-item" id="ctxPageDuplicate">📋 Duplicate Screen</div>
      <div class="context-separator"></div>
      <div class="context-item ctx-danger" id="ctxPageDelete">🗑️ Delete Screen</div>
    `;

    showUniversalContextMenu(e, menuHtml, () => {
      document.getElementById('ctxPageRename')?.addEventListener('click', async () => {
        hideContextMenu();
        const newName = await AppLab.prompt('Enter screen title:', page.name, 'Rename Screen');
        if (newName && newName.trim()) {
          page.name = newName.trim();
          markDirty();
          renderPagesList();
        }
      });

      document.getElementById('ctxPageDuplicate')?.addEventListener('click', () => {
        const clone = JSON.parse(JSON.stringify(page));
        clone.id = 'scr_' + Date.now().toString().slice(-4);
        clone.name = clone.name + ' (Copy)';
        currentProject.pages.push(clone);
        activeScreenId = clone.id;
        markDirty();
        renderPagesList();
        renderCanvas();
        hideContextMenu();
      });

      document.getElementById('ctxPageDelete')?.addEventListener('click', async () => {
        hideContextMenu();
        if (currentProject.pages.length <= 1) {
          AppLab.alert('You cannot delete the only screen in a project.', 'Action Prohibited', '⚠️');
          return;
        }
        const confirmed = await AppLab.confirm(`Delete screen "${page.name}" and all its layers?`, 'Delete Screen', '🗑️');
        if (confirmed) {
          currentProject.pages = currentProject.pages.filter(p => p.id !== pageId);
          activeScreenId = currentProject.pages[0].id;
          activeElementId = null;
          markDirty();
          renderPagesList();
          renderCanvas();
          renderLayersTree();
          buildInspector();
        }
      });
    });
  }

  function openElementContextMenu(e, elId) {
    const menuHtml = `
      <div class="context-item" id="ctxDuplicate">📋 Duplicate Element</div>
      <div class="context-item" id="ctxCopyStyle">🎨 Copy Style / Properties</div>
      <div class="context-item" id="ctxPasteStyle">🖌️ Paste Style / Properties</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxBringFront">🔼 Bring to Front</div>
      <div class="context-item" id="ctxSendBack">🔽 Send to Back</div>
      <div class="context-item" id="ctxLayerUp">⬆️ Step Layer Up (+1)</div>
      <div class="context-item" id="ctxLayerDown">⬇️ Step Layer Down (-1)</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxCenterH">↔️ Center Horizontally</div>
      <div class="context-item" id="ctxCenterV">↕️ Center Vertically</div>
      <div class="context-item" id="ctxCenterBoth">🎯 Center on Canvas</div>
      <div class="context-separator"></div>
      <div class="context-item" id="ctxPlayAnim">▶️ Play Animation Trigger</div>
      <div class="context-item" id="ctxOpenCode">⚡ Open in Code Lab</div>
      <div class="context-separator"></div>
      <div class="context-item ctx-danger" id="ctxDelete">🗑️ Delete Element</div>
    `;

    showUniversalContextMenu(e, menuHtml, () => {
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

      const addQuickElement = (type, text, w, h) => {
        const newEl = instantiateElement(type, text, contextClickPos.x, contextClickPos.y, w, h);
        getCurrentPage().elements.push(newEl);
        markDirty();
        selectElement(newEl.id);
        hideContextMenu();
      };

      document.getElementById('ctxAddButton')?.addEventListener('click', () => addQuickElement('button', 'Click Me', 140, 44));
      document.getElementById('ctxAddLabel')?.addEventListener('click', () => addQuickElement('label', 'Header Title', 160, 32));
      document.getElementById('ctxAddInput')?.addEventListener('click', () => addQuickElement('input', 'Enter text...', 180, 40));
      document.getElementById('ctxAddCard')?.addEventListener('click', () => addQuickElement('card', 'Container Card', 220, 120));

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
      <div class="context-item" id="ctxGlobalTutorials">📚 Tutorials & Academy</div>
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
          <label>Custom Creator Tooltip Note</label>
          <input type="text" class="control-input" id="propTooltip" value="${el.tooltip || ''}" placeholder="Note or prompt shown to your users on hover...">
        </div>

        <div class="control-group">
          <label>Tooltip Display Duration (Seconds)</label>
          <input type="number" step="0.5" min="1.5" max="10" class="control-input" id="propTooltipDur" value="${el.tooltipDuration || 3.5}">
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
      document.getElementById('propTooltip').oninput = (e) => {
        el.tooltip = e.target.value;
        const canvasNode = document.getElementById(el.id);
        if (canvasNode) canvasNode._elementModel = el;
        markDirty();
      };
      document.getElementById('propTooltipDur').oninput = (e) => {
        el.tooltipDuration = parseFloat(e.target.value) || 3.5;
        const canvasNode = document.getElementById(el.id);
        if (canvasNode) canvasNode._elementModel = el;
        markDirty();
      };

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

    // Shapes Tab
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

    // Effects Tab
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

    // Animations Tab
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

  // Code Lab Custom Selects & Blocks
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

  // Component Drag & Drop Palette
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
      const newEl = instantiateElement(
        type,
        `${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
        Math.max(10, e.clientX - rect.left - 40),
        Math.max(10, e.clientY - rect.top - 20)
      );

      getCurrentPage().elements.push(newEl);
      markDirty();
      selectElement(newEl.id);
    };
  }

  // Pages List & Layers Tree
  function renderPagesList() {
    if (!pagesList) return;
    pagesList.innerHTML = '';
    currentProject.pages.forEach(p => {
      const it = document.createElement('div');
      it.className = `page-item ${p.id === activeScreenId ? 'active' : ''}`;
      it.dataset.pageId = p.id;
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
      l.dataset.elementId = el.id;
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

  // ================= UPGRADED INTERACTIVE ACADEMY WORKSPACE =================
  function renderCourseWorkspace() {
    const trackMenuEl = document.getElementById('trackMenu');
    const courseStageEl = document.getElementById('courseStage');
    if (!trackMenuEl || !courseStageEl) return;

    trackMenuEl.innerHTML = `
      <div style="padding: 10px 14px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; color: #a29bfe;">Course Tracks</div>
      </div>
    `;

    courseTracks.forEach(track => {
      const item = document.createElement('div');
      item.className = `track-item ${track.id === activeTrackId ? 'active' : ''}`;
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap: 10px;">
          <span style="font-size: 1.25rem; line-height: 1.2;">${track.icon || '📘'}</span>
          <div style="flex:1; min-width:0;">
            <h4 style="margin:0 0 2px 0; font-size:0.86rem; font-weight:600; color:#fff;">${track.title}</h4>
            <span class="track-meta" style="font-size:0.7rem; color:rgba(255,255,255,0.6); display:block; line-height:1.3;">${track.pages.length} Chapters • ${track.desc}</span>
          </div>
        </div>
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

    const dotsHtml = track.pages.map((p, idx) => `
      <div class="page-dot ${idx === currentCoursePageIndex ? 'active' : ''}" data-page-idx="${idx}" style="cursor:pointer;" title="${p.title}"></div>
    `).join('');

    let interactiveHtml = '';

    if (page.type === 'practice_canvas') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Spatial Clamping Matrix</span>
            <span id="clampingReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">X: 90px | Bounds: [10, 260]</span>
          </div>
          <div id="canvasLabStage" style="position: relative; height: 110px; background: rgba(0,0,0,0.3); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
            <div id="canvasLabChip" style="position: absolute; left: 90px; top: 32px; padding: 8px 14px; background: linear-gradient(135deg, #7b2cbf, #9d4edd); border-radius: 8px; color: #fff; font-size: 0.78rem; font-weight: 600; box-shadow: 0 4px 14px rgba(157,78,221,0.4); transition: left 0.15s cubic-bezier(0.16, 1, 0.3, 1);">📦 Clamped Layer</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="moveChipFarLeft">⏮️ Min (0px)</button>
            <button class="btn-top" id="moveChipLeft">⬅️ Step Left (-30px)</button>
            <button class="btn-top" id="moveChipRight">Step Right (+30px) ➡️</button>
            <button class="btn-top" id="moveChipFarRight">Max (260px) ⏭️</button>
            <button class="btn-top" id="resetChipPos">Reset</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_viewport_scaler') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Viewport Frame Scaler</span>
            <span id="scalerReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Width: 380px (Phone)</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 120px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="scalerBox" style="width: 240px; height: 75px; background: linear-gradient(135deg, #00f2fe, #7b2cbf); border-radius: 10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.8rem; transition: width 0.3s ease;">📱 Adaptive Box</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top" id="scalePhoneBtn">📱 Phone (320px)</button>
            <button class="btn-top" id="scaleTabletBtn">📟 Tablet (480px)</button>
            <button class="btn-top" id="scaleDesktopBtn">💻 Desktop (600px)</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_aabb_collision') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 AABB Box Collision Matrix</span>
            <span id="collisionStatus" style="font-family: monospace; font-size: 0.75rem; background: rgba(46,213,115,0.2); border: 1px solid rgba(46,213,115,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">Status: No Intersection</span>
          </div>
          <div style="position:relative; height: 110px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 12px; overflow:hidden;">
            <div id="boxStatic" style="position:absolute; left: 180px; top: 25px; width: 80px; height: 60px; background: rgba(255,255,255,0.1); border: 2px dashed #aaa; border-radius: 6px; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:0.7rem;">Target</div>
            <div id="boxMovable" style="position:absolute; left: 30px; top: 25px; width: 80px; height: 60px; background: #7b2cbf; border: 2px solid #9d4edd; border-radius: 6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; font-weight:600; transition: left 0.1s ease;">Draggable</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top" id="moveBoxLeft">&larr; Move Left</button>
            <button class="btn-top" id="moveBoxRight">Move Right &rarr;</button>
            <button class="btn-top btn-primary" id="moveBoxIntersect">🎯 Snap to Intersect</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_zindex_stack') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Visual Layer Stack Reorder</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Z-Index Manager</span>
          </div>
          <div id="stackStage" style="position:relative; height: 110px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 12px; display:flex; align-items:center; justify-content:center;">
            <div id="layerA" style="position:absolute; width: 120px; height: 50px; background: #ff0077; border-radius: 8px; left: 160px; top: 30px; z-index: 1; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.75rem; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.4);">Layer A (Back)</div>
            <div id="layerB" style="position:absolute; width: 120px; height: 50px; background: #00f2fe; border-radius: 8px; left: 210px; top: 45px; z-index: 2; display:flex; align-items:center; justify-content:center; color:#000; font-size:0.75rem; font-weight:700; box-shadow:0 4px 12px rgba(0,0,0,0.4);">Layer B (Front)</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top btn-primary" id="bringATopBtn">🔼 Bring Layer A to Front</button>
            <button class="btn-top" id="bringBTopBtn">🔼 Bring Layer B to Front</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_shapes') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Shader Vector Contour Lab</span>
            <span id="shapeReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #d4a5ff;">filter: drop-shadow Active</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 140px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="courseShapeChip" style="width: 110px; height: 110px; background: linear-gradient(135deg, #7b2cbf, #ff007f); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); filter: drop-shadow(0 0 16px rgba(157,78,221,0.7)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.8rem; font-weight:700; text-align:center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);">💠 Diamond</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="shapePillBtn">💊 Capsule</button>
            <button class="btn-top" id="shapeDiamondBtn">💠 Diamond</button>
            <button class="btn-top" id="shapeHexagonBtn">⡡ Hexagon</button>
            <button class="btn-top" id="shapeCircleBtn">⚪ Circle</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_vertex_editor') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Polygon Vertex Customizer</span>
            <span id="vertexReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Top Point: 50%</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 120px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="vertexPolyBox" style="width: 90px; height: 90px; background: #9d4edd; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); box-shadow: 0 0 20px rgba(157,78,221,0.5); transition: clip-path 0.2s ease;"></div>
          </div>
          <div style="display: flex; gap: 12px; align-items: center; justify-content: center;">
            <label style="font-size: 0.75rem; color:#ccc;">Top Vertex X:</label>
            <input type="range" min="0" max="100" value="50" id="vertexTopSlider" style="accent-color: #9d4edd; width: 180px;">
          </div>
        </div>
      `;
    } else if (page.type === 'practice_radius_interpolator') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Border Radius Morph Lab</span>
            <span id="radiusReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #d4a5ff;">Radius: 16px</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 110px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="radiusMorphBox" style="width: 140px; height: 60px; background: linear-gradient(135deg, #7b2cbf, #2ed573); border-radius: 16px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.8rem; font-weight:600; transition: border-radius 0.2s ease;">Morph Box</div>
          </div>
          <div style="display: flex; gap: 12px; align-items: center; justify-content: center;">
            <input type="range" min="0" max="50" value="16" id="radiusSlider" style="accent-color: #2ed573; width: 220px;">
          </div>
        </div>
      `;
    } else if (page.type === 'practice_blocks') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Asynchronous Action Stack Dispatcher</span>
            <span id="blockLogReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Status: Standby</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 110px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="blockSimChip" style="padding: 12px 24px; background: #7b2cbf; border-radius: 10px; color: #fff; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease;">⏹️ Target Component Layer</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top btn-primary" id="runBlockSimBtn">▶️ Trigger 3-Stage Pipeline</button>
            <button class="btn-top" id="resetBlockSimBtn">Reset Layer</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_logic_builder') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Drag-and-Connect Pipeline Builder</span>
            <span id="builderStatus" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Pipeline: 3 Blocks Ready</span>
          </div>
          <div style="display:flex; gap: 8px; justify-content:center; align-items:center; height: 100px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px; padding: 0 10px;">
            <div style="padding:8px 12px; background:#2b1b4d; border:1px solid #9d4edd; border-radius:6px; color:#c77dff; font-size:0.75rem; font-weight:600;">1. On Click</div>
            <span style="color:#666;">&rarr;</span>
            <div style="padding:8px 12px; background:#2b1b4d; border:1px solid #9d4edd; border-radius:6px; color:#c77dff; font-size:0.75rem; font-weight:600;">2. If Active</div>
            <span style="color:#666;">&rarr;</span>
            <div style="padding:8px 12px; background:#00f2fe; border-radius:6px; color:#000; font-size:0.75rem; font-weight:700;">3. Show Alert</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top btn-primary" id="testPipelineBtn">⚡ Test Run Pipeline</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_conditional_branch') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 If/Else Variable Evaluator</span>
            <span id="branchResultTag" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">Branch: Success</span>
          </div>
          <div style="display:flex; justify-content:space-around; align-items:center; height: 100px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px; padding: 0 16px;">
            <div style="text-align:center;">
              <div style="font-size:0.7rem; color:#aaa; margin-bottom:4px;">Variable Score</div>
              <input type="number" id="branchScoreInput" value="75" class="control-input" style="width: 80px; text-align:center;">
            </div>
            <div id="branchOutputCard" style="padding: 10px 18px; background: rgba(46,213,115,0.2); border: 1px solid #2ed573; border-radius: 8px; color: #2ed573; font-weight:700; font-size:0.8rem;">
              Score > 50 &rarr; Success Branch
            </div>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_js') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Sandbox Code Virtual Machine</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #ff007f;">Interactive Scope</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 100px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="jsLabTarget" style="padding: 10px 22px; background: #7b2cbf; border-radius: 10px; color: #fff; font-size: 0.82rem; font-weight: 600; box-shadow: 0 0 16px rgba(157,78,221,0.3); transition: all 0.25s ease;">⚡ JavaScript Target Layer</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top btn-primary" id="runCourseJsBtn">▶️ Execute Sandbox Code</button>
            <button class="btn-top" id="resetCourseJsBtn">Reset Target</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_repl_console') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Live REPL Script Console</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Command Line</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 90px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="replTargetCard" style="padding: 10px 20px; background: #7b2cbf; border-radius: 8px; color: #fff; font-size: 0.8rem; font-weight: 600;">REPL Target Box</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            <input type="text" class="control-input" id="replCommandInput" value="element.style.backgroundColor = '#00f2fe'" style="max-width: 260px; font-family:monospace; font-size:0.75rem;">
            <button class="btn-top btn-primary" id="evalReplBtn">Run</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_math_runner') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Algorithm Formula Runner</span>
            <span id="mathResultBadge" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">Result: 7854</span>
          </div>
          <div style="display:flex; gap: 12px; align-items:center; justify-content:center; height: 90px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <span style="font-size:0.78rem; color:#ccc;">Radius (r):</span>
            <input type="number" id="mathRadiusInput" value="50" class="control-input" style="width: 70px; text-align:center;">
            <span style="font-size:0.78rem; color:#ccc;">Area = &pi; &times; r&sup2;</span>
          </div>
          <div style="display:flex; justify-content:center;">
            <button class="btn-top btn-primary" id="calcMathBtn">🧮 Compute Formula</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_binding') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Bidirectional State Mirror</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">Live Signal</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center; margin-bottom: 12px;">
            <input type="text" class="control-input" id="bindingInput" value="Interactive AppLab" style="max-width: 240px; padding: 8px 12px; font-size: 0.82rem;">
            <button class="btn-top" id="clearBindingInputBtn">Clear</button>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 90px; background: rgba(0,0,0,0.25); border-radius: 8px;">
            <div id="bindingTargetChip" style="padding: 10px 22px; background: rgba(255,255,255,0.08); border: 1px solid rgba(157,78,221,0.4); border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 600;">Interactive AppLab</div>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_color_sync') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Hex Color Theme Synchronizer</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Live CSS Binding</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 100px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="colorSyncCard" style="padding: 12px 24px; background: #7b2cbf; border-radius: 10px; color: #fff; font-size: 0.8rem; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">Themed Component Box</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            <input type="color" id="colorSyncPicker" value="#7b2cbf" style="width: 36px; height: 36px; border:none; background:none; cursor:pointer;">
            <input type="text" class="control-input" id="colorSyncText" value="#7b2cbf" style="width: 110px; font-family:monospace; text-align:center;">
          </div>
        </div>
      `;
    } else if (page.type === 'practice_slider_mirror') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Slider Progress Interpolator</span>
            <span id="sliderMirrorBadge" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #d4a5ff;">Value: 50%</span>
          </div>
          <div style="margin-bottom: 14px;">
            <input type="range" min="0" max="100" value="50" id="sliderMirrorRange" style="width: 100%; accent-color: #9d4edd;">
          </div>
          <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow:hidden;">
            <div id="sliderMirrorBar" style="width: 50%; height: 100%; background: linear-gradient(90deg, #7b2cbf, #00f2fe); transition: width 0.1s ease;"></div>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_perf') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Shader Convolution Blur Profiler</span>
            <span id="perfMetricTag" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #ff007f;">Shader Cost: High (~24px blur)</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 120px; background: radial-gradient(circle, #7b2cbf 0%, #0e0a1a 80%); border-radius: 8px; margin-bottom: 12px; position:relative; overflow:hidden;">
            <div style="position:absolute; color:rgba(255,255,255,0.15); font-size:2.5rem; font-weight:900;">GPU BACKGROUND</div>
            <div id="perfTargetChip" style="position:relative; z-index:2; padding: 14px 28px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-shadow: 0 8px 30px rgba(0,0,0,0.5); color: #fff; font-size: 0.85rem; font-weight: 700; transition: all 0.3s ease;">✨ Glass Shader (Convolution Active)</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="perfToggleQuality">✨ Quality Mode (Full Blur)</button>
            <button class="btn-top" id="perfToggleFast">⚡ Performance Mode (0ms Shader Overhead)</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_fps_stress') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 DOM Paint Stress Simulator</span>
            <span id="fpsReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(46,213,115,0.2); border: 1px solid rgba(46,213,115,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">FPS: 60 (Smooth)</span>
          </div>
          <div id="stressStage" style="position:relative; height: 100px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <div id="stressCounter" style="font-size: 1rem; font-weight:700; color:#fff; z-index:2;">Active Nodes: 1</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-top btn-primary" id="addStressNodesBtn">➕ Spawn 50 Glow Nodes</button>
            <button class="btn-top" id="clearStressNodesBtn">Clear All</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_anim') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Keyframe Keyer & Curve Tester</span>
            <span id="animCurveTag" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Curve: ease-in-out</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 120px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="courseAnimChip" class="anim-pulse" style="padding: 12px 24px; background: linear-gradient(135deg, #7b2cbf, #c77dff); border-radius: 10px; color: #fff; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 18px rgba(157,78,221,0.4); animation-duration: 1.5s; animation-iteration-count: infinite;">💓 Pulsing Keyframe</div>
          </div>
          <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top" id="animPulseBtn">💓 Pulse</button>
            <button class="btn-top" id="animBounceBtn">🏀 Bounce</button>
            <button class="btn-top" id="animFloatBtn">🎈 Float</button>
            <button class="btn-top" id="animSpinBtn">🔄 Spin</button>
            <button class="btn-top" id="animShakeBtn">📳 Shake</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_spring_tester') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Spring Physics Inspector</span>
            <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Cubic-Bezier Spring</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 110px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <button id="springTestBtn" style="padding: 12px 28px; background: #7b2cbf; border: none; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 16px rgba(157,78,221,0.4);">Click to Bounce</button>
          </div>
          <div style="text-align:center; font-size:0.74rem; color:#aaa;">Notice the tactile over-shoot and bounce physics on click.</div>
        </div>
      `;
    } else if (page.type === 'practice_audio') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Dual-Oscillator Interface Synth</span>
            <span id="audioStatusTag" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #2ed573;">AudioContext: Ready</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; height: 100px; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 12px;">
            <div id="audioVisualizerChip" style="padding: 12px 24px; background: #7b2cbf; border-radius: 10px; color: #fff; font-size: 0.85rem; font-weight: 600; box-shadow: 0 0 14px rgba(157,78,221,0.3); transition: all 0.2s ease;">🎵 Oscillator Standby</div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn-top btn-primary" id="playBeepToneBtn">🔊 440Hz Sine Beep</button>
            <button class="btn-top btn-primary" id="playChimeToneBtn">🔔 Two-Tone Chime (C5 &rarr; G5)</button>
            <button class="btn-top" id="playAlertToneBtn">⚠️ Descending Warning</button>
          </div>
        </div>
      `;
    } else if (page.type === 'practice_pitch_sweep') {
      interactiveHtml = `
        <div class="lab-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a29bfe;">🧪 Live Frequency Pitch Sweeper</span>
            <span id="pitchReadout" style="font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; color: #00f2fe;">Frequency: 440 Hz</span>
          </div>
          <div style="margin-bottom: 14px;">
            <input type="range" min="100" max="1200" value="440" id="pitchSlider" style="width: 100%; accent-color: #00f2fe;">
          </div>
          <div style="display:flex; justify-content:center;">
            <button class="btn-top btn-primary" id="playPitchSweepBtn">🔊 Play Continuous Pitch</button>
          </div>
        </div>
      `;
    } else if (page.type === 'quiz' && page.quiz) {
      const q = page.quiz;
      const optsHtml = q.options.map((opt, i) => `
        <button class="quiz-option-btn" data-opt-idx="${i}" style="width: 100%; text-align: left; padding: 10px 14px; margin-bottom: 8px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;">
          <span style="opacity: 0.6; font-weight: 700; margin-right: 6px;">[${String.fromCharCode(65 + i)}]</span> ${opt}
        </button>
      `).join('');

      interactiveHtml = `
        <div class="quiz-card" style="background: rgba(18, 12, 34, 0.7); border: 1px solid rgba(157,78,221,0.3); border-radius: 12px; padding: 18px; margin: 16px 0;">
          <div style="font-size: 0.9rem; font-weight: 600; color: #fff; margin-bottom: 14px; line-height: 1.4;">${q.question}</div>
          <div id="quizOptionsContainer">${optsHtml}</div>
          <div id="quizFeedbackBox" class="quiz-feedback" style="display:none; padding: 12px; border-radius: 8px; font-size: 0.8rem; line-height: 1.4; margin-top: 10px;">${q.explanation}</div>
        </div>
      `;
    }

    courseStageEl.innerHTML = `
      <div class="course-paper" style="max-width: 740px; margin: 0 auto;">
        <div class="course-paper-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.65rem; text-transform:uppercase; font-weight:700; padding:2px 8px; border-radius:4px; background:rgba(157,78,221,0.25); color:#d4a5ff; border:1px solid rgba(157,78,221,0.4);">${track.title}</span>
            <span style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Chapter ${currentCoursePageIndex + 1} of ${track.pages.length}</span>
          </div>
          <div class="page-dots" style="display:flex; gap:6px;">${dotsHtml}</div>
        </div>

        <div class="lesson-headline" style="margin-bottom: 16px;">
          <h2 style="margin: 0 0 6px 0; font-size: 1.3rem; font-weight: 700; color: #fff;">${page.title}</h2>
          <p style="margin: 0; font-size: 0.84rem; color: rgba(255,255,255,0.75); line-height: 1.5;">${page.desc}</p>
        </div>

        ${page.codeSnippet ? `
          <div class="code-snippet-box" style="position:relative; background: #080511; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
            <button class="btn-copy-code" data-code="${encodeURIComponent(page.codeSnippet)}" style="position:absolute; right:10px; top:10px; padding:3px 8px; font-size:0.68rem; background:rgba(255,255,255,0.1); border:none; border-radius:4px; color:#aaa; cursor:pointer;">Copy</button>
            <pre style="margin:0; font-family:'Fira Code', monospace; font-size:0.76rem; color:#a29bfe; overflow-x:auto; line-height:1.45;">${page.codeSnippet}</pre>
          </div>
        ` : ''}

        ${interactiveHtml}

        <div class="course-pagination-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top: 24px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
          <button class="btn-top" id="prevCoursePageBtn" ${currentCoursePageIndex === 0 ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>&larr; Previous</button>
          <button class="btn-top btn-primary" id="nextCoursePageBtn">
            ${currentCoursePageIndex === track.pages.length - 1 ? 'Open Studio Builder 🚀' : 'Next Chapter &rarr;'}
          </button>
        </div>
      </div>
    `;

    // Bind Pagination
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
        setTimeout(() => btn.innerText = 'Copy', 1500);
      };
    });

    // ================= UNIQUE LAB EVENT BINDINGS =================
    const chip = document.getElementById('canvasLabChip');
    const readout = document.getElementById('clampingReadout');
    if (chip) {
      const updateClampedPos = (val) => {
        const clamped = Math.max(10, Math.min(260, val));
        chip.style.left = `${clamped}px`;
        if (readout) readout.innerText = `X: ${clamped}px | Bounds: [10, 260]`;
      };
      document.getElementById('moveChipLeft')?.addEventListener('click', () => updateClampedPos((parseInt(chip.style.left) || 90) - 30));
      document.getElementById('moveChipRight')?.addEventListener('click', () => updateClampedPos((parseInt(chip.style.left) || 90) + 30));
      document.getElementById('moveChipFarLeft')?.addEventListener('click', () => updateClampedPos(0));
      document.getElementById('moveChipFarRight')?.addEventListener('click', () => updateClampedPos(300));
      document.getElementById('resetChipPos')?.addEventListener('click', () => updateClampedPos(90));
    }

    const scalerBox = document.getElementById('scalerBox');
    const scalerReadout = document.getElementById('scalerReadout');
    if (scalerBox) {
      document.getElementById('scalePhoneBtn')?.addEventListener('click', () => {
        scalerBox.style.width = '180px';
        if (scalerReadout) scalerReadout.innerText = 'Width: 320px (Phone)';
      });
      document.getElementById('scaleTabletBtn')?.addEventListener('click', () => {
        scalerBox.style.width = '260px';
        if (scalerReadout) scalerReadout.innerText = 'Width: 480px (Tablet)';
      });
      document.getElementById('scaleDesktopBtn')?.addEventListener('click', () => {
        scalerBox.style.width = '320px';
        if (scalerReadout) scalerReadout.innerText = 'Width: 600px (Desktop)';
      });
    }

    const boxMov = document.getElementById('boxMovable');
    const colStatus = document.getElementById('collisionStatus');
    if (boxMov) {
      let boxPos = 30;
      const evaluateCollision = (pos) => {
        boxMov.style.left = `${pos}px`;
        const isIntersecting = pos + 80 > 180;
        if (isIntersecting) {
          boxMov.style.background = '#ff0077';
          if (colStatus) {
            colStatus.innerText = 'Status: INTERSECTION DETECTED!';
            colStatus.style.background = 'rgba(255,71,87,0.2)';
            colStatus.style.borderColor = 'rgba(255,71,87,0.4)';
            colStatus.style.color = '#ff4757';
          }
        } else {
          boxMov.style.background = '#7b2cbf';
          if (colStatus) {
            colStatus.innerText = 'Status: No Intersection';
            colStatus.style.background = 'rgba(46,213,115,0.2)';
            colStatus.style.borderColor = 'rgba(46,213,115,0.4)';
            colStatus.style.color = '#2ed573';
          }
        }
      };
      document.getElementById('moveBoxLeft')?.addEventListener('click', () => { boxPos = Math.max(10, boxPos - 25); evaluateCollision(boxPos); });
      document.getElementById('moveBoxRight')?.addEventListener('click', () => { boxPos = Math.min(220, boxPos + 25); evaluateCollision(boxPos); });
      document.getElementById('moveBoxIntersect')?.addEventListener('click', () => { boxPos = 150; evaluateCollision(boxPos); });
    }

    const layerA = document.getElementById('layerA');
    const layerB = document.getElementById('layerB');
    if (layerA && layerB) {
      document.getElementById('bringATopBtn')?.addEventListener('click', () => {
        layerA.style.zIndex = '10';
        layerB.style.zIndex = '1';
        layerA.innerText = 'Layer A (Front)';
        layerB.innerText = 'Layer B (Back)';
      });
      document.getElementById('bringBTopBtn')?.addEventListener('click', () => {
        layerB.style.zIndex = '10';
        layerA.style.zIndex = '1';
        layerB.innerText = 'Layer B (Front)';
        layerA.innerText = 'Layer A (Back)';
      });
    }

    const shapeChip = document.getElementById('courseShapeChip');
    if (shapeChip) {
      document.getElementById('shapePillBtn')?.addEventListener('click', () => {
        shapeChip.style.clipPath = 'none';
        shapeChip.style.borderRadius = '9999px';
        shapeChip.style.boxShadow = '0 0 20px rgba(157,78,221,0.5)';
        shapeChip.style.filter = 'none';
        shapeChip.innerText = '💊 Capsule';
      });
      document.getElementById('shapeDiamondBtn')?.addEventListener('click', () => {
        shapeChip.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        shapeChip.style.borderRadius = '0';
        shapeChip.style.boxShadow = 'none';
        shapeChip.style.filter = 'drop-shadow(0 0 16px rgba(157,78,221,0.7))';
        shapeChip.innerText = '💠 Diamond';
      });
      document.getElementById('shapeHexagonBtn')?.addEventListener('click', () => {
        shapeChip.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        shapeChip.style.borderRadius = '0';
        shapeChip.style.boxShadow = 'none';
        shapeChip.style.filter = 'drop-shadow(0 0 16px rgba(157,78,221,0.7))';
        shapeChip.innerText = '⡡ Hexagon';
      });
      document.getElementById('shapeCircleBtn')?.addEventListener('click', () => {
        shapeChip.style.clipPath = 'none';
        shapeChip.style.borderRadius = '50%';
        shapeChip.style.boxShadow = '0 0 25px rgba(255,0,127,0.5)';
        shapeChip.style.filter = 'none';
        shapeChip.innerText = '⚪ Circle';
      });
    }

    const vertexBox = document.getElementById('vertexPolyBox');
    const vertexSlider = document.getElementById('vertexTopSlider');
    const vertexReadout = document.getElementById('vertexReadout');
    if (vertexBox && vertexSlider) {
      vertexSlider.oninput = (e) => {
        const val = e.target.value;
        vertexBox.style.clipPath = `polygon(${val}% 0%, 100% 50%, 50% 100%, 0% 50%)`;
        if (vertexReadout) vertexReadout.innerText = `Top Point: ${val}%`;
      };
    }

    const radiusBox = document.getElementById('radiusMorphBox');
    const radiusSlider = document.getElementById('radiusSlider');
    const radiusReadout = document.getElementById('radiusReadout');
    if (radiusBox && radiusSlider) {
      radiusSlider.oninput = (e) => {
        const val = e.target.value;
        radiusBox.style.borderRadius = `${val}px`;
        if (radiusReadout) radiusReadout.innerText = `Radius: ${val}px`;
      };
    }

    const blockSimChip = document.getElementById('blockSimChip');
    const blockLog = document.getElementById('blockLogReadout');
    if (blockSimChip) {
      document.getElementById('runBlockSimBtn')?.addEventListener('click', () => {
        if (blockLog) blockLog.innerText = 'Stage 1: Dispatching Color Mutation...';
        blockSimChip.innerText = '⚡ Step 1: Color Mutated (#00f2fe)';
        blockSimChip.style.backgroundColor = '#00f2fe';
        blockSimChip.style.color = '#000';
        blockSimChip.style.boxShadow = '0 0 25px rgba(0,242,254,0.6)';

        setTimeout(() => {
          if (blockLog) blockLog.innerText = 'Stage 2: Keyframe Trigger Fired...';
          blockSimChip.innerText = '✨ Step 2: Pulse Ambient Trigger';
          blockSimChip.className = 'anim-pulse';
        }, 600);

        setTimeout(() => {
          if (blockLog) blockLog.innerText = 'Stage 3: Pipeline Complete';
          blockSimChip.innerText = '✅ Step 3: Workflow Succeeded!';
        }, 1200);
      });

      document.getElementById('resetBlockSimBtn')?.addEventListener('click', () => {
        blockSimChip.className = '';
        blockSimChip.style.backgroundColor = '#7b2cbf';
        blockSimChip.style.color = '#fff';
        blockSimChip.style.boxShadow = 'none';
        blockSimChip.innerText = '⏹️ Target Component Layer';
        if (blockLog) blockLog.innerText = 'Status: Standby';
      });
    }

    document.getElementById('testPipelineBtn')?.addEventListener('click', () => {
      AppLab.alert('Pipeline executed successfully: 3 blocks evaluated without syntax error.', 'Pipeline Test', '⚡');
    });

    const scoreInput = document.getElementById('branchScoreInput');
    const branchCard = document.getElementById('branchOutputCard');
    if (scoreInput && branchCard) {
      scoreInput.oninput = (e) => {
        const score = parseInt(e.target.value) || 0;
        if (score > 50) {
          branchCard.style.color = '#2ed573';
          branchCard.style.borderColor = '#2ed573';
          branchCard.style.background = 'rgba(46,213,115,0.2)';
          branchCard.innerText = `Score (${score}) > 50 ➔ Success Branch`;
        } else {
          branchCard.style.color = '#ff4757';
          branchCard.style.borderColor = '#ff4757';
          branchCard.style.background = 'rgba(255,71,87,0.2)';
          branchCard.innerText = `Score (${score}) <= 50 ➔ Retry Branch`;
        }
      };
    }

    const jsTarget = document.getElementById('jsLabTarget');
    if (jsTarget) {
      document.getElementById('runCourseJsBtn')?.addEventListener('click', () => {
        jsTarget.style.backgroundColor = '#ff0077';
        jsTarget.style.color = '#fff';
        jsTarget.style.boxShadow = '0 0 25px rgba(255,0,119,0.7)';
        jsTarget.style.transform = 'scale(1.08) rotate(-3deg)';
        jsTarget.innerText = '⚡ Code Execution Success!';

        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
      });

      document.getElementById('resetCourseJsBtn')?.addEventListener('click', () => {
        jsTarget.style.backgroundColor = '#7b2cbf';
        jsTarget.style.boxShadow = '0 0 16px rgba(157,78,221,0.3)';
        jsTarget.style.transform = 'scale(1) rotate(0deg)';
        jsTarget.innerText = '⚡ JavaScript Target Layer';
      });
    }

    const replBox = document.getElementById('replTargetCard');
    const replInput = document.getElementById('replCommandInput');
    if (replBox && replInput) {
      document.getElementById('evalReplBtn')?.addEventListener('click', () => {
        try {
          const element = replBox;
          const cmd = replInput.value;
          const fn = new Function('element', cmd);
          fn(element);
          AppLab.alert('REPL Statement executed successfully!', 'Console Eval', '⚡');
        } catch (err) {
          AppLab.alert(err.message, 'Evaluation Error', '⚠️');
        }
      });
    }

    const mathRadiusInput = document.getElementById('mathRadiusInput');
    const mathBadge = document.getElementById('mathResultBadge');
    if (mathRadiusInput && mathBadge) {
      document.getElementById('calcMathBtn')?.addEventListener('click', () => {
        const r = parseFloat(mathRadiusInput.value) || 0;
        const area = Math.round(Math.PI * Math.pow(r, 2) * 100) / 100;
        mathBadge.innerText = `Result: ${area}`;
        AppLab.alert(`Computed circle area for radius ${r}: ${area}`, 'Algorithm Result', '🧮');
      });
    }

    const bindInput = document.getElementById('bindingInput');
    const bindTarget = document.getElementById('bindingTargetChip');
    if (bindInput && bindTarget) {
      bindInput.oninput = (e) => {
        bindTarget.innerText = e.target.value || '(Empty State)';
        bindTarget.classList.add('anim-scalePop');
        setTimeout(() => bindTarget.classList.remove('anim-scalePop'), 300);
      };
      document.getElementById('clearBindingInputBtn')?.addEventListener('click', () => {
        bindInput.value = '';
        bindTarget.innerText = '(Empty State)';
      });
    }

    const colorSyncCard = document.getElementById('colorSyncCard');
    const colorPicker = document.getElementById('colorSyncPicker');
    const colorText = document.getElementById('colorSyncText');
    if (colorSyncCard && colorPicker && colorText) {
      colorPicker.oninput = (e) => {
        const val = e.target.value;
        colorText.value = val;
        colorSyncCard.style.backgroundColor = val;
      };
      colorText.oninput = (e) => {
        const val = e.target.value;
        colorSyncCard.style.backgroundColor = val;
        if (/^#[0-9A-F]{6}$/i.test(val)) colorPicker.value = val;
      };
    }

    const sliderRange = document.getElementById('sliderMirrorRange');
    const sliderBar = document.getElementById('sliderMirrorBar');
    const sliderBadge = document.getElementById('sliderMirrorBadge');
    if (sliderRange && sliderBar) {
      sliderRange.oninput = (e) => {
        const val = e.target.value;
        sliderBar.style.width = `${val}%`;
        if (sliderBadge) sliderBadge.innerText = `Value: ${val}%`;
      };
    }

    const perfChip = document.getElementById('perfTargetChip');
    const perfTag = document.getElementById('perfMetricTag');
    if (perfChip) {
      document.getElementById('perfToggleQuality')?.addEventListener('click', () => {
        perfChip.style.backdropFilter = 'blur(24px)';
        perfChip.style.webkitBackdropFilter = 'blur(24px)';
        perfChip.style.background = 'rgba(255,255,255,0.12)';
        perfChip.innerText = '✨ Glass Shader (Convolution Active)';
        if (perfTag) {
          perfTag.innerText = 'Shader Cost: High (~24px blur)';
          perfTag.style.color = '#ff007f';
        }
      });
      document.getElementById('perfToggleFast')?.addEventListener('click', () => {
        perfChip.style.backdropFilter = 'none';
        perfChip.style.webkitBackdropFilter = 'none';
        perfChip.style.background = 'rgba(18, 12, 34, 0.95)';
        perfChip.innerText = '⚡ Performance Layer (Opaque)';
        if (perfTag) {
          perfTag.innerText = 'Shader Cost: Zero (Fastest FPS)';
          perfTag.style.color = '#2ed573';
        }
      });
    }

    const stressStage = document.getElementById('stressStage');
    const stressCounter = document.getElementById('stressCounter');
    const fpsReadout = document.getElementById('fpsReadout');
    if (stressStage) {
      let nodeCount = 1;
      document.getElementById('addStressNodesBtn')?.addEventListener('click', () => {
        nodeCount += 50;
        for (let i = 0; i < 50; i++) {
          const glow = document.createElement('div');
          glow.style.position = 'absolute';
          glow.style.width = '20px';
          glow.style.height = '20px';
          glow.style.background = '#00f2fe';
          glow.style.borderRadius = '50%';
          glow.style.boxShadow = '0 0 12px #00f2fe';
          glow.style.left = `${Math.random() * 90}%`;
          glow.style.top = `${Math.random() * 80}%`;
          stressStage.appendChild(glow);
        }
        if (stressCounter) stressCounter.innerText = `Active Nodes: ${nodeCount}`;
        if (nodeCount > 100 && fpsReadout) {
          fpsReadout.innerText = 'FPS: 42 (Moderate Load)';
          fpsReadout.style.color = '#ffa502';
        }
      });
      document.getElementById('clearStressNodesBtn')?.addEventListener('click', () => {
        nodeCount = 1;
        stressStage.querySelectorAll('div:not(#stressCounter)').forEach(n => n.remove());
        if (stressCounter) stressCounter.innerText = `Active Nodes: ${nodeCount}`;
        if (fpsReadout) {
          fpsReadout.innerText = 'FPS: 60 (Smooth)';
          fpsReadout.style.color = '#2ed573';
        }
      });
    }

    const animChip = document.getElementById('courseAnimChip');
    const animCurveTag = document.getElementById('animCurveTag');
    if (animChip) {
      const setChipAnim = (cls, label, curve) => {
        animChip.className = `anim-${cls}`;
        animChip.innerText = label;
        if (animCurveTag) animCurveTag.innerText = `Curve: ${curve}`;
      };
      document.getElementById('animPulseBtn')?.addEventListener('click', () => setChipAnim('pulse', '💓 Pulsing Keyframe', 'ease-in-out'));
      document.getElementById('animBounceBtn')?.addEventListener('click', () => setChipAnim('bounce', '🏀 Spring Easing', 'cubic-bezier(0.16, 1, 0.3, 1)'));
      document.getElementById('animFloatBtn')?.addEventListener('click', () => setChipAnim('float', '🎈 Floating Ambient', 'ease-in-out'));
      document.getElementById('animSpinBtn')?.addEventListener('click', () => setChipAnim('spin', '🔄 Constant Velocity', 'linear'));
      document.getElementById('animShakeBtn')?.addEventListener('click', () => setChipAnim('shake', '📳 High-Frequency Keyer', 'ease-in-out'));
    }

    const springBtn = document.getElementById('springTestBtn');
    if (springBtn) {
      springBtn.onclick = () => {
        springBtn.style.transform = 'scale(1.18)';
        setTimeout(() => springBtn.style.transform = 'scale(1)', 400);
      };
    }

    const audioChip = document.getElementById('audioVisualizerChip');
    const audioTag = document.getElementById('audioStatusTag');
    if (audioChip) {
      const synthesizeTone = (freq, duration, type = 'sine') => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.start();
          osc.stop(ctx.currentTime + duration);
          if (audioTag) audioTag.innerText = `Playing ${freq}Hz (${type})`;
        } catch (e) {}
      };

      document.getElementById('playBeepToneBtn')?.addEventListener('click', () => {
        audioChip.innerText = '🔊 Playing 440Hz Sine Tone...';
        audioChip.style.boxShadow = '0 0 25px rgba(0,242,254,0.7)';
        synthesizeTone(440, 0.25, 'sine');
        setTimeout(() => {
          audioChip.innerText = '🎵 Oscillator Standby';
          audioChip.style.boxShadow = '0 0 14px rgba(157,78,221,0.3)';
          if (audioTag) audioTag.innerText = 'AudioContext: Ready';
        }, 300);
      });

      document.getElementById('playChimeToneBtn')?.addEventListener('click', () => {
        audioChip.innerText = '🔔 Playing Chime (C5 -> G5)...';
        audioChip.style.boxShadow = '0 0 25px rgba(46,213,115,0.7)';
        synthesizeTone(523, 0.15, 'triangle');
        setTimeout(() => synthesizeTone(784, 0.25, 'triangle'), 120);
        setTimeout(() => {
          audioChip.innerText = '🎵 Oscillator Standby';
          audioChip.style.boxShadow = '0 0 14px rgba(157,78,221,0.3)';
          if (audioTag) audioTag.innerText = 'AudioContext: Ready';
        }, 450);
      });

      document.getElementById('playAlertToneBtn')?.addEventListener('click', () => {
        audioChip.innerText = '⚠️ Warning Sequence...';
        audioChip.style.boxShadow = '0 0 25px rgba(255,71,87,0.7)';
        synthesizeTone(600, 0.1, 'sawtooth');
        setTimeout(() => synthesizeTone(300, 0.2, 'sawtooth'), 110);
        setTimeout(() => {
          audioChip.innerText = '🎵 Oscillator Standby';
          audioChip.style.boxShadow = '0 0 14px rgba(157,78,221,0.3)';
          if (audioTag) audioTag.innerText = 'AudioContext: Ready';
        }, 400);
      });
    }

    const pitchSlider = document.getElementById('pitchSlider');
    const pitchReadout = document.getElementById('pitchReadout');
    if (pitchSlider) {
      pitchSlider.oninput = (e) => {
        if (pitchReadout) pitchReadout.innerText = `Frequency: ${e.target.value} Hz`;
      };
      document.getElementById('playPitchSweepBtn')?.addEventListener('click', () => {
        const f = parseInt(pitchSlider.value) || 440;
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
      });
    }

    // Quiz Submission Handlers
    if (page.type === 'quiz' && page.quiz) {
      const q = page.quiz;
      const feedbackBox = document.getElementById('quizFeedbackBox');
      document.querySelectorAll('.quiz-option-btn').forEach(optBtn => {
        optBtn.onclick = () => {
          const chosenIdx = parseInt(optBtn.dataset.optIdx);
          document.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.disabled = true;
            b.style.cursor = 'default';
          });

          if (feedbackBox) feedbackBox.style.display = 'block';

          if (chosenIdx === q.correctIndex) {
            optBtn.style.background = 'rgba(46, 213, 115, 0.2)';
            optBtn.style.borderColor = '#2ed573';
            if (feedbackBox) {
              feedbackBox.style.background = 'rgba(46, 213, 115, 0.15)';
              feedbackBox.style.border = '1px solid rgba(46, 213, 115, 0.3)';
              feedbackBox.style.color = '#2ed573';
              feedbackBox.innerHTML = `<strong>✅ Correct!</strong> ${q.explanation}`;
            }
          } else {
            optBtn.style.background = 'rgba(255, 71, 87, 0.2)';
            optBtn.style.borderColor = '#ff4757';
            const correctBtn = document.querySelector(`[data-opt-idx="${q.correctIndex}"]`);
            if (correctBtn) {
              correctBtn.style.background = 'rgba(46, 213, 115, 0.2)';
              correctBtn.style.borderColor = '#2ed573';
            }
            if (feedbackBox) {
              feedbackBox.style.background = 'rgba(255, 71, 87, 0.15)';
              feedbackBox.style.border = '1px solid rgba(255, 71, 87, 0.3)';
              feedbackBox.style.color = '#ff6b6b';
              feedbackBox.innerHTML = `<strong>❌ Incorrect.</strong> ${q.explanation}`;
            }
          }
        };
      });
    }
  }

  bindPaletteAndUiTooltips();

  // Initial Load
  switchMainView('homeView');
});
