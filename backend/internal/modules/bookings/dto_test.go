package bookings

import "testing"

func TestApproveValidate(t *testing.T) {
	ok := ApproveBookingInput{StartDate: "2026-09-01", DurationMonths: 3}
	if errs := ok.Validate(); len(errs) != 0 {
		t.Fatalf("expected ok, got %v", errs)
	}
	bad := ApproveBookingInput{StartDate: "not-date", DurationMonths: 20}
	if errs := bad.Validate(); len(errs) == 0 {
		t.Fatalf("expected errs")
	}
}
