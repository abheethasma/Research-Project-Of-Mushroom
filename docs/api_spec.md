# API Specification – Smart Mushroom Cultivation Analytics Framework
 
**Base Path:** `/api/v1`    

---

## 📘 1. Overview

This REST API supports the **Smart Mushroom Cultivation Analytics Framework**, a smart agriculture decision-support system for mushroom cultivation.

The API provides backend support for:

- Environmental sensor data collection
- Real-time environmental monitoring
- Sensor health checking
- Historical environmental graph data
- Mushroom cultivation profile management
- Optimal environmental range lookup
- Mushroom variety recommendation
- Environmental solution recommendation
- 60-minute environmental forecasting
- Mushroom disease detection
- Treatment recommendation
- Disease severity estimation
- Bag-level disease history
- Mushroom type classification
- Growth-stage prediction
- Bag-level growth history

---

## 📌 2. Module Status

| Module | Status | Description |
|---|---|---|
| General API | Implemented | Health check and dummy prediction endpoint |
| Environment Module | Implemented | Sensor readings, status, history, alerts, recommendation, solution advice, forecast |
| Disease Module | Implemented | Disease prediction, severity, treatment recommendation, bag history |
| Type Module | Implemented | Mushroom type classification from image |
| Growth Module | Implemented | Growth-stage prediction and bag-level growth history |

---

## 🔗 3. Base URL

### Local Development

```text
http://127.0.0.1:8000
```

### Same Wi-Fi Network Access

Use your computer IPv4 address when testing from a mobile phone:

```text
http://YOUR_PC_IPV4_ADDRESS:8000
```

Example:

```text
http://192.168.1.100:8000
```

### API Version Prefix

```text
/api/v1
```

### Interactive API Documentation

| Tool | URL |
|---|---|
| Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc | `http://127.0.0.1:8000/redoc` |
| OpenAPI JSON | `http://127.0.0.1:8000/openapi.json` |

---

## 🔐 4. Authentication and Security

### Current Development Setup

| Security Area | Current Status |
|---|---|
| Authentication | Not implemented |
| CORS | Allows all origins |
| HTTPS | Not required for local development |
| API Access | Open during development |

### Production Recommendations

Before production deployment:

- Add JWT or API key authentication
- Restrict CORS to trusted domains
- Use HTTPS/TLS
- Protect environment variables
- Add request logging
- Add rate limiting
- Validate and sanitize all inputs

---

## ✅ 5. Response Codes

| Code | Meaning | Usage |
|---|---|---|
| `200` | OK | Successful request |
| `400` | Bad Request | Invalid input or missing required value |
| `404` | Not Found | Requested resource or optimal range not found |
| `415` | Unsupported Media Type | Unsupported uploaded file type |
| `422` | Validation Error | Request body validation failed |
| `500` | Internal Server Error | Server, database, or model inference error |

---

## 🧭 6. Endpoints Summary

### General Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ping` | Backend health check |
| POST | `/predict` | Dummy test prediction endpoint |

### Environment Endpoints

Base path:

```text
/api/v1/environment
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/readings` | Save a new sensor reading |
| GET | `/status` | Get latest reading, profile, optimal range, and alerts |
| GET | `/health` | Check sensor online/offline status |
| GET | `/options` | Get available mushroom types and stages |
| GET | `/profile` | Get current cultivation profile |
| PUT | `/profile` | Update cultivation profile |
| GET | `/optimal-range` | Get optimal range for mushroom type and stage |
| GET | `/history` | Get environmental history data |
| GET | `/available-dates` | Get dates that contain readings |
| GET | `/recommendation` | Get mushroom variety recommendation |
| GET | `/solution-recommendation` | Get corrective environmental recommendation |
| GET | `/forecast-60m` | Get 60-minute environmental forecast |

### Disease Endpoints

Base path:

```text
/api/v1/disease
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Predict disease, severity, and treatment recommendation |
| GET | `/history/{bag_id}` | Get disease history for a bag |

### Type Endpoints

Base path:

```text
/api/v1/type
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Predict mushroom type from image |

### Growth Endpoints

Base path:

```text
/api/v1/growth
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict-growth-stage` | Predict growth stage from image |
| GET | `/history/{bag_id}` | Get growth history for a bag |

---

# 🌐 7. General Endpoints

## 7.1 Health Check

**Endpoint**

```text
GET /ping
```

**Description**

Checks whether the backend server is running.

**Response**

```json
{
  "message": "Backend is working!"
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/ping
```

---

## 7.2 Dummy Prediction

**Endpoint**

```text
POST /predict
```

**Description**

Simple test endpoint that doubles the input value.

**Request Body**

```json
{
  "value": 5.0
}
```

**Response**

```json
{
  "input": 5.0,
  "prediction": 10.0,
  "note": "This is a dummy result. Replace with real model later."
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"value": 5.0}'
```

---

# 🌱 8. Environment Module

Base path:

```text
/api/v1/environment
```

The environment module manages sensor readings, environmental status, cultivation profile, optimal ranges, historical graph data, variety recommendation, solution recommendation, and forecasting.

---

## 8.1 Save Environment Reading

**Endpoint**

```text
POST /api/v1/environment/readings
```

**Description**

Stores a new temperature, humidity, and optional CO₂ reading.

**Request Body**

```json
{
  "temperature": 25.0,
  "humidity": 90.0,
  "co2": 850.0,
  "node_id": "esp32-01",
  "sampled_at": "2026-05-02T10:30:00Z"
}
```

**Request Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `temperature` | float | Yes | Temperature in Celsius |
| `humidity` | float | Yes | Relative humidity percentage |
| `co2` | float/null | No | Estimated CO₂ value |
| `node_id` | string/null | No | Sensor node ID |
| `sampled_at` | datetime/null | No | Optional timestamp |

**Response**

```json
{
  "id": 1,
  "sampled_at": "2026-05-02T10:30:00Z",
  "temperature": 25.0,
  "humidity": 90.0,
  "co2_estimated": 850.0,
  "node_id": "esp32-01",
  "note": null
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/environment/readings \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25.0,
    "humidity": 90.0,
    "co2": 850.0,
    "node_id": "esp32-01"
  }'
```

---

## 8.2 Get Environment Status

**Endpoint**

```text
GET /api/v1/environment/status
```

**Description**

Returns latest reading, selected profile, optimal range, and alert states.

**Response**

```json
{
  "reading": {
    "id": 1,
    "sampled_at": "2026-05-02T10:30:00Z",
    "temperature": 25.0,
    "humidity": 90.0,
    "co2_estimated": 850.0,
    "node_id": "esp32-01",
    "note": null
  },
  "profile": {
    "mushroom_type": "Oyster Mushroom",
    "stage": "fruiting",
    "updated_at": "2026-05-02T10:25:00Z"
  },
  "optimal_range": {
    "temp_min": 19.0,
    "temp_max": 20.0,
    "rh_min": 85.0,
    "rh_max": 92.0,
    "co2_min": 600.0,
    "co2_max": 600.0,
    "co2_note": "Estimated only (display)"
  },
  "alerts": [
    {
      "param": "temperature",
      "active": true,
      "bad_count": 6,
      "good_count": 0,
      "state_changed_at": "2026-05-02T10:30:00Z",
      "last_value": 25.0,
      "last_message": "Temperature out of range. Current 25.0, optimal 19.0-20.0."
    }
  ]
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/status
```

---

## 8.3 Get Sensor Health

**Endpoint**

```text
GET /api/v1/environment/health
```

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `offline_after_seconds` | integer | 60 | Time limit used to mark sensor as offline |

**Response**

```json
{
  "online": true,
  "last_seen": "2026-05-02T10:30:00Z",
  "node_id": "esp32-01",
  "seconds_since_last": 12
}
```

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/health?offline_after_seconds=60"
```

---

## 8.4 Get Environment Options

**Endpoint**

```text
GET /api/v1/environment/options
```

**Description**

Returns available mushroom types and cultivation stages.

**Response**

```json
{
  "mushrooms": [
    "Abalone Mushroom",
    "Button Mushroom",
    "Milky Mushroom",
    "Oyster Mushroom",
    "Paddy Straw Mushroom"
  ],
  "stages": [
    {
      "key": "spawn_run",
      "label": "Spawn Run"
    },
    {
      "key": "fruiting",
      "label": "Fruiting Phase"
    }
  ]
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/options
```

---

## 8.5 Get Current Profile

**Endpoint**

```text
GET /api/v1/environment/profile
```

**Response**

```json
{
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting",
  "updated_at": "2026-05-02T10:25:00Z"
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/profile
```

---

## 8.6 Update Profile

**Endpoint**

```text
PUT /api/v1/environment/profile
```

**Description**

Updates selected mushroom type and stage. Alert counters are reset after profile update.

**Request Body**

```json
{
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting"
}
```

**Response**

```json
{
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting",
  "updated_at": "2026-05-02T10:25:00Z"
}
```

**cURL**

```bash
curl -X PUT http://127.0.0.1:8000/api/v1/environment/profile \
  -H "Content-Type: application/json" \
  -d '{
    "mushroom_type": "Oyster Mushroom",
    "stage": "fruiting"
  }'
```

---

## 8.7 Get Optimal Range

**Endpoint**

```text
GET /api/v1/environment/optimal-range
```

**Query Parameters**

| Parameter | Type | Required |
|---|---|---|
| `mushroom_type` | string | Yes |
| `stage` | string | Yes |

**Response**

```json
{
  "temp_min": 19.0,
  "temp_max": 20.0,
  "rh_min": 85.0,
  "rh_max": 92.0,
  "co2_min": 600.0,
  "co2_max": 600.0,
  "co2_note": "Estimated only (display)"
}
```

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/optimal-range?mushroom_type=Oyster%20Mushroom&stage=fruiting"
```

---

## 8.8 Get Environment History

**Endpoint**

```text
GET /api/v1/environment/history
```

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `range` | string | Yes | `last_1h`, `last_day`, or `date` |
| `date` | string | Required for `range=date` | Format: `YYYY-MM-DD` |

**Response**

```json
{
  "range": "last_1h",
  "bucket_seconds": 300,
  "points": [
    {
      "ts": "2026-05-02T10:00:00Z",
      "temperature": 25.2,
      "humidity": 91.0,
      "co2": 850.0
    },
    {
      "ts": "2026-05-02T10:05:00Z",
      "temperature": null,
      "humidity": null,
      "co2": null
    }
  ]
}
```

**Range Options**

| Range | Buckets | Bucket Size |
|---|---:|---|
| `last_1h` | 12 | 5 minutes |
| `last_day` | 24 | 1 hour |
| `date` | 24 | 1 hour |

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/history?range=last_1h"
```

```bash
curl "http://127.0.0.1:8000/api/v1/environment/history?range=date&date=2026-05-02"
```

---

## 8.9 Get Available Dates

**Endpoint**

```text
GET /api/v1/environment/available-dates
```

**Response**

```json
{
  "dates": [
    "2026-05-01",
    "2026-05-02"
  ]
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/available-dates
```

---

## 8.10 Get Variety Recommendation

**Endpoint**

```text
GET /api/v1/environment/recommendation
```

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `source` | string | No | `current` | `current`, `last_1h`, `last_day`, or `date` |
| `date` | string | Required for `source=date` | - | Format: `YYYY-MM-DD` |

**Response**

```json
{
  "source": "current",
  "used_stage": "fruiting",
  "temperature": 25.0,
  "humidity": 90.0,
  "points_used": 1,
  "recommendations": [
    {
      "mushroom_type": "Oyster Mushroom",
      "score": 5.0,
      "reason": "Temp off by 5.0°C, RH within range"
    }
  ]
}
```

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/recommendation?source=current"
```

---

## 8.11 Get Solution Recommendation

**Endpoint**

```text
GET /api/v1/environment/solution-recommendation
```

**Description**

Returns corrective actions for the current environmental issue.

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `lang` | string | No | `en` | `en` or `si` |

**Response**

```json
{
  "language": "en",
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting",
  "issue_code": "TEMP_HIGH",
  "metric": "temperature",
  "current_value": 25.0,
  "optimal_min": 19.0,
  "optimal_max": 20.0,
  "title": "Temperature is too high",
  "immediate": [
    "Increase ventilation",
    "Reduce heat sources near the growing area"
  ],
  "short_term": [
    "Monitor temperature again after 15-30 minutes"
  ],
  "long_term": [
    "Improve insulation or airflow control"
  ],
  "safety": [
    "Avoid sudden extreme cooling"
  ],
  "llm_message": "Temperature is too high. Increase ventilation and monitor the room again.",
  "used_llm": true,
  "note": null
}
```

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/solution-recommendation?lang=en"
```

---

## 8.12 Get 60-Minute Forecast

**Endpoint**

```text
GET /api/v1/environment/forecast-60m
```

**Description**

Returns a 60-minute temperature and humidity forecast.

**Response**

```json
{
  "horizon_minutes": 60,
  "generated_at": "2026-05-02T10:30:00Z",
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting",
  "current_temperature": 25.0,
  "current_humidity": 90.0,
  "predicted_temperature": 24.6,
  "predicted_humidity": 88.5,
  "optimal_temp_min": 19.0,
  "optimal_temp_max": 20.0,
  "optimal_rh_min": 85.0,
  "optimal_rh_max": 92.0,
  "temp_status": "high",
  "rh_status": "within",
  "warning": true,
  "warning_message": "Predicted temperature is outside the optimal range.",
  "outdoor": {
    "temperature": 30.0,
    "humidity": 78.0,
    "rainfall": 0.0
  },
  "model_temp_mae": 0.3714,
  "model_rh_mae": 3.4008
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/forecast-60m
```

---

# 🩺 9. Disease Module

Base path:

```text
/api/v1/disease
```

The disease module predicts mushroom disease condition from an uploaded image, estimates severity, generates treatment advice, and stores disease history by bag ID.

---

## 9.1 Predict Disease

**Endpoint**

```text
POST /api/v1/disease/predict
```

**Request Type**

```text
multipart/form-data
```

**Form Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Mushroom disease image |
| `bag_id` | string | No | Bag ID. Default: `default_bag` |

**Supported File Types**

```text
image/jpeg
image/png
image/jpg
```

**Response**

```json
{
  "label": "green_mold",
  "confidence": 0.92,
  "severity": "moderate",
  "treatment": "Isolate the affected bag, improve ventilation, reduce excess moisture, and monitor nearby bags."
}
```

**Supported Labels**

| Label | Description |
|---|---|
| `healthy` | Healthy mushroom bag |
| `black_mold` | Black mold detected |
| `green_mold` | Green mold detected |
| `invalid_image` | Invalid or unclear image |

**Severity Levels**

| Severity | Score Meaning |
|---|---|
| `none` | No disease |
| `mild` | Low severity |
| `moderate` | Medium severity |
| `severe` | High severity |

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/disease/predict \
  -F "file=@mushroom_disease.jpg" \
  -F "bag_id=bag_001"
```

---

## 9.2 Get Disease History

**Endpoint**

```text
GET /api/v1/disease/history/{bag_id}
```

**Path Parameters**

| Parameter | Type | Required |
|---|---|---|
| `bag_id` | string | Yes |

**Response**

```json
[
  {
    "bag_id": "bag_001",
    "label": "green_mold",
    "severity": "moderate",
    "severity_score": 2,
    "confidence": 0.92,
    "timestamp": "2026-05-02T10:30:00Z"
  }
]
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/disease/history/bag_001
```

---

# 🍄 10. Mushroom Type Module

Base path:

```text
/api/v1/type
```

The type module classifies mushroom variety from an uploaded image.

---

## 10.1 Predict Mushroom Type

**Endpoint**

```text
POST /api/v1/type/predict
```

**Request Type**

```text
multipart/form-data
```

**Form Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Mushroom image |

**Supported File Types**

```text
image/jpeg
image/png
image/webp
```

**Response – Confident Prediction**

```json
{
  "ok": true,
  "label": "Oyster Mushroom",
  "confidence": 0.96,
  "top_k": [
    {
      "label": "Oyster Mushroom",
      "confidence": 0.96
    },
    {
      "label": "Button Mushroom",
      "confidence": 0.03
    }
  ],
  "message": null
}
```

**Response – Low Confidence**

```json
{
  "ok": false,
  "label": "unknown",
  "confidence": 0.48,
  "top_k": [],
  "message": "Not confident (maybe not a mushroom). Please upload a clear mushroom image."
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/type/predict \
  -F "file=@mushroom_type.jpg"
```

---

# 📈 11. Growth Module

Base path:

```text
/api/v1/growth
```

The growth module predicts mushroom growth stage from an uploaded image and stores bag-level growth history.

---

## 11.1 Predict Growth Stage

**Endpoint**

```text
POST /api/v1/growth/predict-growth-stage
```

**Request Type**

```text
multipart/form-data
```

**Form Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | file | Yes | Mushroom growth image |
| `bag_id` | string | Yes | Bag identifier |

**Response**

```json
{
  "growth_stage": "fruitbody_development",
  "confidence": 0.9142,
  "next_stage": "harvest_readiness",
  "estimated_days_to_next_stage": 2,
  "warning": null,
  "bag_id": "bag_001"
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/growth/predict-growth-stage \
  -F "image=@growth_stage.jpg" \
  -F "bag_id=bag_001"
```

---

## 11.2 Get Growth History

**Endpoint**

```text
GET /api/v1/growth/history/{bag_id}
```

**Path Parameters**

| Parameter | Type | Required |
|---|---|---|
| `bag_id` | string | Yes |

**Response**

```json
{
  "bag_id": "bag_001",
  "history": [
    {
      "label": "primordia_formation",
      "confidence": 0.91,
      "next_stage": "fruitbody_development",
      "estimated_days_to_next_stage": 2,
      "warning": null,
      "timestamp": "2026-05-02T10:30:00Z"
    }
  ]
}
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/growth/history/bag_001
```

---

# 📦 12. Data Models

## 12.1 Environment Reading

```json
{
  "id": 1,
  "sampled_at": "2026-05-02T10:30:00Z",
  "temperature": 25.0,
  "humidity": 90.0,
  "co2_estimated": 850.0,
  "node_id": "esp32-01",
  "note": null
}
```

## 12.2 Environment Profile

```json
{
  "mushroom_type": "Oyster Mushroom",
  "stage": "fruiting",
  "updated_at": "2026-05-02T10:25:00Z"
}
```

## 12.3 Disease Prediction

```json
{
  "label": "green_mold",
  "confidence": 0.92,
  "severity": "moderate",
  "treatment": "Treatment recommendation text"
}
```

## 12.4 Type Prediction

```json
{
  "ok": true,
  "label": "Oyster Mushroom",
  "confidence": 0.96,
  "top_k": [
    {
      "label": "Oyster Mushroom",
      "confidence": 0.96
    }
  ],
  "message": null
}
```

## 12.5 Growth Prediction

```json
{
  "growth_stage": "fruitbody_development",
  "confidence": 0.9142,
  "next_stage": "harvest_readiness",
  "estimated_days_to_next_stage": 2,
  "warning": null,
  "bag_id": "bag_001"
}
```

---

# ⚠️ 13. Error Handling

All API errors follow the FastAPI standard response format.

## 13.1 Standard Error Format

```json
{
  "detail": "Error message"
}
```

## 13.2 Common Error Examples

### Invalid Environment Profile

```json
{
  "detail": "No optimal range for 'Unknown Mushroom' at stage 'fruiting'"
}
```

### Unsupported Disease Image Type

```json
{
  "detail": "Unsupported file type: image/webp. Please upload a JPG or PNG image."
}
```

### Unsupported Type Image Type

```json
{
  "detail": "Unsupported file type: application/pdf. Use JPEG/PNG/WEBP."
}
```

### Empty Image Upload

```json
{
  "detail": "Empty or invalid image."
}
```

### Prediction Failure

```json
{
  "detail": "Prediction failed: model file not found"
}
```

---

# 🛠️ 14. Development Notes

## 14.1 Run Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 14.2 Local API URLs

```text
Swagger UI: http://127.0.0.1:8000/docs
ReDoc:      http://127.0.0.1:8000/redoc
Ping:       http://127.0.0.1:8000/ping
```

## 14.3 Mobile Testing

When testing with a physical mobile device:

- Do not use `localhost` in the mobile app.
- Use the computer IPv4 address.
- Keep mobile phone and backend computer on the same Wi-Fi network.
- Allow firewall access to port `8000`.

Example:

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
```

## 14.4 Image Upload Field Names

| Module | Upload Field | Extra Field |
|---|---|---|
| Disease | `file` | Optional `bag_id` |
| Type | `file` | None |
| Growth | `image` | Required `bag_id` |

## 14.5 Current Limitations

- Authentication is not implemented.
- CORS allows all origins during development.
- CO₂ is mainly used for display and future extension.
- The forecast endpoint currently exposes a 60-minute forecast.
- Production deployment requires stronger security, logging, and monitoring.

---

# 📝 15. Changelog

## Version 1.1.0

- Added `/api/v1/environment/solution-recommendation`
- Added `/api/v1/environment/forecast-60m`
- Updated disease prediction response with `severity` and `treatment`
- Added disease `bag_id` support
- Added `/api/v1/disease/history/{bag_id}`
- Updated growth endpoint to `/api/v1/growth/predict-growth-stage`
- Added `/api/v1/growth/history/{bag_id}`
- Removed pest API documentation from project scope
- Updated upload field names for image-based endpoints

---

# 📞 16. Support

For technical testing, use:

```text
http://127.0.0.1:8000/docs
```

**Project ID:** 25-26J-211  