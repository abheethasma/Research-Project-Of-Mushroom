[![API Docs](https://img.shields.io/badge/API-Documentation-blue?style=for-the-badge)](docs/api_spec.md)
[![Research Website](https://img.shields.io/badge/Research-Website-green?style=for-the-badge)](https://SachinthaX.github.io/mushroom-research-website/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange?style=for-the-badge)]()

# Smart Mushroom Cultivation Analytics Framework

A smart agriculture decision-support system for mushroom cultivation.

This project combines **environmental monitoring**, **machine learning forecasting**, **mushroom type classification**, **growth-stage prediction**, **disease detection**, **treatment recommendation**, and **severity monitoring** to help farmers make better cultivation decisions.

![Project Banner](./assets/banner.jpeg)

<p align="center">
  <b>Environmental Intelligence</b> •
  <b>Visual Growth Intelligence</b> •
  <b>Disease Intelligence</b>
</p>

---

## 📘 Project Overview

Mushroom cultivation requires careful control of temperature, humidity, CO₂ level, hygiene, disease condition, and growth-stage timing. Manual monitoring can be difficult and inconsistent, especially when farmers manage many cultivation bags.

This system provides an integrated framework that collects sensor readings and image inputs, processes them through backend services and AI/ML models, and returns farmer-friendly outputs through a mobile application.

The final system supports:

- Real-time environmental monitoring
- Temperature and humidity forecasting
- Environmental alerts
- Corrective solution recommendation
- Suitable mushroom variety recommendation
- Mushroom type classification
- Growth-stage prediction
- Bag-level growth history
- Disease detection
- Treatment recommendation
- Disease severity estimation
- Disease history and trend monitoring

---

## 🧩 Main Components

### 1. Environmental Intelligence Module

This module helps farmers monitor and manage the mushroom growing environment.

**Features**

- Temperature, humidity, and estimated CO₂ monitoring
- Sensor online/offline health checking
- Environmental status comparison with optimal ranges
- Historical graph data
- Environmental alerts
- 60-minute temperature and humidity forecasting
- Corrective solution recommendation
- Suitable mushroom variety recommendation

---

### 2. Visual Growth Intelligence Module

This module uses mushroom images to support type identification and growth-stage monitoring.

**Features**

- Mushroom type classification
- Growth-stage prediction
- Confidence score output
- Next-stage prediction
- Estimated days to next stage
- Bag-level growth history

---

### 3. Disease Intelligence Module

This module supports early disease detection and disease management.

**Features**

- Disease detection from mushroom bag images
- Healthy, black mold, green mold, and invalid image handling
- Confidence score output
- Severity estimation
- Treatment recommendation
- Bag-level disease history
- Severity trend monitoring

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Input["Data Sources and User Inputs"]
        Sensor["IoT Sensor Node<br/>Temperature • Humidity • CO₂"]
        Weather["Outdoor Weather Data<br/>Temperature • Humidity • Rainfall"]
        Images["Mobile Image Upload<br/>Mushroom / Disease / Growth Images"]
        Farmer["Farmer Input<br/>Bag ID • Mushroom Type • Stage"]
    end

    subgraph Mobile["React Native Mobile Application"]
        Dashboard["Environmental Dashboard"]
        ForecastUI["Forecast and Trend Graphs"]
        TypeUI["Type Classification Screen"]
        GrowthUI["Growth Stage Screen"]
        DiseaseUI["Disease Detection Screen"]
        HistoryUI["History and Recommendations"]
    end

    subgraph Backend["FastAPI Backend"]
        API["REST API Layer"]
        EnvService["Environment Service"]
        ForecastService["Forecasting Service"]
        TypeService["Mushroom Type Service"]
        GrowthService["Growth Stage Service"]
        DiseaseService["Disease Detection Service"]
        RecService["Recommendation Services"]
        HistoryService["History Services"]
    end

    subgraph Models["AI / ML Models"]
        RF["Random Forest Models<br/>Temperature and Humidity Forecasting"]
        TypeModel["Mushroom Type Classifier"]
        GrowthModel["Growth Stage Classifier"]
        DiseaseModel["Disease Detection Model"]
    end

    subgraph Storage["Database and Stored Records"]
        DB[("PostgreSQL / Supabase")]
        EnvData["Sensor Readings"]
        ProfileData["Cultivation Profiles"]
        GrowthHistory["Growth History"]
        DiseaseHistory["Disease History"]
    end

    Sensor --> API
    Weather --> ForecastService
    Farmer --> Mobile
    Images --> Mobile

    Mobile --> API

    API --> EnvService
    API --> ForecastService
    API --> TypeService
    API --> GrowthService
    API --> DiseaseService
    API --> RecService
    API --> HistoryService

    ForecastService --> RF
    TypeService --> TypeModel
    GrowthService --> GrowthModel
    DiseaseService --> DiseaseModel

    EnvService <--> DB
    HistoryService <--> DB
    DB --> EnvData
    DB --> ProfileData
    DB --> GrowthHistory
    DB --> DiseaseHistory

    API --> Mobile
    Mobile --> Farmer
```

---

## 🚀 Key Features

| Feature Area | Description |
|---|---|
| Environmental Monitoring | Displays live temperature, humidity, and estimated CO₂ readings |
| Sensor Health | Detects whether the sensor node is online or offline |
| Forecasting | Predicts future temperature and humidity conditions |
| Alerts | Identifies unsuitable environmental conditions |
| Solution Recommendation | Suggests corrective actions for unsuitable conditions |
| Variety Recommendation | Recommends suitable mushroom varieties based on environmental fit |
| Type Classification | Predicts mushroom type from image input |
| Growth Prediction | Predicts current growth stage and next-stage transition |
| Disease Detection | Detects disease condition from uploaded mushroom bag images |
| Treatment Recommendation | Provides treatment guidance based on disease and severity |
| History Tracking | Stores growth and disease records using bag ID |
| Mobile Interface | Provides farmer-friendly screens for monitoring and predictions |

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend logic and AI/ML processing |
| FastAPI | REST API development |
| Uvicorn | ASGI server |
| Pydantic | Request and response validation |
| PostgreSQL / Supabase | Database and cloud storage |
| TensorFlow / Keras | Deep learning model inference |
| Scikit-learn | Machine learning and forecasting |
| Random Forest | Temperature and humidity forecasting |
| Pillow / NumPy | Image preprocessing |
| Groq | LLM-assisted recommendation formatting |
| python-dotenv | Environment variable management |
| Swagger / ReDoc | API documentation |

### Mobile Application

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile application |
| Expo | Mobile development and testing |
| React Navigation | App navigation |
| Expo Image Picker | Camera/gallery image selection |
| React Native SVG | Graph and chart rendering |
| Fetch API | Backend API communication |
| Vector Icons | Mobile UI icons |

### Hardware / IoT

| Component | Purpose |
|---|---|
| ESP32 | IoT sensor node controller |
| DHT22 | Temperature and humidity sensing |
| MQ-135 | Air quality / estimated CO₂ sensing |
| Wi-Fi | Sensor data transmission |

---

## 📁 Repository Structure

```text
Research-Project-Of-Mushroom/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── models/
│   │   ├── mushroom_disease_model.h5
│   │   ├── mushroom_type.tflite
│   │   └── class_names.json
│   │
│   └── app/
│       ├── api/
│       │   └── v1/
│       │       ├── environment.py
│       │       ├── disease.py
│       │       ├── type.py
│       │       └── growth.py
│       │
│       ├── data/
│       │   └── environment_solution_data.py
│       │
│       ├── db/
│       │   ├── environment_db.py
│       │   ├── knowledge_db.py
│       │   └── pg_pool.py
│       │
│       ├── schemas/
│       │   ├── environment.py
│       │   ├── disease.py
│       │   ├── type.py
│       │   └── growth.py
│       │
│       └── services/
│           ├── environment_service.py
│           ├── environment_forecast_service.py
│           ├── disease_service.py
│           ├── treatment_service.py
│           ├── disease_history_service.py
│           ├── type_service.py
│           ├── growth_stage_service.py
│           ├── groq_service.py
│           └── weather_service.py
│
├── MobileAppExpo/
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   │
│   ├── assets/
│   │
│   └── src/
│       ├── screens/
│       ├── services/
│       ├── components/
│       └── navigation/
│
├── docs/
│   └── api_spec.md
│
├── assets/
│   └── banner.jpeg
│
├── README.md
└── .gitignore
```

---

## 🔗 Main API Endpoints

### General

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ping` | Backend health check |
| POST | `/predict` | Dummy test endpoint |

### Environment Module

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/environment/readings` | Save sensor reading |
| GET | `/api/v1/environment/status` | Get latest status |
| GET | `/api/v1/environment/health` | Check sensor health |
| GET | `/api/v1/environment/options` | Get mushroom/stage options |
| GET | `/api/v1/environment/profile` | Get current profile |
| PUT | `/api/v1/environment/profile` | Update current profile |
| GET | `/api/v1/environment/optimal-range` | Get optimal range |
| GET | `/api/v1/environment/history` | Get graph/history data |
| GET | `/api/v1/environment/available-dates` | Get dates with readings |
| GET | `/api/v1/environment/recommendation` | Get variety recommendation |
| GET | `/api/v1/environment/solution-recommendation` | Get corrective solution |
| GET | `/api/v1/environment/forecast-60m` | Get 60-minute forecast |

### Disease Module

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/disease/predict` | Predict disease, severity, and treatment |
| GET | `/api/v1/disease/history/{bag_id}` | Get disease history |

### Mushroom Type Module

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/type/predict` | Predict mushroom type |

### Growth Module

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/growth/predict-growth-stage` | Predict growth stage |
| GET | `/api/v1/growth/history/{bag_id}` | Get growth history |

---

## 🚦 Getting Started

### Prerequisites

Install the following:

- Python 3.10 or higher
- Node.js 16 or higher
- npm
- PostgreSQL or Supabase database
- Expo Go mobile app
- Git

---

## ⚙️ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

```bash
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mushroom_db
GROQ_API_KEY=your_groq_api_key
```

Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/ping
```

---

## 📱 Mobile App Setup

Navigate to the mobile app folder:

```bash
cd MobileAppExpo
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Open the app using **Expo Go**.

When testing on a physical mobile device, update the backend URL using your computer IPv4 address:

```javascript
const API_BASE_URL = "http://YOUR_PC_IPV4_ADDRESS:8000";
```

Example:

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
```

Both mobile phone and backend computer must be connected to the same Wi-Fi network.

---

## 🧪 Testing

### Backend Health Check

```bash
curl http://127.0.0.1:8000/ping
```

### Save Environment Reading

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

### Get Environment Status

```bash
curl http://127.0.0.1:8000/api/v1/environment/status
```

### Predict Disease

```bash
curl -X POST http://127.0.0.1:8000/api/v1/disease/predict \
  -F "file=@mushroom_disease.jpg" \
  -F "bag_id=bag_001"
```

### Predict Mushroom Type

```bash
curl -X POST http://127.0.0.1:8000/api/v1/type/predict \
  -F "file=@mushroom_type.jpg"
```

### Predict Growth Stage

```bash
curl -X POST http://127.0.0.1:8000/api/v1/growth/predict-growth-stage \
  -F "image=@growth_stage.jpg" \
  -F "bag_id=bag_001"
```

---

## 📚 Documentation

| Document | Location |
|---|---|
| API Specification | `docs/api_spec.md` |
| Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc | `http://127.0.0.1:8000/redoc` |
| Research Website | `https://SachinthaX.github.io/mushroom-research-website/` |

---

## 👥 Research Team

| Student ID | Name | Contribution |
|---|---|---|
| IT22889188 | S.M.A. Dhananjaya | Disease detection, treatment recommendation, and severity monitoring |
| IT22353566 | Sachintha H N | Environmental monitoring, forecasting, solution recommendation, and variety recommendation |
| IT22911162 | Yukthila Y.C | Mushroom type classification, growth-stage prediction, and bag-level growth history |

---

## 🔮 Future Improvements

- Add more mushroom varieties
- Add more growth-stage image data
- Improve humidity forecasting accuracy
- Add stronger invalid image handling
- Add push notifications for alerts
- Add user authentication
- Add cloud deployment support
- Add admin dashboard
- Add yield prediction
- Improve farm-level analytics

---

## 🐛 Troubleshooting

### Backend does not start

Check:

- Python version is correct
- Virtual environment is activated
- Dependencies are installed
- `.env` file exists
- `DATABASE_URL` is correct

```bash
python --version
pip install -r requirements.txt
```

### Mobile app cannot connect to backend

Check:

- Backend is running
- Mobile and computer are on the same Wi-Fi network
- API URL uses computer IP address, not `localhost`
- Firewall allows port `8000`

### Image prediction fails

Check:

- Uploaded image is valid
- Correct form field is used:
  - Disease: `file`
  - Type: `file`
  - Growth: `image`
- Model files exist in `backend/models/`
- TensorFlow and required ML libraries are installed

### Database connection fails

Check:

- PostgreSQL or Supabase connection is active
- Database URL is correct
- Database credentials are valid
- Required tables are initialized by backend startup

---

## 📄 License

This project was developed for academic research purposes at the **Sri Lanka Institute of Information Technology**.

---

**Project ID:** 25-26J-211  