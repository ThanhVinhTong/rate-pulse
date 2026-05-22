/*
gRPC's middleware for:
- Panic recovery.
- Request ID extraction/generation.
- Logging.
- Bearer token verification.
- Public/protected RPC routing.
- Auth payload in context is the right pattern.
*/
package gapi

import (
	"context"
	"runtime/debug"
	"strings"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

const (
	authorizationHeaderKey  = "authorization"
	authorizationTypeBearer = "bearer"
	requestIDHeaderKey      = "x-request-id"
	userTypeAdmin           = "admin"
)

var publicMethods = map[string]bool{
	pb.RatePulseAuthenticationService_CreateUser_FullMethodName:           true,
	pb.RatePulseAuthenticationService_SignInUser_FullMethodName:           true,
	pb.RatePulseAuthenticationService_RenewAccessToken_FullMethodName:     true,
	pb.RatePulseExchangeRateService_GetLatestExchangeRates_FullMethodName: true,
}

var adminMethods = map[string]bool{
	pb.RatePulseInternalHealthService_CheckHealth_FullMethodName: true,
}

func UnaryServerInterceptor(tokenMaker token.Maker) grpc.UnaryServerInterceptor {
	return chainUnaryInterceptors(
		recoveryInterceptor(),
		requestIDInterceptor(),
		loggingInterceptor(),
		authInterceptor(tokenMaker),
	)
}

func chainUnaryInterceptors(interceptors ...grpc.UnaryServerInterceptor) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		chainedHandler := handler
		for i := len(interceptors) - 1; i >= 0; i-- {
			currentInterceptor := interceptors[i]
			nextHandler := chainedHandler
			chainedHandler = func(currentCtx context.Context, currentReq any) (any, error) {
				return currentInterceptor(currentCtx, currentReq, info, nextHandler)
			}
		}
		return chainedHandler(ctx, req)
	}
}

func recoveryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Error().
					Str("method", info.FullMethod).
					Str("request_id", requestIDFromContext(ctx)).
					Interface("panic", recovered).
					Bytes("stack", debug.Stack()).
					Msg("grpc panic recovered")
				err = status.Error(codes.Internal, "internal server error")
			}
		}()
		return handler(ctx, req)
	}
}

func requestIDInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		requestID := requestIDFromMetadata(ctx)
		if requestID == "" {
			requestID = uuid.NewString()
		}

		ctx = contextWithRequestID(ctx, requestID)
		grpc.SetHeader(ctx, metadata.Pairs(requestIDHeaderKey, requestID))
		return handler(ctx, req)
	}
}

func loggingInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		start := time.Now()
		resp, err := handler(ctx, req)
		code := status.Code(err)

		event := log.Info()
		if err != nil {
			event = log.Error().Err(err)
		}

		event = event.
			Str("method", info.FullMethod).
			Str("request_id", requestIDFromContext(ctx)).
			Str("status_code", code.String()).
			Int64("latency_ms", time.Since(start).Milliseconds())

		if payload, ok := authorizationPayloadFromContext(ctx); ok {
			event = event.Int32("user_id", payload.UserID)
		}

		event.Msg("grpc request completed")
		return resp, nil
	}
}

func authInterceptor(tokenMaker token.Maker) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if publicMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		accessToken, err := accessTokenFromMetadata(ctx)
		if err != nil {
			return nil, err
		}

		payload, err := tokenMaker.VerifyToken(accessToken)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, "invalid access token")
		}

		if adminMethods[info.FullMethod] && payload.UserType != userTypeAdmin {
			return nil, status.Error(codes.PermissionDenied, "admin access required")
		}

		return handler(contextWithAuthorizationPayload(ctx, payload), req)
	}
}

func requestIDFromMetadata(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if values := md.Get(requestIDHeaderKey); len(values) > 0 {
			return values[0]
		}
	}
	return ""
}

func accessTokenFromMetadata(ctx context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", status.Error(codes.Unauthenticated, "metadata is required")
	}

	values := md.Get(authorizationHeaderKey)
	if len(values) == 0 {
		return "", status.Error(codes.Unauthenticated, "authorization header is required")
	}

	fields := strings.Fields(values[0])
	if len(fields) != 2 {
		return "", status.Error(codes.Unauthenticated, "invalid authorization header format")
	}

	if strings.ToLower(fields[0]) != authorizationTypeBearer {
		return "", status.Error(codes.Unauthenticated, "unsupported authorization type")
	}

	return fields[1], nil
}
