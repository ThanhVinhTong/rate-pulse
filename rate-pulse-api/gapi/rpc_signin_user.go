package gapi

import (
	"context"

	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) SignInUser(
	ctx context.Context,
	req *pb.SignInUserRequest,
) (*pb.SignInUserResponse, error) {
	metadata := server.GetMetadata(ctx)
	result, err := server.services.Auth.SignIn(ctx, service.SignInInput{
		Email:     req.GetEmail(),
		Password:  req.GetPassword(),
		UserAgent: metadata.UserAgent,
		ClientIP:  metadata.ClientIp,
	})
	if err != nil {
		return nil, statusFromServiceError(err)
	}

	response := &pb.SignInUserResponse{
		User:                  convertUser(result.User),
		SessionId:             result.SessionID.String(),
		AccessToken:           result.AccessToken,
		RefreshToken:          result.RefreshToken,
		AccessTokenExpiresAt:  timestamppb.New(result.AccessTokenExpiresAt),
		RefreshTokenExpiresAt: timestamppb.New(result.RefreshTokenExpiresAt),
	}
	return response, nil
}
