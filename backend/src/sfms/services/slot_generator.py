from __future__ import annotations

from datetime import date, datetime, time, timedelta


class SlotGenerator:
    """Generates time slots for a court based on operating hours and duration."""

    PEAK_WEEKDAY = [(17, 22)]  # 5 PM - 10 PM
    PEAK_WEEKEND = [(6, 10), (16, 22)]  # 6-10 AM + 4-10 PM

    def generate_slots(
        self,
        court_id: int,
        target_date: date,
        opening: time,
        closing: time,
        duration_minutes: int,
        hourly_rate: float,
        pricing_rules: list[dict],
        peak_hour_rate: float | None = None,
    ) -> list[dict]:
        slots: list[dict] = []
        current = datetime.combine(target_date, opening)
        end = datetime.combine(target_date, closing)
        day_of_week = target_date.weekday()

        while current + timedelta(minutes=duration_minutes) <= end:
            slot_end = current + timedelta(minutes=duration_minutes)
            is_peak = self._is_peak_hour(current.hour, day_of_week)
            price = self._calculate_price(
                current.time(),
                slot_end.time(),
                day_of_week,
                pricing_rules,
                hourly_rate,
                duration_minutes,
                peak_hour_rate if is_peak else None,
            )
            slots.append(
                {
                    "court_id": court_id,
                    "start_time": current.time().strftime("%H:%M"),
                    "end_time": slot_end.time().strftime("%H:%M"),
                    "price": price,
                    "is_available": True,
                    "is_peak": is_peak and peak_hour_rate is not None,
                }
            )
            current = slot_end

        return slots

    def _is_peak_hour(self, hour: int, day_of_week: int) -> bool:
        ranges = self.PEAK_WEEKEND if day_of_week >= 5 else self.PEAK_WEEKDAY
        return any(start <= hour < end for start, end in ranges)

    def _calculate_price(
        self,
        start: time,
        end: time,
        day_of_week: int,
        rules: list[dict],
        default_rate: float,
        duration_minutes: int,
        peak_rate: float | None = None,
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

        # Use peak rate if available, otherwise default
        rate = peak_rate if peak_rate else default_rate
        return rate * duration_minutes / 60
