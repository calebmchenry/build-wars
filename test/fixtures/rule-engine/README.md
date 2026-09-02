# Rule Engine Fixtures

These fixtures are small synthetic catalog slices for `src/domain` rule-engine tests. They mimic the
EPIC-03 profession/attribute and EPIC-04 skill catalog shapes, but they are not authoritative Guild
Wars data.

MVP cases covered here include legal single and dual profession builds, blank and partial editor
states, duplicate professions and attributes, unresolved IDs, primary-only attributes, wrong
profession attributes and skills, attribute budget overspend, malformed skill bars, duplicate
skills, elite limits, PvE-only limits, PvE/PvP mode restrictions, split metadata gaps,
unsupported/non-player skill records, title/allegiance deferral, and effective-rank arithmetic.

Equipment, rune, insignia, armor, weapon, modifier, hero, party, title ownership, allegiance side,
quest-log, and UI policy checks remain placeholder scope for later epics. Tests may include fixture
facts that point at those domains only to verify that this sprint defers them explicitly.
