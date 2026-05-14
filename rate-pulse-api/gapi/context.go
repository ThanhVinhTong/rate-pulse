package gapi

import (
	"context"

	"github.com/ThanhVinhTong/rate-pulse/token"
)

type contextKey string

const (
	requestIDContextKey            contextKey = "request_id"
	authorizationPayloadContextKey contextKey = "authorization_payload"
)

func contextWithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDContextKey, requestID)
}

func requestIDFromContext(ctx context.Context) string {
	requestID, _ := ctx.Value(requestIDContextKey).(string)
	return requestID
}

func contextWithAuthorizationPayload(ctx context.Context, payload *token.Payload) context.Context {
	return context.WithValue(ctx, authorizationPayloadContextKey, payload)
}

func authorizationPayloadFromContext(ctx context.Context) (*token.Payload, bool) {
	payload, ok := ctx.Value(authorizationPayloadContextKey).(*token.Payload)
	return payload, ok
}
