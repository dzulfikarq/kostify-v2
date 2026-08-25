package kosts

import "testing"

func TestKostCreateValidate(t *testing.T) {
	ok := KostCreateInput{Name: "Kost Bahagia", City: "Jakarta", Gender: "campur"}
	if errs := ok.Validate(); len(errs) != 0 {
		t.Fatalf("expected ok, got %v", errs)
	}
	bad := KostCreateInput{Name: "AB", City: "J", Gender: "alien"}
	if errs := bad.Validate(); len(errs) == 0 {
		t.Fatalf("expected errs")
	}
}

func TestRoomCreateValidate(t *testing.T) {
	ok := RoomCreateInput{RoomNumber: "A101", PriceMonthly: 1500000}
	if errs := ok.Validate(); len(errs) != 0 {
		t.Fatalf("expected ok, got %v", errs)
	}
	bad := RoomCreateInput{RoomNumber: "", PriceMonthly: 0}
	if errs := bad.Validate(); len(errs) == 0 {
		t.Fatalf("expected errs for bad room")
	}
}
