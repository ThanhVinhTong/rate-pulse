package gapi

import (
	"context"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) CheckHealth(
	ctx context.Context,
	req *pb.CheckHealthRequest,
) (*pb.CheckHealthResponse, error) {
	result := server.services.Health.CheckHealth(ctx)

	dependencies := make([]*pb.DependencyHealth, len(result.Dependencies))
	for i, dependency := range result.Dependencies {
		dependencies[i] = &pb.DependencyHealth{
			Name:    dependency.Name,
			Status:  dependency.Status,
			Message: dependency.Message,
		}
	}

	return &pb.CheckHealthResponse{
		ServiceName:   result.ServiceName,
		Status:        result.Status,
		Version:       result.Version,
		UptimeSeconds: result.UptimeSeconds,
		CheckedAt:     timestamppb.New(result.CheckedAt),
		Dependencies:  dependencies,
	}, nil
}
