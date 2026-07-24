import { Subject } from '../types/lesson';

export const BASE_PROMPT = `# Code Evolution Lesson Generator

Generate a step-by-step code evolution lesson for an interactive diff viewer. The lesson should show how code evolves from a naive implementation to a production-ready, well-designed solution.

## Topic
[Replace this with your specific topic, e.g., "Design a Rate Limiter using Token Bucket Algorithm" or "Implement Observer Pattern for Event System"]

## Requirements
1. Create 3-5 progressive commits showing code evolution
2. Start with a naive/monolithic implementation showing common design violations
3. Each subsequent commit should fix specific issues and apply design patterns
4. Include detailed architect notes analyzing trade-offs and SOLID compliance
5. Include interview-style pivot questions that test deep understanding
6. Optionally include a "mermaid" string with class diagram syntax showing class relationships

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
      "pivot_question": "A real interview question that tests understanding of the concepts in this step",
      "mermaid": "classDiagram\\n    class ParkingLot {\\n        +park_vehicle()\\n        +exit_vehicle()\\n    }"
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
- "Leadership Principles" — Behavioral patterns, System thinking, Decision frameworks`;

export const SEED_DATA: { subjects: Subject[] } = {
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

        # --- SRP FAILURE 2: Payment Handling in Parking Core ---
        if payment_type == "CREDIT_CARD":
            print(f"Charged \${fee} via Credit Card Gateway")
        elif payment_type == "CASH":
            print(f"Collected \${fee} Cash at register")

        del self.parked_vehicles[license_plate]
        return fee`,
                  architect_notes: `**SRP Analysis:** If the credit card API changes, \`ParkingLot\` changes (Line 67). If business rates change, \`ParkingLot\` changes (Line 57). This is a monolithic "God Class".

**OCP Analysis (The Pivot Test):** An interviewer asks: *"What if we want surge pricing during weekends?"* With this design, you're forced to edit \`exit_vehicle()\`, violating OCP.

**Key Violations:**
- Hardcoded pricing logic tied to vehicle types via if/elif chains
- Payment processing mixed into parking domain logic
- No abstraction layer — everything is concrete`,
                  pivot_question: `What happens when we add Surge Pricing? How would you modify this code to handle dynamic pricing without touching the core \`ParkingLot\` class?`,
                  mermaid: `classDiagram
    class ParkingLot {
        +dict parked_vehicles
        +park_vehicle(type, plate)
        +exit_vehicle(plate, payment_type)
    }
    note for ParkingLot "God Class violating SRP & OCP"
`
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

class HourlyCarPricing(PricingStrategy):
    def calculate_fee(self, hours: float) -> float:
        return hours * 10.0

class HourlyBikePricing(PricingStrategy):
    def calculate_fee(self, hours: float) -> float:
        return hours * 5.0

class SurgePricingStrategy(PricingStrategy):
    """Passing the OCP Pivot Test: Adding weekend surge pricing without touching core code."""
    def calculate_fee(self, hours: float) -> float:
        return hours * 25.0

# --- SRP FIX: Dedicated Payment Processor ---
class PaymentProcessor:
    def process_payment(self, amount: float, payment_method: str) -> bool:
        print(f"Processing payment of \${amount} via {payment_method}")
        return True

# --- Cleaned Core Class ---
class ParkingLot:
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

        fee = self.pricing_strategy.calculate_fee(hours_parked)
        self.payment_processor.process_payment(fee, payment_method)
        del self.parked_vehicles[license_plate]
        return fee`,
                  architect_notes: `**SRP Fix:** The \`ParkingLot\` class now only manages vehicle entry/exit (Line 120). Pricing is delegated to \`PricingStrategy\` (Line 92), and payment to \`PaymentProcessor\` (Line 113).

**OCP Fix:** Adding \`SurgePricingStrategy\` (Line 106) required zero changes to existing classes.

**DIP Applied:** \`ParkingLot.__init__()\` accepts abstract types via constructor injection (Line 126).`,
                  pivot_question: `How do we handle new vehicle types without breaking LSP? What if we need Electric Vehicle support with charging capabilities?`,
                  mermaid: `classDiagram
    class PricingStrategy {
        <<interface>>
        +calculate_fee(hours)*
    }
    class HourlyCarPricing {
        +calculate_fee(hours)
    }
    class HourlyBikePricing {
        +calculate_fee(hours)
    }
    class SurgePricingStrategy {
        +calculate_fee(hours)
    }
    class PaymentProcessor {
        +process_payment(amount, method)
    }
    class ParkingLot {
        -PricingStrategy pricing_strategy
        -PaymentProcessor payment_processor
        +park_vehicle(plate)
        +exit_vehicle(plate, hours, method)
    }
    PricingStrategy <|-- HourlyCarPricing
    PricingStrategy <|-- HourlyBikePricing
    PricingStrategy <|-- SurgePricingStrategy
    ParkingLot --> PricingStrategy : depends on abstraction
    ParkingLot --> PaymentProcessor : delegates payment
`
                },
                {
                  step: 3,
                  title: 'Commit 3: Fixing LSP & ISP (Electric Charging Spots)',
                  code: `# commit_3_final_lsp_isp.py
from abc import ABC, abstractmethod

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

class RegularCar(Vehicle):
    def __init__(self, plate: str):
        self.plate = plate

    def get_license_plate(self) -> str:
        return self.plate

class ElectricCar(Vehicle, Chargeable):
    """LSP & ISP COMPLIANT"""
    def __init__(self, plate: str):
        self.plate = plate

    def get_license_plate(self) -> str:
        return self.plate

    def charge_battery(self):
        print(f"Charging EV vehicle {self.plate}...")

class ParkingSpot(ABC):
    def __init__(self, spot_id: str):
        self.spot_id = spot_id
        self.is_occupied = False

    def assign_vehicle(self, vehicle: Vehicle):
        self.is_occupied = True

class ChargingSpot(ParkingSpot):
    def assign_vehicle(self, vehicle: Vehicle):
        super().assign_vehicle(vehicle)
        if isinstance(vehicle, Chargeable):
            vehicle.charge_battery()`,
                  architect_notes: `**ISP Fix:** Instead of cramming charging methods into \`Vehicle\`, we extracted a separate \`Chargeable\` interface (Line 8).

**LSP Compliance:** \`ElectricCar\` can be used anywhere a \`Vehicle\` is expected (Line 20). \`ChargingSpot\` extends \`ParkingSpot\` cleanly (Line 37).`,
                  pivot_question: `How would you handle a scenario where a ChargingSpot is assigned a non-electric vehicle? What patterns would you use to enforce type safety at the spot-assignment level?`,
                  mermaid: `classDiagram
    class Vehicle {
        <<interface>>
        +get_license_plate()*
    }
    class Chargeable {
        <<interface>>
        +charge_battery()*
    }
    class RegularCar {
        +get_license_plate()
    }
    class ElectricCar {
        +get_license_plate()
        +charge_battery()
    }
    Vehicle <|-- RegularCar
    Vehicle <|-- ElectricCar
    Chargeable <|-- ElectricCar
`
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
            smtp.sendmail("admin@myapp.com", email, f"Welcome {username}!")
            smtp.quit()
        except Exception as e:
            print(f"Email failed: {e}")

        # --- Responsibility 4: Activity Logging ---
        with open("activity.log", "a") as f:
            f.write(f"[{datetime.datetime.now()}] User registered: {username}\\n")

        return {"username": username, "email": email}

    def _hash_password(self, password: str) -> str:
        return f"hashed_{password}"`,
                  architect_notes: `**SRP Violation Breakdown:**
\`UserService\` has **four distinct responsibilities**:
- **Validation logic** (Line 12)
- **Database access** (Line 20)
- **Email sending** (Line 30)
- **Logging** (Line 42)

Each responsibility is an independent axis of change.`,
                  pivot_question: `If the business decides to switch from SQLite to PostgreSQL AND from Gmail SMTP to SendGrid simultaneously, how many places in this codebase need to change?`,
                  mermaid: `classDiagram
    class UserService {
        +register_user(username, email, password)
        -_hash_password(password)
    }
    note for UserService "Handles Validation, DB, SMTP & Logging in 1 class"
`
                },
                {
                  step: 2,
                  title: 'Commit 2: Each class has ONE reason to change',
                  code: `# srp_refactored.py — Single Responsibility APPLIED
import datetime

class UserValidator:
    def validate(self, username: str, email: str, password: str):
        errors = []
        if len(username) < 3: errors.append("Username too short")
        if "@" not in email: errors.append("Invalid email")
        if len(password) < 8: errors.append("Password too short")
        if errors: raise ValueError("; ".join(errors))

class UserRepository:
    def save(self, username: str, email: str, hashed_password: str):
        print(f"[DB] Saving user: {username} ({email})")
        return {"id": 1, "username": username, "email": email}

class EmailService:
    def send_welcome_email(self, email: str, username: str):
        print(f"[EMAIL] Sending welcome email to {email}")

class ActivityLogger:
    def log(self, message: str):
        print(f"[LOG] {message}")

class PasswordHasher:
    def hash(self, password: str) -> str:
        return f"bcrypt_hashed_{password}"

class UserRegistrationService:
    def __init__(self, validator: UserValidator, repository: UserRepository,
                 email_service: EmailService, logger: ActivityLogger, hasher: PasswordHasher):
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
        return user`,
                  architect_notes: `**SRP Applied:** Each class has a single responsibility:
- \`UserValidator\` (Line 4)
- \`UserRepository\` (Line 12)
- \`EmailService\` (Line 18)
- \`ActivityLogger\` (Line 23)
- \`PasswordHasher\` (Line 28)

\`UserRegistrationService\` (Line 32) acts strictly as a high-level orchestrator.`,
                  pivot_question: `If we need to add phone number verification to registration, which classes would change and which wouldn't?`,
                  mermaid: `classDiagram
    class UserValidator { +validate() }
    class UserRepository { +save() }
    class EmailService { +send_welcome_email() }
    class ActivityLogger { +log() }
    class PasswordHasher { +hash() }
    class UserRegistrationService {
        +register()
    }
    UserRegistrationService --> UserValidator
    UserRegistrationService --> UserRepository
    UserRegistrationService --> EmailService
    UserRegistrationService --> ActivityLogger
    UserRegistrationService --> PasswordHasher
`
                }
              ],
              summary: [
                { principle: 'SRP', violation: 'One class handled validation, DB, email, and logging.', fix: 'Extracted each concern into its own specialist class.' },
                { principle: 'Testability', violation: 'Can\'t unit test validation without a real DB and SMTP server.', fix: 'Each class is independently testable with mocks.' }
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
                  code: `# dip_naive.py
class EmailSender:
    def send(self, to: str, subject: str, body: str):
        print(f"[EMAIL] To: {to} | Subject: {subject}")

class SMSGateway:
    def send_sms(self, phone: str, message: str):
        print(f"[SMS] To: {phone} | {message}")

class OrderService:
    def __init__(self):
        # HARDCODED dependencies!
        self.email_sender = EmailSender()
        self.sms_gateway = SMSGateway()

    def place_order(self, customer_email: str, customer_phone: str, item: str):
        order_id = "ORD-1001"
        self.email_sender.send(customer_email, "Order Placed", item)
        self.sms_gateway.send_sms(customer_phone, f"Order {order_id} confirmed")`,
                  architect_notes: `**DIP Violation:** High-level \`OrderService\` directly instantiates and depends on concrete \`EmailSender\` and \`SMSGateway\` modules.

- Hardcoded dependencies prevent unit testing without sending real emails.
- Adding a new notification method requires editing \`OrderService\`.`,
                  pivot_question: `How would you write a unit test for OrderService.place_order() without actually sending emails or SMS?`,
                  mermaid: `classDiagram
    class OrderService {
        -EmailSender email_sender
        -SMSGateway sms_gateway
        +place_order()
    }
    class EmailSender { +send() }
    class SMSGateway { +send_sms() }
    OrderService --> EmailSender : tight coupling
    OrderService --> SMSGateway : tight coupling
`
                },
                {
                  step: 2,
                  title: 'Commit 2: Depend on abstractions — inverted control',
                  code: `# dip_refactored.py
from abc import ABC, abstractmethod
from typing import List

class NotificationService(ABC):
    @abstractmethod
    def notify(self, recipient: str, subject: str, message: str):
        pass

class EmailNotification(NotificationService):
    def notify(self, recipient: str, subject: str, message: str):
        print(f"[EMAIL] To: {recipient} | Subject: {subject}")

class SMSNotification(NotificationService):
    def notify(self, recipient: str, subject: str, message: str):
        print(f"[SMS] To: {recipient} | {message}")

class PushNotification(NotificationService):
    def notify(self, recipient: str, subject: str, message: str):
        print(f"[PUSH] To: {recipient} | {subject}")

class OrderService:
    def __init__(self, notifiers: List[NotificationService]):
        self.notifiers = notifiers

    def place_order(self, customer_id: str, item: str):
        for notifier in self.notifiers:
            notifier.notify(customer_id, "Order Placed", f"Order for {item}")`,
                  architect_notes: `**DIP Applied:** Both \`OrderService\` and concrete notification channels now depend on the abstract \`NotificationService\` interface (Line 5).

- **Inversion of Control:** Dependencies are injected via constructor.
- **Mocking:** Unit tests can inject a mock \`NotificationService\`.`,
                  pivot_question: `How would you implement a notification priority system where critical orders use all channels but routine orders only use email?`,
                  mermaid: `classDiagram
    class NotificationService {
        <<interface>>
        +notify(recipient, subject, message)*
    }
    class EmailNotification { +notify() }
    class SMSNotification { +notify() }
    class PushNotification { +notify() }
    class OrderService {
        -List~NotificationService~ notifiers
        +place_order()
    }
    NotificationService <|-- EmailNotification
    NotificationService <|-- SMSNotification
    NotificationService <|-- PushNotification
    OrderService --> NotificationService : depends on abstraction
`
                }
              ],
              summary: [
                { principle: 'DIP', violation: 'OrderService directly created EmailSender and SMSGateway internally.', fix: 'Depends on NotificationService abstraction, injected via constructor.' },
                { principle: 'Testability', violation: 'Unit testing OrderService required real email/SMS infrastructure.', fix: 'MockNotification enables isolated, fast unit tests.' }
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
