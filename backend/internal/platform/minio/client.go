package mclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"kostify/backend/internal/config"
)

type Client struct {
	inner      *minio.Client
	bucket     string
	publicBase string // for browser-returned URLs, e.g. http://localhost:9000
}

func New(cfg *config.Config) (*Client, error) {
	if cfg.MinioAccessKey == "" {
		return nil, nil // disabled
	}
	cli, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, err
	}
	publicBase := fmt.Sprintf("http://%s", cfg.MinioEndpoint)
	// Override for browser if endpoint is internal docker host.
	if strings.Contains(cfg.MinioEndpoint, "minio:") {
		publicBase = "http://localhost:9000"
	}
	c := &Client{inner: cli, bucket: cfg.MinioBucket, publicBase: publicBase}
	// Ensure bucket exists lazily on first use; also try now.
	_ = c.EnsureBucket(context.Background())
	return c, nil
}

func (c *Client) EnsureBucket(ctx context.Context) error {
	if c == nil || c.inner == nil {
		return nil
	}
	exists, err := c.inner.BucketExists(ctx, c.bucket)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if err := c.inner.MakeBucket(ctx, c.bucket, minio.MakeBucketOptions{}); err != nil {
		return err
	}
	// Public-read for kost photos.
	policy := map[string]any{
		"Version": "2012-10-17",
		"Statement": []map[string]any{{
			"Effect":    "Allow",
			"Principal": "*",
			"Action":    []string{"s3:GetObject"},
			"Resource":  []string{"arn:aws:s3:::" + c.bucket + "/*"},
		}},
	}
	b, _ := json.Marshal(policy)
	_ = c.inner.SetBucketPolicy(ctx, c.bucket, string(b))
	slog.Info("minio bucket ensured", "bucket", c.bucket)
	return nil
}

func (c *Client) Put(ctx context.Context, key string, data []byte, contentType string) (string, error) {
	if c == nil || c.inner == nil {
		return "", fmt.Errorf("minio not configured")
	}
	if err := c.EnsureBucket(ctx); err != nil {
		return "", err
	}
	_, err := c.inner.PutObject(ctx, c.bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s/%s", c.publicBase, c.bucket, key), nil
}
