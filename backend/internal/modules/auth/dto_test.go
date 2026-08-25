package auth

import "testing"

func TestRegisterValidate(t *testing.T) {
	tests := []struct {
		name string
		in   RegisterInput
		ok   bool
	}{
		{"valid tenant", RegisterInput{Name: "Budi", Email: "budi@test.local", Password: "Password123", Role: "tenant"}, true},
		{"short name", RegisterInput{Name: "A", Email: "a@test.local", Password: "Password123"}, false},
		{"bad email", RegisterInput{Name: "Budi", Email: "not-email", Password: "Password123"}, false},
		{"short password", RegisterInput{Name: "Budi", Email: "budi@test.local", Password: "short"}, false},
		{"bad role", RegisterInput{Name: "Budi", Email: "budi@test.local", Password: "Password123", Role: "hacker"}, false},
	}
	for _, tt := range tests {
		errs := tt.in.Validate()
		if tt.ok && len(errs) != 0 {
			t.Errorf("%s: expected ok, got errs %v", tt.name, errs)
		}
		if !tt.ok && len(errs) == 0 {
			t.Errorf("%s: expected errs, got ok", tt.name)
		}
	}
}

func TestLoginValidate(t *testing.T) {
	in := LoginInput{Email: "  BUDI@TEST.LOCAL ", Password: "secret"}
	if err := in.Validate(); err != nil {
		t.Fatalf("expected ok, got %v", err)
	}
	if in.Email != "budi@test.local" {
		t.Fatalf("expected lowercased email, got %s", in.Email)
	}
}
