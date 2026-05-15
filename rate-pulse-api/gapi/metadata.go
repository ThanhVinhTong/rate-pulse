package gapi

import (
	"context"

	"google.golang.org/grpc/metadata"
)

const (
	grpcUserAgentHeader = "user-agent"
	xForwardedForHeader = "x-forwarded-for"
)

type Metadata struct {
	UserAgent string
	ClientIp  string
}

func (server *Server) GetMetadata(ctx context.Context) *Metadata {
	mtdata := &Metadata{}

	if md, ok := metadata.FromIncomingContext(ctx); ok {

		if userAgents := md.Get(grpcUserAgentHeader); len(userAgents) > 0 {
			mtdata.UserAgent = userAgents[0]
		}
		if clientIps := md.Get(xForwardedForHeader); len(clientIps) > 0 {
			mtdata.ClientIp = clientIps[0]
		}
	}

	return mtdata
}
