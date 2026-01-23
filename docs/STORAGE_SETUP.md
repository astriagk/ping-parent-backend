# File Storage Configuration Guide

This project supports multiple file storage providers to accommodate different development and production scenarios.

## Quick Start

### Development (Free - Local Storage)

**Default setup** - No configuration needed!

Files are automatically stored in the `/uploads` directory:

```
your-project/
├── uploads/
│   └── driver-documents/
│       ├── driving-licenses/
│       ├── vehicle-licenses/
│       └── insurance/
├── src/
└── ...
```

**In `.env.dev`:**

```
STORAGE_PROVIDER=local
```

Access files at: `http://localhost:3000/uploads/driver-documents/...`

---

## Production Deployment

### Option 1: DigitalOcean Spaces (Recommended)

- **Cost**: $5/month for 250GB
- **Setup time**: 5 minutes
- **Best for**: Small to medium projects

**Steps:**

1. Create account at https://www.digitalocean.com
2. Create Spaces bucket in `nyc3` region
3. Generate API key in settings
4. Update `.env.prod`:

```
STORAGE_PROVIDER=digitalocean
STORAGE_ENDPOINT=https://nyc3.digitaloceanspaces.com
STORAGE_REGION=nyc3
STORAGE_ACCESS_KEY=your_key
STORAGE_SECRET_KEY=your_secret
STORAGE_BUCKET_NAME=your-bucket-name
```

### Option 2: AWS S3

- **Cost**: Pay-as-you-go (~$0.023/GB)
- **Best for**: Large scale projects

**Steps:**

1. Create AWS account
2. Create S3 bucket
3. Generate IAM access keys
4. Update `.env.prod`:

```
STORAGE_PROVIDER=s3
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your_key
STORAGE_SECRET_KEY=your_secret
STORAGE_BUCKET_NAME=your-bucket-name
```

### Option 3: Wasabi

- **Cost**: $6.99/month for 1TB
- **Best for**: Budget-friendly option

**Steps:**

1. Create account at https://wasabi.com
2. Create bucket
3. Generate access keys
4. Update `.env.prod`:

```
STORAGE_PROVIDER=wasabi
STORAGE_ENDPOINT=https://s3.us-east-1.wasabisys.com
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your_key
STORAGE_SECRET_KEY=your_secret
STORAGE_BUCKET_NAME=your-bucket-name
```

---

## Switching Providers

The factory pattern allows you to **switch providers without code changes**:

**Development → Production:**

```
# .env.dev
STORAGE_PROVIDER=local

# .env.prod
STORAGE_PROVIDER=digitalocean
STORAGE_ENDPOINT=https://nyc3.digitaloceanspaces.com
STORAGE_REGION=nyc3
STORAGE_ACCESS_KEY=your_key
STORAGE_SECRET_KEY=your_secret
STORAGE_BUCKET_NAME=your-bucket
```

**Same code, different storage!**

---

## Architecture

### Storage Factory Pattern

```
uploadFile(file, folder)
    ↓
    ├─→ Local? → uploadFileToLocal()  → Returns: /uploads/...
    │
    └─→ Cloud? → uploadFileToStorage() → Returns: https://bucket.../...
```

### File Structure

```
src/shared/services/
├── local-storage.service.ts      # Local filesystem storage
├── file-storage.service.ts       # S3-compatible cloud storage
└── storage.factory.ts            # Factory & abstraction layer
```

---

## API Response Examples

### Local Storage Response

```json
{
  "success": true,
  "data": {
    "driving_license_photo_url": "/uploads/driver-documents/driving-licenses/uuid-timestamp.jpg"
  }
}
```

### Cloud Storage Response

```json
{
  "success": true,
  "data": {
    "driving_license_photo_url": "https://nyc3.digitaloceanspaces.com/bucket/driver-documents/driving-licenses/uuid-timestamp.jpg"
  }
}
```

---

## Troubleshooting

### Files not saving (Local)

- Ensure `/uploads` directory has write permissions
- Check `STORAGE_PROVIDER=local` in `.env`

### Files not uploading (Cloud)

- Verify access keys are correct
- Check bucket name matches
- Ensure bucket exists and is not private
- Verify credentials have write permissions

### Switching from local to cloud

- Update `STORAGE_PROVIDER` in `.env`
- Old local files won't migrate automatically
- Database references remain relative - URLs will break unless you migrate files

---

## Migration Checklist

When moving from development (local) to production (cloud):

- [ ] Create cloud storage account (DigitalOcean/AWS/Wasabi)
- [ ] Create bucket
- [ ] Generate access keys
- [ ] Update `.env.prod` with credentials
- [ ] Test file upload on staging
- [ ] Migrate existing files if needed
- [ ] Update frontend to use new URLs
- [ ] Deploy to production

---

## Cost Comparison

| Provider                | Setup  | Monthly | Storage     | Notes            |
| ----------------------- | ------ | ------- | ----------- | ---------------- |
| **Local**               | Free   | $0      | Limited     | Development only |
| **DigitalOcean Spaces** | 5 min  | $5      | 250GB       | Recommended      |
| **AWS S3**              | 10 min | ~$2-50  | Pay-per-GB  | Scalable         |
| **Wasabi**              | 5 min  | $7      | 1TB         | Budget option    |
| **MinIO**               | 5 min  | $0      | Self-hosted | DevOps intensive |

---

## Environment Variables Reference

```bash
# REQUIRED - Choose which provider to use
STORAGE_PROVIDER=local|s3|digitalocean|wasabi|minio

# OPTIONAL - Only needed for cloud providers
STORAGE_ENDPOINT=https://...        # Not needed for AWS S3
STORAGE_REGION=us-east-1            # Required for cloud
STORAGE_ACCESS_KEY=xxx              # Required for cloud
STORAGE_SECRET_KEY=xxx              # Required for cloud
STORAGE_BUCKET_NAME=xxx             # Required for cloud
```
