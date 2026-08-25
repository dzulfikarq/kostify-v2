// Package migrations embeds SQL migration files so the migrate CLI binary
// is fully self-contained (no external files needed at runtime).
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
