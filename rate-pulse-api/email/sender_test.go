package email

import (
	"bytes"
	"errors"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockSMTPClient captures messages for verification
type mockSMTPClient struct {
	sendMailFunc func(addr string, a smtp.Auth, from string, to []string, msg []byte) error
	lastAddr     string
	lastFrom     string
	lastMessage  []byte   // Captures the raw email for assertions
	lastTo       []string // Captures recipients
}

func (m *mockSMTPClient) SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error {
	m.lastAddr = addr
	m.lastFrom = from
	m.lastMessage = append([]byte{}, msg...) // Deep copy
	m.lastTo = append([]string{}, to...)

	if m.sendMailFunc != nil {
		return m.sendMailFunc(addr, a, from, to, msg)
	}
	return nil
}

// ====================== NewBrevoSender Tests ======================

func TestNewBrevoSender(t *testing.T) {
	tests := []struct {
		name        string
		config      BrevoSenderConfig
		wantErr     bool
		errContains string
	}{
		{
			name: "valid input",
			config: BrevoSenderConfig{
				SenderName:    "John Doe",
				SenderAddress: "john.doe@example.com",
				SMTPUsername:  "smtp-login@example.com",
				SMTPPassword:  "smtp-key-xyz",
			},
		},
		{
			name: "defaults smtp username to sender address",
			config: BrevoSenderConfig{
				SenderName:    "John Doe",
				SenderAddress: "john.doe@example.com",
				SMTPPassword:  "smtp-key-xyz",
			},
		},
		{
			name: "empty name",
			config: BrevoSenderConfig{
				SenderAddress: "test@example.com",
				SMTPPassword:  "smtp-key",
			},
			wantErr:     true,
			errContains: "email sender name is required",
		},
		{
			name: "invalid sender email",
			config: BrevoSenderConfig{
				SenderName:    "Test",
				SenderAddress: "invalid-email",
				SMTPPassword:  "smtp-key",
			},
			wantErr:     true,
			errContains: "email sender address is invalid",
		},
		{
			name: "invalid smtp username",
			config: BrevoSenderConfig{
				SenderName:    "Test",
				SenderAddress: "sender@example.com",
				SMTPUsername:  "invalid-login",
				SMTPPassword:  "smtp-key",
			},
			wantErr:     true,
			errContains: "smtp username is invalid",
		},
		{
			name: "invalid smtp port",
			config: BrevoSenderConfig{
				SenderName:    "Test",
				SenderAddress: "sender@example.com",
				SMTPPort:      70000,
				SMTPPassword:  "smtp-key",
			},
			wantErr:     true,
			errContains: "smtp port",
		},
		{
			name: "empty smtp key",
			config: BrevoSenderConfig{
				SenderName:    "Test",
				SenderAddress: "test@example.com",
				SMTPPassword:  "   ",
			},
			wantErr:     true,
			errContains: "brevo smtp key is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sender, err := NewBrevoSender(tt.config)

			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
				assert.Nil(t, sender)
			} else {
				require.NoError(t, err)
				bs := sender.(*BrevoSender)
				assert.Equal(t, strings.TrimSpace(tt.config.SenderName), bs.name)
				assert.Equal(t, strings.TrimSpace(tt.config.SenderAddress), bs.fromEmailAddress)
				assert.NotEmpty(t, bs.smtpUsername)
				assert.Equal(t, brevoSMTPHost, bs.smtpHost)
				assert.Equal(t, brevoSMTPPort, bs.smtpPort)
			}
		})
	}
}

// ====================== Validation Tests ======================

func Test_validateRecipients(t *testing.T) {
	tests := []struct {
		name        string
		field       string
		recipients  []string
		wantErr     bool
		errContains string
	}{
		{"valid to", "to", []string{"alice@example.com", "bob@example.com"}, false, ""},
		{"empty to", "to", []string{}, true, "at least one recipient"},
		{"empty cc allowed", "cc", []string{}, false, ""},
		{"invalid email", "to", []string{"invalid-email"}, true, "recipient"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRecipients(tt.recipients, tt.field)
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func Test_validateAttachments(t *testing.T) {
	tmpDir := t.TempDir()
	validFile := filepath.Join(tmpDir, "report.pdf")
	_ = os.WriteFile(validFile, []byte("test"), 0644)

	oversized := filepath.Join(tmpDir, "big.pdf")
	_ = os.WriteFile(oversized, make([]byte, 11<<20), 0644)

	tests := []struct {
		name        string
		files       []string
		wantErr     bool
		errContains string
	}{
		{"valid", []string{validFile}, false, ""},
		{"non-existent", []string{"/fake/file"}, true, "failed to stat"},
		{"directory", []string{tmpDir}, true, "is a directory"},
		{"too large", []string{oversized}, true, "exceeds"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateAttachments(tt.files)
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// ====================== SendEmail Tests ======================

func TestBrevoSender_SendEmail(t *testing.T) {
	tmpDir := t.TempDir()
	attachmentPath := filepath.Join(tmpDir, "invoice.pdf")
	_ = os.WriteFile(attachmentPath, []byte("%PDF fake content"), 0644)

	newSender := func() *BrevoSender {
		return &BrevoSender{
			name:             "Test Sender",
			fromEmailAddress: "sender@example.com",
			smtpUsername:     "smtp-login@example.com",
			smtpPassword:     "smtp-key",
			smtpHost:         brevoSMTPHost,
			smtpPort:         brevoSMTPPort,
			smtpClient:       &mockSMTPClient{},
		}
	}

	tests := []struct {
		name         string
		subject      string
		content      string
		to           []string
		cc           []string
		bcc          []string
		attachments  []string
		mockErr      error
		wantErr      bool
		errContains  string
		validateFunc func(t *testing.T, mock *mockSMTPClient)
	}{
		{
			name:        "successful email with attachment",
			subject:     "Monthly Report",
			content:     "<h1>Hello</h1><p>This is a test email.</p>",
			to:          []string{"recipient@example.com"},
			cc:          []string{"cc@example.com"},
			bcc:         []string{"bcc@example.com"},
			attachments: []string{attachmentPath},
			wantErr:     false,
			validateFunc: func(t *testing.T, mock *mockSMTPClient) {
				msgStr := string(mock.lastMessage)

				assert.Contains(t, msgStr, "Monthly Report")
				assert.Contains(t, msgStr, "multipart/mixed")
				assert.Contains(t, msgStr, "invoice.pdf")
				assert.Contains(t, msgStr, "base64")
				assert.Contains(t, msgStr, "Hello</h1>")
				assert.Equal(t, "smtp-relay.brevo.com:587", mock.lastAddr)
				assert.Equal(t, "sender@example.com", mock.lastFrom)
				assert.Contains(t, strings.Join(mock.lastTo, ","), "recipient@example.com")
			},
		},
		{
			name:        "no recipients should fail",
			subject:     "Test",
			content:     "<p>test</p>",
			to:          []string{},
			wantErr:     true,
			errContains: "at least one recipient",
		},
		{
			name:        "invalid recipient",
			subject:     "Test",
			content:     "<p>test</p>",
			to:          []string{"invalid-email"},
			wantErr:     true,
			errContains: "recipient",
		},
		{
			name:        "smtp error propagated",
			subject:     "Test",
			content:     "<p>test</p>",
			to:          []string{"user@example.com"},
			mockErr:     errors.New("535-5.7.8 Username and Password not accepted"),
			wantErr:     true,
			errContains: "Username and Password",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sender := newSender()
			mock := sender.smtpClient.(*mockSMTPClient)

			if tt.mockErr != nil {
				mock.sendMailFunc = func(string, smtp.Auth, string, []string, []byte) error {
					return tt.mockErr
				}
			}

			err := sender.SendEmail(tt.subject, tt.content, tt.to, tt.cc, tt.bcc, tt.attachments)

			if tt.wantErr {
				require.Error(t, err)
				if tt.errContains != "" {
					assert.Contains(t, err.Error(), tt.errContains)
				}
			} else {
				require.NoError(t, err)
				if tt.validateFunc != nil {
					tt.validateFunc(t, mock)
				}
			}
		})
	}
}

// ====================== Low-level Component Tests ======================

func Test_base64LineWriter(t *testing.T) {
	var buf bytes.Buffer
	w := newBase64LineWriter(&buf)

	input := []byte("This is a long string to test base64 line wrapping behavior according to email standards.")
	_, err := w.Write(input)
	require.NoError(t, err)

	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\r\n")

	for _, line := range lines {
		assert.LessOrEqual(t, len(line), 76, "Base64 lines must not exceed 76 characters per RFC 2045")
	}
}
