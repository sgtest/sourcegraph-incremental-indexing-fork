package api

import (
	"net/http"

	"github.com/sourcegraph/sourcegraph/internal/database"
)

// HandleRegistry is called to handle HTTP requests for the extension registry. If there is no local
// extension registry, it returns an HTTP error response.
var HandleRegistry = func(db database.DB) func(w http.ResponseWriter, r *http.Request) error {
	return func(w http.ResponseWriter, r *http.Request) error {
		http.Error(w, "no local extension registry exists", http.StatusNotFound)
		return nil
	}
}
