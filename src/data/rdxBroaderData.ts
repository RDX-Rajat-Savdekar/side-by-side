import { Chapter } from '../types/lesson';

export const AMAZON_BROADER_CHAPTER: Chapter = {
  id: 'amazon-broader-lld',
  name: 'Amazon Broader LLD (12 Problems)',
  lessons: [
    // -------------------------------------------------------------------------
    // 01 — LIBRARY MANAGEMENT SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 'broader-01-library-management',
      title: '01 — Library Management System (LoanPolicy Strategy)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Monolithic Checkout (Hardcoded Tier Limits)',
          code: `# 01_library_naive.py
class NaiveLibrary:
    def checkout(self, member_tier: str, book_isbn: str):
        # HARDCODED LIMITS: Violates OCP
        limit = 10 if member_tier == "premium" else 3
        # Direct checkout logic without LoanPolicy abstraction...`,
          architect_notes: `**01 — Library Management: Naive Analysis**
- **OCP Violation:** Hardcoding borrowing limits per member tier inside checkout logic.
- **SRP:** Catalog management is mixed with borrowing policy enforcement.`,
          pivot_question: `Interviewer: "Students get a 5-book limit and 60-day loan period." How does your design absorb new member tiers?`,
          mermaid: `classDiagram
    class NaiveLibrary { +checkout(member_tier, isbn) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Catalog vs LoanService Separation & LoanPolicy Strategy',
          code: `# 01_library_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class Book:
    isbn: str
    title: str

class BookCopy:
    def __init__(self, copy_id: str, book: Book):
        self.copy_id = copy_id
        self.book = book
        self.available = True

@dataclass
class Member:
    member_id: str
    tier: str

class LoanPolicy(ABC):
    @abstractmethod
    def max_books(self, member: Member) -> int: ...
    @abstractmethod
    def loan_days(self, member: Member) -> int: ...

class TieredLoanPolicy(LoanPolicy):
    def max_books(self, member: Member) -> int:
        return 10 if member.tier == "premium" else 3
    def loan_days(self, member: Member) -> int:
        return 30 if member.tier == "premium" else 14

class Catalog:
    def __init__(self):
        self._copies: Dict[str, List[BookCopy]] = {}
    def add_copy(self, copy: BookCopy) -> None:
        self._copies.setdefault(copy.book.isbn, []).append(copy)
    def free_copy(self, isbn: str) -> Optional[BookCopy]:
        return next((c for c in self._copies.get(isbn, []) if c.available), None)

class LoanService:
    def __init__(self, catalog: Catalog, policy: Optional[LoanPolicy] = None):
        self.catalog = catalog
        self.policy = policy or TieredLoanPolicy()
        self._held: Dict[str, List[str]] = {}

    def checkout(self, member: Member, isbn: str) -> Optional[BookCopy]:
        held = self._held.setdefault(member.member_id, [])
        if len(held) >= self.policy.max_books(member):
            return None
        copy = self.catalog.free_copy(isbn)
        if not copy: return None
        copy.available = False
        held.append(copy.copy_id)
        return copy

    def return_copy(self, member: Member, copy: BookCopy) -> None:
        copy.available = True
        self._held.get(member.member_id, []).remove(copy.copy_id)`,
          architect_notes: `**01 — Library Management: Pattern Solution**
- **SRP:** \`Catalog\` tracks inventory; \`LoanService\` tracks checkouts; \`LoanPolicy\` enforces borrowing limits.
- **Strategy Pattern:** \`LoanPolicy\` interface allows adding new member tiers with zero changes to \`LoanService\`.`,
          pivot_question: `Magic Question: "Catalog tracks copies; LoanService enforces injected LoanPolicy. New tier = new policy class, no checkout rewrite. Good?"`,
          mermaid: `classDiagram
    class LoanPolicy { <<interface>> +max_books()* +loan_days()* }
    class TieredLoanPolicy { +max_books() }
    class LoanService { -Catalog catalog -LoanPolicy policy +checkout() }
    LoanPolicy <|-- TieredLoanPolicy
    LoanService --> LoanPolicy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — StudentFriendlyPolicy (Zero Checkout Edits)',
          code: `# 01_library_pivot.py
# WINNING SENTENCE: "New LoanPolicy implementation injected into LoanService — checkout logic is untouched:"

class StudentFriendlyPolicy(LoanPolicy):
    def max_books(self, member: Member) -> int:
        return 5 if member.tier == "student" else (10 if member.tier == "premium" else 3)
    def loan_days(self, member: Member) -> int:
        return 60 if member.tier == "student" else 14

if __name__ == "__main__":
    cat = Catalog()
    b = Book("111", "Clean Code")
    cat.add_copy(BookCopy("c1", b))
    svc = LoanService(cat)
    reg = Member("m1", "regular")
    
    copy = svc.checkout(reg, "111")
    assert copy is not None and not copy.available
    
    # Pivot verification: student policy gives 5 books, no service change
    student_svc = LoanService(cat, StudentFriendlyPolicy())
    assert student_svc.policy.max_books(Member("s", "student")) == 5
    print("Library Management Verification PASSED")`,
          architect_notes: `**01 — Library Management: Pivot Verification**
- **Zero Core Edit:** \`StudentFriendlyPolicy\` injected without modifying \`LoanService\` or \`Catalog\`.`,
          pivot_question: `How would you implement a ReservationQueue per ISBN when all physical copies are currently checked out?`,
          mermaid: `classDiagram
    class LoanPolicy { <<interface>> }
    class StudentFriendlyPolicy { +max_books() +loan_days() }
    LoanPolicy <|-- StudentFriendlyPolicy
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoded if/else borrowing limits in checkout.', fix: 'Extracted LoanPolicy interface.' },
        { principle: 'SRP', violation: 'Mixing book title catalog with member loan state.', fix: 'Catalog and LoanService separated.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 02 — ELEVATOR SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 'broader-02-elevator-system',
      title: '02 — Elevator System (DispatchStrategy Pattern)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Single Car Dispatcher (Unscalable Logic)',
          code: `# 02_elevator_naive.py
class NaiveElevator:
    def __init__(self): self.floor = 0
    def move_to(self, target: int): self.floor = target
# PIVOT FAIL: What about N elevators and SCAN vs Round-Robin scheduling?`,
          architect_notes: `**02 — Elevator System: Naive Analysis**
- Single car assumption fails when scaling to multi-car buildings.
- **Dispatch Strategy:** Decouple car motion from controller scheduling decisions.`,
          pivot_question: `Interviewer: "Now optimize for throughput using Round-Robin or LookAhead dispatch instead of Nearest Car."`,
          mermaid: `classDiagram
    class NaiveElevator { +floor +move_to() }
`
        },
        {
          step: 2,
          title: 'Commit 2: DispatchStrategy & ElevatorController Decoupling',
          code: `# 02_elevator_refactored.py
from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional

class Direction(Enum):
    UP = 1
    DOWN = -1
    IDLE = 0

class Elevator:
    def __init__(self, car_id: int, floor: int = 0):
        self.car_id = car_id
        self.floor = floor
        self.direction = Direction.IDLE
        self._targets: set[int] = set()

    def add_target(self, floor: int):
        self._targets.add(floor)
        self._retarget()

    def _retarget(self):
        if not self._targets:
            self.direction = Direction.IDLE
            return
        nearest = min(self._targets, key=lambda f: abs(f - self.floor))
        self.direction = Direction.UP if nearest > self.floor else (Direction.DOWN if nearest < self.floor else Direction.IDLE)

    def step(self):
        if not self._targets:
            self.direction = Direction.IDLE
            return
        self.floor += self.direction.value
        self._targets.discard(self.floor)
        self._retarget()

    @property
    def busy((self)) -> bool: return bool(self._targets)

class DispatchStrategy(ABC):
    @abstractmethod
    def select(self, cars: List[Elevator], floor: int) -> Elevator: ...

class NearestCarDispatch(DispatchStrategy):
    def select(self, cars: List[Elevator], floor: int) -> Elevator:
        return min(cars, key=lambda c: (c.busy, abs(c.floor - floor)))

class ElevatorController:
    def __init__(self, cars: List[Elevator], dispatch: Optional[DispatchStrategy] = None):
        self.cars = cars
        self.dispatch = dispatch or NearestCarDispatch()

    def request(self, floor: int) -> Elevator:
        car = self.dispatch.select(self.cars, floor)
        car.add_target(floor)
        return car

    def tick(self):
        for car in self.cars: car.step()`,
          architect_notes: `**02 — Elevator System: Pattern Solution**
- **SRP:** \`Elevator\` handles its own step motion; \`ElevatorController\` delegates routing to \`DispatchStrategy\`.
- **Strategy Pattern:** Swapping \`NearestCarDispatch\` to SCAN or LookAhead is a strategy swap.`,
          pivot_question: `Magic Question: "Controller routes requests to a car chosen by DispatchStrategy; Elevator owns step motion. Swapping dispatch is a new strategy. Good?"`,
          mermaid: `classDiagram
    class DispatchStrategy { <<interface>> +select()* }
    class NearestCarDispatch { +select() }
    class ElevatorController { -List~Elevator~ cars -DispatchStrategy dispatch +request() }
    DispatchStrategy <|-- NearestCarDispatch
    ElevatorController --> DispatchStrategy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — RoundRobinDispatch Strategy Injection',
          code: `# 02_elevator_pivot.py
# WINNING SENTENCE: "New DispatchStrategy (RoundRobinDispatch) injected into Controller — Elevator motion is untouched:"

class RoundRobinDispatch(DispatchStrategy):
    def __init__(self): self._i = 0
    def select(self, cars: List[Elevator], floor: int) -> Elevator:
        car = cars[self._i % len(cars)]
        self._i += 1
        return car

if __name__ == "__main__":
    ctrl = ElevatorController([Elevator(0, floor=0), Elevator(1, floor=9)])
    car = ctrl.request(8)
    assert car.car_id == 1 # Car 1 at floor 9 is nearest to floor 8
    
    # Pivot: Round-robin dispatch with zero controller edits
    rr = ElevatorController([Elevator(0), Elevator(1)], RoundRobinDispatch())
    assert rr.request(5).car_id == 0
    assert rr.request(5).car_id == 1
    print("Elevator System Verification PASSED")`,
          architect_notes: `**02 — Elevator System: Pivot Verification**
- **Zero Core Edit:** \`RoundRobinDispatch\` injected into \`ElevatorController\` without altering \`Elevator\` movement logic.`,
          pivot_question: `How would you handle floor capacity limits and VIP elevator overrides?`,
          mermaid: `classDiagram
    class DispatchStrategy { <<interface>> }
    class RoundRobinDispatch { +select() }
    DispatchStrategy <|-- RoundRobinDispatch
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoded FCFS or nearest elevator choice in controller.', fix: 'Extracted DispatchStrategy interface.' },
        { principle: 'SRP', violation: 'Elevator car motion logic mixed with global floor request routing.', fix: 'Decoupled Elevator car step logic from ElevatorController.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 03 — RATE LIMITER
    // -------------------------------------------------------------------------
    {
      id: 'broader-03-rate-limiter',
      title: '03 — Rate Limiter (TokenBucket & SlidingWindow Log)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Global Counter (Algorithm Coupling)',
          code: `# 03_rate_limiter_naive.py
class NaiveRateLimiter:
    def __init__(self, limit: int):
        self.limit = limit
        self.count = 0
    def allow(self):
        if self.count < self.limit:
            self.count += 1
            return True
        return False`,
          architect_notes: `**03 — Rate Limiter: Naive Analysis**
- Algorithm fixed to basic counter. Cannot support per-client keys or sliding windows.`,
          pivot_question: `Interviewer: "Switch from Token Bucket to Fixed-Window or Sliding-Window Log." How does your facade swap algorithms?`,
          mermaid: `classDiagram
    class NaiveRateLimiter { +allow() }
`
        },
        {
          step: 2,
          title: 'Commit 2: LimiterAlgorithm Strategy & Per-Key Facade',
          code: `# 03_rate_limiter_refactored.py
from abc import ABC, abstractmethod
from collections import deque
from typing import Callable, Dict

class LimiterAlgorithm(ABC):
    @abstractmethod
    def allow(self, now: float) -> bool: ...

class TokenBucket(LimiterAlgorithm):
    def __init__(self, capacity: int, refill_per_sec: float):
        self.capacity = capacity
        self.refill = refill_per_sec
        self.tokens = float(capacity)
        self.last = 0.0

    def allow(self, now: float) -> bool:
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

class SlidingWindowLog(LimiterAlgorithm):
    def __init__(self, limit: int, window_sec: float):
        self.limit = limit
        self.window = window_sec
        self._hits: deque[float] = deque()

    def allow(self, now: float) -> bool:
        while self._hits and self._hits[0] <= now - self.window:
            self._hits.popleft()
        if len(self._hits) < self.limit:
            self._hits.append(now)
            return True
        return False

class RateLimiter:
    def __init__(self, factory: Callable[[], LimiterAlgorithm]):
        self._factory = factory
        self._per_key: Dict[str, LimiterAlgorithm] = {}

    def allow(self, key: str, now: float) -> bool:
        algo = self._per_key.setdefault(key, self._factory())
        return algo.allow(now)`,
          architect_notes: `**03 — Rate Limiter: Pattern Solution**
- **Strategy Pattern:** \`LimiterAlgorithm\` interface implemented by \`TokenBucket\` and \`SlidingWindowLog\`.
- **Facade + Factory:** \`RateLimiter\` maps client keys to algorithm instances created via \`factory\`.`,
          pivot_question: `Magic Question: "RateLimiter facade keeps one algorithm instance per client key, built by an injected factory. Swapping algorithms = swap the factory, no facade change. Good?"`,
          mermaid: `classDiagram
    class LimiterAlgorithm { <<interface>> +allow(now)* }
    class TokenBucket { +allow() }
    class SlidingWindowLog { +allow() }
    class RateLimiter { -Dict _per_key +allow(key, now) }
    LimiterAlgorithm <|-- TokenBucket
    LimiterAlgorithm <|-- SlidingWindowLog
    RateLimiter --> LimiterAlgorithm
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — FixedWindow Strategy & Per-Team Quota',
          code: `# 03_rate_limiter_pivot.py
# WINNING SENTENCE: "New LimiterAlgorithm implementation; RateLimiter facade takes it via factory — nothing else changes:"

class FixedWindow(LimiterAlgorithm):
    def __init__(self, limit: int, window_sec: float):
        self.limit = limit
        self.window = window_sec
        self._start = 0.0
        self._count = 0

    def allow(self, now: float) -> bool:
        if now - self._start >= self.window:
            self._start = now
            self._count = 0
        if self._count < self.limit:
            self._count += 1
            return True
        return False

if __name__ == "__main__":
    rl = RateLimiter(lambda: SlidingWindowLog(limit=3, window_sec=1.0))
    assert [rl.allow("userA", t) for t in (0.0, 0.1, 0.2)] == [True, True, True]
    assert not rl.allow("userA", 0.3) # 4th request blocked
    
    # Pivot: FixedWindow works through same facade
    fw = RateLimiter(lambda: FixedWindow(limit=2, window_sec=1.0))
    assert fw.allow("k", 0.0) and fw.allow("k", 0.5)
    assert not fw.allow("k", 0.9)
    assert fw.allow("k", 1.1) # New window
    print("Rate Limiter Verification PASSED")`,
          architect_notes: `**03 — Rate Limiter: Pivot Verification**
- **Zero Facade Touch:** \`FixedWindow\` works directly through the \`RateLimiter\` factory.`,
          pivot_question: `How would you support distributed rate limiting across 100 web nodes using Redis sliding window logs?`,
          mermaid: `classDiagram
    class LimiterAlgorithm { <<interface>> }
    class FixedWindow { +allow() }
    LimiterAlgorithm <|-- FixedWindow
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding token bucket algorithm inside main facade.', fix: 'Extracted LimiterAlgorithm interface.' },
        { principle: 'Factory Pattern', violation: 'Tight coupling per-client limiter creation.', fix: 'Injected factory function creating LimiterAlgorithm instances per key.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 04 — NOTIFICATION SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 'broader-04-notification-system',
      title: '04 — Notification System (Dependency Inversion & Channel Registry)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Concrete Messaging (DIP Failure)',
          code: `# 04_notification_naive.py
class NaiveNotificationService:
    def notify(self, email: str, msg: str):
        # TIGHT COUPLING: Direct SMTP calls inside service
        print(f"Sending SMTP to {email}: {msg}")`,
          architect_notes: `**04 — Notification System: Naive Analysis**
- Service depends directly on SMTP. Cannot add SMS, Push, or Slack without editing core.`,
          pivot_question: `Interviewer: "Add Slack notifications tomorrow." How does Dependency Inversion prevent modifying NotificationService?`,
          mermaid: `classDiagram
    class NaiveNotificationService { +notify(email, msg) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Channel Interface & NotificationService Registry',
          code: `# 04_notification_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List

class Channel(ABC):
    @abstractmethod
    def name(self) -> str: ...
    @abstractmethod
    def send(self, to: str, message: str) -> str: ...

class SmsChannel(Channel):
    def name(self): return "sms"
    def send(self, to, message): return f"SMS->{to}: {message}"

class EmailChannel(Channel):
    def name(self): return "email"
    def send(self, to, message): return f"EMAIL->{to}: {message}"

class PushChannel(Channel):
    def name(self): return "push"
    def send(self, to, message): return f"PUSH->{to}: {message}"

@dataclass
class User:
    user_id: str
    prefs: List[str] = field(default_factory=list)

class NotificationService:
    def __init__(self):
        self._channels: Dict[str, Channel] = {}

    def register(self, channel: Channel) -> None:
        self._channels[channel.name()] = channel

    def notify(self, user: User, message: str) -> List[str]:
        sent: List[str] = []
        for pref in user.prefs:
            channel = self._channels.get(pref)
            if channel:
                sent.append(channel.send(user.user_id, message))
        return sent`,
          architect_notes: `**04 — Notification System: Dependency Inversion**
- **DIP:** \`NotificationService\` depends on the \`Channel\` abstraction, not concrete classes.
- **Registry:** \`register(Channel)\` allows dynamic plugin of notification channels.`,
          pivot_question: `Magic Question: "NotificationService holds a registry of Channel implementations; it depends only on Channel interface. Registering Slack is register(SlackChannel()) with zero service edits. Good?"`,
          mermaid: `classDiagram
    class Channel { <<interface>> +name()* +send()* }
    class SmsChannel { +send() }
    class EmailChannel { +send() }
    class NotificationService { -Dict _channels +register() +notify() }
    Channel <|-- SmsChannel
    Channel <|-- EmailChannel
    NotificationService --> Channel
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — SlackChannel & Retrying Decorator',
          code: `# 04_notification_pivot.py
# WINNING SENTENCE: "New Channel implementation, register it — service and existing channels untouched:"

class SlackChannel(Channel):
    def name(self): return "slack"
    def send(self, to: str, message: str) -> str:
        return f"SLACK->{to}: {message}"

if __name__ == "__main__":
    svc = NotificationService()
    svc.register(SmsChannel())
    svc.register(EmailChannel())
    
    user = User("alice", prefs=["email", "sms"])
    out = svc.notify(user, "Order shipped")
    assert out == ["EMAIL->alice: Order shipped", "SMS->alice: Order shipped"]
    
    # Pivot: add Slack with zero service edits
    svc.register(SlackChannel())
    slack_user = User("carol", prefs=["slack"])
    assert svc.notify(slack_user, "deploy done") == ["SLACK->carol: deploy done"]
    print("Notification System Verification PASSED")`,
          architect_notes: `**04 — Notification System: Pivot Verification**
- **Zero Core Edit:** \`SlackChannel\` registered dynamically into \`NotificationService\`.`,
          pivot_question: `How would you wrap a Channel in a RetryingChannel decorator to handle transient network retries without modifying NotificationService?`,
          mermaid: `classDiagram
    class Channel { <<interface>> }
    class SlackChannel { +send() }
    Channel <|-- SlackChannel
`
        }
      ],
      summary: [
        { principle: 'DIP', violation: 'NotificationService hardcoding concrete SMTP/SMS calls.', fix: 'Injected Channel interface registry.' },
        { principle: 'OCP', violation: 'Editing notification dispatch logic to add Slack.', fix: 'Registered SlackChannel implementing Channel interface.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 05 — MUSIC PLAYER
    // -------------------------------------------------------------------------
    {
      id: 'broader-05-music-player',
      title: '05 — Music Player API (PlayOrder Strategy & Artist Queries)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Fixed Playlist (Rigid Array Indexing)',
          code: `# 05_music_naive.py
class NaivePlayer:
    def __init__(self, songs: list):
        self.songs = songs
        self.idx = 0
    def play_next(self):
        self.idx += 1
        return self.songs[self.idx]`,
          architect_notes: `**05 — Music Player: Naive Analysis**
- Rigid array indexing breaks when deleting songs by artist or switching to Shuffle mode.`,
          pivot_question: `Interviewer: "Delete all songs EXCEPT a given artist's" and "Add Repeat-One mode."`,
          mermaid: `classDiagram
    class NaivePlayer { +songs +play_next() }
`
        },
        {
          step: 2,
          title: 'Commit 2: Queryable Playlist & PlayOrder Strategy (Sequential / Shuffle)',
          code: `# 05_music_refactored.py
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

@dataclass(frozen=True)
class Song:
    song_id: str
    title: str
    artist: str

class Playlist:
    def __init__(self): self._songs: List[Song] = []
    def add(self, song: Song): self._songs.append(song)
    @property
    def songs(self) -> List[Song]: return list(self._songs)
    def by_artist(self, artist: str) -> List[Song]:
        return [s for s in self._songs if s.artist == artist]
    def keep_only_artist(self, artist: str) -> None:
        self._songs = [s for s in self._songs if s.artist == artist]

class PlayOrder(ABC):
    @abstractmethod
    def order(self, songs: List[Song]) -> List[Song]: ...

class Sequential(PlayOrder):
    def order(self, songs: List[Song]) -> List[Song]: return list(songs)

class Shuffle(PlayOrder):
    def __init__(self, seed: Optional[int] = None):
        self._rng = random.Random(seed)
    def order(self, songs: List[Song]) -> List[Song]:
        out = list(songs)
        self._rng.shuffle(out)
        return out

class MusicPlayer:
    def __init__(self, playlist: Playlist, order: Optional[PlayOrder] = None):
        self.playlist = playlist
        self.order = order or Sequential()
        self._queue: List[Song] = []
        self._pos = 0

    def play(self) -> Optional[Song]:
        self._queue = self.order.order(self.playlist.songs)
        self._pos = 0
        return self._current()

    def next(self) -> Optional[Song]:
        self._pos += 1
        return self._current()

    def _current(self) -> Optional[Song]:
        return self._queue[self._pos] if 0 <= self._pos < len(self._queue) else None`,
          architect_notes: `**05 — Music Player: Pattern Solution**
- **Queryable Data Model:** \`Playlist.keep_only_artist()\` is a clean list comprehension filter.
- **Strategy Pattern:** \`PlayOrder\` interface handles \`Sequential\` vs \`Shuffle\` playback orders.`,
          pivot_question: `Magic Question: "Playlist supports artist queries; PlayOrder strategy turns it into a play queue. Shuffle vs sequential is a strategy swap. Good?"`,
          mermaid: `classDiagram
    class PlayOrder { <<interface>> +order(songs)* }
    class Sequential { +order() }
    class Shuffle { +order() }
    class MusicPlayer { -Playlist playlist -PlayOrder order +play() +next() }
    PlayOrder <|-- Sequential
    PlayOrder <|-- Shuffle
    MusicPlayer --> PlayOrder
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — RepeatOne PlayOrder Strategy',
          code: `# 05_music_pivot.py
# WINNING SENTENCE: "New PlayOrder implementation injected into the player — core logic untouched:"

class RepeatOne(PlayOrder):
    def order(self, songs: List[Song]) -> List[Song]:
        return songs[:1] * 3 if songs else []

if __name__ == "__main__":
    pl = Playlist()
    pl.add(Song("1", "A", "Adele"))
    pl.add(Song("2", "B", "Drake"))
    pl.add(Song("3", "C", "Adele"))
    
    player = MusicPlayer(pl)
    assert player.play().song_id == "1"
    
    # Pivot: keep only Adele
    pl.keep_only_artist("Adele")
    assert [s.song_id for s in pl.songs] == ["1", "3"]
    
    # RepeatOne strategy check
    rep = MusicPlayer(pl, RepeatOne())
    assert rep.play().song_id == rep.next().song_id
    print("Music Player Verification PASSED")`,
          architect_notes: `**05 — Music Player: Pivot Verification**
- **Zero Core Touch:** Added \`RepeatOne\` strategy without altering \`MusicPlayer\` or \`Playlist\`.`,
          pivot_question: `How would you extend this to handle track progress audio buffering and gapless playback?`,
          mermaid: `classDiagram
    class PlayOrder { <<interface>> }
    class RepeatOne { +order() }
    PlayOrder <|-- RepeatOne
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding sequential song index progression.', fix: 'Extracted PlayOrder strategy interface.' },
        { principle: 'Queryable Model', violation: 'Brittle fixed-index array of song IDs.', fix: 'Playlist data model supporting direct artist filtering.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 06 — CACHE API PLUGGABLE EVICTION
    // -------------------------------------------------------------------------
    {
      id: 'broader-06-cache-api-eviction',
      title: '06 — Cache API Pluggable Eviction (Generic Store & Prefix Eviction)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Cache Store (Coupled Eviction & Concrete Key Types)',
          code: `# 06_cache_api_naive.py
class NaiveCache:
    def __init__(self): self.data = {}
    def get(self, k): return self.data.get(k)
    def put(self, k, v): self.data[k] = v`,
          architect_notes: `**06 — Cache API: Naive Analysis**
- No eviction bounds; unpluggable eviction strategy.`,
          pivot_question: `Interviewer: "Evict all keys starting with 'abc'." How does your data model handle prefix eviction queries without polluting the eviction strategy?`,
          mermaid: `classDiagram
    class NaiveCache { +data +get() +put() }
`
        },
        {
          step: 2,
          title: 'Commit 2: Generic Cache[K,V] with EvictionPolicy Strategy & Prefix Query',
          code: `# 06_cache_api_refactored.py
from abc import ABC, abstractmethod
from collections import OrderedDict, defaultdict
from typing import Dict, Generic, List, Optional, TypeVar

K = TypeVar("K")
V = TypeVar("V")

class EvictionPolicy(ABC):
    @abstractmethod
    def record(self, key) -> None: ...
    @abstractmethod
    def forget(self, key) -> None: ...
    @abstractmethod
    def evict(self): ...

class LRUPolicy(EvictionPolicy):
    def __init__(self): self._order = OrderedDict()
    def record(self, key):
        self._order.pop(key, None)
        self._order[key] = True
    def forget(self, key): self._order.pop(key, None)
    def evict(self):
        key, _ = self._order.popitem(last=False)
        return key

class LFUPolicy(EvictionPolicy):
    def __init__(self): self._freq = defaultdict(int)
    def record(self, key): self._freq[key] += 1
    def forget(self, key): self._freq.pop(key, None)
    def evict(self):
        key = min(self._freq, key=lambda k: self._freq[k])
        del self._freq[key]
        return key

class Cache(Generic[K, V]):
    def __init__(self, capacity: int, policy: Optional[EvictionPolicy] = None):
        self.capacity = capacity
        self.policy = policy or LRUPolicy()
        self._store: Dict[K, V] = {}

    def get(self, key: K) -> Optional[V]:
        if key not in self._store: return None
        self.policy.record(key)
        return self._store[key]

    def put(self, key: K, value: V) -> None:
        if key not in self._store and len(self._store) >= self.capacity:
            victim = self.policy.evict()
            self._store.pop(victim, None)
        self._store[key] = value
        self.policy.record(key)

    def evict_prefix(self, prefix: str) -> List[K]:
        victims = [k for k in self._store if isinstance(k, str) and k.startswith(prefix)]
        for k in victims:
            del self._store[k]
            self.policy.forget(k)
        return victims`,
          architect_notes: `**06 — Cache API: Pattern Solution**
- **Strategy Pattern:** \`EvictionPolicy\` strategy (\`LRUPolicy\` / \`LFUPolicy\`).
- **Clean Separation:** \`evict_prefix()\` is a store query that notifies \`policy.forget()\`, keeping the eviction strategy pure.`,
          pivot_question: `Magic Question: "Generic Cache holds map + capacity; an injected EvictionPolicy decides the victim. Prefix eviction is a query on the store itself. Good?"`,
          mermaid: `classDiagram
    class EvictionPolicy { <<interface>> +record()* +forget()* +evict()* }
    class LRUPolicy { +evict() }
    class LFUPolicy { +evict() }
    class Cache { -Dict _store -EvictionPolicy policy +get() +put() +evict_prefix() }
    EvictionPolicy <|-- LRUPolicy
    EvictionPolicy <|-- LFUPolicy
    Cache --> EvictionPolicy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Prefix Eviction & Per-Instance LFU Injections',
          code: `# 06_cache_api_pivot.py
# WINNING SENTENCE: "Evicting by prefix is a query over the store; evict_prefix scans keys and tells policy to forget them. Eviction strategy stays pure."

if __name__ == "__main__":
    c: Cache[str, int] = Cache(capacity=3)
    c.put("abc:1", 1); c.put("abc:2", 2); c.put("xyz:1", 3)
    assert c.get("abc:1") == 1
    c.put("xyz:2", 4) # evicts LRU ("abc:2")
    assert c.get("abc:2") is None
    
    # Pivot: prefix eviction check
    dropped = c.evict_prefix("abc")
    assert dropped == ["abc:1"] and c.get("abc:1") is None
    
    # Per-instance LFU policy check
    lfu: Cache[str, int] = Cache(2, LFUPolicy())
    lfu.put("a", 1); lfu.put("b", 2)
    lfu.get("a"); lfu.get("a") # 'a' freq=3, 'b' freq=1
    lfu.put("c", 3)            # evicts least frequent = 'b'
    assert lfu.get("b") is None and lfu.get("a") == 1
    print("Cache API Pluggable Eviction Verification PASSED")`,
          architect_notes: `**06 — Cache API: Pivot Verification**
- **Zero Core Edit:** Injected \`LFUPolicy\` per-instance without altering \`Cache\` store methods.`,
          pivot_question: `How would you replace the prefix scan with a Trie index for O(L) prefix deletions when storing millions of keys?`,
          mermaid: `classDiagram
    class EvictionPolicy { <<interface>> }
    class LFUPolicy { +record() +evict() }
    EvictionPolicy <|-- LFUPolicy
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding LRU eviction inside Cache class.', fix: 'Extracted EvictionPolicy interface with LRUPolicy & LFUPolicy.' },
        { principle: 'SRP & Data Query', violation: 'Polluting eviction policy with key prefix filtering.', fix: 'Prefix deletion handled by store query, notifying policy.forget().' }
      ]
    },

    // -------------------------------------------------------------------------
    // 07 — SNAKE AND LADDER GAME
    // -------------------------------------------------------------------------
    {
      id: 'broader-07-snake-and-ladder',
      title: '07 — Snake & Ladder Game (Die Strategy & Jump Abstraction)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Hardcoded Die Roll & If/Else Snakes',
          code: `# 07_snake_naive.py
class NaiveSnakeGame:
    def play_turn(self, player, roll):
        player.pos += roll
        # HARDCODED SNAKES & LADDERS: Violates OCP
        if player.pos == 4: player.pos = 25
        elif player.pos == 99: player.pos = 7`,
          architect_notes: `**07 — Snake & Ladder: Naive Analysis**
- Hardcoded snakes & ladders inside turn logic. Cannot support loaded die for testing or custom cell effects.`,
          pivot_question: `Interviewer: "Use a LoadedDie for testing" and "Add mystery cells with custom effects."`,
          mermaid: `classDiagram
    class NaiveSnakeGame { +play_turn(player, roll) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Die Strategy & Generalized Jump Abstraction',
          code: `# 07_snake_refactored.py
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional

class Die(ABC):
    @abstractmethod
    def roll(self) -> int: ...

class StandardDie(Die):
    def __init__(self, sides: int = 6, seed: Optional[int] = None):
        self.sides = sides
        self._rng = random.Random(seed)
    def roll(self) -> int: return self._rng.randint(1, self.sides)

@dataclass(frozen=True)
class Jump:
    from_cell: int
    to_cell: int

class Board:
    def __init__(self, size: int, jumps: List[Jump]):
        self.size = size
        self._jumps: Dict[int, int] = {j.from_cell: j.to_cell for j in jumps}
    def resolve(self, position: int) -> int:
        return self._jumps.get(position, position)

class Player:
    def __init__(self, name: str):
        self.name = name
        self.position = 0

class Game:
    def __init__(self, board: Board, players: List[Player], die: Optional[Die] = None):
        self.board = board
        self.players = players
        self.die = die or StandardDie()
        self._turn = 0
        self.winner: Optional[Player] = None

    def play_turn(self) -> Player:
        player = self.players[self._turn % len(self.players)]
        roll = self.die.roll()
        target = player.position + roll
        if target <= self.board.size: # overshoot forfeits move
            player.position = self.board.resolve(target)
            if player.position == self.board.size:
                self.winner = player
        self._turn += 1
        return player`,
          architect_notes: `**07 — Snake & Ladder: Pattern Solution**
- **Die Strategy:** \`Die\` interface allows swapping \`StandardDie\` with \`LoadedDie\`.
- **Generalized Jump Abstraction:** \`Jump\` represents both snakes (\`to < from\`) and ladders (\`to > from\`) uniformly.`,
          pivot_question: `Magic Question: "Board holds size + jumps map; Game runs turn loop rolling a Die strategy and resolving jumps. Die is swappable. Good?"`,
          mermaid: `classDiagram
    class Die { <<interface>> +roll()* }
    class StandardDie { +roll() }
    class Board { -Dict _jumps +resolve() }
    class Game { -Board board -List~Player~ players -Die die +play_turn() }
    Die <|-- StandardDie
    Game --> Die
    Game --> Board
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — LoadedDie Injection (Zero Game Edits)',
          code: `# 07_snake_pivot.py
# WINNING SENTENCE: "New Die implementation injected into Game — turn logic is untouched:"

class LoadedDie(Die):
    def __init__(self, sequence: List[int]):
        self._seq = sequence
        self._i = 0
    def roll(self) -> int:
        val = self._seq[self._i % len(self._seq)]
        self._i += 1
        return val

if __name__ == "__main__":
    board = Board(size=100, jumps=[Jump(4, 25), Jump(99, 7)])
    p = Player("solo")
    g = Game(board, [p], LoadedDie([4]))
    g.play_turn()
    assert p.position == 25 # ladder from 4 to 25 took effect
    
    # Overshoot check
    p.position = 98
    g2 = Game(board, [p], LoadedDie([5])) # 98 + 5 = 103 > 100 -> no move
    g2.play_turn()
    assert p.position == 98
    print("Snake & Ladder Verification PASSED")`,
          architect_notes: `**07 — Snake & Ladder: Pivot Verification**
- **Zero Core Edit:** Injected \`LoadedDie\` into \`Game\` without altering turn loop or board resolution.`,
          pivot_question: `How would you promote Jump to a CellEffect interface to support special cells like "Roll Again" or "Freeze 1 Turn"?`,
          mermaid: `classDiagram
    class Die { <<interface>> }
    class LoadedDie { +roll() }
    Die <|-- LoadedDie
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding die rolling & random number generation inside turn loop.', fix: 'Extracted Die strategy interface.' },
        { principle: 'Abstraction', violation: 'Special-casing snakes vs ladders with if/else branches.', fix: 'Unified Jump abstraction (from_cell -> to_cell).' }
      ]
    },

    // -------------------------------------------------------------------------
    // 08 — TIC TAC TOE
    // -------------------------------------------------------------------------
    {
      id: 'broader-08-tic-tac-toe',
      title: '08 — Tic Tac Toe (WinRule Strategy for N x N Grid)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Hardcoded 3x3 Win Checks',
          code: `# 08_tictactoe_naive.py
class NaiveTicTacToe:
    def check_win(self, grid):
        # HARDCODED 3x3 WIN CHECKS: Violates OCP
        if grid[0][0] == grid[0][1] == grid[0][2] != " ": return True
        # PIVOT FAIL: What about N x N grid with K in a row?`,
          architect_notes: `**08 — Tic Tac Toe: Naive Analysis**
- Hardcoded 3x3 index checks break when scaling to $N \times N$ with $K$ in a row.`,
          pivot_question: `Interviewer: "Now make it an N x N board with K in a row to win." How does your WinRule handle arbitrary grid dimensions?`,
          mermaid: `classDiagram
    class NaiveTicTacToe { +check_win(grid) }
`
        },
        {
          step: 2,
          title: 'Commit 2: WinRule Strategy & N x N Board Grid',
          code: `# 08_tictactoe_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

class Symbol(Enum):
    X = "X"
    O = "O"
    EMPTY = " "

@dataclass
class Player:
    name: str
    symbol: Symbol

class Board:
    def __init__(self, size: int = 3):
        self.size = size
        self._grid: List[List[Symbol]] = [[Symbol.EMPTY] * size for _ in range(size)]
        self.moves = 0

    def place(self, r: int, c: int, symbol: Symbol) -> bool:
        if not (0 <= r < self.size and 0 <= c < self.size): return False
        if self._grid[r][c] is not Symbol.EMPTY: return False
        self._grid[r][c] = symbol
        self.moves += 1
        return True

    def get(self, r: int, c: int) -> Symbol: return self._grid[r][c]

    @property
    def is_full(self) -> bool: return self.moves == self.size * self.size

class WinRule(ABC):
    @abstractmethod
    def is_win(self, board: Board, r: int, c: int) -> bool: ...

class KInARowWin(WinRule):
    def __init__(self, k: Optional[int] = None): self.k = k

    def is_win(self, board: Board, r: int, c: int) -> bool:
        symbol = board.get(r, c)
        if symbol is Symbol.EMPTY: return False
        need = self.k or board.size
        for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
            count = 1 + self._run(board, r, c, dr, dc, symbol) + self._run(board, r, c, -dr, -dc, symbol)
            if count >= need: return True
        return False

    @staticmethod
    def _run(board: Board, r: int, c: int, dr: int, dc: int, symbol: Symbol) -> int:
        steps = 0
        r, c = r + dr, c + dc
        while 0 <= r < board.size and 0 <= c < board.size and board.get(r, c) is symbol:
            steps += 1
            r, c = r + dr, c + dc
        return steps

class GameStatus(Enum):
    IN_PROGRESS = 0
    WIN = 1
    DRAW = 2

class Game:
    def __init__(self, players: List[Player], size: int = 3, win_rule: Optional[WinRule] = None):
        self.players = players
        self.board = Board(size)
        self.win_rule = win_rule or KInARowWin()
        self._turn = 0
        self.status = GameStatus.IN_PROGRESS
        self.winner: Optional[Player] = None

    def move(self, r: int, c: int) -> GameStatus:
        if self.status is not GameStatus.IN_PROGRESS: return self.status
        player = self.players[self._turn % len(self.players)]
        if not self.board.place(r, c, player.symbol): return self.status
        if self.win_rule.is_win(self.board, r, c):
            self.status, self.winner = GameStatus.WIN, player
        elif self.board.is_full:
            self.status = GameStatus.DRAW
        else:
            self._turn += 1
        return self.status`,
          architect_notes: `**08 — Tic Tac Toe: Pattern Solution**
- **WinRule Strategy:** \`WinRule\` interface (\`KInARowWin\`) handles $N \times N$ with $K$ in a row checks.
- **SRP:** \`Board\` stores marks; \`WinRule\` evaluates win conditions; \`Game\` owns turn loop.`,
          pivot_question: `Magic Question: "Board stores marks; win logic lives behind WinRule interface injected into Game, so a different win condition is a new class with zero Board/Game edits. Good?"`,
          mermaid: `classDiagram
    class WinRule { <<interface>> +is_win(board, r, c)* }
    class KInARowWin { +is_win() }
    class Game { -Board board -WinRule win_rule +move() }
    WinRule <|-- KInARowWin
    Game --> WinRule
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — 5x5 Grid with 4-in-a-Row Win Rule',
          code: `# 08_tictactoe_pivot.py
# WINNING SENTENCE: "That's Game(players, size=N, win_rule=KInARowWin(4)) — Board and Game are untouched."

if __name__ == "__main__":
    x = Player("X", Symbol.X); o = Player("O", Symbol.O)
    g = Game([x, o], size=3)
    g.move(0, 0); g.move(1, 0)
    g.move(0, 1); g.move(1, 1)
    status = g.move(0, 2) # X completes top row
    assert status is GameStatus.WIN and g.winner is x
    
    # Pivot: 5x5 board, K=4 in a row, zero code changes!
    big = Game([x, o], size=5, win_rule=KInARowWin(4))
    for col in range(3):
        big.move(0, col); big.move(1, col)
    assert big.move(0, 3) is GameStatus.WIN # X gets 4 in a row
    print("Tic Tac Toe Verification PASSED")`,
          architect_notes: `**08 — Tic Tac Toe: Pivot Verification**
- **Zero Core Edit:** Instantiated \`Game(size=5, win_rule=KInARowWin(4))\` with zero changes to \`Board\` or \`Game\`.`,
          pivot_question: `How would you support 3-player Tic-Tac-Toe or 3D Tic-Tac-Toe ($N \times N \times N$)?`,
          mermaid: `classDiagram
    class WinRule { <<interface>> }
    class KInARowWin { +is_win() }
    WinRule <|-- KInARowWin
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding 3x3 row/col/diag index checks.', fix: 'Extracted WinRule strategy interface with KInARowWin.' },
        { principle: 'SRP', violation: 'Coupling win evaluation logic with board grid storage.', fix: 'Board grid decoupled from WinRule strategy.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 09 — ATM MACHINE
    // -------------------------------------------------------------------------
    {
      id: 'broader-09-atm-machine',
      title: '09 — ATM Machine (State Pattern & CashDispenser Strategy)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Flag-Based ATM State (Tight Coupling)',
          code: `# 09_atm_naive.py
class NaiveATM:
    def __init__(self): self.authenticated = False
    def withdraw(self, amount):
        if not self.authenticated: raise RuntimeError("Auth first!")
        # Hardcoded cash dispensing...`,
          architect_notes: `**09 — ATM Machine: Naive Analysis**
- Boolean auth flags fail when adding multi-step card insertion, PIN auth, or custom cash dispensing policies.`,
          pivot_question: `Interviewer: "Dispense using fewest notes policy (greedy)" and "Add deposit / balance inquiry operations."`,
          mermaid: `classDiagram
    class NaiveATM { +bool authenticated +withdraw() }
`
        },
        {
          step: 2,
          title: 'Commit 2: State Pattern (Idle -> CardInserted -> Authenticated) & GreedyDispenser',
          code: `# 09_atm_refactored.py
from abc import ABC, abstractmethod
from typing import Dict, Optional

class Account:
    def __init__(self, number: str, pin: str, balance: int):
        self.number = number
        self.pin = pin
        self.balance = balance

class BankService:
    def __init__(self): self._accounts: Dict[str, Account] = {}
    def add(self, account: Account): self._accounts[account.number] = account
    def authenticate(self, number: str, pin: str) -> bool:
        acct = self._accounts.get(number)
        return bool(acct) and acct.pin == pin
    def balance(self, number: str) -> int: return self._accounts[number].balance
    def debit(self, number: str, amount: int) -> bool:
        acct = self._accounts[number]
        if acct.balance < amount: return False
        acct.balance -= amount
        return True

class CashDispenser(ABC):
    @abstractmethod
    def dispense(self, amount: int, inventory: Dict[int, int]) -> Optional[Dict[int, int]]: ...

class GreedyDispenser(CashDispenser):
    def dispense(self, amount: int, inventory: Dict[int, int]) -> Optional[Dict[int, int]]:
        plan: Dict[int, int] = {}
        remaining = amount
        for denom in sorted(inventory, reverse=True):
            take = min(remaining // denom, inventory[denom])
            if take:
                plan[denom] = take
                remaining -= take * denom
        if remaining != 0: return None
        for denom, count in plan.items():
            inventory[denom] -= count
        return plan

class ATMState(ABC):
    def __init__(self, atm: "ATM"): self.atm = atm
    def insert_card(self, number: str) -> "ATMState": raise RuntimeError("cannot insert card now")
    def enter_pin(self, pin: str) -> "ATMState": raise RuntimeError("no card inserted")
    def withdraw(self, amount: int) -> "ATMState": raise RuntimeError("authenticate first")

class IdleState(ATMState):
    def insert_card(self, number: str) -> ATMState:
        self.atm.current_account = number
        return CardInsertedState(self.atm)

class CardInsertedState(ATMState):
    def enter_pin(self, pin: str) -> ATMState:
        if self.atm.bank.authenticate(self.atm.current_account, pin):
            return AuthenticatedState(self.atm)
        self.atm.current_account = None
        return IdleState(self.atm)

class AuthenticatedState(ATMState):
    def withdraw(self, amount: int) -> ATMState:
        acct = self.atm.current_account
        if self.atm.bank.balance(acct) < amount:
            self.atm.last_dispensed = None
            return self
        plan = self.atm.dispenser.dispense(amount, self.atm.inventory)
        if plan is None:
            self.atm.last_dispensed = None
            return self
        self.atm.bank.debit(acct, amount)
        self.atm.last_dispensed = plan
        return self

class ATM:
    def __init__(self, bank: BankService, inventory: Dict[int, int], dispenser: Optional[CashDispenser] = None):
        self.bank = bank
        self.inventory = inventory
        self.dispenser = dispenser or GreedyDispenser()
        self.state: ATMState = IdleState(self)
        self.current_account: Optional[str] = None
        self.last_dispensed: Optional[Dict[int, int]] = None

    def insert_card(self, number: str): self.state = self.state.insert_card(number)
    def enter_pin(self, pin: str): self.state = self.state.enter_pin(pin)
    def withdraw(self, amount: int): self.state = self.state.withdraw(amount)`,
          architect_notes: `**09 — ATM Machine: Pattern Solution**
- **State Pattern:** \`IdleState\` -> \`CardInsertedState\` -> \`AuthenticatedState\`.
- **Strategy Pattern:** \`CashDispenser\` interface (\`GreedyDispenser\`) decides note payout policies.`,
          pivot_question: `Magic Question: "ATM state machine gates each action to the right phase; withdrawal debits BankService and gets notes from CashDispenser strategy. Good?"`,
          mermaid: `classDiagram
    class ATMState { <<interface>> +insert_card()* +enter_pin()* +withdraw()* }
    class CashDispenser { <<interface>> +dispense()* }
    class GreedyDispenser { +dispense() }
    class ATM { -BankService bank -ATMState state -CashDispenser dispenser }
    ATMState <|-- IdleState
    ATMState <|-- CardInsertedState
    ATMState <|-- AuthenticatedState
    CashDispenser <|-- GreedyDispenser
    ATM --> ATMState
    ATM --> CashDispenser
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — Custom CashDispenser & Runnable ATM Demo',
          code: `# 09_atm_pivot.py
# WINNING SENTENCE: "New CashDispenser implementation injected into ATM — states and BankService untouched:"

if __name__ == "__main__":
    bank = BankService()
    bank.add(Account("acct1", "1234", balance=500))
    atm = ATM(bank, inventory={100: 5, 50: 5, 20: 5, 10: 5})
    
    atm.insert_card("acct1")
    atm.enter_pin("0000") # Wrong pin -> ejects back to Idle
    assert isinstance(atm.state, IdleState)
    
    atm.insert_card("acct1")
    atm.enter_pin("1234") # Correct pin -> Authenticated
    assert isinstance(atm.state, AuthenticatedState)
    
    atm.withdraw(180) # 100 + 50 + 20 + 10
    assert atm.last_dispensed == {100: 1, 50: 1, 20: 1, 10: 1}
    assert bank.balance("acct1") == 320
    print("ATM Machine Verification PASSED")`,
          architect_notes: `**09 — ATM Machine: Pivot Verification**
- **Zero Core Edit:** Auth state transitions and note dispensing verified cleanly.`,
          pivot_question: `How would you handle deposit operations (cash envelope inspection) or check printing?`,
          mermaid: `classDiagram
    class CashDispenser { <<interface>> }
    class GreedyDispenser { +dispense() }
    CashDispenser <|-- GreedyDispenser
`
        }
      ],
      summary: [
        { principle: 'State Pattern', violation: 'Boolean flags for card insertion & authentication.', fix: 'Extracted ATMState objects (Idle, CardInserted, Authenticated).' },
        { principle: 'Strategy Pattern', violation: 'Hardcoding note denomination greedy math inside ATM class.', fix: 'Extracted CashDispenser strategy interface.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 10 — HOTEL BOOKING SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 'broader-10-hotel-booking',
      title: '10 — Hotel Booking System (DateRange Overlap & Pricing Strategy)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Booking (Flawed Date Overlap Checks)',
          code: `# 10_hotel_naive.py
class NaiveHotel:
    def book(self, room_id: str, check_in: str, check_out: str):
        # FLAWED OVERLAP CHECK: String comparison instead of DateRange [in, out)
        return True`,
          architect_notes: `**10 — Hotel Booking: Naive Analysis**
- Flawed date comparisons lead to double bookings.
- **Half-Open DateRange:** \`[check_in, check_out)\` ensures touching boundaries (checkout Aug 4, checkin Aug 4) do NOT overlap.`,
          pivot_question: `Interviewer: "Add Seasonal Pricing (1.5x in December) and member discount rules."`,
          mermaid: `classDiagram
    class NaiveHotel { +book(room_id, check_in, check_out) }
`
        },
        {
          step: 2,
          title: 'Commit 2: DateRange Overlap Logic & PricingStrategy (PerNightPricing)',
          code: `# 10_hotel_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from enum import Enum
from typing import Dict, List, Optional

class RoomType(Enum):
    SINGLE = "single"
    DOUBLE = "double"
    SUITE = "suite"

@dataclass
class Room:
    room_id: str
    room_type: RoomType

@dataclass(frozen=True)
class DateRange:
    check_in: date
    check_out: date

    @property
    def nights(self) -> int:
        return (self.check_out - self.check_in).days

    def overlaps(self, other: "DateRange") -> bool:
        # Half-open interval check: [in, out)
        return self.check_in < other.check_out and other.check_in < self.check_out

class PricingStrategy(ABC):
    @abstractmethod
    def price(self, room: Room, rng: DateRange) -> float: ...

class PerNightPricing(PricingStrategy):
    RATES = {RoomType.SINGLE: 80.0, RoomType.DOUBLE: 120.0, RoomType.SUITE: 250.0}
    def price(self, room: Room, rng: DateRange) -> float:
        return self.RATES[room.room_type] * rng.nights()

@dataclass
class Booking:
    booking_id: str
    room: Room
    date_range: DateRange
    price: float

class BookingService:
    def __init__(self, rooms: List[Room], pricing: Optional[PricingStrategy] = None):
        self.rooms = rooms
        self.pricing = pricing or PerNightPricing()
        self._bookings: Dict[str, List[Booking]] = {}
        self._counter = 0

    def _is_free(self, room: Room, rng: DateRange) -> bool:
        return all(not b.date_range.overlaps(rng) for b in self._bookings.get(room.room_id, []))

    def available(self, room_type: RoomType, rng: DateRange) -> List[Room]:
        return [r for r in self.rooms if r.room_type == room_type and self._is_free(r, rng)]

    def book(self, room_type: RoomType, rng: DateRange) -> Optional[Booking]:
        free = self.available(room_type, rng)
        if not free: return None
        room = free[0]
        self._counter += 1
        booking = Booking(f"B{self._counter}", room, rng, self.pricing.price(room, rng))
        self._bookings.setdefault(room.room_id, []).append(booking)
        return booking

    def cancel(self, booking: Booking) -> None:
        self._bookings.get(booking.room.room_id, []).remove(booking)`,
          architect_notes: `**10 — Hotel Booking: Pattern Solution**
- **DateRange Overlap Math:** \`check_in < other.check_out and other.check_in < self.check_out\` correctly handles half-open intervals.
- **Strategy Pattern:** \`PricingStrategy\` interface decouples per-night, seasonal, or member pricing from \`BookingService\`.`,
          pivot_question: `Magic Question: "BookingService checks half-open date overlap for availability and prices via PricingStrategy. Seasonal pricing = new strategy. Good?"`,
          mermaid: `classDiagram
    class PricingStrategy { <<interface>> +price(room, rng)* }
    class PerNightPricing { +price() }
    class BookingService { -List~Room~ rooms -PricingStrategy pricing +book() +available() }
    PricingStrategy <|-- PerNightPricing
    BookingService --> PricingStrategy
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — SeasonalPricing Strategy Injection',
          code: `# 10_hotel_pivot.py
# WINNING SENTENCE: "New PricingStrategy injected into BookingService; availability and booking logic are untouched:"

class SeasonalPricing(PricingStrategy):
    def __init__(self, base: PricingStrategy, peak_month: int, multiplier: float):
        self.base = base
        self.peak_month = peak_month
        self.multiplier = multiplier

    def price(self, room: Room, rng: DateRange) -> float:
        p = self.base.price(room, rng)
        return p * self.multiplier if rng.check_in.month == self.peak_month else p

if __name__ == "__main__":
    rooms = [Room("101", RoomType.DOUBLE), Room("102", RoomType.DOUBLE)]
    svc = BookingService(rooms)
    stay = DateRange(date(2026, 8, 1), date(2026, 8, 4)) # 3 nights
    
    b1 = svc.book(RoomType.DOUBLE, stay)
    assert b1 is not None and b1.price == 360.0 # 3 nights * $120
    
    # Overlapping booking check -> takes room 102
    b2 = svc.book(RoomType.DOUBLE, DateRange(date(2026, 8, 3), date(2026, 8, 5)))
    assert b2 is not None and b2.room.room_id == "102"
    
    # Pivot: Seasonal pricing check
    seasonal = SeasonalPricing(PerNightPricing(), peak_month=12, multiplier=1.5)
    dec_stay = DateRange(date(2026, 12, 24), date(2026, 12, 26))
    assert seasonal.price(Room("x", RoomType.SINGLE), dec_stay) == 80.0 * 2 * 1.5
    print("Hotel Booking Verification PASSED")`,
          architect_notes: `**10 — Hotel Booking: Pivot Verification**
- **Zero Core Edit:** \`SeasonalPricing\` decorator strategy injected without touching \`BookingService\`.`,
          pivot_question: `How would you handle room amenities filtering (e.g. sea view, balcony) and room upgrade policies?`,
          mermaid: `classDiagram
    class PricingStrategy { <<interface>> }
    class SeasonalPricing { +price() }
    PricingStrategy <|-- SeasonalPricing
`
        }
      ],
      summary: [
        { principle: 'Date Range Logic', violation: 'Flawed string date comparisons leading to double bookings.', fix: 'Half-open DateRange interval overlap method.' },
        { principle: 'Strategy Pattern', violation: 'Hardcoding seasonal pricing multipliers inside BookingService.', fix: 'Extracted PricingStrategy interface.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 11 — SHOPPING CART
    // -------------------------------------------------------------------------
    {
      id: 'broader-11-shopping-cart',
      title: '11 — Shopping Cart (Composable Discount Rules & Tax Pipeline)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Cart (Baking Discount Math into Cart)',
          code: `# 11_cart_naive.py
class NaiveCart:
    def __init__(self): self.items = []
    def total(self):
        sub = sum(item.price for item in self.items)
        # HARDCODED PROMOS: Violates OCP
        if sub > 50: sub -= 5
        return sub`,
          architect_notes: `**11 — Shopping Cart: Naive Analysis**
- Baking promo codes and discounts directly inside \`Cart.total()\`.`,
          pivot_question: `Interviewer: "Add a 'buy 2 get cheapest free' coupon and percentage discounts."`,
          mermaid: `classDiagram
    class NaiveCart { +items +total() }
`
        },
        {
          step: 2,
          title: 'Commit 2: PriceCalculator & Composable DiscountRule Pipeline',
          code: `# 11_cart_refactored.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List

@dataclass(frozen=True)
class Product:
    product_id: str
    price: float

@dataclass
class LineItem:
    product: Product
    qty: int
    @property
    def subtotal(self) -> float: return self.product.price * self.qty

class Cart:
    def __init__(self): self._items: Dict[str, LineItem] = {}
    def add(self, product: Product, qty: int = 1):
        if product.product_id in self._items:
            self._items[product.product_id].qty += qty
        else:
            self._items[product.product_id] = LineItem(product, qty)
    def update_qty(self, product_id: str, qty: int):
        if qty <= 0: self._items.pop(product_id, None)
        else: self._items[product_id].qty = qty
    def remove(self, product_id: str): self._items.pop(product_id, None)
    @property
    def items(self) -> List[LineItem]: return list(self._items.values())
    def subtotal(self) -> float: return sum(li.subtotal for li in self.items)

class DiscountRule(ABC):
    @abstractmethod
    def apply(self, subtotal: float, cart: Cart) -> float: ...

class PercentageOff(DiscountRule):
    def __init__(self, percent: float): self.percent = percent
    def apply(self, subtotal: float, cart: Cart) -> float:
        return subtotal * (self.percent / 100.0)

class SpendThresholdOff(DiscountRule):
    def __init__(self, threshold: float, flat_off: float):
        self.threshold = threshold
        self.flat_off = flat_off
    def apply(self, subtotal: float, cart: Cart) -> float:
        return self.flat_off if subtotal >= self.threshold else 0.0

class PriceCalculator:
    def __init__(self, rules: List[DiscountRule] = None, tax_rate: float = 0.0):
        self.rules = rules or []
        self.tax_rate = tax_rate

    def total(self, cart: Cart) -> float:
        subtotal = cart.subtotal()
        discount = sum(rule.apply(subtotal, cart) for rule in self.rules)
        taxed = (subtotal - discount) * (1 + self.tax_rate)
        return round(taxed, 2)`,
          architect_notes: `**11 — Shopping Cart: Pattern Solution**
- **SRP:** \`Cart\` holds line items; \`PriceCalculator\` executes discount rule pipelines; \`Product\` is pure data.
- **Strategy Pattern:** \`DiscountRule\` interface allows composing \`PercentageOff\` and \`SpendThresholdOff\`.`,
          pivot_question: `Magic Question: "Cart holds line items; PriceCalculator runs ordered DiscountRule strategies then applies tax. New promo = new rule. Good?"`,
          mermaid: `classDiagram
    class DiscountRule { <<interface>> +apply(subtotal, cart)* }
    class PercentageOff { +apply() }
    class SpendThresholdOff { +apply() }
    class PriceCalculator { -List~DiscountRule~ rules +total(cart) }
    DiscountRule <|-- PercentageOff
    DiscountRule <|-- SpendThresholdOff
    PriceCalculator --> DiscountRule
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — BuyNGetCheapestFree Discount Rule',
          code: `# 11_cart_pivot.py
# WINNING SENTENCE: "New DiscountRule implementation dropped into calculator's rule list — Cart and checkout untouched:"

class BuyNGetCheapestFree(DiscountRule):
    def __init__(self, n: int): self.n = n
    def apply(self, subtotal: float, cart: Cart) -> float:
        prices = sorted((li.product.price for li in cart.items for _ in range(li.qty)))
        if len(prices) >= self.n:
            return prices[0] # cheapest unit free
        return 0.0

if __name__ == "__main__":
    cart = Cart()
    cart.add(Product("book", 10.0), qty=2)
    cart.add(Product("pen", 2.0), qty=5)
    assert cart.subtotal() == 30.0
    
    # 10% off + $5 off over $15
    calc = PriceCalculator([PercentageOff(10), SpendThresholdOff(15, 5)])
    assert calc.total(cart) == 13.0 # 30 - 3 - 5 = 13
    
    # Pivot: Buy 2 Get 1 Free coupon check
    cart.add(Product("book", 10.0)) # 3 books
    combo = PriceCalculator([BuyNGetCheapestFree(2)])
    assert combo.total(cart) == 22.0 # 32 - 10
    print("Shopping Cart Verification PASSED")`,
          architect_notes: `**11 — Shopping Cart: Pivot Verification**
- **Zero Core Edit:** \`BuyNGetCheapestFree\` added as a new \`DiscountRule\` class without editing \`Cart\`.`,
          pivot_question: `How would you handle category-specific coupons (e.g. 20% off Electronics only) using the cart line items?`,
          mermaid: `classDiagram
    class DiscountRule { <<interface>> }
    class BuyNGetCheapestFree { +apply() }
    DiscountRule <|-- BuyNGetCheapestFree
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding promotion discount calculations inside Cart.total().', fix: 'Extracted DiscountRule strategy pipeline.' },
        { principle: 'SRP', violation: 'Cart class managing item state, currency rounding, and tax rates.', fix: 'Decoupled Cart from PriceCalculator.' }
      ]
    },

    // -------------------------------------------------------------------------
    // 12 — BATTLESHIP GAME
    // -------------------------------------------------------------------------
    {
      id: 'broader-12-battleship-game',
      title: '12 — Battleship Game (Weapon Strategy & Coordinate Grid)',
      language: 'python',
      commits: [
        {
          step: 1,
          title: 'Commit 1: Naive Single Shot Grid Firing (Hardcoded Shot Logic)',
          code: `# 12_battleship_naive.py
class NaiveBattleship:
    def fire(self, r: int, c: int):
        # Single cell hit check only...
        return "HIT"`,
          architect_notes: `**12 — Battleship Game: Naive Analysis**
- Single cell shot assumption breaks when introducing special weapons (e.g. 3x3 Area Bomb or Cross Shot).`,
          pivot_question: `Interviewer: "Add a special bomb weapon that hits a 3x3 area at once." How does your Weapon strategy absorb this?`,
          mermaid: `classDiagram
    class NaiveBattleship { +fire(r, c) }
`
        },
        {
          step: 2,
          title: 'Commit 2: Weapon Strategy & Board Coordinate Hit Detection',
          code: `# 12_battleship_refactored.py
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple

Coord = Tuple[int, int]

class ShotResult(Enum):
    MISS = "miss"
    HIT = "hit"
    SUNK = "sunk"
    REPEAT = "repeat"

class Ship:
    def __init__(self, name: str, cells: List[Coord]):
        self.name = name
        self.cells: Set[Coord] = set(cells)
        self._hits: Set[Coord] = set()

    def register_hit(self, cell: Coord) -> None: self._hits.add(cell)

    @property
    def is_sunk(self) -> bool: return self._hits == self.cells

class Board:
    def __init__(self, size: int):
        self.size = size
        self._cell_to_ship: Dict[Coord, Ship] = {}
        self._ships: List[Ship] = []
        self._fired: Set[Coord] = set()

    def place_ship(self, ship: Ship) -> bool:
        if any(not self._in_bounds(c) or c in self._cell_to_ship for c in ship.cells):
            return False
        for c in ship.cells: self._cell_to_ship[c] = ship
        self._ships.append(ship)
        return True

    def _in_bounds(self, c: Coord) -> bool:
        return 0 <= c[0] < self.size and 0 <= c[1] < self.size

    def receive_fire(self, cell: Coord) -> ShotResult:
        if cell in self._fired: return ShotResult.REPEAT
        self._fired.add(cell)
        ship = self._cell_to_ship.get(cell)
        if not ship: return ShotResult.MISS
        ship.register_hit(cell)
        return ShotResult.SUNK if ship.is_sunk else ShotResult.HIT

    @property
    def all_sunk(self) -> bool: return all(s.is_sunk for s in self._ships)

class Weapon(ABC):
    @abstractmethod
    def targets(self, center: Coord) -> List[Coord]: ...

class SingleShot(Weapon):
    def targets(self, center: Coord) -> List[Coord]: return [center]

class Game:
    def __init__(self, size: int):
        self.boards = {0: Board(size), 1: Board(size)}
        self._turn = 0
        self.winner: Optional[int] = None

    def place(self, player: int, ship: Ship) -> bool:
        return self.boards[player].place_ship(ship)

    def fire(self, player: int, cell: Coord, weapon: Optional[Weapon] = None) -> List[ShotResult]:
        weapon = weapon or SingleShot()
        opponent = 1 - player
        results = [self.boards[opponent].receive_fire(t) for t in weapon.targets(cell)]
        if self.boards[opponent].all_sunk: self.winner = player
        self._turn = opponent
        return results`,
          architect_notes: `**12 — Battleship Game: Pattern Solution**
- **Weapon Strategy:** \`Weapon\` interface (\`SingleShot\`) yields target coordinates to fire upon.
- **SRP:** \`Ship\` tracks hit cells; \`Board\` handles grid placement & firing; \`Game\` manages turns & victory.`,
          pivot_question: `Magic Question: "Each player owns a Board mapping cells to Ships; Firing pattern is a Weapon strategy, so an area bomb is a new class. Good?"`,
          mermaid: `classDiagram
    class Weapon { <<interface>> +targets(center)* }
    class SingleShot { +targets() }
    class Game { -Dict boards -Weapon weapon +fire() }
    Weapon <|-- SingleShot
    Game --> Weapon
`
        },
        {
          step: 3,
          title: 'Commit 3: Pivot Absorption — AreaBomb Weapon Strategy (3x3 Target Yield)',
          code: `# 12_battleship_pivot.py
# WINNING SENTENCE: "New Weapon implementation returning 3x3 cells; Board.receive_fire and Game are untouched:"

class AreaBomb(Weapon):
    def targets(self, center: Coord) -> List[Coord]:
        r, c = center
        return [(r + dr, c + dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1)]

if __name__ == "__main__":
    game = Game(size=5)
    assert game.place(1, Ship("destroyer", [(0, 0), (0, 1)]))
    
    assert game.fire(0, (0, 0)) == [ShotResult.HIT]
    assert game.fire(0, (0, 0)) == [ShotResult.REPEAT]
    assert game.fire(0, (2, 2)) == [ShotResult.MISS]
    assert game.fire(0, (0, 1)) == [ShotResult.SUNK]
    assert game.winner == 0
    
    # Pivot: AreaBomb weapon check
    g2 = Game(size=5)
    g2.place(1, Ship("sub", [(1, 1), (1, 2)]))
    results = g2.fire(0, (1, 1), AreaBomb()) # 3x3 around (1,1)
    assert ShotResult.SUNK in results
    assert g2.winner == 0
    print("Battleship Game Verification PASSED")`,
          architect_notes: `**12 — Battleship Game: Pivot Verification**
- **Zero Core Edit:** \`AreaBomb\` strategy implemented in 4 lines and passed to \`Game.fire()\`.`,
          pivot_question: `How would you implement fog-of-war tracking or radar scan capabilities?`,
          mermaid: `classDiagram
    class Weapon { <<interface>> }
    class AreaBomb { +targets() }
    Weapon <|-- AreaBomb
`
        }
      ],
      summary: [
        { principle: 'Strategy Pattern', violation: 'Hardcoding single coordinate target firing.', fix: 'Extracted Weapon strategy interface yielding target coordinates.' },
        { principle: 'SRP', violation: 'Mixing ship hit tracking with game turn flow.', fix: 'Decoupled Ship, Board, and Game into distinct single-responsibility classes.' }
      ]
    }
  ]
};
