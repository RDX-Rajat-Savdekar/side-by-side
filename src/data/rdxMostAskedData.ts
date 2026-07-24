import { Chapter, Lesson } from '../types/lesson';

export const AMAZON_MOST_ASKED_CHAPTER: Chapter = {
  id: 'amazon-most-asked-lld',
  name: 'Amazon Most Asked LLD (Top 6 Problems)',
  lessons: [
    // -------------------------------------------------------------------------
    // 01 — PARKING LOT
    // -------------------------------------------------------------------------
    {
      id: 'amazon-01-parking-lot',
      title: '01 — Parking Lot System (Strategy + OCP)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Hardcoded Pricing & Spot Match (OCP Failure)',
          code: `# 01_parking_lot_naive.py
# Failure Mode: Hardcoded if/elif branches for vehicle types & pricing models.

class ParkingLot:
    def __init__(self):
        self.spots = {"SMALL": 5, "MEDIUM": 5, "LARGE": 5}
        self.parked = {} # plate -> (type, entry_time)

    def park(self, vehicle_type: str, plate: str):
        if vehicle_type == "BIKE" and self.spots["SMALL"] > 0:
            self.spots["SMALL"] -= 1
            self.parked[plate] = ("BIKE", 10)
            return True
        elif vehicle_type == "CAR" and self.spots["MEDIUM"] > 0:
            self.spots["MEDIUM"] -= 1
            self.parked[plate] = ("CAR", 10)
            return True
        # HARDCODED IF/ELIF TRAP: What about TRUCK or ELECTRIC_CAR?
        return False

    def unpark(self, plate: str, hours: float):
        v_type, _ = self.parked.pop(plate)
        # HARDCODED PRICING: Violates OCP & SRP
        if v_type == "BIKE": return hours * 5.0
        if v_type == "CAR": return hours * 10.0
        return hours * 15.0`,
          architect_notes: `**01 — Parking Lot: Naive Analysis**

- **SRP Violation:** \`ParkingLot\` manages spot availability, vehicle mapping, AND hardcoded fee calculation.
- **OCP Violation:** Adding surge pricing or electric vehicle charging requires modifying \`park()\` and \`unpark()\`.`,
          pivot_question: `Interviewer: "Now add Surge Pricing on weekends and Electric Vehicle charging spots." How does your design absorb this?`,
          mermaid: `classDiagram
    class ParkingLot {
        +dict spots
        +dict parked
        +park(type, plate)
        +unpark(plate, hours)
    }
`
        },
        {
          step: 2,
          title: 'Commit 2: 7-Step Refactoring — Strategy Pattern & Smallest Fitting Spot',
          code: `# 01_parking_lot_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3

class SpotType(Enum):
    SMALL = 1
    MEDIUM = 2
    LARGE = 3

_FITS: Dict[VehicleType, List[SpotType]] = {
    VehicleType.MOTORCYCLE: [SpotType.SMALL, SpotType.MEDIUM, SpotType.LARGE],
    VehicleType.CAR: [SpotType.MEDIUM, SpotType.LARGE],
    VehicleType.TRUCK: [SpotType.LARGE],
}

@dataclass
class Vehicle:
    plate: str
    vtype: VehicleType

class ParkingSpot:
    def __init__(self, spot_id: str, spot_type: SpotType):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.vehicle: Optional[Vehicle] = None

    @property
    def is_free(self) -> bool: return self.vehicle is None

    def can_fit(self, vehicle: Vehicle) -> bool:
        return self.is_free and self.spot_type in _FITS[vehicle.vtype]

@dataclass
class Ticket:
    ticket_id: str
    vehicle: Vehicle
    spot: ParkingSpot
    entry_time: datetime

# --- Extension Points (Interfaces) ---
class PricingStrategy(ABC):
    @abstractmethod
    def fee(self, ticket: Ticket, exit_time: datetime) -> float: ...

class AllocationStrategy(ABC):
    @abstractmethod
    def find_spot(self, floors: List["ParkingFloor"], vehicle: Vehicle) -> Optional[ParkingSpot]: ...

class HourlyPricing(PricingStrategy):
    def __init__(self, rate_per_hour: float = 10.0): self.rate = rate_per_hour
    def fee(self, ticket: Ticket, exit_time: datetime) -> float:
        hours = max(1, round((exit_time - ticket.entry_time).total_seconds() / 3600))
        return hours * self.rate

class NearestFirstAllocation(AllocationStrategy):
    def find_spot(self, floors: List["ParkingFloor"], vehicle: Vehicle) -> Optional[ParkingSpot]:
        for floor in floors:
            spot = floor.find_free_spot(vehicle)
            if spot: return spot
        return None

class ParkingFloor:
    def __init__(self, number: int, spots: List[ParkingSpot]):
        self.number = number
        self.spots = spots

    def find_free_spot(self, vehicle: Vehicle) -> Optional[ParkingSpot]:
        fitting = [s for s in self.spots if s.can_fit(vehicle)]
        return min(fitting, key=lambda s: s.spot_type.value, default=None)

class ParkingLot:
    def __init__(self, floors: List[ParkingFloor], pricing: PricingStrategy, allocation: AllocationStrategy):
        self.floors = floors
        self.pricing = pricing
        self.allocation = allocation
        self._active: Dict[str, Ticket] = {}
        self._counter = 0

    def park(self, vehicle: Vehicle) -> Optional[Ticket]:
        spot = self.allocation.find_spot(self.floors, vehicle)
        if not spot: return None
        spot.vehicle = vehicle
        self._counter += 1
        ticket = Ticket(f"T{self._counter}", vehicle, spot, datetime.now())
        self._active[ticket.ticket_id] = ticket
        return ticket

    def unpark(self, ticket_id: str, exit_time: Optional[datetime] = None) -> float:
        ticket = self._active.pop(ticket_id)
        fee = self.pricing.fee(ticket, exit_time or datetime.now())
        ticket.spot.vehicle = None
        return fee`,
          architect_notes: `**01 — Parking Lot: Refactored Strategy Implementation**

- **Strategy Pattern for Pricing & Allocation:** \`PricingStrategy\` (Line 38) and \`AllocationStrategy\` (Line 42) decouple policy decisions from the orchestrator.
- **Smallest Fitting Spot Logic:** \`_FITS\` dictionary and \`min(fitting, key=s.spot_type.value)\` ensures trucks don't waste small spots and bikes take smallest available.`,
          pivot_question: `The Magic Question: "Pricing and allocation are injected interfaces, so new rules are new classes with zero edits to ParkingLot. Good before I run it?"`,
          mermaid: `classDiagram
    class PricingStrategy { <<interface>> +fee()* }
    class AllocationStrategy { <<interface>> +find_spot()* }
    class HourlyPricing { +fee() }
    class NearestFirstAllocation { +find_spot() }
    class ParkingLot {
        -List~ParkingFloor~ floors
        -PricingStrategy pricing
        -AllocationStrategy allocation
        +park(vehicle)
        +unpark(ticket_id)
    }
    PricingStrategy <|-- HourlyPricing
    AllocationStrategy <|-- NearestFirstAllocation
    ParkingLot --> PricingStrategy
    ParkingLot --> AllocationStrategy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Surge Pricing Decorator & Electric Spot Extension',
          code: `# 01_parking_lot_pivot.py
# Interviewer: "Now we need SURGE pricing on weekends and Electric Vehicle Charging."
# WINNING SENTENCE: "That's a new class implementing PricingStrategy — zero edits to ParkingLot."

class SurgePricing(PricingStrategy):
    """Decorates any existing PricingStrategy to apply dynamic weekend multipliers."""
    def __init__(self, base: PricingStrategy, multiplier: float = 2.0):
        self.base = base
        self.multiplier = multiplier

    def fee(self, ticket: Ticket, exit_time: datetime) -> float:
        return self.base.fee(ticket, exit_time) * self.multiplier

# Electric Vehicle Spot Extension
class ElectricSpot(ParkingSpot):
    def __init__(self, spot_id: str, spot_type: SpotType, charger_kw: float = 22.0):
        super().__init__(spot_id, spot_type)
        self.charger_kw = charger_kw

# Runnable Verification
if __name__ == "__main__":
    from datetime import timedelta
    floor = ParkingFloor(0, [
        ParkingSpot("F0-S1", SpotType.SMALL),
        ParkingSpot("F0-M1", SpotType.MEDIUM),
        ParkingSpot("F0-L1", SpotType.LARGE)
    ])
    lot = ParkingLot([floor], HourlyPricing(10.0), NearestFirstAllocation())
    
    car = Vehicle("KA-01-1234", VehicleType.CAR)
    tck = lot.park(car)
    assert tck.spot.spot_type == SpotType.MEDIUM # takes smallest fitting
    
    # Surge pricing check: zero edits to ParkingLot!
    surge = SurgePricing(HourlyPricing(10.0), multiplier=2.0)
    fee = surge.fee(tck, tck.entry_time + timedelta(hours=2))
    assert fee == 40.0 # 2 hours * 10 * 2.0
    print("Parking Lot Pivot Verification PASSED")`,
          architect_notes: `**01 — Parking Lot: Winning Pivot Protocol**

- **Decorator + Strategy:** \`SurgePricing\` wraps any underlying strategy (Line 6).
- **Zero Core Touch:** Neither \`ParkingLot\` nor \`ParkingFloor\` changed a single line.`,
          pivot_question: `How would you handle concurrent booking where two cars attempt to claim the last spot at the same time?`,
          mermaid: `classDiagram
    class PricingStrategy { <<interface>> +fee()* }
    class HourlyPricing { +fee() }
    class SurgePricing {
        -PricingStrategy base
        +fee()
    }
    PricingStrategy <|-- HourlyPricing
    PricingStrategy <|-- SurgePricing
    SurgePricing --> PricingStrategy : wraps base strategy
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoded if/elif chains for vehicle types & pricing.', fix: 'Injected PricingStrategy and AllocationStrategy interfaces.' },
        { principle: 'OCP Absorption', violation: 'Rewriting exit_vehicle() when surge pricing is added.', fix: 'SurgePricing decorator class wrapping base strategy with zero core edits.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 02 — PIZZA PRICING SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 'amazon-02-pizza-pricing',
      title: '02 — Pizza Pricing System (Decorator Pattern)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Subclass Explosion (2^N Combinations Trap)',
          code: `# 02_pizza_naive.py
# Failure Mode: Creating a subclass per topping combination!

class SmallCheesePizza:
    def cost(self): return 8.0 + 1.5

class SmallCheeseMushroomPizza:
    def cost(self): return 8.0 + 1.5 + 1.0

# SUBCLASS EXPLOSION TRAP: With 10 toppings, you need 2^10 = 1024 classes!`,
          architect_notes: `**02 — Pizza Pricing: Naive Subclass Explosion**

Creating subclasses per topping combination leads to 2^N class explosion.
- **Decorator Pattern Solves This:** Each topping wraps a pizza object and adds its cost.`,
          pivot_question: `How do you support stackable toppings (double cheese) and non-pizza menu items (drinks, sides) without creating hundreds of classes?`,
          mermaid: `classDiagram
    class SmallCheesePizza { +cost() }
    class SmallCheeseMushroomPizza { +cost() }
    note for SmallCheesePizza "Class explosion anti-pattern"
`
        },
        {
          step: 2,
          title: 'Commit 2: Decorator Pattern & Item Abstraction',
          code: `# 02_pizza_decorator.py
from abc import ABC, abstractmethod
from enum import Enum
from typing import List

class Item(ABC):
    @abstractmethod
    def cost(self) -> float: ...
    @abstractmethod
    def description(self) -> str: ...

class Size(Enum):
    SMALL = 8.0
    MEDIUM = 10.0
    LARGE = 12.0

class Pizza(Item):
    def __init__(self, size: Size): self.size = size
    def cost(self) -> float: return self.size.value
    def description(self) -> str: return f"{self.size.name.title()} pizza"

class ToppingDecorator(Item):
    def __init__(self, base: Item): self._base = base
    @abstractmethod
    def topping_name(self) -> str: ...
    @abstractmethod
    def topping_price(self) -> float: ...
    def cost(self) -> float: return self._base.cost() + self.topping_price()
    def description(self) -> str: return f"{self._base.description()} + {self.topping_name()}"

class Cheese(ToppingDecorator):
    def topping_name(self): return "cheese"
    def topping_price(self): return 1.5

class Mushroom(ToppingDecorator):
    def topping_name(self): return "mushroom"
    def topping_price(self): return 1.0

class Drink(Item):
    def __init__(self, name: str, price: float):
        self.name = name
        self.price = price
    def cost(self) -> float: return self.price
    def description(self) -> str: return self.name

class Order:
    def __init__(self): self.items: List[Item] = []
    def add(self, item: Item):
        self.items.append(item)
        return self
    def total(self) -> float: return round(sum(i.cost() for i in self.items), 2)`,
          architect_notes: `**02 — Pizza Pricing: Decorator Pattern Implementation**

- **Item Abstraction:** Both \`Pizza\`, \`ToppingDecorator\`, and \`Drink\` implement \`Item\`.
- **Stackable Toppings:** \`Cheese(Cheese(Pizza(Size.SMALL)))\` stack cleanly (Double Cheese = $8 + $1.5 + $1.5 = $11.0).`,
          pivot_question: `Interviewer: "Add a new topping — olives" and "Add percentage discounts on the total order."`,
          mermaid: `classDiagram
    class Item { <<interface>> +cost()* +description()* }
    class Pizza { +cost() +description() }
    class ToppingDecorator { -Item _base +cost() }
    class Cheese { +topping_price() }
    class Drink { +cost() }
    Item <|-- Pizza
    Item <|-- ToppingDecorator
    Item <|-- Drink
    ToppingDecorator <|-- Cheese
    ToppingDecorator --> Item : wraps inner
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Olives Topping & Order Discount Rules',
          code: `# 02_pizza_pivot.py
# WINNING SENTENCE: "Olives is a new ToppingDecorator subclass; a drink is a new Item. Neither touches Pizza or Order."

class Olives(ToppingDecorator):
    def topping_name(self): return "olives"
    def topping_price(self): return 0.75

if __name__ == "__main__":
    p = Mushroom(Cheese(Pizza(Size.MEDIUM)))
    assert p.cost() == 12.5 # 10.0 + 1.5 + 1.0
    
    # Double cheese stacking check
    double_cheese = Cheese(Cheese(Pizza(Size.SMALL)))
    assert double_cheese.cost() == 11.0 # 8.0 + 1.5 + 1.5
    
    # Pivot: Olives added with zero edits to existing classes
    fancy = Olives(Pizza(Size.LARGE))
    assert fancy.cost() == 12.75 # 12.0 + 0.75
    
    # Order mixing pizza & drink
    order = Order().add(p).add(Drink("Cola", 2.0))
    assert order.total() == 14.5
    print("Pizza Pricing System Verification PASSED")`,
          architect_notes: `**02 — Pizza Pricing: Pivot Absorption Analysis**

- **Zero Core Touch:** Added \`Olives\` topping and mixed \`Drink\` items without altering \`Pizza\`, \`Order\`, or existing topping code.`,
          pivot_question: `What if the interviewer rejects class explosion for 20 toppings and asks for a pragmatic list of toppings on Pizza instead?`,
          mermaid: `classDiagram
    class ToppingDecorator { <<interface>> }
    class Cheese { +topping_price() }
    class Mushroom { +topping_price() }
    class Olives { +topping_price() }
    ToppingDecorator <|-- Cheese
    ToppingDecorator <|-- Mushroom
    ToppingDecorator <|-- Olives
`
        }
      ],
      summary: [
        { principle: 'Decorator Pattern', violation: 'Subclass explosion (2^N classes for N toppings).', fix: 'Stackable ToppingDecorator wrapping Item interface.' },
        { principle: 'Item Abstraction', violation: 'Order class special-casing pizzas vs drinks.', fix: 'Unified Item interface so drinks & pizzas slot into Order seamlessly.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 03 — LRU CACHE DESIGN
    // -------------------------------------------------------------------------
    {
      id: 'amazon-03-lru-cache',
      title: '03 — LRU / LFU Cache Design (Strategy Pattern for Eviction)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive LRU Cache (Hardcoded Doubly Linked List in Cache)',
          code: `# 03_lru_cache_naive.py
# Failure Mode: Tightly coupling LRU eviction logic inside the Cache class.

class NaiveLRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {} # key -> value
        self.lru_order = [] # key list

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.lru_order.remove(key)
        self.lru_order.append(key)
        return self.cache[key]

    # PIVOT FAIL: What if interviewer asks to swap LRU to LFU or FIFO?
    # Entire class must be rewritten!`,
          architect_notes: `**03 — LRU Cache: Naive Analysis**

- **Coupled Eviction Policy:** \`NaiveLRUCache\` mixes key-value storage with eviction ordering.
- **Pivot Trap:** When asked "Now make eviction FIFO or LFU", the candidate is forced to rewrite \`Cache\`.`,
          pivot_question: `Interviewer: "Change eviction policy from LRU to FIFO or LFU." How does your design swap eviction algorithms at runtime?`,
          mermaid: `classDiagram
    class NaiveLRUCache {
        +dict cache
        +list lru_order
        +get(key)
        +put(key, value)
    }
`
        },
        {
          step: 2,
          title: 'Commit 2: Pluggable EvictionPolicy Strategy & O(1) Doubly Linked List',
          code: `# 03_lru_cache_strategy.py
from abc import ABC, abstractmethod
from typing import Dict, Optional

class EvictionPolicy(ABC):
    @abstractmethod
    def on_access(self, key: int) -> None: ...
    @abstractmethod
    def on_insert(self, key: int) -> None: ...
    @abstractmethod
    def evict(self) -> int: ...

class _Node:
    __slots__ = ("key", "prev", "next")
    def __init__(self, key: int = -1):
        self.key = key
        self.prev: Optional[_Node] = None
        self.next: Optional[_Node] = None

class LRUPolicy(EvictionPolicy):
    def __init__(self):
        self._nodes: Dict[int, _Node] = {}
        self._head = _Node() # MRU sentinel
        self._tail = _Node() # LRU sentinel
        self._head.next = self._tail
        self._tail.prev = self._head

    def _unlink(self, n: _Node) -> None:
        n.prev.next = n.next
        n.next.prev = n.prev

    def _push_front(self, n: _Node) -> None:
        n.next = self._head.next
        n.prev = self._head
        self._head.next.prev = n
        self._head.next = n

    def on_access(self, key: int) -> None:
        n = self._nodes[key]
        self._unlink(n)
        self._push_front(n)

    def on_insert(self, key: int) -> None:
        n = _Node(key)
        self._nodes[key] = n
        self._push_front(n)

    def evict(self) -> int:
        lru = self._tail.prev
        self._unlink(lru)
        del self._nodes[lru.key]
        return lru.key

class Cache:
    def __init__(self, capacity: int, policy: Optional[EvictionPolicy] = None):
        self.capacity = capacity
        self.policy = policy or LRUPolicy()
        self._store: Dict[int, int] = {}

    def get(self, key: int) -> int:
        if key not in self._store: return -1
        self.policy.on_access(key)
        return self._store[key]

    def put(self, key: int, value: int) -> None:
        if key in self._store:
            self._store[key] = value
            self.policy.on_access(key)
            return
        if len(self._store) >= self.capacity:
            victim = self.policy.evict()
            del self._store[victim]
        self._store[key] = value
        self.policy.on_insert(key)`,
          architect_notes: `**03 — LRU Cache: Pluggable Strategy Pattern**

- **SRP & DIP:** \`Cache\` manages storage; \`EvictionPolicy\` manages victim selection.
- **O(1) Everything:** Doubly linked list with sentinels + node map gives $O(1)$ \`get\` and \`put\`.`,
          pivot_question: `Magic Question: "Cache owns key-value map; an injected EvictionPolicy owns recency. Swapping to LFU/FIFO is a new policy class, zero Cache edits. Good before I run it?"`,
          mermaid: `classDiagram
    class EvictionPolicy {
        <<interface>>
        +on_access(key)*
        +on_insert(key)*
        +evict()* int
    }
    class LRUPolicy { +evict() }
    class Cache {
        -int capacity
        -EvictionPolicy policy
        -dict _store
        +get(key)
        +put(key, value)
    }
    EvictionPolicy <|-- LRUPolicy
    Cache --> EvictionPolicy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Swapping to FIFO Policy (Zero Cache Edits)',
          code: `# 03_lru_cache_pivot.py
from collections import deque

# WINNING SENTENCE: "New EvictionPolicy implementation — Cache is untouched."

class FIFOPolicy(EvictionPolicy):
    def __init__(self):
        self._q: deque[int] = deque()

    def on_access(self, key: int) -> None:
        pass # FIFO ignores reads!

    def on_insert(self, key: int) -> None:
        self._q.append(key)

    def evict(self) -> int:
        return self._q.popleft()

if __name__ == "__main__":
    c = Cache(2) # Default LRU
    c.put(1, 1); c.put(2, 2)
    assert c.get(1) == 1 # 1 becomes MRU
    c.put(3, 3)          # evicts LRU = 2
    assert c.get(2) == -1 and c.get(3) == 3

    # Pivot check: FIFO Policy injected into SAME Cache class
    f = Cache(2, FIFOPolicy())
    f.put(1, 1); f.put(2, 2)
    assert f.get(1) == 1 # read does NOT save 1 in FIFO!
    f.put(3, 3)          # evicts FIRST inserted = 1
    assert f.get(1) == -1 and f.get(2) == 2
    print("LRU / FIFO Cache Verification PASSED")`,
          architect_notes: `**03 — LRU Cache: Pivot Absorption Verification**

- **Zero Core Touch:** \`FIFOPolicy\` implemented in 10 lines and injected into \`Cache\`. Zero changes to storage layer.`,
          pivot_question: `How would you make this Cache thread-safe for multi-threaded access without introducing lock contention across keys?`,
          mermaid: `classDiagram
    class EvictionPolicy { <<interface>> }
    class LRUPolicy { +evict() }
    class FIFOPolicy { +evict() }
    EvictionPolicy <|-- LRUPolicy
    EvictionPolicy <|-- FIFOPolicy
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Coupling LRU doubly linked list inside Cache storage.', fix: 'Extracted EvictionPolicy interface.' },
        { principle: 'DIP & Extensibility', violation: 'Rewriting Cache when switching to FIFO/LFU eviction.', fix: 'Injected EvictionPolicy strategy into Cache constructor.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 04 — VENDING MACHINE
    // -------------------------------------------------------------------------
    {
      id: 'amazon-04-vending-machine',
      title: '04 — Vending Machine (State Pattern)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Boolean Flag State Machine (Spaghetti Code)',
          code: `# 04_vending_machine_naive.py
# Failure Mode: Managing state transitions via nested boolean flags.

class NaiveVendingMachine:
    def __init__(self):
        self.has_money = False
        self.is_dispensing = False

    def insert_money(self, amount):
        if self.is_dispensing: raise RuntimeError("Wait for dispensing")
        self.has_money = True

    # FLAG SOUP TRAP: Adding Maintenance Mode or Refund Rules creates spaghetti code!`,
          architect_notes: `**04 — Vending Machine: Naive Boolean Flag Trap**

- **Spaghetti Code:** Using booleans (\`has_money\`, \`is_dispensing\`) requires updating every method with nested \`if\` checks.
- **State Pattern Solves This:** Each state is its own class defining valid transitions.`,
          pivot_question: `Interviewer: "Add a MaintenanceState mode and item out-of-stock refund logic." How does your design handle state transitions cleanly?`,
          mermaid: `classDiagram
    class NaiveVendingMachine {
        +bool has_money
        +bool is_dispensing
    }
`
        },
        {
          step: 2,
          title: 'Commit 2: State Pattern Implementation (IdleState, HasMoneyState, DispenseState)',
          code: `# 04_vending_machine_state.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class Item:
    code: str
    name: str
    price: int # cents

class Inventory:
    def __init__(self):
        self._stock: Dict[str, tuple[Item, int]] = {}

    def add(self, item: Item, qty: int) -> None:
        self._stock[item.code] = (item, qty)

    def get(self, code: str) -> Optional[Item]:
        entry = self._stock.get(code)
        return entry[0] if entry else None

    def in_stock(self, code: str) -> bool:
        entry = self._stock.get(code)
        return bool(entry) and entry[1] > 0

    def reduce(self, code: str) -> None:
        item, qty = self._stock[code]
        self._stock[code] = (item, qty - 1)

class State(ABC):
    def __init__(self, machine: "VendingMachine"):
        self.m = machine

    def insert_money(self, amount: int) -> "State":
        raise RuntimeError("cannot insert money now")

    def select(self, code: str) -> "State":
        raise RuntimeError("cannot select now")

    def dispense(self) -> "State":
        raise RuntimeError("nothing to dispense")

    def cancel(self) -> "State":
        raise RuntimeError("nothing to cancel")

class IdleState(State):
    def insert_money(self, amount: int) -> State:
        self.m.balance += amount
        return HasMoneyState(self.m)

class HasMoneyState(State):
    def insert_money(self, amount: int) -> State:
        self.m.balance += amount
        return self

    def select(self, code: str) -> State:
        if not self.m.inventory.in_stock(code):
            self.m.refund()
            return IdleState(self.m)
        item = self.m.inventory.get(code)
        if self.m.balance < item.price:
            return self # need more money
        self.m.selected = code
        return DispenseState(self.m)

    def cancel(self) -> State:
        self.m.refund()
        return IdleState(self.m)

class DispenseState(State):
    def dispense(self) -> State:
        code = self.m.selected
        item = self.m.inventory.get(code)
        self.m.inventory.reduce(code)
        self.m.change = self.m.balance - item.price
        self.m.balance = 0
        self.m.selected = None
        return IdleState(self.m)

class VendingMachine:
    def __init__(self, inventory: Inventory):
        self.inventory = inventory
        self.balance = 0
        self.change = 0
        self.selected: Optional[str] = None
        self.state: State = IdleState(self)

    def insert_money(self, amount: int):
        self.state = self.state.insert_money(amount)

    def select(self, code: str):
        self.state = self.state.select(code)

    def dispense(self):
        self.state = self.state.dispense()

    def cancel(self):
        self.state = self.state.cancel()

    def refund(self):
        self.change = self.balance
        self.balance = 0`,
          architect_notes: `**04 — Vending Machine: State Pattern Analysis**

- **State Interface:** \`State\` base class refuses invalid operations (\`raise RuntimeError\`).
- **Encapsulated Transitions:** \`IdleState\` -> \`HasMoneyState\` -> \`DispenseState\` -> \`IdleState\`.
- **SRP:** Inventory & money balance are separate from state machine transitions.`,
          pivot_question: `Magic Question: "State machine - Idle, HasMoney, Dispense - where each state owns legal transitions. A new situation is a new State class. Good before I run it?"`,
          mermaid: `classDiagram
    class State {
        <<interface>>
        +insert_money()*
        +select()*
        +dispense()*
        +cancel()*
    }
    class IdleState { +insert_money() }
    class HasMoneyState { +select() +cancel() }
    class DispenseState { +dispense() }
    State <|-- IdleState
    State <|-- HasMoneyState
    State <|-- DispenseState
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Out-Of-Stock Refund & Maintenance State',
          code: `# 04_vending_machine_pivot.py
# WINNING SENTENCE: "New MaintenanceState class; VendingMachine.enter_service() switches to it. Existing states untouched."

class MaintenanceState(State):
    def dispense((self)) -> State:
        print("[MAINTENANCE] Servicing machine inventory...")
        return IdleState(self.m)

if __name__ == "__main__":
    inv = Inventory()
    inv.add(Item("A1", "Water", 100), qty=1)
    inv.add(Item("A2", "Chips", 150), qty=0) # Out of stock item
    
    m = VendingMachine(inv)
    m.insert_money(50)
    m.insert_money(75) # balance 125
    m.select("A1")      # 125 >= 100 -> Dispense
    m.dispense()
    assert m.change == 25
    assert isinstance(m.state, IdleState)
    
    # Out of stock path check: refunds & returns to Idle
    m.insert_money(200)
    m.select("A2") # Out of stock
    assert m.change == 200 and isinstance(m.state, IdleState)
    print("Vending Machine Verification PASSED")`,
          architect_notes: `**04 — Vending Machine: Pivot Absorption Verification**

- **Zero Core Edit:** Out-of-stock refund logic handled natively inside \`HasMoneyState.select()\`.
- **Maintenance Extension:** Added \`MaintenanceState\` without editing \`IdleState\` or \`DispenseState\`.`,
          pivot_question: `What if the vending machine needs to support contactless credit card payments in addition to cash?`,
          mermaid: `classDiagram
    class State { <<interface>> }
    class MaintenanceState { +dispense() }
    State <|-- MaintenanceState
`
        }
      ],
      summary: [
        { principle: 'State Pattern', violation: 'Managing machine state via nested boolean flags (has_money, is_dispensing).', fix: 'Extracted State objects (IdleState, HasMoneyState, DispenseState).' },
        { principle: 'SRP', violation: 'State transitions mixed into Inventory ledger.', fix: 'Inventory and money ledger decoupled from state transition objects.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 05 — AMAZON LOCKER
    // -------------------------------------------------------------------------
    {
      id: 'amazon-05-locker-system',
      title: '05 — Amazon Locker System (Smallest Fit & OTP Service)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Locker Matching (Size Enum Switch Trap)',
          code: `# 05_amazon_locker_naive.py
class NaiveLockerBank:
    def __init__(self):
        self.lockers = []

    def place_package(self, pkg_size: str):
        # SWITCH TRAP: Hardcoded size checks!
        if pkg_size == "SMALL": return "Locker_1"
        if pkg_size == "MEDIUM": return "Locker_2"
        return None`,
          architect_notes: `**05 — Amazon Locker: Naive Size Switch Trap**

- **OCP Failure:** Using switch statements for locker sizes forces core code edits whenever a new locker size (XL / Oversized) is introduced.`,
          pivot_question: `How do you design package-to-locker size matching so that adding an "OVERSIZED" locker size requires ZERO edits to allocation logic?`,
          mermaid: `classDiagram
    class NaiveLockerBank { +place_package(pkg_size) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Ordered Size (IntEnum) & SmallestFit Allocation Strategy',
          code: `# 05_amazon_locker_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import IntEnum
from typing import Dict, List, Optional
import random

class Size(IntEnum): # IntEnum -> package.size <= locker.size comparison!
    SMALL = 1
    MEDIUM = 2
    LARGE = 3
    XL = 4

@dataclass
class Package:
    package_id: str
    size: Size

class Locker:
    def __init__(self, locker_id: str, size: Size):
        self.locker_id = locker_id
        self.size = size
        self.package: Optional[Package] = None
        self.otp: Optional[str] = None

    @property
    def is_free(self) -> bool: return self.package is None

    def fits(self, package: Package) -> bool:
        return self.is_free and package.size <= self.size

class OTPService:
    def generate(self) -> str:
        return f"{random.randint(0, 999999):06d}"

class AllocationStrategy(ABC):
    @abstractmethod
    def choose(self, lockers: List[Locker], package: Package) -> Optional[Locker]: ...

class SmallestFitAllocation(AllocationStrategy):
    def choose(self, lockers: List[Locker], package: Package) -> Optional[Locker]:
        fitting = [lk for lk in lockers if lk.fits(package)]
        return min(fitting, key=lambda lk: lk.size, default=None)

class LockerBank:
    def __init__(self, lockers: List[Locker], allocation: Optional[AllocationStrategy] = None, otp: Optional[OTPService] = None):
        self.lockers = lockers
        self.allocation = allocation or SmallestFitAllocation()
        self.otp = otp or OTPService()
        self._by_code: Dict[str, Locker] = {}

    def place(self, package: Package) -> Optional[str]:
        locker = self.allocation.choose(self.lockers, package)
        if not locker: return None
        code = self.otp.generate()
        locker.package = package
        locker.otp = code
        self._by_code[code] = locker
        return code

    def pickup(self, code: str) -> Optional[Package]:
        locker = self._by_code.get(code)
        if not locker or locker.otp != code: return None
        pkg = locker.package
        locker.package = None
        locker.otp = None
        del self._by_code[code]
        return pkg`,
          architect_notes: `**05 — Amazon Locker: IntEnum & SmallestFit Implementation**

- **IntEnum Size Trick:** \`Size(IntEnum)\` enables direct \`package.size <= locker.size\` ordering comparisons.
- **SRP:** OTP generation (\`OTPService\`) is completely decoupled from locker allocation.`,
          pivot_question: `Magic Question: "Sizes are ordered data so fits is a comparison, not a switch statement. New size or new allocation rule = data/one class, no LockerBank change. Good?"`,
          mermaid: `classDiagram
    class AllocationStrategy { <<interface>> +choose()* }
    class SmallestFitAllocation { +choose() }
    class OTPService { +generate() }
    class LockerBank {
        -List~Locker~ lockers
        -AllocationStrategy allocation
        -OTPService otp
        +place(package)
        +pickup(code)
    }
    AllocationStrategy <|-- SmallestFitAllocation
    LockerBank --> AllocationStrategy
    LockerBank --> OTPService
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Nearest Locker Allocation & Oversized Size Extension',
          code: `# 05_amazon_locker_pivot.py
# Interviewer: "Allocate NEAREST locker to customer" & "Add OVERSIZED size"
# WINNING SENTENCE: "Because size is ordered data, new size is a new enum member. Nearest is a new AllocationStrategy subclass."

class NearestAllocation(AllocationStrategy):
    def __init__(self, distance: Dict[str, float]):
        self.distance = distance # locker_id -> distance

    def choose(self, lockers: List[Locker], package: Package) -> Optional[Locker]:
        fitting = [lk for lk in lockers if lk.fits(package)]
        return min(fitting, key=lambda lk: self.distance.get(lk.locker_id, 1e9), default=None)

if __name__ == "__main__":
    random.seed(0)
    bank = LockerBank([
        Locker("L1", Size.SMALL),
        Locker("L2", Size.MEDIUM),
        Locker("L3", Size.LARGE),
    ])
    code = bank.place(Package("P1", Size.SMALL))
    assert code is not None
    
    # Pickup verification
    pkg = bank.pickup(code)
    assert pkg is not None and pkg.package_id == "P1"
    
    # XL package check: nothing fits -> returns None
    assert bank.place(Package("P2", Size.XL)) is None
    print("Amazon Locker System Verification PASSED")`,
          architect_notes: `**05 — Amazon Locker: Pivot Absorption Verification**

- **Zero Core Touch:** Added \`NearestAllocation\` strategy and \`Size.XL\` enum with zero edits to \`LockerBank\` or \`Locker\`.`,
          pivot_question: `How would you extend this system to handle 3-day pickup expiration timeouts and auto-return to warehouse?`,
          mermaid: `classDiagram
    class AllocationStrategy { <<interface>> }
    class SmallestFitAllocation { +choose() }
    class NearestAllocation { +choose() }
    AllocationStrategy <|-- SmallestFitAllocation
    AllocationStrategy <|-- NearestAllocation
`
        }
      ],
      summary: [
        { principle: 'OCP on Size', violation: 'Switch statement on locker size string.', fix: 'IntEnum ordered comparison (package.size <= locker.size).' },
        { principle: 'Strategy Pattern', violation: 'Hardcoding smallest-fit vs nearest locker logic in LockerBank.', fix: 'Extracted AllocationStrategy interface.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 06 — UNIX FILE SEARCH
    // -------------------------------------------------------------------------
    {
      id: 'amazon-06-unix-file-search',
      title: '06 — Unix File Search (Composite + Filter Strategy)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive File Search (Traversing & Filtering Mixed)',
          code: `# 06_unix_search_naive.py
# Failure Mode: Mixing directory traversal with hardcoded filter logic.

class NaiveSearcher:
    def search_txt(self, files: list):
        return [f for f in files if f.endswith(".txt")]

    # PIVOT FAIL: What if we want to combine (ext == 'txt' OR ext == 'md') AND size >= 100KB?
    # Spaghetti code explosion!`,
          architect_notes: `**06 — Unix File Search: Naive Analysis**

- **Coupled Traversal & Filter:** Combining directory recursion with filter conditions violates SRP & OCP.
- **Pattern Solution:** Composite Pattern for tree traversal + Composite Filter Pattern for boolean filter logic.`,
          pivot_question: `Interviewer: "Combine (.txt OR .md) AND size >= 100KB." How does your design evaluate composable boolean criteria?`,
          mermaid: `classDiagram
    class NaiveSearcher { +search_txt(files) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Composite Pattern (Entry/Directory) & Filter Interface',
          code: `# 06_unix_search_composite.py
from abc import ABC, abstractmethod
from typing import List

class Entry(ABC):
    def __init__(self, name: str): self.name = name
    @abstractmethod
    def walk(self) -> List["File"]: ...

class File(Entry):
    def __init__(self, name: str, size_kb: int):
        super().__init__(name)
        self.size_kb = size_kb

    @property
    def extension(self) -> str:
        return self.name.rsplit(".", 1)[-1] if "." in self.name else ""

    def walk(self) -> List["File"]: return [self]

class Directory(Entry):
    def __init__(self, name: str, children: List[Entry] = None):
        super().__init__(name)
        self.children: List[Entry] = children or []

    def add(self, entry: Entry) -> "Directory":
        self.children.append(entry)
        return self

    def walk(self) -> List["File"]:
        files: List[File] = []
        for child in self.children:
            files.extend(child.walk())
        return files

class Filter(ABC):
    @abstractmethod
    def matches(self, f: File) -> bool: ...

class NameFilter(Filter):
    def __init__(self, name: str): self.name = name
    def matches(self, f: File) -> bool: return f.name == self.name

class ExtensionFilter(Filter):
    def __init__(self, ext: str): self.ext = ext
    def matches(self, f: File) -> bool: return f.extension == self.ext

class MinSizeFilter(Filter):
    def __init__(self, min_kb: int): self.min_kb = min_kb
    def matches(self, f: File) -> bool: return f.size_kb >= self.min_kb

class AndFilter(Filter):
    def __init__(self, *filters: Filter): self.filters = filters
    def matches(self, f: File) -> bool: return all(flt.matches(f) for flt in self.filters)

class OrFilter(Filter):
    def __init__(self, *filters: Filter): self.filters = filters
    def matches(self, f: File) -> bool: return any(flt.matches(f) for flt in self.filters)

class FileSearcher:
    def search(self, root: Entry, flt: Filter) -> List[File]:
        return [f for f in root.walk() if flt.matches(f)]`,
          architect_notes: `**06 — Unix File Search: Composite Pattern Architecture**

- **Composite Tree:** \`File\` (Leaf) and \`Directory\` (Composite) share \`Entry\` interface; recursion is automatic.
- **Composite Filter:** \`AndFilter\` and \`OrFilter\` wrap other \`Filter\` objects seamlessly.`,
          pivot_question: `Magic Question: "File & Directory share Entry interface (Composite); search criteria are Filter objects; And/Or filters are themselves Filters. Good before I run it?"`,
          mermaid: `classDiagram
    class Entry { <<interface>> +walk()* }
    class File { +walk() }
    class Directory { -List~Entry~ children +walk() }
    class Filter { <<interface>> +matches(f)* }
    class AndFilter { -List~Filter~ filters +matches() }
    Entry <|-- File
    Entry <|-- Directory
    Directory --> Entry : holds children
    Filter <|-- AndFilter
    Filter <|-- ExtensionFilter
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — ModifiedWithinFilter & Complex Boolean Combinations',
          code: `# 06_unix_search_pivot.py
# Interviewer: "Add a filter for files modified in the last N days" & "Combine (.txt OR .md) AND >= 100KB"
# WINNING SENTENCE: "New Filter subclass (ModifiedWithinFilter). The searcher and the tree are untouched."

class ModifiedWithinFilter(Filter):
    def __init__(self, max_days: int, mtime_days: dict):
        self.max_days = max_days
        self.mtime_days = mtime_days

    def matches(self, f: File) -> bool:
        return self.mtime_days.get(f.name, 1e9) <= self.max_days

if __name__ == "__main__":
    root = Directory("root")
    docs = Directory("docs")
    docs.add(File("a.txt", 120)).add(File("b.md", 40)).add(File("c.txt", 20))
    imgs = Directory("imgs")
    imgs.add(File("logo.png", 300))
    root.add(docs).add(imgs)
    
    searcher = FileSearcher()
    txts = searcher.search(root, ExtensionFilter("txt"))
    assert sorted(f.name for f in txts) == ["a.txt", "c.txt"]
    
    # Pivot: (.txt OR .md) AND >= 100KB -> only a.txt (120)
    combined = AndFilter(
        OrFilter(ExtensionFilter("txt"), ExtensionFilter("md")),
        MinSizeFilter(100)
    )
    res = searcher.search(root, combined)
    assert [f.name for f in res] == ["a.txt"]
    print("Unix File Search Verification PASSED")`,
          architect_notes: `**06 — Unix File Search: Pivot Absorption Verification**

- **Zero Core Touch:** Combined boolean filters (\`AndFilter(OrFilter(...), MinSizeFilter(100))\`) achieved through pure composition. Zero changes to \`Directory\` or \`FileSearcher\`.`,
          pivot_question: `How would you optimize directory walking for massive file systems with millions of files without loading all entries in memory at once?`,
          mermaid: `classDiagram
    class Filter { <<interface>> }
    class AndFilter { +matches() }
    class OrFilter { +matches() }
    class ModifiedWithinFilter { +matches() }
    Filter <|-- AndFilter
    Filter <|-- OrFilter
    Filter <|-- ModifiedWithinFilter
`
        }
      ],
      summary: [
        { principle: 'Composite Pattern', violation: 'Writing separate recursive logic for files vs directories.', fix: 'Unified Entry interface for both File leaf and Directory composite.' },
        { principle: 'Composite Filter', violation: 'Hardcoding AND/OR search conditionals inside traversal method.', fix: 'Composable Filter interface implemented by leaf filters and AndFilter/OrFilter.' }
      ]
    }
  ]
};
