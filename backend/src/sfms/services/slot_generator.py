from __future__ import annotations

from datetime import date, datetime, time, timedelta


class SlotGenerator:
    """Generates time slots for a court based on operating hours and duration."""

    def generate_slots(
        self,
        court_id: int,
        target_date: date,
        opening: time,
        closing: time,
        duration_minutes: int,
        hourly_rate: float,
        pricing_rules: list[dict],
    ) -> list[dict]:
        slots: list[dict] = []
        current = datetime.combine(target_date, opening)
        end = datetime.combine(target_date, closing)

        while current + timedelta(minutes=duration_minutes) <= end:
            slot_end = current + timedelta(minutes=duration_minutes)
            price = self._calculate_price(
                current.time(),
                slot_end.time(),
                target_date.weekday(),
                pricing_rules,
                hourly_rate,
                duration_minutes,
            )
            slots.append(
                {
                    "court_id": court_id,
                    "start_time": current.time().strftime("%H:%M"),
                    "end_time": slot_end.time().strftime("%H:%M"),
                    "price": price,
                    "is_available": True,
                }
            )
            current = slot_end

        return slots

    def _calculate_price(
        self,
        start: time,
        end: time,
        day_of_week: int,
        rules: list[dict],
        default_rate: float,
        duration_minutes: int,
    ) -> float:
        # Day-specific rules take priority
        for rule in rules:
            rule_dow = rule.get("day_of_week")
            if rule_dow is not None and rule_dow == day_of_week:
                rule_start = rule["start_time"] if isinstance(rule["start_time"], time) else time.fromisoformat(str(rule["start_time"]))
                rule_end = rule["end_time"] if isinstance(rule["end_time"], time) else time.fromisoformat(str(rule["end_time"]))
                if rule_start <= start and end <= rule_end:
                    return float(rule["rate"]) * duration_minutes / 60

        # Generic rules (day_of_week is NULL)
        for rule in rules:
            if rule.get("day_of_week") is not None:
                continue
            rule_start = rule["start_time"] if isinstance(rule["start_time"], time) else time.fromisoformat(str(rule["start_time"]))
            rule_end = rule["end_time"] if isinstance(rule["end_time"], time) else time.fromisoformat(str(rule["end_time"]))
            if rule_start <= start and end <= rule_end:
                return float(rule["rate"]) * duration_minutes / 60

        return default_rate * duration_minutes / 60
