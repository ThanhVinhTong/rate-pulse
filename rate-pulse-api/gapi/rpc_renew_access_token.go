package gapi

import (
	"context"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) RenewAccessToken(
	ctx context.Context,
	req *pb.RenewAccessTokenRequest,
) (*pb.RenewAccessTokenResponse, error) {
	if err := validateRenewAccessTokenRequest(req); err != nil {
		return nil, err
	}

	result, err := server.services.Auth.RenewAccessToken(ctx, service.RenewAccessTokenInput{
		RefreshToken: req.GetRefreshToken(),
	})
	if err != nil {
		return nil, statusFromServiceError(err)
	}

	return &pb.RenewAccessTokenResponse{
		AccessToken:          result.AccessToken,
		AccessTokenExpiresAt: timestamppb.New(result.AccessTokenExpiresAt),
	}, nil
}
