package api

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"

	"github.com/ThanhVinhTong/rate-pulse/docs"
	"github.com/gin-gonic/gin"
)

func registerSwaggerRoutes(router *gin.Engine) {
	router.GET("/swagger", redirectToSwaggerIndex)
	router.GET("/swagger/", redirectToSwaggerIndex)
	router.GET("/swagger/index.html", serveSwaggerUI)
	router.GET("/swagger/doc.json", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, buildSwaggerSpec(router.Routes()))
	})
}

func redirectToSwaggerIndex(ctx *gin.Context) {
	ctx.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
}

func serveSwaggerUI(ctx *gin.Context) {
	ctx.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerHTML))
}

func buildSwaggerSpec(routes gin.RoutesInfo) map[string]any {
	spec := map[string]any{}
	if err := json.Unmarshal(docs.SwaggerJSON, &spec); err != nil {
		spec = map[string]any{
			"swagger": "2.0",
			"info": map[string]any{
				"title":   "Rate Pulse API",
				"version": "1.0",
			},
		}
	}

	spec["basePath"] = "/"
	spec["paths"] = buildSwaggerPaths(routes)
	spec["securityDefinitions"] = map[string]any{
		"BearerAuth": map[string]any{
			"type":        "apiKey",
			"name":        "Authorization",
			"in":          "header",
			"description": `Use "Bearer <access_token>".`,
		},
	}

	return spec
}

func buildSwaggerPaths(routes gin.RoutesInfo) map[string]any {
	paths := make(map[string]any)
	sort.Slice(routes, func(i, j int) bool {
		if routes[i].Path == routes[j].Path {
			return routes[i].Method < routes[j].Method
		}
		return routes[i].Path < routes[j].Path
	})

	for _, route := range routes {
		if strings.HasPrefix(route.Path, "/swagger") {
			continue
		}

		path := swaggerPath(route.Path)
		methods, ok := paths[path].(map[string]any)
		if !ok {
			methods = make(map[string]any)
			paths[path] = methods
		}

		methods[strings.ToLower(route.Method)] = swaggerOperation(route)
	}

	return paths
}

func swaggerOperation(route gin.RouteInfo) map[string]any {
	operation := map[string]any{
		"tags":        []string{swaggerTag(route.Path)},
		"summary":     swaggerSummary(route.Method, route.Path),
		"operationId": swaggerOperationID(route.Method, route.Path),
		"responses": map[string]any{
			"200": map[string]any{"description": "OK"},
			"400": map[string]any{"description": "Bad Request"},
			"401": map[string]any{"description": "Unauthorized"},
			"500": map[string]any{"description": "Internal Server Error"},
		},
	}

	if params := swaggerPathParameters(route.Path); len(params) > 0 {
		operation["parameters"] = params
	}
	if isAuthenticatedSwaggerRoute(route.Path) {
		operation["security"] = []map[string][]string{{"BearerAuth": []string{}}}
	}

	return operation
}

func swaggerPath(path string) string {
	segments := strings.Split(path, "/")
	for i, segment := range segments {
		if strings.HasPrefix(segment, ":") {
			segments[i] = "{" + strings.TrimPrefix(segment, ":") + "}"
		}
	}
	return strings.Join(segments, "/")
}

func swaggerPathParameters(path string) []map[string]any {
	var params []map[string]any
	for _, segment := range strings.Split(path, "/") {
		if !strings.HasPrefix(segment, ":") {
			continue
		}

		params = append(params, map[string]any{
			"name":        strings.TrimPrefix(segment, ":"),
			"in":          "path",
			"required":    true,
			"type":        "string",
			"description": "Path parameter",
		})
	}
	return params
}

func swaggerTag(path string) string {
	segments := strings.Split(strings.Trim(path, "/"), "/")
	if len(segments) == 0 || segments[0] == "" {
		return "system"
	}
	if segments[0] == "admin" && len(segments) > 1 {
		return segments[1]
	}
	return segments[0]
}

func swaggerSummary(method string, path string) string {
	return method + " " + swaggerPath(path)
}

func swaggerOperationID(method string, path string) string {
	replacer := strings.NewReplacer("/", "_", ":", "", "-", "_", "{", "", "}", "")
	return strings.Trim(replacer.Replace(strings.ToLower(method+"_"+path)), "_")
}

func isAuthenticatedSwaggerRoute(path string) bool {
	if strings.HasPrefix(path, "/admin/") {
		return true
	}

	switch {
	case path == "/users" || strings.HasPrefix(path, "/users/"):
		return true
	case strings.HasPrefix(path, "/rate-source-preferences"):
		return true
	case strings.HasPrefix(path, "/currency-preference"):
		return true
	default:
		return false
	}
}

const swaggerHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rate Pulse API Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #f7f7f7; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/swagger/doc.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`
