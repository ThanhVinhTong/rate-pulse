package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	mongoClient "github.com/ThanhVinhTong/rate-pulse/db/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type GeoInsightDoc struct {
	Region      string `json:"region"`
	Detail      string `json:"detail"`
	SignalTypes *int   `json:"signal_types"`
	Events      *int   `json:"events"`
}

type AIInsightsDoc struct {
	WorldBrief  string          `json:"world_brief"`
	GeoInsights []GeoInsightDoc `json:"geo_insights"`
	BreakNews   []string        `json:"break_news"`
}

type FeedArticleDoc struct {
	Title  string `json:"title"`
	Href   string `json:"href"`
	Domain string `json:"domain"`
	Time   string `json:"time"`
	Source string `json:"source"`
}

type SnapshotMeta struct {
	FeedCategoryCount int `json:"feed_category_count"`
	FeedItemCount     int `json:"feed_item_count"`
	BreakingNewsCount int `json:"breaking_news_count"`
	GeoInsightCount   int `json:"geo_insight_count"`
}

type SnapshotDocument struct {
	ID          string                      `json:"_id"`
	GeneratedAt time.Time                   `json:"generated_at"`
	AIInsights  AIInsightsDoc               `json:"ai_insights"`
	Feeds       map[string][]FeedArticleDoc `json:"feeds"`
	Meta        SnapshotMeta                `json:"meta"`
}

type NewsUseCase interface {
	GetLatestSnapshot(ctx context.Context) (*SnapshotDocument, error)
}

type NewsService struct {
	mongoClient *mongoClient.Client
	mu          sync.RWMutex
	cachedDoc   *SnapshotDocument
	lastFetch   time.Time
	cacheTTL    time.Duration
}

func NewNewsService(client *mongoClient.Client) *NewsService {
	return &NewsService{
		mongoClient: client,
		cacheTTL:    200 * time.Minute, // Cache snapshot in-memory for 200 minutes
	}
}

func (s *NewsService) GetLatestSnapshot(ctx context.Context) (*SnapshotDocument, error) {
	if s.mongoClient == nil {
		return nil, errors.New("mongodb client is not initialized")
	}

	// 1. Check in-memory cache first (< 0.1ms latency)
	s.mu.RLock()
	if s.cachedDoc != nil && time.Since(s.lastFetch) < s.cacheTTL {
		doc := s.cachedDoc
		s.mu.RUnlock()
		return doc, nil
	}
	s.mu.RUnlock()

	// 2. Fetch fresh snapshot from MongoDB
	col := s.mongoClient.GetCollection()
	opts := options.FindOne().SetSort(bson.D{{Key: "generated_at", Value: -1}})

	filter := bson.M{
		"feeds":                bson.M{"$ne": nil},
		"meta.feed_item_count": bson.M{"$gt": 0},
	}

	var rawBson bson.M
	err := col.FindOne(ctx, filter, opts).Decode(&rawBson)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch latest snapshot: %w", err)
	}

	jsonBytes, err := json.Marshal(rawBson)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal bson to json: %w", err)
	}

	var doc SnapshotDocument
	if err := json.Unmarshal(jsonBytes, &doc); err != nil {
		return nil, fmt.Errorf("failed to unmarshal json to snapshot struct: %w", err)
	}

	// 3. Update in-memory cache safely
	s.mu.Lock()
	s.cachedDoc = &doc
	s.lastFetch = time.Now()
	s.mu.Unlock()

	return &doc, nil
}
