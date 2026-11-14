//go:build linux

package daemon

import (
	"strings"
	"testing"
)

func TestValidateConfigJSON(t *testing.T) {
	digest, err := validateConfigJSON([]byte(`{"log":{"level":"info"}}`))
	if err != nil {
		t.Fatalf("valid config rejected: %v", err)
	}
	if len(digest) != 64 {
		t.Fatalf("unexpected digest length %d", len(digest))
	}

	cases := []struct {
		name   string
		config string
	}{
		{"empty", ""},
		{"invalid", `{"log":`},
		{"array", `[]`},
		{"null", `null`},
		{"scalar", `"text"`},
	}
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			if _, err := validateConfigJSON([]byte(testCase.config)); err == nil {
				t.Fatalf("expected rejection for %q", testCase.config)
			}
		})
	}

	large := `{"value":"` + strings.Repeat("a", MaxConfigSize) + `"}`
	if _, err := validateConfigJSON([]byte(large)); err == nil {
		t.Fatal("expected rejection for oversized config")
	}
}

func TestValidateChannel(t *testing.T) {
	for _, channel := range []string{ChannelStable, ChannelAlpha} {
		if err := validateChannel(channel); err != nil {
			t.Fatalf("valid channel %q rejected: %v", channel, err)
		}
	}
	for _, channel := range []string{"", "beta", "stable "} {
		if err := validateChannel(channel); err == nil {
			t.Fatalf("invalid channel %q accepted", channel)
		}
	}
}

func TestDecodeParams(t *testing.T) {
	var params ConfigureParams
	if err := decodeParams(nil, &params); err != nil {
		t.Fatalf("nil params rejected: %v", err)
	}
	raw := []byte(`{"channel":"alpha","config":{"log":{}}}`)
	if err := decodeParams(raw, &params); err != nil {
		t.Fatalf("valid params rejected: %v", err)
	}
	if params.Channel != ChannelAlpha {
		t.Fatalf("unexpected channel %q", params.Channel)
	}
	if err := decodeParams([]byte(`[]`), &params); err == nil {
		t.Fatal("array params accepted")
	}
}
