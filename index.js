/* ============================================
   CODE EVOLUTION — MAIN APPLICATION
   ============================================ */

// ============================================
// SECTION 1 — SEED DATA
// ============================================

const SEED_DATA = {
    subjects: [
        {
            id: 'lld',
            name: 'Low-Level Design',
            icon: '🏗️',
            chapters: [
                {
                    id: 'solid-principles',
                    name: 'SOLID Principles',
                    lessons: [
                        {
                            id: 'parking-lot-srp-ocp',
                            title: 'Refactoring Parking Lot to obey SRP and OCP',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: Naive Monolithic Implementation',
                                    code: `# commit_1_naive.py
import datetime

class ParkingLot:
    """
    FAILURE SIGNALS:
    1. SRP Violation: This class handles spot management, pricing calculations,
       ticketing, AND payment processing. Multiple reasons to change!
    2. OCP Violation: Adding a new vehicle type or a new pricing model (e.g., Surge)
       forces us to modify \`calculate_fee()\` using hardcoded if/else statements.
    """
    def __init__(self):
        self.parked_vehicles = {}

    def park_vehicle(self, vehicle_type: str, license_plate: str):
        self.parked_vehicles[license_plate] = {
            "type": vehicle_type,
            "entry_time": datetime.datetime.now()
        }
        print(f"Issued ticket for {license_plate}")

    def exit_vehicle(self, license_plate: str, payment_type: str):
        record = self.parked_vehicles.get(license_plate)
        if not record:
            raise ValueError("Vehicle not found!")

        # --- SRP & OCP FAILURE 1: Hardcoded Pricing Logic ---
        hours = 2  # Hardcoded for simulation simplicity
        fee = 0
        if record["type"] == "CAR":
            fee = hours * 10
        elif record["type"] == "BIKE":
            fee = hours * 5
        elif record["type"] == "TRUCK":
            fee = hours * 20
        # PIVOT TEST FAIL: What if we add "SURGE_PRICING" or "ELECTRIC_CAR"?
        # We'd have to edit this core method and add more 'elif' branches!

        # --- SRP FAILURE 2: Payment Handling in Parking Core ---
        if payment_type == "CREDIT_CARD":
            print(f"Charged \${fee} via Credit Card Gateway")
        elif payment_type == "CASH":
            print(f"Collected \${fee} Cash at register")

        del self.parked_vehicles[license_plate]
        return fee`,
                                    architect_notes: `**SRP Analysis:** If the credit card API changes, \`ParkingLot\` changes. If the business changes hourly rate fees, \`ParkingLot\` changes. This is a monolithic "God Class" with multiple reasons to change.

**OCP Analysis (The Pivot Test):** An interviewer asks: *"What if we want surge pricing during weekends?"* With this design, you're forced to edit \`exit_vehicle()\`, directly violating OCP.

**Key Violations:**
- Hardcoded pricing logic tied to vehicle types via if/elif chains
- Payment processing mixed into parking domain logic
- No abstraction layer — everything is concrete`,
                                    pivot_question: `What happens when we add Surge Pricing? How would you modify this code to handle dynamic pricing without touching the core \`ParkingLot\` class?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Extract Interfaces & Apply Strategy Pattern',
                                    code: `# commit_2_refactored_srp_ocp.py
from abc import ABC, abstractmethod
import datetime

# --- OCP FIX: Define an abstraction for Pricing ---
class PricingStrategy(ABC):
    @abstractmethod
    def calculate_fee(self, hours: float) -> float:
        pass

# Concrete Pricing Strategies (Open for Extension)
class HourlyCarPricing(PricingStrategy):
    def calculate_fee(self, hours: float) -> float:
        return hours * 10.0

class HourlyBikePricing(PricingStrategy):
    def calculate_fee(self, hours: float) -> float:
        return hours * 5.0

class SurgePricingStrategy(PricingStrategy):
    """Passing the OCP Pivot Test: Adding weekend surge pricing without touching core code."""
    def calculate_fee(self, hours: float) -> float:
        return hours * 25.0  # Peak pricing rate


# --- SRP FIX: Dedicated Payment Processor ---
class PaymentProcessor:
    def process_payment(self, amount: float, payment_method: str) -> bool:
        print(f"Processing payment of \${amount} via {payment_method}")
        return True


# --- Cleaned Core Class ---
class ParkingLot:
    """
    SUCCESS SIGNALS:
    1. SRP: ParkingLot only manages vehicles and delegates pricing/payment.
    2. DIP: ParkingLot depends on the abstract \`PricingStrategy\`, not concrete rates.
    """
    def __init__(self, pricing_strategy: PricingStrategy, payment_processor: PaymentProcessor):
        # DIP: Constructor Dependency Injection
        self.pricing_strategy = pricing_strategy
        self.payment_processor = payment_processor
        self.parked_vehicles = {}

    def park_vehicle(self, license_plate: str):
        self.parked_vehicles[license_plate] = datetime.datetime.now()

    def exit_vehicle(self, license_plate: str, hours_parked: float, payment_method: str):
        if license_plate not in self.parked_vehicles:
            raise ValueError("Vehicle not found")

        # Clean delegation using interface polymorphism
        fee = self.pricing_strategy.calculate_fee(hours_parked)
        self.payment_processor.process_payment(fee, payment_method)

        del self.parked_vehicles[license_plate]
        return fee`,
                                    architect_notes: `**SRP Fix:** The \`ParkingLot\` class now only manages vehicle entry/exit — its single responsibility. Pricing is delegated to \`PricingStrategy\` implementations, and payment to \`PaymentProcessor\`.

**OCP Fix (Passing the Pivot Test):** Adding \`SurgePricingStrategy\` required zero changes to existing classes. We simply created a new class and injected it.

**DIP Applied:** \`ParkingLot.__init__()\` accepts abstract types via constructor injection. The class depends on abstractions, not concretions.

**Things to say in the interview:**
*"I've separated the pricing logic into a PricingStrategy interface. If business management changes our pricing model — for example, introducing weekend surge pricing — we simply introduce a new strategy class without modifying the ParkingLot core."*`,
                                    pivot_question: `How do we handle new vehicle types without breaking LSP? What if we need Electric Vehicle support with charging capabilities?`
                                },
                                {
                                    step: 3,
                                    title: 'Commit 3: Fixing LSP & ISP (Electric Charging Spots)',
                                    code: `# commit_3_final_lsp_isp.py
from abc import ABC, abstractmethod

# --- ISP FIX: Separate Interfaces for distinct capabilities ---
class Vehicle(ABC):
    @abstractmethod
    def get_license_plate(self) -> str:
        pass

class Chargeable(ABC):
    """ISP: Split into a dedicated interface so regular cars aren't forced
    to implement charging methods."""
    @abstractmethod
    def charge_battery(self):
        pass

# --- Polymorphic Classes complying with LSP ---
class RegularCar(Vehicle):
    def __init__(self, plate: str):
        self.plate = plate

    def get_license_plate(self) -> str:
        return self.plate

class ElectricCar(Vehicle, Chargeable):
    """
    LSP & ISP COMPLIANT:
    - ElectricCar can be substituted anywhere a standard Vehicle is expected.
    - Implements Chargeable without polluting the base Vehicle class contract.
    """
    def __init__(self, plate: str):
        self.plate = plate

    def get_license_plate(self) -> str:
        return self.plate

    def charge_battery(self):
        print(f"Charging EV vehicle {self.plate}...")


# Spot Abstraction avoiding LSP contract violations
class ParkingSpot(ABC):
    def __init__(self, spot_id: str):
        self.spot_id = spot_id
        self.is_occupied = False

    def assign_vehicle(self, vehicle: Vehicle):
        self.is_occupied = True

class ChargingSpot(ParkingSpot):
    """
    LSP Compliance: Extended functionality without breaking standard
    ParkingSpot expectations.
    """
    def assign_vehicle(self, vehicle: Vehicle):
        super().assign_vehicle(vehicle)
        if isinstance(vehicle, Chargeable):
            vehicle.charge_battery()`,
                                    architect_notes: `**ISP Fix:** Instead of cramming charging methods into the base \`Vehicle\` class (which would force \`RegularCar\` to implement unused methods), we extracted a separate \`Chargeable\` interface. This is Interface Segregation in action.

**LSP Compliance:** \`ElectricCar\` can be used anywhere a \`Vehicle\` is expected — it fulfills the full contract. The \`ChargingSpot\` extends \`ParkingSpot\` without breaking any parent class expectations.

**Key Design Decision:** Using Python's multiple inheritance (\`ElectricCar(Vehicle, Chargeable)\`) to compose capabilities cleanly. In Java/C#, this would be achieved with interfaces.`,
                                    pivot_question: `How would you handle a scenario where a ChargingSpot is assigned a non-electric vehicle? What patterns would you use to enforce type safety at the spot-assignment level?`
                                }
                            ],
                            summary: [
                                { principle: 'SRP', violation: 'ParkingLot calculated fees and processed payments directly.', fix: 'Extracted PricingStrategy and PaymentProcessor.' },
                                { principle: 'OCP', violation: 'Adding new rates required modifying if/elif branches in exit_vehicle().', fix: 'Added polymorphic strategy classes (SurgePricingStrategy).' },
                                { principle: 'LSP', violation: 'EV logic forced into base vehicle class, breaking expectations.', fix: 'Created ElectricCar cleanly fulfilling standard Vehicle contracts.' },
                                { principle: 'ISP', violation: 'Potentially bloated base interfaces.', fix: 'Extracted clean, single-purpose Chargeable interface.' },
                                { principle: 'DIP', violation: 'ParkingLot hardcoded pricing details.', fix: 'Injected PricingStrategy interface via ParkingLot.__init__().' }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'hld',
            name: 'High-Level Design',
            icon: '🌐',
            chapters: []
        },
        {
            id: 'leetcode',
            name: 'LeetCode',
            icon: '💻',
            chapters: []
        },
        {
            id: 'leadership',
            name: 'Leadership Principles',
            icon: '🎯',
            chapters: []
        }
    ]
};

// ============================================
// SECTION 2 — BASE PROMPT TEMPLATE
// ============================================

const BASE_PROMPT = `# Code Evolution Lesson Generator

Generate a step-by-step code evolution lesson for an interactive diff viewer. The lesson should show how code evolves from a naive implementation to a production-ready, well-designed solution.

## Topic
[Replace this with your specific topic, e.g., "Design a Rate Limiter using Token Bucket Algorithm" or "Implement Observer Pattern for Event System"]

## Requirements
1. Create 3-5 progressive commits showing code evolution
2. Start with a naive/monolithic implementation showing common design violations
3. Each subsequent commit should fix specific issues and apply design patterns
4. Include detailed architect notes analyzing trade-offs and SOLID compliance
5. Include interview-style pivot questions that test deep understanding

## Output Format
Respond with ONLY valid JSON (no markdown code fences) in this exact schema:

{
  "subject": "Low-Level Design",
  "chapter": "Chapter Name (e.g., SOLID Principles, Design Patterns, Concurrency)",
  "title": "Lesson Title",
  "language": "python",
  "commits": [
    {
      "step": 1,
      "title": "Commit 1: Description of this version",
      "code": "Complete, runnable code for this step with comments highlighting violations/fixes",
      "architect_notes": "Detailed analysis: What this code does well/poorly, SOLID violations identified, trade-offs. Use **bold** for emphasis and bullet points (- item) for lists.",
      "pivot_question": "A real interview question that tests understanding of the concepts in this step"
    }
  ],
  "summary": [
    {
      "principle": "Principle Name (e.g., SRP, OCP, DRY)",
      "violation": "What was wrong in the naive version",
      "fix": "How it was fixed in the refactored version"
    }
  ]
}

## Valid Subjects
- "Low-Level Design" — OOP, SOLID, Design Patterns
- "High-Level Design" — System Design, Distributed Systems, Scalability
- "LeetCode" — Algorithm patterns, Data Structures, Complexity Analysis
- "Leadership Principles" — Behavioral patterns, System thinking, Decision frameworks

## Guidelines
- Code must be complete and syntactically valid
- Comments in code should highlight specific violations (e.g., "# SRP VIOLATION: mixing concerns")
- Architect notes should reference specific classes, methods, or code sections
- Pivot questions should be the kind asked in FAANG interviews
- Each commit should build on the previous one (show evolution, not restart)
- Use **bold** for emphasis and \`backticks\` for code references in architect_notes`;

// ============================================
// SECTION 3 — STATE MANAGEMENT
// ============================================

const state = {
    subjects: [],
    currentLesson: null,
    currentStep: 0,
    commentaryOpen: true,
    navOpen: true,
    visitedSteps: new Set(),
};

function loadData() {
    // Always start with seed data
    state.subjects = JSON.parse(JSON.stringify(SEED_DATA.subjects));

    // Merge any user-imported lessons from localStorage
    try {
        const custom = JSON.parse(localStorage.getItem('codeEvolution_custom') || '[]');
        custom.forEach(lesson => addLessonToState(lesson));
    } catch (e) {
        console.warn('Failed to load custom lessons:', e);
    }
}

function addLessonToState(lessonData) {
    const subjectName = lessonData.subject || 'Low-Level Design';
    const chapterName = lessonData.chapter || 'General';

    // Find or create subject
    let subject = state.subjects.find(s => s.name === subjectName);
    if (!subject) {
        subject = {
            id: slugify(subjectName),
            name: subjectName,
            icon: getSubjectIcon(subjectName),
            chapters: []
        };
        state.subjects.push(subject);
    }

    // Find or create chapter
    let chapter = subject.chapters.find(c => c.name === chapterName);
    if (!chapter) {
        chapter = { id: slugify(chapterName), name: chapterName, lessons: [] };
        subject.chapters.push(chapter);
    }

    // Avoid duplicates
    if (!chapter.lessons.find(l => l.title === lessonData.title)) {
        chapter.lessons.push(lessonData);
    }
}

function saveCustomLesson(lessonData) {
    try {
        const custom = JSON.parse(localStorage.getItem('codeEvolution_custom') || '[]');
        custom.push(lessonData);
        localStorage.setItem('codeEvolution_custom', JSON.stringify(custom));
    } catch (e) {
        console.warn('Failed to save custom lesson:', e);
    }
}

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getSubjectIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('low') && n.includes('level')) return '🏗️';
    if (n.includes('high') && n.includes('level')) return '🌐';
    if (n.includes('leet') || n.includes('algorithm')) return '💻';
    if (n.includes('leader')) return '🎯';
    return '📚';
}

// ============================================
// SECTION 4 — MONACO EDITOR
// ============================================

let diffEditor = null;
let originalModel = null;
let modifiedModel = null;
let monacoReady = false;

function initMonaco() {
    if (typeof require === 'undefined') {
        console.error('Monaco AMD loader not available');
        return;
    }

    require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
    });

    require(['vs/editor/editor.main'], function () {
        // Custom dark theme matching our app aesthetic
        monaco.editor.defineTheme('evolution-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'ff7b72' },
                { token: 'string', foreground: 'a5d6ff' },
                { token: 'number', foreground: '79c0ff' },
                { token: 'type', foreground: 'ffa657' },
                { token: 'identifier', foreground: 'e6edf3' },
                { token: 'delimiter', foreground: '8b949e' },
            ],
            colors: {
                'editor.background': '#0d1117',
                'editor.foreground': '#e6edf3',
                'editorLineNumber.foreground': '#6e768166',
                'editorLineNumber.activeForeground': '#e6edf3',
                'editor.lineHighlightBackground': '#161b2280',
                'editor.selectionBackground': '#264f7844',
                'diffEditor.insertedTextBackground': '#2ea04322',
                'diffEditor.removedTextBackground': '#f8514922',
                'diffEditor.insertedLineBackground': '#2ea04315',
                'diffEditor.removedLineBackground': '#f8514915',
                'editorOverviewRuler.addedForeground': '#3fb95060',
                'editorOverviewRuler.deletedForeground': '#f8514960',
                'scrollbarSlider.background': '#8b949e20',
                'scrollbarSlider.hoverBackground': '#8b949e35',
            }
        });

        const container = document.getElementById('diff-container');

        diffEditor = monaco.editor.createDiffEditor(container, {
            theme: 'evolution-dark',
            readOnly: true,
            automaticLayout: true,
            renderSideBySide: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            renderWhitespace: 'none',
            contextmenu: false,
            scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
            },
            padding: { top: 12 },
            enableSplitViewResizing: true,
            ignoreTrimWhitespace: false,
        });

        monacoReady = true;

        // If a lesson was already selected before Monaco loaded
        if (state.currentLesson) {
            updateDiffView();
        }
    });
}

function updateDiffView() {
    if (!monacoReady || !diffEditor || !state.currentLesson) return;

    const commits = state.currentLesson.commits;
    const step = state.currentStep;

    const beforeCode = step > 0 ? commits[step - 1].code : '';
    const afterCode = commits[step].code;
    const language = state.currentLesson.language || 'python';

    // Dispose old models
    if (originalModel) originalModel.dispose();
    if (modifiedModel) modifiedModel.dispose();

    originalModel = monaco.editor.createModel(beforeCode, language);
    modifiedModel = monaco.editor.createModel(afterCode, language);

    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
    });
}

// ============================================
// SECTION 5 — NAVIGATION TREE
// ============================================

function renderNavTree() {
    const container = document.getElementById('nav-tree');
    container.innerHTML = '';

    state.subjects.forEach(subject => {
        const subjectItem = document.createElement('div');
        subjectItem.className = 'nav-item expanded';

        // Subject header
        const subjectHeader = createNavHeader(subject.icon, subject.name);
        subjectItem.appendChild(subjectHeader);

        // Children container
        const children = document.createElement('div');
        children.className = 'nav-children';

        if (subject.chapters.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'nav-empty';
            empty.textContent = 'No lessons yet — use Generate';
            children.appendChild(empty);
        }

        subject.chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'nav-item expanded';

            const chapterHeader = createNavHeader('📖', chapter.name);
            chapterItem.appendChild(chapterHeader);

            const chapterChildren = document.createElement('div');
            chapterChildren.className = 'nav-children';

            chapter.lessons.forEach(lesson => {
                const lessonItem = document.createElement('div');
                lessonItem.className = 'nav-item expanded';

                const lessonHeader = createNavHeader('📝', lesson.title);
                lessonHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectLesson(lesson, 0);
                });
                lessonItem.appendChild(lessonHeader);

                // Commit timeline
                const timeline = document.createElement('div');
                timeline.className = 'commit-timeline nav-children';

                lesson.commits.forEach((commit, idx) => {
                    const node = document.createElement('button');
                    node.className = 'commit-node';
                    node.dataset.lessonId = lesson.id || lesson.title;
                    node.dataset.step = idx;

                    node.innerHTML = `
                        <span class="commit-dot"></span>
                        <span class="commit-label">${escapeHtml(commit.title)}</span>
                    `;

                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectLesson(lesson, idx);
                    });

                    timeline.appendChild(node);
                });

                lessonItem.appendChild(timeline);
                chapterChildren.appendChild(lessonItem);
            });

            chapterItem.appendChild(chapterChildren);
            children.appendChild(chapterItem);
        });

        subjectItem.appendChild(children);
        container.appendChild(subjectItem);
    });

    updateActiveNavStates();
}

function createNavHeader(icon, label) {
    const header = document.createElement('div');
    header.className = 'nav-item-header';
    header.innerHTML = `
        <span class="nav-chevron">▸</span>
        <span class="nav-icon">${icon}</span>
        <span class="nav-label">${escapeHtml(label)}</span>
    `;

    header.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = header.parentElement;
        item.classList.toggle('expanded');
    });

    return header;
}

function updateActiveNavStates() {
    // Clear all active states
    document.querySelectorAll('.commit-node').forEach(node => {
        node.classList.remove('active');
        node.classList.remove('visited');
    });

    if (!state.currentLesson) return;

    const lessonId = state.currentLesson.id || state.currentLesson.title;
    document.querySelectorAll(`.commit-node`).forEach(node => {
        if (node.dataset.lessonId === lessonId) {
            const step = parseInt(node.dataset.step);
            if (step === state.currentStep) {
                node.classList.add('active');
            } else if (state.visitedSteps.has(`${lessonId}-${step}`)) {
                node.classList.add('visited');
            }
        }
    });
}

// ============================================
// SECTION 6 — LESSON SELECTION & NAVIGATION
// ============================================

function selectLesson(lesson, stepIndex = 0) {
    state.currentLesson = lesson;
    state.currentStep = stepIndex;

    const lessonId = lesson.id || lesson.title;
    state.visitedSteps.add(`${lessonId}-${stepIndex}`);

    // Show workspace, hide empty state
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('diff-container').style.display = '';
    document.getElementById('commit-badge').classList.remove('hidden');
    document.getElementById('diff-labels').classList.remove('hidden');
    document.getElementById('scrubber-bar').classList.remove('hidden');

    updateAll();
}

function navigateStep(step) {
    if (!state.currentLesson) return;
    const maxStep = state.currentLesson.commits.length - 1;
    const newStep = Math.max(0, Math.min(step, maxStep));
    if (newStep === state.currentStep) return;

    state.currentStep = newStep;
    const lessonId = state.currentLesson.id || state.currentLesson.title;
    state.visitedSteps.add(`${lessonId}-${newStep}`);

    updateAll();
}

function updateAll() {
    updateDiffView();
    updateWorkspaceHeader();
    updateCommentary();
    updateScrubber();
    updateActiveNavStates();
}

// ============================================
// SECTION 7 — WORKSPACE HEADER
// ============================================

function updateWorkspaceHeader() {
    if (!state.currentLesson) return;

    const commit = state.currentLesson.commits[state.currentStep];
    document.getElementById('commit-step-badge').textContent = commit.step;
    document.getElementById('commit-title').textContent = commit.title;
}

// ============================================
// SECTION 8 — COMMENTARY PANEL
// ============================================

function updateCommentary() {
    if (!state.currentLesson) return;

    const commit = state.currentLesson.commits[state.currentStep];

    // Architect Notes
    document.getElementById('architect-notes').innerHTML = `
        <div class="notes-card">
            <div class="card-header">
                <span>📋</span> Architect's Notes
            </div>
            <div class="card-body">${renderMarkdown(commit.architect_notes)}</div>
        </div>
    `;

    // Pivot Question
    document.getElementById('pivot-question').innerHTML = `
        <div class="pivot-card">
            <div class="card-header">
                <span>🎯</span> Interview Pivot
            </div>
            <div class="card-body">${renderMarkdown(commit.pivot_question)}</div>
        </div>
    `;

    // Summary (only on last commit)
    const summaryEl = document.getElementById('lesson-summary');
    if (state.currentStep === state.currentLesson.commits.length - 1 && state.currentLesson.summary) {
        const rows = state.currentLesson.summary.map(s => `
            <tr>
                <td>${escapeHtml(s.principle)}</td>
                <td>${escapeHtml(s.violation)}</td>
                <td>${escapeHtml(s.fix)}</td>
            </tr>
        `).join('');

        summaryEl.innerHTML = `
            <div class="summary-card">
                <div class="card-header">
                    <span>📊</span> Refactoring Summary
                </div>
                <div class="card-body">
                    <table class="summary-table">
                        <thead><tr><th>Principle</th><th>Violation</th><th>Fix</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        summaryEl.innerHTML = '';
    }
}

// ============================================
// SECTION 9 — SCRUBBER BAR
// ============================================

function renderScrubber() {
    if (!state.currentLesson) return;

    const commits = state.currentLesson.commits;
    const nodesContainer = document.getElementById('scrubber-nodes');
    nodesContainer.innerHTML = '';

    commits.forEach((commit, idx) => {
        const node = document.createElement('button');
        node.className = 'scrubber-node';
        node.dataset.step = idx;
        node.title = commit.title;

        // Shorten label: "Commit 1: Naive..." → show the short title
        const shortLabel = commit.title.replace(/^Commit \d+:\s*/, '');

        node.innerHTML = `
            <span class="scrubber-dot"></span>
            <span class="scrubber-node-label">${escapeHtml(shortLabel)}</span>
        `;

        node.addEventListener('click', () => navigateStep(idx));
        nodesContainer.appendChild(node);
    });

    updateScrubber();
}

function updateScrubber() {
    if (!state.currentLesson) return;

    const commits = state.currentLesson.commits;
    const totalSteps = commits.length;
    const step = state.currentStep;

    // Update nodes
    document.querySelectorAll('.scrubber-node').forEach(node => {
        const nodeStep = parseInt(node.dataset.step);
        node.classList.toggle('active', nodeStep === step);

        const lessonId = state.currentLesson.id || state.currentLesson.title;
        node.classList.toggle('visited', nodeStep !== step && state.visitedSteps.has(`${lessonId}-${nodeStep}`));
    });

    // Update progress line fill
    const fill = document.getElementById('scrubber-line-fill');
    const pct = totalSteps > 1 ? (step / (totalSteps - 1)) * 100 : 0;
    fill.style.width = `calc(${pct}% - ${pct > 0 ? 0 : 0}px)`;

    // Update counter
    document.getElementById('current-step-display').textContent = step + 1;
    document.getElementById('total-steps-display').textContent = totalSteps;

    // Update arrow buttons
    document.getElementById('scrubber-prev').disabled = step === 0;
    document.getElementById('scrubber-next').disabled = step === totalSteps - 1;
}

// ============================================
// SECTION 10 — PROMPT GENERATOR MODAL
// ============================================

function initModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('prompt-modal');
    const closeBtn = document.getElementById('modal-close');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-prompt-btn');
    const importBtn = document.getElementById('import-btn');

    // Show prompt preview
    document.getElementById('prompt-preview').textContent = BASE_PROMPT;

    // Open modal
    generateBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        document.getElementById('json-input').value = '';
        document.getElementById('import-status').textContent = '';
        document.getElementById('import-status').className = 'import-status';
    });

    // Close modal
    closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
    });

    // Copy prompt
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(BASE_PROMPT).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Copied!</span>
            `;
            copyBtn.classList.add('success');
            showToast('✅', 'Prompt copied to clipboard');
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('success');
            }, 2000);
        }).catch(() => {
            showToast('⚠️', 'Failed to copy — try selecting text manually');
        });
    });

    // Import lesson
    importBtn.addEventListener('click', () => {
        const statusEl = document.getElementById('import-status');
        const input = document.getElementById('json-input').value.trim();

        if (!input) {
            statusEl.textContent = 'Please paste JSON first.';
            statusEl.className = 'import-status error';
            return;
        }

        try {
            // Try to extract JSON from markdown code fences if present
            let jsonStr = input;
            const fenceMatch = input.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (fenceMatch) {
                jsonStr = fenceMatch[1].trim();
            }

            const data = JSON.parse(jsonStr);

            // Validate required fields
            if (!data.title || !data.commits || !Array.isArray(data.commits) || data.commits.length === 0) {
                throw new Error('Missing required fields: title, commits (array with at least 1 item)');
            }

            // Validate each commit
            data.commits.forEach((c, i) => {
                if (!c.code || !c.title) {
                    throw new Error(`Commit ${i + 1} missing required fields: title, code`);
                }
                if (!c.step) c.step = i + 1;
                if (!c.architect_notes) c.architect_notes = '';
                if (!c.pivot_question) c.pivot_question = '';
            });

            // Set defaults
            if (!data.id) data.id = slugify(data.title);
            if (!data.subject) data.subject = 'Low-Level Design';
            if (!data.chapter) data.chapter = 'General';
            if (!data.language) data.language = 'python';
            if (!data.summary) data.summary = [];

            // Add to state and save
            addLessonToState(data);
            saveCustomLesson(data);
            renderNavTree();
            selectLesson(data, 0);
            renderScrubber();

            statusEl.textContent = '✓ Lesson imported successfully!';
            statusEl.className = 'import-status success';
            showToast('🎉', `Imported: ${data.title}`);

            // Close modal after a moment
            setTimeout(() => {
                document.getElementById('modal-overlay').classList.add('hidden');
            }, 1200);

        } catch (e) {
            statusEl.textContent = `Error: ${e.message}`;
            statusEl.className = 'import-status error';
            showToast('❌', 'Import failed — check your JSON format');
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    });
}

// ============================================
// SECTION 11 — TOAST NOTIFICATIONS
// ============================================

function showToast(icon, message, duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// SECTION 12 — TOGGLE PANELS & RESIZE
// ============================================

function initPanelToggles() {
    // Nav toggle
    document.getElementById('toggle-nav').addEventListener('click', () => {
        document.body.classList.toggle('nav-collapsed');
        state.navOpen = !state.navOpen;
    });

    // Commentary toggle
    document.getElementById('toggle-commentary').addEventListener('click', () => {
        document.body.classList.toggle('commentary-collapsed');
        state.commentaryOpen = !state.commentaryOpen;
    });

    // Nav resize handle
    const handle = document.getElementById('nav-resize-handle');
    const nav = document.getElementById('nav-panel');
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        handle.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        nav.style.width = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ============================================
// SECTION 13 — KEYBOARD NAVIGATION
// ============================================

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Don't capture when typing in inputs
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        if (document.querySelector('.modal-overlay:not(.hidden)')) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                navigateStep(state.currentStep + 1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                navigateStep(state.currentStep - 1);
                break;
            case 'Home':
                e.preventDefault();
                navigateStep(0);
                break;
            case 'End':
                e.preventDefault();
                if (state.currentLesson) {
                    navigateStep(state.currentLesson.commits.length - 1);
                }
                break;
        }
    });
}

// ============================================
// SECTION 14 — SCRUBBER ARROW BUTTONS
// ============================================

function initScrubberButtons() {
    document.getElementById('scrubber-prev').addEventListener('click', () => {
        navigateStep(state.currentStep - 1);
    });

    document.getElementById('scrubber-next').addEventListener('click', () => {
        navigateStep(state.currentStep + 1);
    });
}

// ============================================
// SECTION 15 — UTILITIES
// ============================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderMarkdown(text) {
    if (!text) return '';

    let html = escapeHtml(text);

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code: `text`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Unordered list items: - item
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Clean up nested <ul> tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs: double newlines
    html = html.split(/\n\n+/).map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<ul>') || p.startsWith('<li>')) return p;
        return `<p>${p}</p>`;
    }).join('');

    // Single newlines within paragraphs
    html = html.replace(/([^>])\n([^<])/g, '$1<br>$2');

    return html;
}

// ============================================
// SECTION 16 — FIND FIRST LESSON
// ============================================

function findFirstLesson() {
    for (const subject of state.subjects) {
        for (const chapter of subject.chapters) {
            if (chapter.lessons.length > 0) {
                return chapter.lessons[0];
            }
        }
    }
    return null;
}

// ============================================
// SECTION 17 — INITIALIZATION
// ============================================

function init() {
    loadData();
    renderNavTree();
    initPanelToggles();
    initModal();
    initKeyboard();
    initScrubberButtons();
    initMonaco();

    // Auto-select first lesson
    const first = findFirstLesson();
    if (first) {
        selectLesson(first, 0);
        renderScrubber();
    }
}

document.addEventListener('DOMContentLoaded', init);
