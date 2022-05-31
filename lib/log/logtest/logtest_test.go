package logtest

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/sourcegraph/sourcegraph/lib/log"
	"github.com/sourcegraph/sourcegraph/lib/log/privacy"
)

func TestExport(t *testing.T) {
	logger, exportLogs := Captured(t)
	assert.NotNil(t, logger)

	logger.Info("hello world", log.Text("key", privacy.NewText( "value", privacy.Unknown)))

	logs := exportLogs()
	assert.Len(t, logs, 1)
	assert.Equal(t, "TestExport", logs[0].Scope)
	assert.Equal(t, "hello world", logs[0].Message)

	// In dev mode, attributes are not added
	assert.Equal(t, map[string]any{"key": "value"}, logs[0].Fields)
}
