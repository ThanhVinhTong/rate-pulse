package email

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net/mail"
	"net/smtp"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
)

type smtpClient interface {
	SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error
}

const (
	smtpHost              = "smtp.gmail.com"     // Gmail SMTP server hostname
	smtpAddress           = "smtp.gmail.com:587" // Gmail SMTP with STARTTLS port
	maxAttachmentBytes    = 10 << 20             // Maximum size per attachment (10MB)
	maxTotalRawAttachment = 18 << 20             // Maximum total raw size of all attachments (18MB)
)

// Sender defines the contract for sending emails
type Sender interface {
	SendEmail(subject, content string, to, cc, bcc, attachments []string) error
}

type GmailSender struct {
	name              string
	fromEmailAddress  string
	fromEmailPassword string
	smtpClient        smtpClient // Injected for testing
}

// NewGmailSender creates and validates a new Gmail sender
func NewGmailSender(name, fromEmailAddress, fromEmailPassword string) (Sender, error) {
	name = strings.TrimSpace(name)
	fromEmailAddress = strings.TrimSpace(fromEmailAddress)

	if name == "" {
		return nil, errors.New("email sender name is required")
	}
	if _, err := mail.ParseAddress(fromEmailAddress); err != nil {
		return nil, fmt.Errorf("email sender address is invalid: %w", err)
	}
	if strings.TrimSpace(fromEmailPassword) == "" {
		return nil, errors.New("email sender password is required")
	}

	sender := &GmailSender{
		name:              name,
		fromEmailAddress:  fromEmailAddress,
		fromEmailPassword: fromEmailPassword,
		smtpClient:        smtpClientFunc(smtp.SendMail), // Real implementation
	}
	return sender, nil
}

// Helper type to adapt smtp.SendMail to interface
type smtpClientFunc func(addr string, a smtp.Auth, from string, to []string, msg []byte) error

func (f smtpClientFunc) SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error {
	return f(addr, a, from, to, msg)
}

// SendEmail sends an HTML email with CC, BCC, and attachments via Gmail
func (sender *GmailSender) SendEmail(
	subject string,
	content string,
	to []string,
	cc []string,
	bcc []string,
	attachments []string,
) error {
	// Input validation
	if err := validateRecipients(to, "to"); err != nil {
		return err
	}
	if err := validateRecipients(cc, "cc"); err != nil {
		return err
	}
	if err := validateRecipients(bcc, "bcc"); err != nil {
		return err
	}
	if err := validateAttachments(attachments); err != nil {
		return err
	}

	auth := smtp.PlainAuth("", sender.fromEmailAddress, sender.fromEmailPassword, smtpHost)

	// Build the complete email message
	var msg bytes.Buffer
	writer := multipart.NewWriter(&msg)

	// Set top-level email headers
	headers := textproto.MIMEHeader{
		"From":         {fmt.Sprintf("%s <%s>", sender.name, sender.fromEmailAddress)},
		"To":           {strings.Join(to, ",")},
		"Subject":      {mime.QEncoding.Encode("UTF-8", subject)}, // Properly encode special chars
		"MIME-Version": {"1.0"},
		"Content-Type": {`multipart/mixed; boundary=` + writer.Boundary()},
	}
	if len(cc) > 0 {
		headers.Set("Cc", strings.Join(cc, ","))
	}

	// Write headers
	for k, vs := range headers {
		for _, v := range vs {
			msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
		}
	}
	msg.WriteString("\r\n") // Blank line after headers

	// HTML content part
	htmlHeader := textproto.MIMEHeader{
		"Content-Type":              {`text/html; charset="UTF-8"`},
		"Content-Transfer-Encoding": {"quoted-printable"},
	}

	htmlPart, err := writer.CreatePart(htmlHeader)
	if err != nil {
		return fmt.Errorf("failed to create html part: %w", err)
	}

	htmlWriter := quotedprintable.NewWriter(htmlPart)
	if _, err := htmlWriter.Write([]byte(content)); err != nil {
		return fmt.Errorf("failed to write html content: %w", err)
	}
	if err := htmlWriter.Close(); err != nil {
		return fmt.Errorf("failed to close html encoder: %w", err)
	}

	// Add attachments
	for _, filePath := range attachments {
		if err := writeAttachment(writer, filePath); err != nil {
			return err
		}
	}

	// Finalize multipart message
	if err := writer.Close(); err != nil {
		return fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Prepare all recipients for SMTP envelope
	recipients := append(append(append([]string{}, to...), cc...), bcc...)

	return sender.smtpClient.SendMail(
		smtpAddress,
		auth,
		sender.fromEmailAddress,
		recipients,
		msg.Bytes(),
	)
}

// validateRecipients checks email address format
func validateRecipients(recipients []string, field string) error {
	if field == "to" && len(recipients) == 0 {
		return errors.New("email must have at least one recipient")
	}

	for _, addr := range recipients {
		if _, err := mail.ParseAddress(strings.TrimSpace(addr)); err != nil {
			return fmt.Errorf("%s recipient %q is invalid: %w", field, addr, err)
		}
	}
	return nil
}

// validateAttachments enforces file size limits
func validateAttachments(filePaths []string) error {
	var totalSize int64

	for _, filePath := range filePaths {
		stat, err := os.Stat(filePath)
		if err != nil {
			return fmt.Errorf("failed to stat attachment %s: %w", filePath, err)
		}
		if stat.IsDir() {
			return fmt.Errorf("attachment %s is a directory", filePath)
		}
		if stat.Size() > maxAttachmentBytes {
			return fmt.Errorf("attachment %s exceeds %d bytes", filePath, maxAttachmentBytes)
		}

		totalSize += stat.Size()
		if totalSize > maxTotalRawAttachment {
			return fmt.Errorf("attachments exceed total raw size limit of %d bytes", maxTotalRawAttachment)
		}
	}
	return nil
}

// writeAttachment adds file as base64 encoded part
func writeAttachment(writer *multipart.Writer, filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open attachment %s: %w", filePath, err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return fmt.Errorf("failed to stat attachment %s: %w", filePath, err)
	}

	mediaType := mime.TypeByExtension(filepath.Ext(filePath))
	if mediaType == "" {
		mediaType = "application/octet-stream"
	}

	header := textproto.MIMEHeader{
		"Content-Type":              {mediaType},
		"Content-Disposition":       {fmt.Sprintf(`attachment; filename=%q`, stat.Name())},
		"Content-Transfer-Encoding": {"base64"},
	}

	part, err := writer.CreatePart(header)
	if err != nil {
		return fmt.Errorf("failed to create attachment part %s: %w", filePath, err)
	}

	encoder := base64.NewEncoder(base64.StdEncoding, newBase64LineWriter(part))
	if _, err := io.Copy(encoder, file); err != nil {
		_ = encoder.Close()
		return fmt.Errorf("failed to write attachment %s: %w", filePath, err)
	}
	if err := encoder.Close(); err != nil {
		return fmt.Errorf("failed to close attachment encoder %s: %w", filePath, err)
	}

	return nil
}

// base64LineWriter ensures base64 output is wrapped at 76 characters per line (email standard)
type base64LineWriter struct {
	w    io.Writer
	line int
}

func newBase64LineWriter(w io.Writer) io.Writer {
	return &base64LineWriter{w: w}
}

func (w *base64LineWriter) Write(p []byte) (int, error) {
	written := 0
	for _, b := range p {
		if w.line >= 76 {
			if _, err := w.w.Write([]byte("\r\n")); err != nil {
				return written, err
			}
			w.line = 0
		}
		if _, err := w.w.Write([]byte{b}); err != nil {
			return written, err
		}
		w.line++
		written++
	}
	return written, nil
}
