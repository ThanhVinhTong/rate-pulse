package main

import (
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/util"
)

func TestBuildBrevoSenderConfigUsesSMTPSecrets(t *testing.T) {
	config := util.Config{
		EmailSenderName:    "Rate Pulse",
		EmailSenderAddress: "sender@example.com",
		EmailSMTPHost:      "smtp.example.com",
		EmailSMTPPort:      2525,
		EmailSMTPUsername:  "smtp-login@example.com",
		EmailSMTPPassword:  "smtp-key",
	}

	got := buildBrevoSenderConfig(config)

	if got.SenderName != config.EmailSenderName {
		t.Fatalf("SenderName = %q, want %q", got.SenderName, config.EmailSenderName)
	}
	if got.SenderAddress != config.EmailSenderAddress {
		t.Fatalf("SenderAddress = %q, want %q", got.SenderAddress, config.EmailSenderAddress)
	}
	if got.SMTPHost != config.EmailSMTPHost {
		t.Fatalf("SMTPHost = %q, want %q", got.SMTPHost, config.EmailSMTPHost)
	}
	if got.SMTPPort != config.EmailSMTPPort {
		t.Fatalf("SMTPPort = %d, want %d", got.SMTPPort, config.EmailSMTPPort)
	}
	if got.SMTPUsername != config.EmailSMTPUsername {
		t.Fatalf("SMTPUsername = %q, want %q", got.SMTPUsername, config.EmailSMTPUsername)
	}
	if got.SMTPPassword != config.EmailSMTPPassword {
		t.Fatalf("SMTPPassword = %q, want %q", got.SMTPPassword, config.EmailSMTPPassword)
	}
}

func TestBuildBrevoSenderConfigFallsBackToExistingEmailFields(t *testing.T) {
	config := util.Config{
		EmailSenderName:    "Rate Pulse",
		EmailSenderAddress: "sender@example.com",
	}

	got := buildBrevoSenderConfig(config)

	if got.SMTPUsername != config.EmailSenderAddress {
		t.Fatalf("SMTPUsername = %q, want %q", got.SMTPUsername, config.EmailSenderAddress)
	}
}
