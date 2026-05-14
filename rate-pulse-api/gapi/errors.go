package gapi

import (
	"github.com/ThanhVinhTong/rate-pulse/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func statusFromServiceError(err error) error {
	switch service.ServiceErrorCode(err) {
	case service.ErrInvalidInput.Code:
		return status.Error(codes.InvalidArgument, service.ServiceErrorMessage(err))
	case service.ErrInvalidCredentials.Code,
		service.ErrUnauthorized.Code,
		service.ErrSessionNotFound.Code,
		service.ErrSessionBlocked.Code,
		service.ErrSessionExpired.Code:
		return status.Error(codes.Unauthenticated, service.ServiceErrorMessage(err))
	case service.ErrNotFound.Code:
		return status.Error(codes.NotFound, service.ServiceErrorMessage(err))
	case service.ErrDuplicateEmail.Code,
		service.ErrDuplicateExchangeRate.Code:
		return status.Error(codes.AlreadyExists, service.ServiceErrorMessage(err))
	default:
		return status.Error(codes.Internal, service.ErrInternal.Message)
	}
}
