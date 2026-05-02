# API Specification – Smart Mushroom Cultivation Analytics Framework

**Document Version:** 1.1.0  
**Backend Version:** 0.2.0  
**Last Updated:** May 2026  
**Base Path:** `/api/v1`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL and Versioning](#2-base-url-and-versioning)
3. [Authentication and Security](#3-authentication-and-security)
4. [Response Codes](#4-response-codes)
5. [Endpoints Summary](#5-endpoints-summary)
6. [General Endpoints](#6-general-endpoints)
7. [Environment Module](#7-environment-module)
8. [Disease Module](#8-disease-module)
9. [Mushroom Type Module](#9-mushroom-type-module)
10. [Growth Module](#10-growth-module)
11. [Pests Module](#11-pests-module)
12. [Data Models](#12-data-models)
13. [Error Handling](#13-error-handling)
14. [Development Notes](#14-development-notes)

---

## 1. Overview

This REST API supports the **Smart Mushroom Cultivation Analytics Framework**, a decision-support backend for mushroom cultivation.

The API provides:

- Environmental sensor data ingestion
- Real-time environment status
- Sensor health checking
- Environmental history and graph data
- Mushroom cultivation profile management
- Optimal range lookup
- Mushroom variety recommendation
- Environmental solution recommendation
- 60-minute environmental forecasting
- Mushroom disease detection
- Treatment recommendation
- Disease severity output
- Bag-level disease history
- Mushroom type classification
- Growth-stage prediction
- Bag-level growth history
- Placeholder pest detection endpoint

---

## Current Module Status

| Module | Status | Notes |
|---|---|---|
| General API | Implemented | Health check and dummy prediction endpoint |
| Environment | Implemented | Readings, status, alerts, history, recommendation, solution recommendation, forecast |
| Disease | Implemented | Image prediction, severity, treatment advice, bag-level history |
| Type Classification | Implemented | Image-based mushroom type prediction using uploaded file |
| Growth Prediction | Implemented | Image-based growth-stage prediction with bag-level history |
| Pests | Placeholder | Dummy pest response, ready for future model integration |

---

## 2. Base URL and Versioning

### Local Development

```text
http://127.0.0.1:8000
```

### Same Wi-Fi Network Access

```text
http://YOUR_PC_IPV4_ADDRESS:8000
```

Example:

```text
http://192.168.1.100:8000
```

Use this format when testing from a physical mobile device.

### API Version Prefix

Most API endpoints use:

```text
/api/v1
```

### Interactive Documentation

When the backend is running, API documentation is available at:

| Tool | URL |
|---|---|
| Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc | `http://127.0.0.1:8000/redoc` |
| OpenAPI JSON | `http://127.0.0.1:8000/openapi.json` |

---

## 3. Authentication and Security

### Current Development Setup

| Item | Current Status |
|---|---|
| Authentication | Not implemented |
| CORS | Allows all origins |
| HTTPS | Not required in local development |
| API access | Open during development |

### Production Recommendations

Before production deployment:

- Add authentication using JWT or API keys
- Restrict CORS to trusted frontend domains
- Use HTTPS/TLS
- Add rate limiting
- Add request validation and logging
- Protect sensitive environment variables
- Avoid exposing database credentials in code

---

## 4. Response Codes

| Code | Meaning | Common Usage |
|---|---|---|
| `200` | OK | Successful request |
| `400` | Bad Request | Invalid input, missing data, invalid source/date |
| `404` | Not Found | Resource or optimal range not found |
| `415` | Unsupported Media Type | Unsupported image/file type |
| `422` | Validation Error | Pydantic validation error |
| `500` | Internal Server Error | Server, database, or model inference failure |

---

## 5. Endpoints Summary

### General Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ping` | Backend health check |
| POST | `/predict` | Dummy test prediction endpoint |

### Environment Module

Base path:

```text
/api/v1/environment
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/readings` | Save a new sensor reading |
| GET | `/status` | Get latest environment status, profile, optimal range, and alerts |
| GET | `/recommendation` | Get suitable mushroom variety recommendations |
| GET | `/solution-recommendation` | Get corrective action recommendation for current issue |
| GET | `/options` | Get available mushroom types and growth stages |
| GET | `/profile` | Get selected mushroom type and growth stage |
| PUT | `/profile` | Update selected mushroom type and growth stage |
| GET | `/optimal-range` | Get optimal environment range for selected type/stage |
| GET | `/history` | Get bucketed environmental history |
| GET | `/available-dates` | Get dates that contain environmental readings |
| GET | `/health` | Get sensor online/offline health status |
| GET | `/forecast-60m` | Get 60-minute temperature and humidity forecast |

### Disease Module

Base path:

```text
/api/v1/disease
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Predict mushroom disease, severity, and treatment recommendation |
| GET | `/history/{bag_id}` | Get disease history for a specific bag |

### Mushroom Type Module

Base path:

```text
/api/v1/type
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Predict mushroom type from image |

### Growth Module

Base path:

```text
/api/v1/growth
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict-growth-stage` | Predict mushroom growth stage from image and bag ID |
| GET | `/history/{bag_id}` | Get growth-stage history for a specific bag |

### Pests Module

Base path:

```text
/api/v1/pests
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Dummy pest prediction endpoint |

---

## 6. General Endpoints

## 6.1 Health Check

**Endpoint**

```text
GET /ping
```

**Description**

Checks whether the backend is running.

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

## 6.2 Dummy Prediction

**Endpoint**

```text
POST /predict
```

**Description**

A simple test endpoint that doubles the input value.

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
  -d "{\"value\": 5.0}"
```

---

## 7. Environment Module

The environment module handles real-time monitoring, profile selection, history graphs, alerts, environmental recommendations, and forecasting.

Base path:

```text
/api/v1/environment
```

---

## 7.1 Save Environment Reading

**Endpoint**

```text
POST /api/v1/environment/readings
```

**Description**

Stores a new temperature, humidity, and optional CO₂ reading from an IoT node or simulator.

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
| `co2` | float/null | No | Estimated CO₂ ppm, display only |
| `node_id` | string/null | No | Sensor node identifier |
| `sampled_at` | datetime/null | No | Optional timestamp; backend uses current UTC if missing |

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
  -d "{
    \"temperature\": 25.0,
    \"humidity\": 90.0,
    \"co2\": 850.0,
    \"node_id\": \"esp32-01\"
  }"
```

---

## 7.2 Get Environment Status

**Endpoint**

```text
GET /api/v1/environment/status
```

**Description**

Returns the latest reading, selected cultivation profile, optimal range, and alert states.

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

**Alert Logic**

- Temperature and humidity alerts use consecutive-reading logic.
- Alert becomes active after repeated out-of-range readings.
- Alert becomes inactive after repeated normal readings.
- CO₂ is stored and displayed but is not the main alert/recommendation metric.

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/environment/status
```

---

## 7.3 Get Sensor Health

**Endpoint**

```text
GET /api/v1/environment/health
```

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `offline_after_seconds` | integer | 60 | Sensor is considered offline after this many seconds without readings |

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

## 7.4 Get Environment Options

**Endpoint**

```text
GET /api/v1/environment/options
```

**Description**

Returns available mushroom types and cultivation stages for dropdowns.

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

## 7.5 Get Current Profile

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

## 7.6 Update Profile

**Endpoint**

```text
PUT /api/v1/environment/profile
```

**Description**

Updates the selected mushroom type and cultivation stage. Alert states are reset after profile update.

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
  -d "{
    \"mushroom_type\": \"Oyster Mushroom\",
    \"stage\": \"fruiting\"
  }"
```

---

## 7.7 Get Optimal Range

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

## 7.8 Get Environment History

**Endpoint**

```text
GET /api/v1/environment/history
```

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `range` | string | Yes | `last_1h`, `last_day`, or `date` |
| `date` | string | Required only for `range=date` | Format: `YYYY-MM-DD` |

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

## 7.9 Get Available Dates

**Endpoint**

```text
GET /api/v1/environment/available-dates
```

**Description**

Returns available dates that contain sensor readings.

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

## 7.10 Get Variety Recommendation

**Endpoint**

```text
GET /api/v1/environment/recommendation
```

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `source` | string | No | `current` | `current`, `last_1h`, `last_day`, or `date` |
| `date` | string | Required only for `source=date` | - | Format: `YYYY-MM-DD` |

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
    },
    {
      "mushroom_type": "Milky Mushroom",
      "score": 8.0,
      "reason": "Temp off by 2.0°C, RH off by 12.0%"
    }
  ]
}
```

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/recommendation?source=current"
```

```bash
curl "http://127.0.0.1:8000/api/v1/environment/recommendation?source=last_day"
```

---

## 7.11 Get Solution Recommendation

**Endpoint**

```text
GET /api/v1/environment/solution-recommendation
```

**Description**

Returns corrective recommendations when the current environmental condition is outside the optimal range.

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
  "llm_message": "Temperature is too high. Do this now: Increase ventilation...",
  "used_llm": true,
  "note": null
}
```

**Possible Issue Codes**

| Issue Code | Meaning |
|---|---|
| `TEMP_HIGH` | Temperature is above optimal range |
| `TEMP_LOW` | Temperature is below optimal range |
| `RH_HIGH` | Humidity is above optimal range |
| `RH_LOW` | Humidity is below optimal range |
| `CO2_HIGH` | CO₂ is above display threshold |

**cURL**

```bash
curl "http://127.0.0.1:8000/api/v1/environment/solution-recommendation?lang=en"
```

```bash
curl "http://127.0.0.1:8000/api/v1/environment/solution-recommendation?lang=si"
```

---

## 7.12 Get 60-Minute Forecast

**Endpoint**

```text
GET /api/v1/environment/forecast-60m
```

**Description**

Returns a 60-minute forecast for temperature and humidity using the environmental forecast service.

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

## 8. Disease Module

Base path:

```text
/api/v1/disease
```

The disease module accepts mushroom bag images, predicts the disease class, estimates severity, generates treatment advice, and stores history by `bag_id`.

---

## 8.1 Predict Disease

**Endpoint**

```text
POST /api/v1/disease/predict
```

**Description**

Predicts mushroom disease from an uploaded image and returns disease label, confidence, severity, and treatment recommendation.

**Request Type**

```text
multipart/form-data
```

**Form Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Mushroom image file |
| `bag_id` | string | No | Bag ID; default is `default_bag` |

**Supported File Types**

```text
image/jpeg
image/png
image/jpg
```

**Supported Labels**

| Label | Meaning |
|---|---|
| `healthy` | Healthy mushroom bag |
| `black_mold` | Black mold detected |
| `green_mold` | Green mold detected |
| `invalid_image` | Invalid or unclear image |

**Response**

```json
{
  "label": "green_mold",
  "confidence": 0.92,
  "severity": "moderate",
  "treatment": "Isolate the affected bag, improve ventilation, reduce excess moisture, and monitor nearby bags."
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/disease/predict \
  -F "file=@mushroom_disease.jpg" \
  -F "bag_id=bag_001"
```

**React Native Upload Example**

```javascript
const formData = new FormData();

formData.append("file", {
  uri: imageUri,
  name: "mushroom.jpg",
  type: "image/jpeg",
});

formData.append("bag_id", "bag_001");

const response = await fetch(`${BACKEND_URL}/api/v1/disease/predict`, {
  method: "POST",
  body: formData,
});
```

---

## 8.2 Get Disease History

**Endpoint**

```text
GET /api/v1/disease/history/{bag_id}
```

**Description**

Returns all previous disease predictions for a specific bag.

**Path Parameter**

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
  },
  {
    "bag_id": "bag_001",
    "label": "healthy",
    "severity": "none",
    "severity_score": 0,
    "confidence": 0.88,
    "timestamp": "2026-05-03T10:30:00Z"
  }
]
```

**cURL**

```bash
curl http://127.0.0.1:8000/api/v1/disease/history/bag_001
```

---

## 9. Mushroom Type Module

Base path:

```text
/api/v1/type
```

---

## 9.1 Predict Mushroom Type

**Endpoint**

```text
POST /api/v1/type/predict
```

**Description**

Classifies the mushroom type from an uploaded image.

**Request Type**

```text
multipart/form-data
```

**Form Field**

| Field | Type | Required |
|---|---|---|
| `file` | file | Yes |

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

## 10. Growth Module

Base path:

```text
/api/v1/growth
```

The growth module predicts the current growth stage from an uploaded image and stores bag-level growth history.

---

## 10.1 Predict Growth Stage

**Endpoint**

```text
POST /api/v1/growth/predict-growth-stage
```

**Description**

Predicts the current mushroom growth stage from an image and stores the prediction using `bag_id`.

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

## 10.2 Get Growth History

**Endpoint**

```text
GET /api/v1/growth/history/{bag_id}
```

**Description**

Returns saved growth-stage history for a specific bag.

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

## 11. Pests Module

Base path:

```text
/api/v1/pests
```

The pests module is currently a placeholder endpoint.

---

## 11.1 Predict Pest

**Endpoint**

```text
POST /api/v1/pests/predict
```

**Description**

Returns dummy pest detection data. This endpoint is prepared for future pest model integration.

**Request Body**

```json
{
  "sample_id": "sample_001"
}
```

**Response**

```json
{
  "pest_name": "Dummy Mite",
  "confidence": 0.85,
  "advice": "Increase ventilation and inspect the growing room for visible mites."
}
```

**cURL**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/pests/predict \
  -H "Content-Type: application/json" \
  -d "{\"sample_id\": \"sample_001\"}"
```

---

## 12. Data Models

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

## 12.3 Optimal Range

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

## 12.4 Alert State

```json
{
  "param": "temperature",
  "active": true,
  "bad_count": 6,
  "good_count": 0,
  "state_changed_at": "2026-05-02T10:30:00Z",
  "last_value": 25.0,
  "last_message": "Temperature out of range. Current 25.0, optimal 19.0-20.0."
}
```

## 12.5 Disease Prediction

```json
{
  "label": "green_mold",
  "confidence": 0.92,
  "severity": "moderate",
  "treatment": "Treatment recommendation text"
}
```

## 12.6 Disease History Item

```json
{
  "bag_id": "bag_001",
  "label": "green_mold",
  "severity": "moderate",
  "severity_score": 2,
  "confidence": 0.92,
  "timestamp": "2026-05-02T10:30:00Z"
}
```

## 12.7 Type Prediction

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

## 12.8 Growth Prediction

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

## 13. Error Handling

All error responses follow the FastAPI standard format.

## 13.1 Example Error Response

```json
{
  "detail": "Error message"
}
```

## 13.2 Common Errors

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

## 14. Development Notes

## 14.1 Backend Run Command

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 14.2 Local API URLs

```text
Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc
Ping: http://127.0.0.1:8000/ping
```

## 14.3 Mobile Testing Notes

When testing with a physical mobile device:

- Do not use `localhost` in the mobile app.
- Use the PC’s IPv4 address.
- Keep PC and mobile phone on the same Wi-Fi network.
- Allow firewall access to port `8000`.

Example:

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
```

## 14.4 Image Upload Notes

| Module | Upload Field Name | Required Extra Field |
|---|---|---|
| Disease | `file` | Optional `bag_id` |
| Type | `file` | None |
| Growth | `image` | Required `bag_id` |

## 14.5 Current Limitations

- No authentication is implemented yet.
- CORS allows all origins in development.
- Pests endpoint is still a dummy placeholder.
- CO₂ is mainly used for display and future extension.
- Environment forecast endpoint currently exposes 60-minute prediction.
- Production deployment requires stronger security and monitoring.

---

## Changelog

### Version 1.1.0

- Updated backend version to `0.2.0`
- Added `/api/v1/environment/solution-recommendation`
- Added `/api/v1/environment/forecast-60m`
- Updated disease response to include `severity` and `treatment`
- Added disease `bag_id` form field
- Added `/api/v1/disease/history/{bag_id}`
- Corrected growth endpoint to `/api/v1/growth/predict-growth-stage`
- Added `/api/v1/growth/history/{bag_id}`
- Marked pests module as placeholder
- Updated request field names for image uploads

---

## Support

For technical questions, check:

```text
http://127.0.0.1:8000/docs
```

or contact the project team.

**Project ID:** 25-26J-211