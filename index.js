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
                        },
                        {
                            id: 'srp-user-registration',
                            title: 'S — Single Responsibility: User Registration',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: God Class — One class does everything',
                                    code: `# srp_naive.py — Single Responsibility VIOLATION
import sqlite3
import smtplib
import datetime

class UserService:
    """
    SRP VIOLATION: This class has FOUR reasons to change:
    1. Validation rules change
    2. Database schema changes
    3. Email provider changes
    4. Logging format changes

    Each of these concerns is a separate "axis of change".
    """

    def register_user(self, username: str, email: str, password: str):
        # --- Responsibility 1: Validation ---
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if "@" not in email:
            raise ValueError("Invalid email address")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        # --- Responsibility 2: Database Persistence ---
        db = sqlite3.connect("users.db")
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, self._hash_password(password))
        )
        db.commit()
        db.close()

        # --- Responsibility 3: Email Notification ---
        try:
            smtp = smtplib.SMTP("smtp.gmail.com", 587)
            smtp.starttls()
            smtp.login("admin@myapp.com", "secret")
            smtp.sendmail(
                "admin@myapp.com",
                email,
                f"Subject: Welcome!\\n\\nHello {username}, welcome aboard!"
            )
            smtp.quit()
        except Exception as e:
            print(f"Email failed: {e}")

        # --- Responsibility 4: Activity Logging ---
        with open("activity.log", "a") as f:
            f.write(f"[{datetime.datetime.now()}] User registered: {username}\\n")

        return {"username": username, "email": email}

    def _hash_password(self, password: str) -> str:
        return f"hashed_{password}"  # Simplified for demo`,
                                    architect_notes: `**SRP Violation Breakdown:**

This \`UserService\` class has **four distinct responsibilities** — each is an independent reason for the class to change:

- **Validation logic** — If password requirements change, this class changes
- **Database access** — If we switch from SQLite to PostgreSQL, this class changes
- **Email sending** — If we switch email providers (SendGrid, AWS SES), this class changes
- **Logging** — If we change log format or switch to structured logging, this class changes

**The "Newspaper Test":** If you described this class's purpose, you'd need four paragraphs. A well-designed class should be described in one sentence.`,
                                    pivot_question: `If the business decides to switch from SQLite to PostgreSQL AND from Gmail SMTP to SendGrid simultaneously, how many places in this codebase need to change? What's the blast radius?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Each class has ONE reason to change',
                                    code: `# srp_refactored.py — Single Responsibility APPLIED
import datetime


class UserValidator:
    """Responsibility: Validate user input. Changes when validation rules change."""

    def validate(self, username: str, email: str, password: str):
        errors = []
        if len(username) < 3:
            errors.append("Username must be at least 3 characters")
        if "@" not in email:
            errors.append("Invalid email address")
        if len(password) < 8:
            errors.append("Password must be at least 8 characters")
        if errors:
            raise ValueError("; ".join(errors))


class UserRepository:
    """Responsibility: Persist user data. Changes when storage layer changes."""

    def save(self, username: str, email: str, hashed_password: str):
        # Tomorrow we can swap SQLite for PostgreSQL — only THIS class changes
        print(f"[DB] Saving user: {username} ({email})")
        return {"id": 1, "username": username, "email": email}


class EmailService:
    """Responsibility: Send emails. Changes when email provider changes."""

    def send_welcome_email(self, email: str, username: str):
        # Tomorrow we can swap Gmail for SendGrid — only THIS class changes
        print(f"[EMAIL] Sending welcome email to {email}")


class ActivityLogger:
    """Responsibility: Log activity. Changes when logging format changes."""

    def log(self, message: str):
        timestamp = datetime.datetime.now().isoformat()
        print(f"[LOG {timestamp}] {message}")


class PasswordHasher:
    """Responsibility: Hash passwords. Changes when hashing algorithm changes."""

    def hash(self, password: str) -> str:
        return f"bcrypt_hashed_{password}"


class UserRegistrationService:
    """
    SRP COMPLIANT: This class has ONE responsibility — orchestrate registration.
    It delegates each concern to a specialist class.
    """

    def __init__(
        self,
        validator: UserValidator,
        repository: UserRepository,
        email_service: EmailService,
        logger: ActivityLogger,
        hasher: PasswordHasher,
    ):
        self.validator = validator
        self.repository = repository
        self.email_service = email_service
        self.logger = logger
        self.hasher = hasher

    def register(self, username: str, email: str, password: str):
        self.validator.validate(username, email, password)
        hashed = self.hasher.hash(password)
        user = self.repository.save(username, email, hashed)
        self.email_service.send_welcome_email(email, username)
        self.logger.log(f"User registered: {username}")
        return user


# --- Usage ---
service = UserRegistrationService(
    validator=UserValidator(),
    repository=UserRepository(),
    email_service=EmailService(),
    logger=ActivityLogger(),
    hasher=PasswordHasher(),
)
service.register("alice", "alice@example.com", "securepass123")`,
                                    architect_notes: `**SRP Applied — Each class has ONE reason to change:**

- \`UserValidator\` — changes only when validation rules change
- \`UserRepository\` — changes only when the database layer changes
- \`EmailService\` — changes only when the email provider changes
- \`ActivityLogger\` — changes only when the logging strategy changes
- \`PasswordHasher\` — changes only when the hashing algorithm changes

**\`UserRegistrationService\`** is now a pure **orchestrator** — it delegates every concern. Its only responsibility is coordination.

**Things to say in the interview:**
*"SRP doesn't mean one method per class. It means one reason to change. I identify 'axes of change' — if the email provider swaps from Gmail to SendGrid, only EmailService changes. Zero blast radius on the rest of the system."*`,
                                    pivot_question: `If we need to add phone number verification to registration, which classes would change and which wouldn't? How does SRP contain the blast radius?`
                                }
                            ],
                            summary: [
                                { principle: 'SRP', violation: 'One class handled validation, DB, email, and logging.', fix: 'Extracted each concern into its own specialist class.' },
                                { principle: 'Testability', violation: 'Can\'t unit test validation without a real DB and SMTP server.', fix: 'Each class is independently testable with mocks.' }
                            ]
                        },
                        {
                            id: 'ocp-shape-calculator',
                            title: 'O — Open/Closed: Shape Area Calculator',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: if/elif chain — must edit to extend',
                                    code: `# ocp_naive.py — Open/Closed VIOLATION
import math

class AreaCalculator:
    """
    OCP VIOLATION: Every time we add a new shape, we MUST modify
    this method. The class is NOT closed for modification.
    """

    def calculate_area(self, shape: dict) -> float:
        shape_type = shape["type"]

        if shape_type == "circle":
            return math.pi * shape["radius"] ** 2

        elif shape_type == "rectangle":
            return shape["width"] * shape["height"]

        elif shape_type == "triangle":
            return 0.5 * shape["base"] * shape["height"]

        # OCP FAILURE: What if we need a Pentagon? Hexagon? Trapezoid?
        # We'd add MORE elif branches here, modifying tested code!
        else:
            raise ValueError(f"Unknown shape: {shape_type}")

    def total_area(self, shapes: list) -> float:
        return sum(self.calculate_area(s) for s in shapes)


# --- Usage with raw dicts (fragile, no type safety) ---
shapes = [
    {"type": "circle", "radius": 5},
    {"type": "rectangle", "width": 4, "height": 6},
    {"type": "triangle", "base": 3, "height": 8},
]

calc = AreaCalculator()
print(f"Total area: {calc.total_area(shapes)}")

# PROBLEM: Adding a new shape means editing AreaCalculator.calculate_area()
# This violates OCP and risks breaking existing, tested logic.`,
                                    architect_notes: `**OCP Violation — The "New Shape" Test:**

Every time a new shape is introduced, the \`calculate_area()\` method must be modified:
- New \`elif\` branch added
- Existing tested code is touched
- Risk of introducing bugs in previously working shapes

**The if/elif anti-pattern** is the most common OCP violation. It's a code smell that screams "this should be polymorphism."

**Using raw dicts** compounds the problem — no type safety, no IDE autocomplete, easy to pass malformed data.`,
                                    pivot_question: `If a team of 5 developers each needs to add a different shape type, how many merge conflicts will occur in this single file? How does this design scale with team size?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Polymorphism — extend without modifying',
                                    code: `# ocp_refactored.py — Open/Closed APPLIED
import math
from abc import ABC, abstractmethod


class Shape(ABC):
    """
    OCP: Define an abstract interface. New shapes are ADDED by creating
    new classes — the calculator never needs to change.
    """

    @abstractmethod
    def area(self) -> float:
        """Each shape knows how to compute its own area."""
        pass

    @abstractmethod
    def name(self) -> str:
        pass


# --- Existing shapes (closed for modification) ---

class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        return math.pi * self.radius ** 2

    def name(self) -> str:
        return f"Circle(r={self.radius})"


class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

    def name(self) -> str:
        return f"Rectangle({self.width}x{self.height})"


class Triangle(Shape):
    def __init__(self, base: float, height: float):
        self.base = base
        self.height = height

    def area(self) -> float:
        return 0.5 * self.base * self.height

    def name(self) -> str:
        return f"Triangle(b={self.base}, h={self.height})"


# --- NEW shape: Zero modifications to existing code! ---

class Pentagon(Shape):
    """OCP in action: Adding Pentagon required ZERO changes to existing classes."""

    def __init__(self, side: float):
        self.side = side

    def area(self) -> float:
        return (math.sqrt(5 * (5 + 2 * math.sqrt(5))) / 4) * self.side ** 2

    def name(self) -> str:
        return f"Pentagon(s={self.side})"


# --- Calculator is now CLOSED for modification ---

class AreaCalculator:
    """This class NEVER changes when new shapes are added."""

    def total_area(self, shapes: list[Shape]) -> float:
        return sum(shape.area() for shape in shapes)

    def print_report(self, shapes: list[Shape]):
        for shape in shapes:
            print(f"  {shape.name()}: {shape.area():.2f}")
        print(f"  Total: {self.total_area(shapes):.2f}")


# --- Usage ---
shapes = [Circle(5), Rectangle(4, 6), Triangle(3, 8), Pentagon(4)]
AreaCalculator().print_report(shapes)`,
                                    architect_notes: `**OCP Applied — Open for extension, closed for modification:**

- \`AreaCalculator\` is now **closed** — it will never be edited again for new shapes
- Adding \`Pentagon\` required **zero changes** to any existing class
- Each shape encapsulates its own area formula (also satisfying SRP!)

**The key insight:** OCP is achieved through **polymorphism** and **abstractions**. The \`Shape\` abstract class defines a contract; concrete shapes fulfill it.

**Things to say in the interview:**
*"I use OCP to ensure that adding new features means adding new code, not modifying existing tested code. The AreaCalculator works with any Shape subclass — it doesn't know or care about the specifics."*`,
                                    pivot_question: `What if shapes need both area() and perimeter()? How do you evolve the Shape interface without breaking existing implementations?`
                                }
                            ],
                            summary: [
                                { principle: 'OCP', violation: 'Adding shapes required modifying the if/elif chain in AreaCalculator.', fix: 'Abstract Shape class — new shapes are new classes, calculator never changes.' },
                                { principle: 'Polymorphism', violation: 'Raw dicts with type strings — no safety, no IDE support.', fix: 'Type-safe Shape classes with enforced interface contracts.' }
                            ]
                        },
                        {
                            id: 'lsp-bird-hierarchy',
                            title: 'L — Liskov Substitution: Bird Hierarchy',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: Penguin throws on fly() — breaks substitution',
                                    code: `# lsp_naive.py — Liskov Substitution VIOLATION

class Bird:
    """Base class assumes ALL birds can fly."""

    def __init__(self, name: str):
        self.name = name

    def eat(self):
        print(f"{self.name} is eating seeds")

    def fly(self):
        """LSP PROBLEM: Not all birds can fly!"""
        print(f"{self.name} is soaring through the sky")


class Sparrow(Bird):
    """Sparrow can fly — no issues here."""
    pass


class Penguin(Bird):
    """
    LSP VIOLATION: Penguin overrides fly() to raise an exception.
    Any code expecting a Bird and calling fly() will CRASH with a Penguin.
    """

    def fly(self):
        # This BREAKS the contract established by Bird.fly()
        raise NotImplementedError("Penguins can't fly!")

    def swim(self):
        print(f"{self.name} is swimming gracefully")


class Ostrich(Bird):
    """Another LSP VIOLATION — same problem as Penguin."""

    def fly(self):
        raise NotImplementedError("Ostriches can't fly!")

    def run(self):
        print(f"{self.name} is running at 45 mph")


# --- This function EXPECTS all Birds can fly ---
def bird_show(birds: list):
    """
    LSP Test: Can we substitute ANY Bird subclass here?
    Answer: NO — Penguin and Ostrich will crash this function.
    """
    for bird in birds:
        bird.eat()
        bird.fly()  # BOOM! Crashes for Penguin and Ostrich
        print("---")


# This works fine
bird_show([Sparrow("Jack"), Sparrow("Jill")])

# This CRASHES — LSP violation exposed
# bird_show([Sparrow("Jack"), Penguin("Tux"), Ostrich("Oscar")])`,
                                    architect_notes: `**LSP Violation — The Substitution Test:**

LSP states: *If S is a subtype of T, then objects of type T can be replaced with objects of type S without altering the correctness of the program.*

**The failure:** \`Penguin\` and \`Ostrich\` are subtypes of \`Bird\`, but substituting them into \`bird_show()\` crashes the program. The subclass violates the parent's contract.

**Root cause:** The \`Bird\` base class makes a **false assumption** — that all birds can fly. This is a modeling error at the hierarchy design level.

**The Rectangle-Square Problem:** This is the same fundamental issue as the classic Rectangle/Square LSP violation — a subclass that can't fulfill its parent's promises.`,
                                    pivot_question: `How would you redesign this hierarchy so that bird_show() can safely accept ANY bird subclass without crashing? What's the right abstraction boundary?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Capability-based hierarchy — safe substitution',
                                    code: `# lsp_refactored.py — Liskov Substitution APPLIED
from abc import ABC, abstractmethod


class Bird(ABC):
    """
    LSP FIX: Base Bird class only includes behaviors ALL birds share.
    Flying is NOT a universal bird trait — it belongs in a subtype.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def eat(self):
        pass

    @abstractmethod
    def make_sound(self):
        pass


class FlyingBird(Bird):
    """Only birds that CAN fly extend this class."""

    @abstractmethod
    def fly(self):
        pass


class SwimmingBird(Bird):
    """Only birds that CAN swim extend this class."""

    @abstractmethod
    def swim(self):
        pass


# --- Concrete Birds: each fulfills its parent's FULL contract ---

class Sparrow(FlyingBird):
    """LSP SAFE: Sparrow IS-A FlyingBird. fly() works as expected."""

    def eat(self):
        print(f"{self.name} pecks at seeds")

    def make_sound(self):
        print(f"{self.name}: Chirp chirp!")

    def fly(self):
        print(f"{self.name} soars through the sky")


class Penguin(SwimmingBird):
    """
    LSP SAFE: Penguin IS-A SwimmingBird (not FlyingBird).
    No broken contracts — Penguin never promises to fly.
    """

    def eat(self):
        print(f"{self.name} catches fish")

    def make_sound(self):
        print(f"{self.name}: Honk honk!")

    def swim(self):
        print(f"{self.name} glides through icy waters")


class Ostrich(Bird):
    """LSP SAFE: Ostrich IS-A Bird. No flying or swimming required."""

    def eat(self):
        print(f"{self.name} grazes on plants")

    def make_sound(self):
        print(f"{self.name}: Boom boom!")

    def run(self):
        print(f"{self.name} sprints at 45 mph")


# --- Functions that work with ANY Bird — LSP guaranteed ---

def bird_show(birds: list[Bird]):
    """LSP SAFE: Only calls methods guaranteed by the Bird contract."""
    for bird in birds:
        bird.eat()
        bird.make_sound()
        print("---")


def flying_show(birds: list[FlyingBird]):
    """Type-safe: Only accepts birds that CAN fly."""
    for bird in birds:
        bird.fly()


# All of these work safely — no crashes, no surprises
bird_show([Sparrow("Jack"), Penguin("Tux"), Ostrich("Oscar")])
flying_show([Sparrow("Jack"), Sparrow("Jill")])`,
                                    architect_notes: `**LSP Applied — Capability-based hierarchy:**

- \`Bird\` base class only defines **universal traits** (eat, make_sound)
- \`FlyingBird\` and \`SwimmingBird\` are intermediate classes for **optional capabilities**
- Every subclass **fully honors** its parent's contract — no exceptions thrown, no broken promises

**Key insight:** LSP violations are almost always **modeling errors**. The fix isn't adding checks — it's redesigning the hierarchy to match reality.

**Things to say in the interview:**
*"I check LSP by asking: can I substitute any subclass into code expecting the base type without surprises? If a subclass throws NotImplementedError, that's a hierarchy design flaw, not a subclass problem."*`,
                                    pivot_question: `What if a Duck can both fly AND swim? How do you handle multiple capabilities without multiple inheritance issues?`
                                }
                            ],
                            summary: [
                                { principle: 'LSP', violation: 'Penguin.fly() throws NotImplementedError — breaks parent contract.', fix: 'Redesigned hierarchy: FlyingBird/SwimmingBird capability classes.' },
                                { principle: 'Modeling', violation: 'Assumed all birds fly — false abstraction.', fix: 'Only universal traits in base class; capabilities in subtypes.' }
                            ]
                        },
                        {
                            id: 'isp-worker-system',
                            title: 'I — Interface Segregation: Worker Management',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: Fat interface — Robots forced to eat()',
                                    code: `# isp_naive.py — Interface Segregation VIOLATION
from abc import ABC, abstractmethod


class Worker(ABC):
    """
    ISP VIOLATION: This is a "fat interface" — it forces ALL implementors
    to define work(), eat(), sleep(), and take_break().

    A Robot worker doesn't eat or sleep, but is FORCED to implement them.
    """

    @abstractmethod
    def work(self):
        pass

    @abstractmethod
    def eat(self, food: str):
        pass

    @abstractmethod
    def sleep(self, hours: int):
        pass

    @abstractmethod
    def take_break(self):
        pass


class HumanWorker(Worker):
    """Human implements all methods naturally — no issue here."""

    def __init__(self, name: str):
        self.name = name

    def work(self):
        print(f"{self.name} is coding features")

    def eat(self, food: str):
        print(f"{self.name} is eating {food}")

    def sleep(self, hours: int):
        print(f"{self.name} sleeps for {hours} hours")

    def take_break(self):
        print(f"{self.name} takes a coffee break")


class RobotWorker(Worker):
    """
    ISP VIOLATION EXPOSED: Robot is FORCED to implement eat() and sleep()
    even though they make no sense for a robot.
    """

    def __init__(self, model: str):
        self.model = model

    def work(self):
        print(f"Robot {self.model} is assembling parts")

    def eat(self, food: str):
        # FORCED to implement — makes no sense for a robot!
        raise NotImplementedError("Robots don't eat!")

    def sleep(self, hours: int):
        # FORCED to implement — makes no sense for a robot!
        raise NotImplementedError("Robots don't sleep!")

    def take_break(self):
        print(f"Robot {self.model} enters standby mode")


# --- Manager code that triggers ISP problems ---
def lunch_break(workers: list):
    """This function crashes when it encounters a RobotWorker."""
    for worker in workers:
        worker.eat("sandwich")  # BOOM for robots!
        worker.take_break()


team = [HumanWorker("Alice"), RobotWorker("T-800")]
# lunch_break(team)  # Crashes on the Robot!`,
                                    architect_notes: `**ISP Violation — The "Fat Interface" Problem:**

The \`Worker\` interface forces every implementor to define 4 methods, even if some are meaningless:
- \`RobotWorker\` must implement \`eat()\` → throws NotImplementedError
- \`RobotWorker\` must implement \`sleep()\` → throws NotImplementedError

**Why this is dangerous:** Client code (like \`lunch_break()\`) assumes all \`Worker\` objects can eat — a perfectly reasonable assumption given the interface. But robots break that assumption at runtime.

**ISP says:** *"No client should be forced to depend on methods it does not use."* Split fat interfaces into focused, role-specific ones.`,
                                    pivot_question: `What if we add a DroneWorker that can work but needs to recharge instead of eating? How many NotImplementedError methods would you need with this design?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Segregated interfaces — implement only what fits',
                                    code: `# isp_refactored.py — Interface Segregation APPLIED
from abc import ABC, abstractmethod


# --- ISP FIX: Small, focused interfaces for each capability ---

class Workable(ABC):
    """Can perform work tasks."""
    @abstractmethod
    def work(self):
        pass


class Eatable(ABC):
    """Can consume food (biological entities)."""
    @abstractmethod
    def eat(self, food: str):
        pass


class Sleepable(ABC):
    """Needs rest periods (biological entities)."""
    @abstractmethod
    def sleep(self, hours: int):
        pass


class Rechargeable(ABC):
    """Can be recharged (electronic entities)."""
    @abstractmethod
    def recharge(self, minutes: int):
        pass


class Breakable(ABC):
    """Can take breaks."""
    @abstractmethod
    def take_break(self):
        pass


# --- Classes implement ONLY the interfaces that apply ---

class HumanWorker(Workable, Eatable, Sleepable, Breakable):
    """Human: can work, eat, sleep, and take breaks."""

    def __init__(self, name: str):
        self.name = name

    def work(self):
        print(f"{self.name} is coding features")

    def eat(self, food: str):
        print(f"{self.name} is eating {food}")

    def sleep(self, hours: int):
        print(f"{self.name} sleeps for {hours} hours")

    def take_break(self):
        print(f"{self.name} takes a coffee break")


class RobotWorker(Workable, Rechargeable, Breakable):
    """Robot: can work, recharge, and take breaks. Does NOT eat or sleep."""

    def __init__(self, model: str):
        self.model = model

    def work(self):
        print(f"Robot {self.model} is assembling parts")

    def recharge(self, minutes: int):
        print(f"Robot {self.model} recharging for {minutes} minutes")

    def take_break(self):
        print(f"Robot {self.model} enters standby mode")


# --- Client code uses narrow interfaces — type-safe! ---

def lunch_break(eaters: list[Eatable]):
    """Only accepts entities that CAN eat — type system enforces this."""
    for eater in eaters:
        eater.eat("sandwich")

def work_shift(workers: list[Workable]):
    """Accepts anything that can work — humans, robots, drones."""
    for worker in workers:
        worker.work()

def recharge_station(machines: list[Rechargeable]):
    """Only accepts rechargeable entities."""
    for machine in machines:
        machine.recharge(30)


# --- Safe usage — no crashes, no surprises ---
humans = [HumanWorker("Alice"), HumanWorker("Bob")]
robots = [RobotWorker("T-800"), RobotWorker("R2-D2")]

work_shift(humans + robots)  # Both can work
lunch_break(humans)          # Only humans eat
recharge_station(robots)     # Only robots recharge`,
                                    architect_notes: `**ISP Applied — Small, focused interfaces:**

- \`Workable\` — just \`work()\`
- \`Eatable\` — just \`eat()\`
- \`Sleepable\` — just \`sleep()\`
- \`Rechargeable\` — just \`recharge()\`

**Key wins:**
- \`RobotWorker\` no longer implements methods it can't fulfill
- Client functions declare exactly what capability they need
- The **type system** prevents passing a Robot to \`lunch_break()\` — caught at design time, not runtime

**Things to say in the interview:**
*"ISP is about designing interfaces from the client's perspective. I ask: what does this client actually need? Then I create an interface with exactly those methods — nothing more."*`,
                                    pivot_question: `How does ISP interact with DIP here? If a manager function needs both Workable and Breakable, should you create a combined interface or accept two separate parameters?`
                                }
                            ],
                            summary: [
                                { principle: 'ISP', violation: 'Fat Worker interface forced Robot to implement eat() and sleep().', fix: 'Segregated into Workable, Eatable, Sleepable, Rechargeable.' },
                                { principle: 'Type Safety', violation: 'Runtime NotImplementedError when Robot tries to eat.', fix: 'Compile-time safety — type system prevents invalid calls.' }
                            ]
                        },
                        {
                            id: 'dip-notification-system',
                            title: 'D — Dependency Inversion: Order Notifications',
                            language: 'python',
                            commits: [
                                {
                                    step: 1,
                                    title: 'Commit 1: Hardcoded dependency — tightly coupled',
                                    code: `# dip_naive.py — Dependency Inversion VIOLATION

class EmailSender:
    """Low-level module: knows HOW to send emails."""

    def send(self, to: str, subject: str, body: str):
        print(f"[EMAIL] To: {to}")
        print(f"  Subject: {subject}")
        print(f"  Body: {body}")


class SMSGateway:
    """Another low-level module: knows HOW to send SMS."""

    def send_sms(self, phone: str, message: str):
        print(f"[SMS] To: {phone} | Message: {message}")


class OrderService:
    """
    DIP VIOLATION: High-level module (OrderService) directly depends
    on low-level modules (EmailSender, SMSGateway).

    The dependency arrow points DOWNWARD — high depends on low.
    """

    def __init__(self):
        # HARDCODED dependencies — created internally!
        self.email_sender = EmailSender()
        self.sms_gateway = SMSGateway()

    def place_order(self, customer_email: str, customer_phone: str, item: str):
        # Process the order
        order_id = f"ORD-{hash(item) % 10000:04d}"
        print(f"\\nOrder {order_id} placed for: {item}")

        # DIP VIOLATION: Directly calling concrete implementations
        self.email_sender.send(
            customer_email,
            f"Order Confirmation: {order_id}",
            f"Your order for {item} has been placed!"
        )

        # DIP VIOLATION: What if we want to add Push Notifications?
        # We'd have to modify THIS class to add self.push_service = PushService()
        self.sms_gateway.send_sms(
            customer_phone,
            f"Order {order_id} confirmed: {item}"
        )


# --- Usage ---
service = OrderService()
service.place_order("alice@mail.com", "+1234567890", "Mechanical Keyboard")

# PROBLEMS:
# 1. Can't test OrderService without REAL EmailSender and SMSGateway
# 2. Can't swap email providers without editing OrderService
# 3. Adding new notification channels means modifying OrderService`,
                                    architect_notes: `**DIP Violation — Dependency arrows point the wrong way:**

\`OrderService\` (high-level policy) directly creates and depends on \`EmailSender\` and \`SMSGateway\` (low-level details):

- **Tight coupling:** \`OrderService\` can't exist without \`EmailSender\`
- **Untestable:** Unit testing \`OrderService\` sends real emails
- **Rigid:** Adding Push Notifications means editing \`OrderService\`

**DIP states:** *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*

The dependency arrow should be **inverted** — both the high-level and low-level modules should point toward an abstraction.`,
                                    pivot_question: `How would you write a unit test for OrderService.place_order() without actually sending emails or SMS? What's blocking testability?`
                                },
                                {
                                    step: 2,
                                    title: 'Commit 2: Depend on abstractions — inverted control',
                                    code: `# dip_refactored.py — Dependency Inversion APPLIED
from abc import ABC, abstractmethod
from typing import List


# --- The ABSTRACTION that both layers depend on ---

class NotificationService(ABC):
    """
    DIP: This abstraction is the "inversion point."
    Both high-level (OrderService) and low-level (Email/SMS)
    depend on THIS interface — not on each other.
    """

    @abstractmethod
    def notify(self, recipient: str, subject: str, message: str):
        pass


# --- Low-level modules implement the abstraction ---

class EmailNotification(NotificationService):
    def notify(self, recipient: str, subject: str, message: str):
        print(f"[EMAIL] To: {recipient} | Subject: {subject}")
        print(f"  {message}")


class SMSNotification(NotificationService):
    def notify(self, recipient: str, subject: str, message: str):
        print(f"[SMS] To: {recipient} | {message}")


class PushNotification(NotificationService):
    """Added WITHOUT modifying OrderService or any existing code!"""

    def notify(self, recipient: str, subject: str, message: str):
        print(f"[PUSH] To device: {recipient} | {subject}: {message}")


class SlackNotification(NotificationService):
    """Another channel — again, zero changes to existing code."""

    def notify(self, recipient: str, subject: str, message: str):
        print(f"[SLACK] Channel: {recipient} | {message}")


# --- High-level module depends on ABSTRACTIONS ---

class OrderService:
    """
    DIP COMPLIANT:
    - Depends on NotificationService (abstraction), not EmailSender (concrete)
    - Notification channels are INJECTED, not created internally
    - Adding new channels requires ZERO changes to this class
    """

    def __init__(self, notifiers: List[NotificationService]):
        # Dependencies INJECTED from outside (Inversion of Control)
        self.notifiers = notifiers

    def place_order(self, customer_id: str, item: str):
        order_id = f"ORD-{hash(item) % 10000:04d}"
        print(f"\\nOrder {order_id} placed for: {item}")

        # Notify through ALL configured channels
        for notifier in self.notifiers:
            notifier.notify(
                customer_id,
                f"Order Confirmation: {order_id}",
                f"Your order for {item} has been placed!"
            )


# --- Flexible configuration at composition root ---

# Production: email + SMS + push
prod_service = OrderService([
    EmailNotification(),
    SMSNotification(),
    PushNotification(),
])
prod_service.place_order("alice@mail.com", "Mechanical Keyboard")

# Testing: no real notifications needed
class MockNotification(NotificationService):
    def __init__(self):
        self.sent = []
    def notify(self, recipient, subject, message):
        self.sent.append((recipient, subject, message))

mock = MockNotification()
test_service = OrderService([mock])
test_service.place_order("test@test.com", "Test Item")
print(f"\\nTest: {len(mock.sent)} notification(s) captured")`,
                                    architect_notes: `**DIP Applied — Both layers depend on abstractions:**

\`\`\`
Before:  OrderService → EmailSender (high depends on low)
After:   OrderService → NotificationService ← EmailNotification
         (both depend on the abstraction)
\`\`\`

**Key wins:**
- **Testable:** \`MockNotification\` makes unit testing trivial — no real emails sent
- **Extensible:** Added \`PushNotification\` and \`SlackNotification\` with zero changes to \`OrderService\`
- **Configurable:** Different environments can wire different notification stacks

**DIP + DI (Dependency Injection):** DIP is the principle; DI is the technique. We *inject* the abstraction via the constructor rather than creating it internally.

**Things to say in the interview:**
*"I invert dependencies so high-level business logic doesn't know about low-level details. OrderService talks to a NotificationService interface — whether that's email, SMS, or a mock for testing, OrderService doesn't care."*`,
                                    pivot_question: `How would you implement a notification priority system where critical orders use all channels but routine orders only use email? Where does that routing logic live?`
                                }
                            ],
                            summary: [
                                { principle: 'DIP', violation: 'OrderService directly created EmailSender and SMSGateway internally.', fix: 'Depends on NotificationService abstraction, injected via constructor.' },
                                { principle: 'Testability', violation: 'Unit testing OrderService required real email/SMS infrastructure.', fix: 'MockNotification enables isolated, fast unit tests.' },
                                { principle: 'OCP (bonus)', violation: 'Adding Push Notifications meant modifying OrderService.', fix: 'New channels added as new classes — zero changes to existing code.' }
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
