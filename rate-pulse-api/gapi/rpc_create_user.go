package gapi

import (
	"context"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
)

func (server *Server) CreateUser(
	ctx context.Context,
	req *pb.CreateUserRequest,
) (*pb.CreateUserResponse, error) {
	user, err := server.services.Auth.CreateUser(ctx, service.CreateUserInput{
		Username:           req.GetUsername(),
		Email:              req.GetEmail(),
		Password:           req.GetPassword(),
		TimeZone:           req.GetTimeZone(),
		LanguagePreference: req.GetLanguagePreference(),
		CountryOfResidence: req.GetCountryOfResidence(),
		CountryOfBirth:     req.GetCountryOfBirth(),
		FirstName:          req.GetFirstName(),
		LastName:           req.GetLastName(),
	})
	if err != nil {
		return nil, statusFromServiceError(err)
	}

	response := &pb.CreateUserResponse{
		User: convertUser(user),
	}
	return response, nil
}
