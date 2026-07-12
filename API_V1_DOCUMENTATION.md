# Visual Compare API v1 - Complete Documentation

## Overview

Visual Compare API is a REST API for image comparison and similarity detection. It provides enterprise-grade image analysis with SHA-256 exact matching, perceptual hashing (pHash), and metadata comparison.

**Base URL**: `https://v0-visual-compare-chile.vercel.app/api/v1`

**API Version**: `1.0.0`

## Authentication

All requests require an API key passed via the `Authorization` header:

```bash
Authorization: Bearer your_api_key_here
```

### Getting an API Key

1. Sign up at https://v0-visual-compare-chile.vercel.app
2. Navigate to `Settings -> API Keys`
3. Create a key with optional expiration plus `daily` and `monthly` quotas
4. Copy the key (shown only once for security)
5. Use in requests: `Authorization: Bearer sc_xxxxx`

## Rate Limiting

- Rate limits are enforced per API key
- Each key stores `quota_daily` and `quota_monthly`
- Default base quota for the MVP is `5,000` image analyses per month per API key
- When a request exceeds either quota, the API returns `429 Too Many Requests`
- API key creation and revocation do not consume that key's quota

Rate limit headers:
```
X-RateLimit-Limit-Daily: 500
X-RateLimit-Remaining-Daily: 499
X-RateLimit-Limit-Monthly: 5000
X-RateLimit-Remaining-Monthly: 4999
```

The quota headers are returned on successful authenticated requests and on `429` responses when a key is already over its configured limit.

Quota exceeded response:
```json
{
  "error": "API key quota exceeded",
  "reason": "quota_exceeded"
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check API status.

**Response** (200 OK):
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

### 2. Upload Image

**POST** `/images`

Upload an image for comparison.

**Headers**:
```
Authorization: Bearer your_api_key
Content-Type: multipart/form-data
```

**Request Body**:
```
image: <binary file>
```

**Supported Formats**: JPEG, PNG, WebP, TIFF

**Max File Size**: 50MB

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "product.jpg",
  "size_bytes": 1024000,
  "width": 1920,
  "height": 1080,
  "mime_type": "image/jpeg",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "phash": "a1b2c3d4e5f6g7h8",
  "storage_path": "550e8400-e29b-41d4-a716-446655440000/image.jpg",
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid image
- `401 Unauthorized`: Invalid API key
- `413 Payload Too Large`: File exceeds 50MB
- `429 Too Many Requests`: API key quota exceeded

**Example**:
```bash
curl -X POST https://v0-visual-compare-chile.vercel.app/api/v1/images \
  -H "Authorization: Bearer your_api_key" \
  -F "image=@product.jpg"
```

---

### 3. Compare Images

**POST** `/compare`

Compare two uploaded images for similarity.

**Headers**:
```
Authorization: Bearer your_api_key
Content-Type: application/json
```

**Request Body**:
```json
{
  "image_a_id": "550e8400-e29b-41d4-a716-446655440000",
  "image_b_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "image_a_id": "550e8400-e29b-41d4-a716-446655440000",
  "image_b_id": "660e8400-e29b-41d4-a716-446655440001",
  "similarity_score": 96.8,
  "classification": "near_duplicate",
  "signals": {
    "sha256_match": false,
    "phash_distance": 3,
    "size_match": true,
    "dimensions_match": true,
    "format_match": true
  },
  "recommendation": "REVIEW",
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Classification Values**:
- `exact_match` (95-100%): Identical images
- `near_duplicate` (85-94%): Nearly identical copies
- `visually_similar` (60-84%): Similar appearance
- `partially_similar` (20-59%): Some similarities
- `different` (<20%): Unrelated images

**Recommendations**:
- `REJECT_DUPLICATE`: Identical or near-identical - likely fraud
- `REVIEW`: Needs human review for final decision
- `APPROVE`: Significantly different - safe to approve

**Error Responses**:
- `400 Bad Request`: Missing or invalid image IDs
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: Images not found
- `429 Too Many Requests`: API key quota exceeded

**Example**:
```bash
curl -X POST https://v0-visual-compare-chile.vercel.app/api/v1/compare \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_a_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_b_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

---

### 4. List Comparisons

**GET** `/comparisons?limit=50&offset=0`

Get all comparisons for your organization.

**Query Parameters**:
- `limit` (optional): Results per page, max 100 (default: 50)
- `offset` (optional): Result offset for pagination (default: 0)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "image_a_id": "550e8400-e29b-41d4-a716-446655440000",
      "image_b_id": "660e8400-e29b-41d4-a716-446655440001",
      "similarity_score": 96.8,
      "classification": "near_duplicate",
      "signals": {},
      "recommendation": "REVIEW",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "count": 1
}
```

**Example**:
```bash
curl -X GET "https://v0-visual-compare-chile.vercel.app/api/v1/comparisons?limit=10" \
  -H "Authorization: Bearer your_api_key"
```

**Error Responses**:
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: API key quota exceeded

---

### 5. Get Comparison Details

**GET** `/comparisons/{id}`

Get detailed results for a specific comparison.

**Parameters**:
- `id` (path): Comparison ID

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "image_a_id": "550e8400-e29b-41d4-a716-446655440000",
  "image_b_id": "660e8400-e29b-41d4-a716-446655440001",
  "similarity_score": 96.8,
  "classification": "near_duplicate",
  "signals": {
    "sha256_match": false,
    "phash_distance": 3,
    "size_match": true,
    "dimensions_match": true,
    "format_match": true
  },
  "recommendation": "REVIEW",
  "result_json": {
    "images": {
      "a": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "filename": "product_a.jpg",
        "width": 1920,
        "height": 1080
      },
      "b": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "filename": "product_b.jpg",
        "width": 1920,
        "height": 1080
      }
    },
    "similarity_score": 96.8,
    "classification": "near_duplicate",
    "recommendation": "REVIEW"
  },
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: Comparison not found
- `429 Too Many Requests`: API key quota exceeded

---

### 6. Usage Statistics

**GET** `/usage`

Get usage statistics for current billing period and the current API key quota snapshot.

**Response** (200 OK):
```json
{
  "uploads_today": 3,
  "uploads_month": 12,
  "comparisons_today": 4,
  "comparisons_month": 21,
  "storage_gb": 0.18,
  "api_calls_today": 7,
  "api_calls_month": 52,
  "period": {
    "start_date": "2026-07-01T00:00:00.000Z",
    "end_date": "2026-07-31T00:00:00.000Z"
  },
  "current_key": {
    "quota_daily": 500,
    "quota_monthly": 5000,
    "usage_today": 7,
    "usage_month": 52,
    "remaining_daily": 493,
    "remaining_monthly": 4948
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: API key quota exceeded

### Verification Flow

Use this sequence after deploying the quota migration:

```bash
# 1. Create a key in Settings with daily quota = 2 and monthly quota = 10

# 2. First request should succeed and return X-RateLimit headers
curl -i https://v0-visual-compare-chile.vercel.app/api/v1/usage \
  -H "Authorization: Bearer sc_your_key"

# 3. Second request should still succeed
curl -i https://v0-visual-compare-chile.vercel.app/api/v1/usage \
  -H "Authorization: Bearer sc_your_key"

# 4. Third request should return 429
curl -i https://v0-visual-compare-chile.vercel.app/api/v1/usage \
  -H "Authorization: Bearer sc_your_key"
```

---

## Error Handling

All errors return appropriate HTTP status codes with JSON error messages:

```json
{
  "error": "Invalid API key"
}
```

**Common Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `429 Too Many Requests`: API key quota exceeded
- `500 Internal Server Error`: Server error

---

## Code Examples

### Python

```python
import requests

api_key = "your_api_key"
base_url = "https://v0-visual-compare-chile.vercel.app/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Upload image
with open("product.jpg", "rb") as f:
    files = {"image": f}
    response = requests.post(f"{base_url}/images", headers=headers, files=files)
    image_id = response.json()["id"]

# Compare images
data = {
    "image_a_id": "550e8400...",
    "image_b_id": "660e8400..."
}
response = requests.post(f"{base_url}/compare", headers=headers, json=data)
result = response.json()
print(f"Similarity: {result['similarity_score']}%")
```

### JavaScript/Node.js

```javascript
const apiKey = "your_api_key"
const baseUrl = "https://v0-visual-compare-chile.vercel.app/api/v1"
const headers = { Authorization: `Bearer ${apiKey}` }

// Upload image
const formData = new FormData()
formData.append("image", fileInput.files[0])

const uploadRes = await fetch(`${baseUrl}/images`, {
  method: "POST",
  headers,
  body: formData,
})
const { id: imageId } = await uploadRes.json()

// Compare images
const compareRes = await fetch(`${baseUrl}/compare`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    image_a_id: "550e8400...",
    image_b_id: "660e8400...",
  }),
})
const result = await compareRes.json()
console.log(`Similarity: ${result.similarity_score}%`)
```

### cURL

```bash
#!/bin/bash

API_KEY="your_api_key"
BASE_URL="https://v0-visual-compare-chile.vercel.app/api/v1"

# Upload image
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/images" \
  -H "Authorization: Bearer $API_KEY" \
  -F "image=@product.jpg")

IMAGE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')

# Compare images
curl -X POST "$BASE_URL/compare" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"image_a_id\": \"$IMAGE_ID\",
    \"image_b_id\": \"another_image_id\"
  }"
```

---

## Best Practices

1. **Store API Keys Securely**
   - Never commit API keys to version control
   - Use environment variables for sensitive data
   - Rotate keys regularly

2. **Handle Errors Gracefully**
   - Implement retry logic for transient failures
   - Log errors for debugging
   - Provide user-friendly error messages

3. **Optimize Performance**
   - Use batch comparisons when possible
   - Cache comparison results when appropriate
   - Implement pagination for large result sets

4. **Compliance**
   - Ensure compliance with Chile's LGPD requirements
   - Keep audit logs of all comparisons
   - Document your usage for compliance audits

---

## Support

For issues or questions:
- Email: support@visualcompare.cl
- Documentation: https://docs.visualcompare.cl
- Status Page: https://status.visualcompare.cl

---

**Last Updated**: January 1, 2024  
**API Version**: 1.0.0
