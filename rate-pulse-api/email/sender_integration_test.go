package email

import (
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/stretchr/testify/require"
)

func TestSendEmailWithBrevo_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	config, err := util.LoadConfig("..")
	require.NoError(t, err)

	// Optional: Skip if credentials are not set
	if config.EmailSMTPPassword == "" {
		t.Skip("Email credentials not configured")
	}

	sender, err := NewBrevoSender(BrevoSenderConfig{
		SenderName:    config.EmailSenderName,
		SenderAddress: config.EmailSenderAddress,
		SMTPHost:      config.EmailSMTPHost,
		SMTPPort:      config.EmailSMTPPort,
		SMTPUsername:  config.EmailSMTPUsername,
		SMTPPassword:  config.EmailSMTPPassword,
	})
	require.NoError(t, err)

	subject := "Test Email from Unit Test - " + util.RandomString(6)
	content := `
		<h1>Hello World</h1>
		<p>This is a test email sent from automated tests.</p>
	`
	attachFiles := []string{"../welcome_guide.md"}

	to := []string{config.EmailSenderAddress} // Send to yourself for testing

	err = sender.SendEmail(subject, content, to, nil, nil, attachFiles)
	require.NoError(t, err)
}
