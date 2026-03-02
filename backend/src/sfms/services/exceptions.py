class SlotUnavailableError(Exception):
    """Raised when a requested slot is already booked or no longer available."""


class BookingNotFoundError(Exception):
    """Raised when a booking cannot be found or has already been cancelled."""


class PaymentRequiredError(Exception):
    """Raised when a booking requires payment before confirmation."""
