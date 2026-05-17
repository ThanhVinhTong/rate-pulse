package docs

import _ "embed"

// SwaggerJSON is generated from the protobuf definitions by `make swagger`.
//
//go:embed api.swagger.json
var SwaggerJSON []byte
