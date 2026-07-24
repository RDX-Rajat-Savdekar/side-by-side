import { Subject } from '../types/lesson';
import { AMAZON_MOST_ASKED_CHAPTER } from './rdxMostAskedData';
import { AMAZON_BROADER_CHAPTER } from './rdxBroaderData';

export const RDX_SUBJECT: Subject = {
  id: 'rdx-notes',
  name: 'RDX Notes (Amazon LLD)',
  icon: '⚡',
  chapters: [
    AMAZON_MOST_ASKED_CHAPTER,
    AMAZON_BROADER_CHAPTER,
    {
      id: 'amazon-lld-playbook',
      name: 'Amazon LLD Playbook & Decision Tree',
      lessons: [
        {
          id: 'rdx-7-step-playbook',
          title: 'The 7-Step LLD Interview Playbook (Weak Hire -> Strong Hire)',
          language: 'python',
          commits: [
            {
              step: 1,
              title: 'Commit 1: Naive Candidate — Instant Coding (Weak Hire Signal)',
              code: `# rdx_step1_naive_god_class.py
# WEAK HIRE SIGNAL: Candidate started coding in 30 seconds without asking clarifying questions.
# Handles Amazon Locker System with a Monolithic God Class.

import datetime

class AmazonLockerSystem:
    """
    AMAZON RUBRIC FAILURE SIGNALS:
    1. Failure Mode 2: Coding before asking requirements.
    2. Failure Mode 1: Monolithic God Class (Handles lockers, packages, OTP generation, payment & notifications).
    3. Failure Mode 3: If/Else Hell (OCP Violation when size or locker types change).
    """
    def __init__(self):
        self.lockers = {}  # locker_id -> details
        self.packages = {} # package_id -> details

    def process_delivery(self, package_id: str, package_size: str, customer_email: str):
        # HARDCODED locker matching logic (OCP Failure)
        assigned_locker = None
        if package_size == "SMALL":
            assigned_locker = "Locker_S_1"
        elif package_size == "MEDIUM":
            assigned_locker = "Locker_M_1"
        elif package_size == "LARGE":
            assigned_locker = "Locker_L_1"
        # PIVOT FAIL: What if we add "REFRIGERATED" or "OVERSIZED"?

        # HARDCODED OTP generation & notification mixed into locker core (SRP Failure)
        otp = hash(package_id + str(datetime.datetime.now())) % 1000000
        print(f"Sending email to {customer_email} with OTP: {otp}")

        self.lockers[assigned_locker] = {"status": "OCCUPIED", "package_id": package_id, "otp": otp}
        return assigned_locker

    def pickup_package(self, locker_id: str, entered_otp: int):
        locker = self.lockers.get(locker_id)
        if not locker:
            raise ValueError("Locker not found")
        if locker["otp"] != entered_otp:
            return False

        locker["status"] = "EMPTY"
        print(f"Locker {locker_id} opened.")
        return True`,
              architect_notes: `**RDX Amazon Evaluation Rubric — Commit 1 Analysis:**

- **[Requirement Gathering Axis] ❌ FAIL:** Candidate started writing code within 30 seconds. Missed non-functional requirements (concurrency, expiration policies, locker sizes).
- **[SOLID Adherence] ❌ FAIL (SRP & OCP):** \`AmazonLockerSystem\` is a monolithic God Class handling compartment allocation, OTP generation, SMTP notifications, and state management.
- **[Extensibility] ❌ FAIL:** Adding a new locker type (e.g. Refrigerated or Oversized) requires editing core \`process_delivery()\` if/elif chains.

**What the Interviewer is Thinking:**
*"This candidate writes code like it's a LeetCode problem. In production, this system will collapse next quarter when the business team introduces refrigerated lockers."*`,
              pivot_question: `The interviewer asks: "What if Amazon Locker introduces Refrigerated Compartments for grocery deliveries and Surge Pricing for peak holiday storage?" How does this code handle that?`,
              mermaid: `classDiagram
    class AmazonLockerSystem {
        +dict lockers
        +dict packages
        +process_delivery(pkg_id, size, email)
        +pickup_package(locker_id, otp)
    }
    note for AmazonLockerSystem "God Class violating SRP, OCP & Dive Deep LP"
`
            },
            {
              step: 2,
              title: 'Commit 2: Mid-Level Candidate — Entity Decomposition & Strategy (Hire Signal)',
              code: `# rdx_step2_refactored_entities.py
# HIRE SIGNAL: Entities decomposed, interfaces defined for allocation strategies.

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional
import datetime

class CompartmentSize(Enum):
    SMALL = 1
    MEDIUM = 2
    LARGE = 3
    EXTRA_LARGE = 4

class Package:
    def __init__(self, package_id: str, size: CompartmentSize):
        self.package_id = package_id
        self.size = size

class Compartment:
    def __init__(self, compartment_id: str, size: CompartmentSize):
        self.compartment_id = compartment_id
        self.size = size
        self.is_occupied = False
        self.current_package: Optional[Package] = None

# --- OCP FIX: Allocation Strategy Interface ---
class AllocationStrategy(ABC):
    @abstractmethod
    def find_compartment(self, package: Package, compartments: List[Compartment]) -> Optional[Compartment]:
        pass

class FitExactSizeStrategy(AllocationStrategy):
    """Assigns smallest available compartment that fits the package."""
    def find_compartment(self, package: Package, compartments: List[Compartment]) -> Optional[Compartment]:
        for comp in compartments:
            if not comp.is_occupied and comp.size.value >= package.size.value:
                return comp
        return None

# --- SRP FIX: Dedicated Notification Service Interface ---
class NotificationService(ABC):
    @abstractmethod
    def send_otp(self, recipient: str, otp: str):
        pass

class EmailNotification(NotificationService):
    def send_otp(self, recipient: str, otp: str):
        print(f"[EMAIL] Sent OTP {otp} to {recipient}")

class LockerSystem:
    def __init__(self, compartments: List[Compartment], allocation_strategy: AllocationStrategy, notifier: NotificationService):
        self.compartments = compartments
        self.allocation_strategy = allocation_strategy
        self.notifier = notifier
        self.active_otps = {} # compartment_id -> otp

    def deposit_package(self, package: Package, customer_email: str) -> Optional[str]:
        comp = self.allocation_strategy.find_compartment(package, self.compartments)
        if not comp:
            raise RuntimeError("No available compartment for size")

        comp.is_occupied = True
        comp.current_package = package
        otp = "789012"
        self.active_otps[comp.compartment_id] = otp
        self.notifier.send_otp(customer_email, otp)
        return comp.compartment_id`,
              architect_notes: `**RDX Amazon Evaluation Rubric — Commit 2 Analysis:**

- **[Entity Decomposition] ✅ HIRE:** Identified nouns → classes (\`Package\`, \`Compartment\`, \`CompartmentSize\`).
- **[SOLID Adherence] ✅ HIRE:** Extracted \`AllocationStrategy\` (Line 27) and \`NotificationService\` (Line 39) behind clean interfaces.
- **[Extensibility] ✅ HIRE:** Adding \`LowestFloorFirstAllocation\` requires zero edits to \`LockerSystem\`.

**Key Interview Script (Thing to Say):**
*"I'm defining an AllocationStrategy interface here so that if business rules change — for example, preferring ground floor lockers for heavy packages — we simply introduce a new strategy class without touching core locker logic."*`,
              pivot_question: `How do you support locker expiration rules (e.g. package returned if not picked up within 3 days) and concurrent access by multiple delivery agents simultaneously?`,
              mermaid: `classDiagram
    class AllocationStrategy {
        <<interface>>
        +find_compartment(package, compartments)*
    }
    class FitExactSizeStrategy {
        +find_compartment()
    }
    class NotificationService {
        <<interface>>
        +send_otp(recipient, otp)*
    }
    class LockerSystem {
        -List~Compartment~ compartments
        -AllocationStrategy allocation_strategy
        -NotificationService notifier
        +deposit_package(package, email)
    }
    AllocationStrategy <|-- FitExactSizeStrategy
    NotificationService <|-- EmailNotification
    LockerSystem --> AllocationStrategy
    LockerSystem --> NotificationService
`
            },
            {
              step: 3,
              title: 'Commit 3: Amazon Strong Hire — Full 7-Step Execution (Strong Hire Signal)',
              code: `# rdx_step3_strong_hire_master.py
"""
================================================================================
RDX AMAZON LLD INTERVIEW MASTER TEMPLATE
Candidate Level: L5 / L6 (SDE-II / Senior SDE) - STRONG HIRE EXECUTION
================================================================================

STEP 1: GATHER REQUIREMENTS (Articulated verbally & scoped)
- Functional: Deposit package, assign compartment, generate OTP, verify pickup, handle return timeout.
- Non-Functional: Thread-safe concurrent access, extensible allocation & access policies, testable.

STEP 2: ENTITIES & RELATIONSHIPS
# LockerSystem HAS-MANY Compartments
# Compartment HAS-A CompartmentSize and HAS-A CompartmentType
# Package HAS-A CompartmentSize and REQUIRED CompartmentType
# Ticket REFERENCES Compartment, Package, and ExpirationTimestamp
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional, Dict
import datetime
import threading

# --- Domain Enums ---
class CompartmentSize(Enum):
    SMALL = 1
    MEDIUM = 2
    LARGE = 3

class CompartmentType(Enum):
    STANDARD = "STANDARD"
    REFRIGERATED = "REFRIGERATED"
    CHARGING = "CHARGING"

# --- Domain Data Classes ---
class Package:
    def __init__(self, package_id: str, size: CompartmentSize, req_type: CompartmentType = CompartmentType.STANDARD):
        if not package_id: raise ValueError("package_id cannot be empty")
        self.package_id = package_id
        self.size = size
        self.req_type = req_type

class Compartment:
    def __init__(self, comp_id: str, size: CompartmentSize, comp_type: CompartmentType = CompartmentType.STANDARD):
        self.comp_id = comp_id
        self.size = size
        self.comp_type = comp_type
        self.is_occupied = False
        self.current_package: Optional[Package] = None

class Ticket:
    def __init__(self, ticket_id: str, comp_id: str, package_id: str, otp: str, expires_at: datetime.datetime):
        self.ticket_id = ticket_id
        self.comp_id = comp_id
        self.package_id = package_id
        self.otp = otp
        self.expires_at = expires_at

# --- STEP 3: INTERFACES BEFORE IMPLEMENTATIONS (OCP & DIP) ---
class LockerAllocationStrategy(ABC):
    @abstractmethod
    def allocate(self, package: Package, compartments: List[Compartment]) -> Optional[Compartment]:
        pass

class AccessPolicy(ABC):
    """Pivots absorbed cleanly: Dynamic access fees, surge storage pricing, or time windows."""
    @abstractmethod
    def is_access_allowed(self, ticket: Ticket, entered_otp: str) -> bool:
        pass

# --- Concrete Extensions (Passing the Pivot Test with ZERO edits to core) ---
class TemperatureAwareAllocation(LockerAllocationStrategy):
    """Strong Hire: Absorbs refrigerated & charging locker requirements cleanly."""
    def allocate(self, package: Package, compartments: List[Compartment]) -> Optional[Compartment]:
        for comp in compartments:
            if not comp.is_occupied and comp.comp_type == package.req_type and comp.size.value >= package.size.value:
                return comp
        return None

class StandardAccessPolicy(AccessPolicy):
    def is_access_allowed(self, ticket: Ticket, entered_otp: str) -> bool:
        if datetime.datetime.now() > ticket.expires_at:
            print(f"[EXPIRED] Ticket {ticket.ticket_id} has expired!")
            return False
        return ticket.otp == entered_otp

# --- STEP 5 & STEP 7: CORE ORCHESTRATOR WITH THREAD SAFETY & TESTABILITY ---
class AmazonLockerSystem:
    def __init__(
        self,
        compartments: List[Compartment],
        allocation_strategy: LockerAllocationStrategy,
        access_policy: AccessPolicy
    ):
        self.compartments = compartments
        self.allocation_strategy = allocation_strategy
        self.access_policy = access_policy
        self.active_tickets: Dict[str, Ticket] = {} # comp_id -> Ticket
        self._lock = threading.Lock() # Strong Hire Signal: Explicit Concurrency Handling

    def deposit_package(self, package: Package) -> Ticket:
        with self._lock: # Thread safety on spot allocation
            comp = self.allocation_strategy.allocate(package, self.compartments)
            if not comp:
                raise RuntimeError(f"No available compartment for package {package.package_id}")

            comp.is_occupied = True
            comp.current_package = package
            expires_at = datetime.datetime.now() + datetime.timedelta(days=3)
            ticket = Ticket(f"TCK-{package.package_id}", comp.comp_id, package.package_id, "998877", expires_at)
            self.active_tickets[comp.comp_id] = ticket
            print(f"[DEPOSIT SUCCESS] Package {package.package_id} placed in Compartment {comp.comp_id} ({comp.comp_type.value})")
            return ticket

    def pickup_package(self, comp_id: str, entered_otp: str) -> bool:
        with self._lock:
            ticket = self.active_tickets.get(comp_id)
            if not ticket:
                raise ValueError("No active ticket for this compartment")

            if not self.access_policy.is_access_allowed(ticket, entered_otp):
                return False

            comp = next((c for c in self.compartments if c.comp_id == comp_id), None)
            if comp:
                comp.is_occupied = False
                comp.current_package = None
            del self.active_tickets[comp_id]
            print(f"[PICKUP SUCCESS] Package {ticket.package_id} retrieved from Compartment {comp_id}")
            return True`,
              architect_notes: `**RDX Amazon Master Reference — Strong Hire Breakdown:**

1. **[Requirement Gathering & LP Alignment] ✅ STRONG HIRE:** Demonstrates "Dive Deep" and "Invent and Simplify" by specifying functional vs non-functional boundaries upfront.
2. **[Thread Safety] ✅ STRONG HIRE (Unprompted Concurrency):** Uses \`threading.Lock()\` around spot allocation & ticket management (\`with self._lock:\`).
3. **[OCP Pivot Absorption] ✅ STRONG HIRE:** When the interviewer asks *"What if we need Refrigerated Compartments and OTP Expiration Policies?"*, we simply pass \`TemperatureAwareAllocation\` and \`StandardAccessPolicy\` — **ZERO edits to AmazonLockerSystem**.
4. **[Magic Question Buy-in] ✅ STRONG HIRE:** Got explicit architectural buy-in before writing concrete logic.`,
              pivot_question: `What if Amazon adds a dynamic surge fee for packages left in lockers for more than 48 hours? How does your AccessPolicy or Ticket handle this calculation without modifying AmazonLockerSystem?`,
              mermaid: `classDiagram
    class LockerAllocationStrategy {
        <<interface>>
        +allocate(package, compartments)*
    }
    class TemperatureAwareAllocation {
        +allocate()
    }
    class AccessPolicy {
        <<interface>>
        +is_access_allowed(ticket, entered_otp)*
    }
    class StandardAccessPolicy {
        +is_access_allowed()
    }
    class AmazonLockerSystem {
        -List~Compartment~ compartments
        -LockerAllocationStrategy allocation_strategy
        -AccessPolicy access_policy
        -Lock _lock
        +deposit_package(package)
        +pickup_package(comp_id, otp)
    }
    LockerAllocationStrategy <|-- TemperatureAwareAllocation
    AccessPolicy <|-- StandardAccessPolicy
    AmazonLockerSystem --> LockerAllocationStrategy : Strategy
    AmazonLockerSystem --> AccessPolicy : Policy
`
            }
          ],
          summary: [
            { principle: 'Requirement Scoping', violation: 'Started coding in 30s without asking questions (Weak Hire).', fix: 'Spent first 5-10m asking functional/non-functional constraints (Strong Hire).' },
            { principle: 'SRP & OCP', violation: 'God Class with if/elif branches for small/medium/large lockers.', fix: 'Extracted LockerAllocationStrategy & AccessPolicy interfaces.' },
            { principle: 'Concurrency', violation: 'Race conditions when 2 delivery drivers book same locker simultaneously.', fix: 'Added explicit threading.Lock() synchronized blocks.' },
            { principle: 'Pivot Absorption', violation: 'Rewrote core locker class when refrigerated requirement was dropped.', fix: 'Added TemperatureAwareAllocation with zero edits to core LockerSystem.' }
          ]
        },
        {
          id: 'rdx-pattern-handbook',
          title: 'The 7 Essential Design Patterns for Amazon LLD',
          language: 'python',
          commits: [
            {
              step: 1,
              title: 'Commit 1: Naive Multi-Pattern Abuse (Over-engineering Failure Mode)',
              code: `# rdx_pattern_naive.py — Over-Engineering Failure Mode (Pattern Name-Dropping)
# Applying Singleton, Observer, Mediator, Factory everywhere without justification.

class GlobalSingletonDatabase:
    _instance = None
    @classmethod
    def get_instance(cls):
        if not cls._instance: cls._instance = cls()
        return cls._instance

class OverEngineeredPizza:
    """Pattern-memorization without justification signals poor engineering judgment."""
    pass`,
              architect_notes: `**RDX Rubric — Failure Mode 4 (Over-Engineering):**

Candidates who name-drop 6 GoF patterns for a simple 4-class problem fail the interview. Amazon interviewers look for **Engineering Judgment**: *Only apply a pattern when it solves a specific axis of change.*`,
              pivot_question: `Why choose Strategy Pattern over Inheritance for pricing calculations? What is the exact trade-off?`,
              mermaid: `classDiagram
    class GlobalSingletonDatabase {
        +_instance
        +get_instance()
    }
    note for GlobalSingletonDatabase "Over-engineering anti-pattern"
`
            },
            {
              step: 2,
              title: 'Commit 2: The 7 Core Patterns Used Pragmatically (Strategy, Factory, State, Observer, Decorator, Composite, Singleton)',
              code: `# rdx_pattern_7_core.py — The 7 GoF Patterns Needed for Amazon LLD
from abc import ABC, abstractmethod
from typing import List

# 1. STRATEGY PATTERN (The King of LLD)
class PricingStrategy(ABC):
    @abstractmethod
    def calculate_price(self, base_price: float) -> float: pass

class SurgePricing(PricingStrategy):
    def calculate_price(self, base_price: float) -> float: return base_price * 1.5

# 2. FACTORY PATTERN (Object Creation Without Coupling)
class VehicleFactory:
    @staticmethod
    def create_vehicle(v_type: str):
        if v_type == "CAR": return "CarInstance"
        if v_type == "TRUCK": return "TruckInstance"

# 3. STATE PATTERN (Complex State Machine Transitions)
class OrderState(ABC):
    @abstractmethod
    def next_state(self, order): pass

class PendingState(OrderState):
    def next_state(self, order): order.state = PaidState()

class PaidState(OrderState):
    def next_state(self, order): order.state = ShippedState()

class ShippedState(OrderState):
    def next_state(self, order): print("Order delivered")

# 4. OBSERVER PATTERN (Event-Driven Decoupling)
class OrderObserver(ABC):
    @abstractmethod
    def on_order_placed(self, order_id: str): pass

class InventoryNotifier(OrderObserver):
    def on_order_placed(self, order_id: str): print(f"Deducting inventory for {order_id}")

# 5. DECORATOR PATTERN (Stackable Add-Ons — Pizza Toppings)
class FoodItem(ABC):
    @abstractmethod
    def get_cost(self) -> float: pass

class BasePizza(FoodItem):
    def get_cost(self) -> float: return 10.0

class CheeseDecorator(FoodItem):
    def __init__(self, inner: FoodItem): self.inner = inner
    def get_cost(self) -> float: return self.inner.get_cost() + 2.5

# 6. COMPOSITE PATTERN (Trees Where Group Is Also a Leaf — File System / Filters)
class FileNode(ABC):
    @abstractmethod
    def get_size(self) -> int: pass

class FileLeaf(FileNode):
    def __init__(self, size: int): self.size = size
    def get_size(self) -> int: return self.size

class DirectoryComposite(FileNode):
    def __init__(self): self.children: List[FileNode] = []
    def add(self, node: FileNode): self.children.append(node)
    def get_size(self) -> int: return sum(c.get_size() for c in self.children)`,
              architect_notes: `**RDX Master Reference — The 7 Patterns You Need Cold:**

1. **Strategy:** Varies behavior (pricing, allocation, sorting).
2. **Factory:** Encapsulates creation logic (\`VehicleFactory.create("truck")\`).
3. **State:** Replaces massive \`if/else\` machine state chains (\`IdleState\` -> \`PaymentState\` -> \`DispenseState\`).
4. **Observer:** Event notification (\`OrderSystem\` notifies \`PaymentService\` & \`InventoryService\`).
5. **Decorator:** Stackable add-ons (\`BasePizza\` + \`CheeseDecorator\` + \`JalapenoDecorator\`).
6. **Composite:** Tree structures where a directory holds files and sub-directories uniformly.
7. **Singleton:** Global access points (used sparingly for database connections).`,
              pivot_question: `In an interview, if you use Decorator Pattern for Pizza toppings, what is the pragmatic cousin alternative if the interviewer pushes back on class explosion?`,
              mermaid: `classDiagram
    class FoodItem {
        <<interface>>
        +get_cost()*
    }
    class BasePizza { +get_cost() }
    class CheeseDecorator {
        -FoodItem inner
        +get_cost()
    }
    FoodItem <|-- BasePizza
    FoodItem <|-- CheeseDecorator
    CheeseDecorator --> FoodItem : wraps inner
`
            }
          ],
          summary: [
            { principle: 'Strategy Pattern', violation: 'Hardcoded pricing/sorting conditional chains.', fix: 'Extracted interface with interchangeable concrete strategies.' },
            { principle: 'Decorator Pattern', violation: 'Creating a subclass for every topping combination (Subclass Explosion).', fix: 'Stackable wrappers around a common FoodItem interface.' },
            { principle: 'Composite Pattern', violation: 'Different code logic for scanning files vs scanning folders.', fix: 'Common FileNode interface implemented by Leaf and DirectoryComposite.' }
          ]
        }
      ]
    },
    {
      id: 'rdx-master-guide',
      name: 'Amazon LLD Master Reference (Full Text)',
      lessons: [
        {
          id: 'rdx-master-doc-full',
          title: 'THE AMAZON LLD INTERVIEW — Master Reference Document (v2)',
          language: 'markdown',
          commits: [
            {
              step: 1,
              title: 'Part 1: The Comprehensive Report & Hidden SOLID Rubric',
              code: `# THE AMAZON LLD INTERVIEW — MASTER REFERENCE DOCUMENT (v2)
# Author: rdx_lld.py | 23 sections

## 1.1 WHAT IS THE LLD ROUND — THE BIGGER PICTURE
The single most important reframe: this is NOT a LeetCode problem. It is a simulation of what it would be like to design a real production system with you as a teammate.

The LLD round (also called "Logical & Maintainable Code" or "OOD" at Amazon) tests ONE core question:
"If I give you a vague business requirement today, will your code still work when the requirements change next quarter?"

Amazon's primary evaluation metric is MAINTAINABILITY OVER A 5-YEAR HORIZON.
This means:
→ Your code must survive changing business requirements without a rewrite
→ Your classes must have single, clear responsibilities
→ New features must be addable WITHOUT modifying existing core logic
→ Your design must be understandable by a new hire reading it for the first time

THIS IS NOT A DSA ROUND. The algorithm is usually trivial. The test is:
→ Can you decompose a vague problem into clean entities?
→ Can you define relationships and boundaries between those entities?
→ Can you write code that is open for extension but closed for modification?
→ Can you absorb a surprise new requirement without your design collapsing?

FROM THE AMAZON RESEARCH REPORTS:
"Candidates who immediately begin writing code frequently fail the evaluation. Conversely, those who spend the first ten minutes asking clarifying questions, defining constraints, and outlining object relationships align perfectly with the Dive Deep and Invent and Simplify Leadership Principles."

---

## 1.2 THE EVALUATION AXES — WHAT THE INTERVIEWER IS SCORING
The LLD round scores you on these axes (from Amazon's internal rubric):
[Requirement Gathering] — Do you ask before you build?
[Entity Decomposition]  — Can you identify the right objects and relationships?
[SOLID Adherence]       — Does your design follow OOP best practices?
[Extensibility]         — Can your design absorb new features cleanly?
[Code Quality]          — Is your code modular, readable, well-named?
[Communication]         — Are you narrating your design decisions and trade-offs?
[LP Alignment]          — Do you demonstrate Invent and Simplify, Dive Deep, Insist on Highest Standards?

---

## 1.3 THE SOLID PRINCIPLES — THE HIDDEN RUBRIC
SOLID is NOT just theory. It is the ACTUAL scoring framework Amazon uses for the LLD round.

S — SINGLE RESPONSIBILITY PRINCIPLE (SRP)
"A class should have only one reason to change."
WHAT THE INTERVIEWER LOOKS FOR:
→ Does each class have a single, clearly defined job?
→ Is there a god-class that does everything? (INSTANT RED FLAG)

O — OPEN/CLOSED PRINCIPLE (OCP) [THIS IS THE MOST TESTED PRINCIPLE AT AMAZON]
"Software entities should be open for extension, closed for modification."
WHAT THE INTERVIEWER LOOKS FOR:
→ Can new behavior be added by creating new classes, NOT modifying existing ones?
→ When the interviewer drops a new requirement, does the candidate need to rewrite core logic? If yes → FAIL.

L — LISKOV SUBSTITUTION PRINCIPLE (LSP)
"Subtypes must be substitutable for their base types."

I — INTERFACE SEGREGATION PRINCIPLE (ISP)
"No client should be forced to depend on methods it does not use."

D — DEPENDENCY INVERSION PRINCIPLE (DIP)
"Depend on abstractions, not concretions."`,
              architect_notes: `**RDX Reference Document Part 1:**
- Focuses on the core mental reframe: Amazon LLD is about **Maintainability over a 5-year Horizon**.
- Explicitly maps SOLID principles to Amazon's internal evaluation scoring rubric.`,
              pivot_question: `What are the 4 main Failure Modes candidates make during the Amazon LLD round?`,
              mermaid: `classDiagram
    class AmazonLLDRubric {
        +RequirementGathering
        +EntityDecomposition
        +SOLIDAdherence
        +Extensibility
        +CodeQuality
        +LPAlignment
    }
`
            },
            {
              step: 2,
              title: 'Part 2: The Decision Tree & 7-Step LLD Checklist',
              code: `# PART 2: THE DECISION TREE & THE SEVEN-STEP LLD CHECKLIST

STEP 0 → BEHAVIORAL WARM-UP (2-5 min)
STEP 1 → GATHER REQUIREMENTS (5-10 min)
STEP 2 → IDENTIFY ENTITIES AND RELATIONSHIPS (5 min)
STEP 3 → DEFINE INTERFACES AND CLASS SKELETON (5 min)
STEP 4 → GET BUY-IN ON DESIGN (The Magic Question) (30 sec)
STEP 5 → IMPLEMENT CORE LOGIC (15-20 min)
STEP 6 → ABSORB THE PIVOT (5-10 min)
STEP 7 → WRAP UP — DISCUSS TRADE-OFFS AND EXTENSIONS (5 min)

---

## STEP 4: GET BUY-IN ON THE DESIGN (The Magic Question)
Duration: 30 seconds. NEVER skip this.
Before implementing ANY logic, get explicit confirmation that your architecture is correct.

THE EXACT TEMPLATE (memorize this):
"So the design has [N] core entities — [Entity1, Entity2, Entity3].
The extension points are [pricing/allocation] behind interfaces so we can add new models without modifying existing logic.
I'll use [HashMap/list/etc.] for [specific tracking need].
Does this structure look good to you, or should I reconsider anything before I start implementing?"

---

## STEP 6: ABSORB THE PIVOT (THE MOMENT OF TRUTH)
Duration: 5-10 minutes. THIS is what the round is REALLY testing.

YOUR RESPONSE PROTOCOL:
1. DON'T PANIC. This is expected. It is the test.
2. PAUSE AND ASSESS. Say: "Great question. Let me think about how this fits into my current design..."
3. SHOW THAT YOUR DESIGN ABSORBS IT. Say:
   "Because I used the Strategy pattern for pricing, I can support this by creating a new SurgePricing class that implements PricingStrategy. No changes to ParkingLot needed." ← THIS IS THE WINNING ANSWER.

---

## SIGNAL SUMMARY TABLE — LLD ROUND

STRONG HIRE SIGNALS:
- Anticipating the pivot before being asked
- Mentioning concurrency and thread safety unprompted
- Discussing testability and mock strategies
- Explaining rejected alternatives ("I considered X but chose Y because...")
- Drawing entity relationships before coding
- Design absorbs pivot requirement with zero core changes
- Interfaces defined before concrete classes

WEAK / NO HIRE SIGNALS:
- Started coding within 30 seconds of hearing the problem
- Built a monolithic god-class
- Used if-else chains instead of polymorphism
- Couldn't absorb the pivot without rewriting core logic
- Silent for extended period mid-design`,
              architect_notes: `**RDX Reference Document Part 2:**
- Defines the exact 7-step checklist used by Amazon Strong Hires.
- Outlines the Magic Question (Step 4) and Pivot Response Protocol (Step 6).`,
              pivot_question: `What is "The Winning Sentence" to say BEFORE you code the midway add-on requirement in Step 6?`,
              mermaid: `graph TD
    Step0[Step 0: STAR Warmup] --> Step1[Step 1: Scrape Requirements]
    Step1 --> Step2[Step 2: Entities & Relationships]
    Step2 --> Step3[Step 3: Skeleton Interfaces]
    Step3 --> Step4[Step 4: Magic Question Buy-in]
    Step4 --> Step5[Step 5: Core Implementation]
    Step5 --> Step6[Step 6: Absorb Pivot]
    Step6 --> Step7[Step 7: Trade-offs & Wrap up]
`
            }
          ],
          summary: [
            { principle: 'Maintainability Horizon', violation: 'Designing for today only.', fix: 'Designing for 5-year maintainability where requirements change next quarter.' },
            { principle: 'The Magic Question', violation: 'Jumping into code without buy-in.', fix: 'Step 4: Summarize architecture & get interviewer buy-in before implementing.' },
            { principle: 'Pivot Absorption', violation: 'Panic & core code rewrites when requirements pivot.', fix: 'Step 6: Add a new class implementing existing interfaces — zero core edits.' }
          ]
        }
      ]
    }
  ]
};
