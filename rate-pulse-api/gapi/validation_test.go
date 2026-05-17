package gapi

import (
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/stretchr/testify/require"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestValidateCreateUserRequestReturnsFieldViolation(t *testing.T) {
	err := validateCreateUserRequest(&pb.CreateUserRequest{})

	require.Error(t, err)
	require.Equal(t, codes.InvalidArgument, status.Code(err))

	st, ok := status.FromError(err)
	require.True(t, ok)
	require.Equal(t, "invalid request parameters", st.Message())

	require.Len(t, st.Details(), 1)
	badRequest, ok := st.Details()[0].(*errdetails.BadRequest)
	require.True(t, ok)
	require.Len(t, badRequest.GetFieldViolations(), 5)
	require.Equal(t, "username", badRequest.GetFieldViolations()[0].GetField())
	require.Equal(t, "username is required", badRequest.GetFieldViolations()[0].GetDescription())
}
