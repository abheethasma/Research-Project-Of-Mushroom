[![API Docs](https://img.shields.io/badge/API-Documentation-blue?style=for-the-badge)](docs/api_spec.md)
[![Research Website](https://img.shields.io/badge/Research-Website-green?style=for-the-badge)](https://SachinthaX.github.io/mushroom-research-website/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange?style=for-the-badge)]()

# Smart Mushroom Cultivation Analytics Framework

A comprehensive smart agriculture decision-support system for mushroom cultivation.  
This project combines **environmental monitoring**, **machine learning forecasting**, **mushroom type and growth-stage prediction**, **disease detection**, **treatment recommendation**, and **severity monitoring** to help mushroom farmers make faster and more accurate cultivation decisions.

![Project Banner](./assets/banner.jpeg)

<p align="center">
  <b>Environmental Monitoring</b> • <b>Forecasting</b> • <b>Growth Prediction</b> • <b>Disease Detection</b> • <b>Treatment Recommendation</b>
</p>

---

## Overview

Mushroom cultivation is highly sensitive to environmental conditions such as temperature, humidity, CO₂ level, ventilation, hygiene, and growth-stage timing. Manual monitoring can be time-consuming, inconsistent, and difficult when farmers manage many cultivation bags.

This project provides an integrated system that supports mushroom farmers by converting sensor readings and image inputs into practical decision-support outputs such as alerts, forecasts, predictions, recommendations, and history-based trends.

---

## Main Components

### 1. Environmental Intelligence Module

This module monitors the mushroom growing environment and provides decision support based on sensor data.

**Main features:**

- Real-time temperature, humidity, and estimated CO₂ monitoring
- Environmental alert generation
- Historical trend analysis
- 1-hour, 6-hour, and 24-hour temperature/humidity forecasting
- Corrective solution recommendation
- Mushroom variety recommendation based on environmental suitability

### 2. Visual Growth Intelligence Module

This module analyzes mushroom images to support type identification and growth-stage monitoring.

**Main features:**

- Mushroom type classification
- Growth-stage prediction
- Bag-level growth history
- Next-stage estimation
- Mobile image capture and upload support
- Confidence score output

### 3. Disease Intelligence Module

This module detects disease conditions from mushroom bag images and provides practical disease management support.

**Main features:**

- Disease detection from uploaded images
- Healthy, black mold, green mold, and invalid/other image handling
- Confidence score output
- Treatment recommendation
- Severity estimation
- Bag-level disease history
- Severity trend monitoring

---

## System Architecture

```mermaid
flowchart TB
    subgraph Input["Data Sources"]
        IoT[IoT Sensor Node]
        Weather[Outdoor Weather API]
        Image[Mobile Image Capture]
        User[Farmer Input]
    end

    subgraph Backend["FastAPI Backend"]
        API[REST API Layer]
        Env[Environmental Service]
        Forecast[Forecasting Service]
        Growth[Growth Prediction Service]
        Disease[Disease Detection Service]
        Rec[Recommendation Service]
        History[History Service]
    end

    subgraph Models["AI / ML Models"]
        RF[Random Forest Forecast Models]
        TypeModel[Mushroom Type Model]
        StageModel[Growth Stage Model]
        DiseaseModel[Disease Detection Model]
    end

    subgraph Storage["Database / Storage"]
        DB[(Database)]
        Records[History Records]
    end

    subgraph Mobile["Mobile Application"]
        Dashboard[Environmental Dashboard]
        Graphs[Trend Graphs]
        Predictions[Predictions]
        Recommendations[Recommendations]
        HistoryUI[History Views]
    end

    IoT --> API
    Weather --> API
    Image --> API
    User --> Mobile

    Mobile --> API
    API --> Env
    API --> Forecast
    API --> Growth
    API --> Disease
    API --> Rec
    API --> History

    Forecast --> RF
    Growth --> TypeModel
    Growth --> StageModel
    Disease --> DiseaseModel

    Env <--> DB
    History <--> Records
    API --> Mobile
```

---

## Key Features

- Real-time environmental dashboard
- Temperature, humidity, and CO₂ monitoring
- Forecasting for 1-hour, 6-hour, and 24-hour horizons
- Smart alert generation
- Environmental solution recommendation
- Mushroom variety recommendation
- Mushroom type classification
- Growth-stage prediction
- Disease detection
- Treatment recommendation
- Disease severity scoring
- Bag-level history tracking
- Farmer-friendly mobile interface

---

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| FastAPI | Backend REST API |
| Python | Backend and machine learning logic |
| TensorFlow / Keras | Deep learning model inference |
| Scikit-learn | Forecasting and ML evaluation |
| Random Forest | Temperature and humidity forecasting |
| Pillow / NumPy | Image preprocessing |
| PostgreSQL / Supabase | Data storage |
| Uvicorn | Backend server |
| Swagger / ReDoc | API documentation |

### Mobile Application

| Technology | Purpose |
|---|---|
| React Native | Mobile application development |
| Expo | Mobile testing and development |
| Expo Image Picker | Camera and gallery image selection |
| Fetch API | Backend communication |
| React Native SVG | Graph and chart rendering |
| Vector Icons | UI icons |

### Hardware / IoT

| Component | Purpose |
|---|---|
| ESP32 | Sensor node controller |
| DHT22 | Temperature and humidity sensing |
| MQ-135 | Air quality / CO₂-related sensing |
| Wi-Fi | Data transmission |

---

## Repository Structure

```text
Research-Project-Of-Mushroom/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── mushroom_disease_model.h5
│   │   ├── mushroom_type.tflite
│   │   └── class_names.json
│   └── app/
│       ├── api/v1/
│       ├── db/
│       ├── schemas/
│       └── services/
│
├── MobileAppExpo/
│   ├── App.js
│   ├── package.json
│   ├── app.json
│   └── src/
│       ├── screens/
│       └── services/
│
├── docs/
│   └── api_spec.md
│
├── assets/
│   └── banner.jpeg
│
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or higher
- Node.js 16 or higher
- npm
- PostgreSQL or Supabase database
- Expo Go mobile app
- Git

---

## Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mushroom_db
```

Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend API documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/ping
```

---

## Mobile App Setup

Go to the mobile app folder:

```bash
cd MobileAppExpo
```

Install dependencies:

```bash
npm install
```

Update the backend URL in the API service file.

Example:

```javascript
export const BACKEND_URL = "http://YOUR_PC_IP_ADDRESS:8000";
```

Start Expo:

```bash
npx expo start
```

Open the app using **Expo Go** on your mobile device.

Make sure the mobile phone and backend computer are connected to the same Wi-Fi network.

---

## API Documentation

The backend provides Swagger API documentation when the server is running:

```text
http://127.0.0.1:8000/docs
```

Detailed API specification:

```text
docs/api_spec.md
```

---

## Research Website

The project research website is available here:

```text
https://SachinthaX.github.io/mushroom-research-website/
```

The website includes:

- Home
- Domain
- Milestones
- Documents
- Presentations
- About Us
- Contact Us

---

## Research Team

| Student ID | Name | Contribution |
|---|---|---|
| IT22889188 | S.M.A. Dhananjaya | Disease detection, treatment recommendation, severity monitoring |
| IT22353566 | Sachintha H N | Environmental monitoring, forecasting, solution recommendation, variety recommendation |
| IT22911162 | Yukthila Y.C | Mushroom type classification, growth-stage prediction, bag-level history |

---

## Future Improvements

- Add more mushroom varieties
- Add more disease categories
- Improve humidity forecasting accuracy
- Add stronger image quality validation
- Add push notifications for alerts
- Add cloud deployment support
- Add user authentication
- Add admin dashboard
- Add yield prediction
- Improve farm-level analytics

---

## Troubleshooting

### Backend does not start

Check:

```bash
python --version
pip install -r requirements.txt
```

Make sure the `.env` file contains the correct database URL.

### Mobile app cannot connect to backend

Check:

- Backend is running
- Mobile and computer are on the same Wi-Fi
- API URL uses the computer IP address, not `localhost`
- Firewall is not blocking port `8000`

### Images are not uploading

Check:

- Camera/gallery permission is enabled
- Backend upload endpoint is running
- Image file format is supported

### AI model is not loading

Check:

- Model files exist in `backend/models/`
- TensorFlow is installed correctly
- Model file names match the backend code

---

## License

This project was developed for academic research purposes at the Sri Lanka Institute of Information Technology.

---

## Status

**Project ID:** 25-26J-211