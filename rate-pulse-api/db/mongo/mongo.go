package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Client struct {
	client     *mongo.Client
	database   string
	collection string
}

func NewClient(uri, dbName, collectionName string) (*Client, error) {
	if uri == "" {
		return nil, fmt.Errorf("MONGO_URI is empty")
	}
	if dbName == "" {
		dbName = "rate_pulse"
	}
	if collectionName == "" {
		collectionName = "news-rate-pulse"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to mongodb: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping mongodb: %w", err)
	}

	// Ensure index on generated_at descending for fast sort
	col := client.Database(dbName).Collection(collectionName)
	indexModel := mongo.IndexModel{
		Keys: bson.D{{Key: "generated_at", Value: -1}},
	}
	_, _ = col.Indexes().CreateOne(ctx, indexModel)

	return &Client{
		client:     client,
		database:   dbName,
		collection: collectionName,
	}, nil
}

func (c *Client) GetCollection() *mongo.Collection {
	return c.client.Database(c.database).Collection(c.collection)
}

func (c *Client) Close(ctx context.Context) error {
	if c.client != nil {
		return c.client.Disconnect(ctx)
	}
	return nil
}
