package worker

import (
	"context"
	"encoding/json"
	"fmt"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/hibiken/asynq"
	"github.com/rs/zerolog/log"
)

const TaskSendVerifyEmail = "task:send_verify_email"

type PayloadSendVerifyEmail struct {
	UserId int32 `json:"user_id"`
}

func (distributor *RedisTaskDistributor) DistributeTaskSendVerifyEmail(
	ctx context.Context,
	payload *PayloadSendVerifyEmail,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendVerifyEmail, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Bytes("payload", task.Payload()).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).
		Msg("enqueued task")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendVerifyEmail(
	ctx context.Context,
	task *asynq.Task,
) error {
	var payload PayloadSendVerifyEmail
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal task payload: %w", asynq.SkipRetry)
	}

	user, err := processor.store.GetUserByID(ctx, payload.UserId)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	secretCodeHash, err := util.HashPassword(util.RandomString(32))
	if err != nil {
		return fmt.Errorf("failed to generate hashed secret: %w", err)
	}

	verifyEmail, err := processor.store.CreateVerifyEmail(ctx, db.CreateVerifyEmailParams{
		UserID:         user.UserID,
		Email:          user.Email,
		SecretCodeHash: secretCodeHash,
	})
	if err != nil {
		return fmt.Errorf("failed to create verified email: %w", err)
	}

	// Process the verify email task for the retrieved user
	subject := "Welcome to Rate Pulse"
	verifyUrl := fmt.Sprintf(
		"%s?email_id=%d&secret_code=%s",
		processor.config.FrontendVerifyEmailURL,
		verifyEmail.ID,
		verifyEmail.SecretCodeHash,
	)
	content := fmt.Sprintf(`Hello %s,<br/>
	Thank you for registering with us!<br/>
	Please <a href="%s">click here</a> to verify your email address.<br/>
	`, user.Username, verifyUrl)
	to := []string{user.Email}

	err = processor.emailSender.SendEmail(
		subject,
		content,
		to,
		nil,
		nil,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to send verify email: %w", err)
	}

	log.Info().Str("type", task.Type()).Int32("user_id", user.UserID).
		Str("email", user.Email).Msg("sent verify email")

	return nil
}
