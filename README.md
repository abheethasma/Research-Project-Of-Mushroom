# Research-Project-Of-Mushroom-
A comprehensive suite of tools for smart mushroom farming, integrating IoT monitoring, AI-driven disease/pest detection, growth prediction, and harvest optimization.


# A Predictive Analytics Framework for Optimizing Mushroom Cultivation

![Mushroom Tech](https://img.shields.io/badge/Project--ID-25--26J--211-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-green)
![SriLanka](https://img.shields.io/badge/Institution-SLIIT,%20Sri%20Lanka-darkgreen)

This repository contains the development of a comprehensive, AI-powered predictive analytics framework designed to revolutionize the mushroom cultivation process. Our goal is to empower growers with an integrated system that provides data-driven insights at every stage—from initial planning and environmental monitoring to growth stage prediction, disease management, and optimized harvesting.

---

## 👥 Project Team & Components

This project is a collaborative effort by four researchers, each focusing on a critical component of the overall framework.

### 1. Mushroom Harvesting Optimization System
* *Researcher:* Sachindra K.T.N. (IT22350350)
* [cite_start]*Focus:* This component develops a smart harvesting system using image analysis to automate *ripeness detection, perform **size-based quality grading, and predict the **optimal harvest window*[cite: 33, 34, 35, 36, 37]. [cite_start]It also includes a user-centric tool that generates personalized cultivation plans based on the grower's budget, space, and desired timeline[cite: 38, 39, 40].

### 2. Visual Growth Stage & Type Classification System
* *Researcher:* Yakupitiyage Chamath Yukthila (IT22911162)
* [cite_start]*Focus:* This component uses Artificial Neural Networks (ANNs) for the automated *visual classification of mushroom varieties* (Oyster, Button, Milky) and the *prediction of key growth stages* (spawn run, primordia formation, fruitbody development)[cite: 354]. [cite_start]By analyzing time-series imagery, it provides forecasts for developmental transitions, enabling proactive farm management[cite: 356, 358].

### 3. Environmental Monitoring & Pest Detection System
* *Researcher:* Nipuna Sachintha (IT22353566)
* [cite_start]*Focus:* This component integrates an IoT-based sensor network (using ESP32) to monitor critical environmental parameters like temperature, humidity, and $CO_2$ levels in real-time[cite: 786]. [cite_start]It features a recommendation engine to suggest suitable mushroom varieties based on live conditions and uses a CNN for *visual detection of common Sri Lankan pests*, providing localized treatment solutions[cite: 787, 788, 789].

### 4. Visual Disease Detection & Treatment System
* *Researcher:* Dhananjaya S.M.A (IT22889188)
* [cite_start]*Focus:* This component employs ANNs for the automated *visual detection of common mushroom diseases* like black mold, green mold, and soft rot[cite: 1168]. [cite_start]Beyond identification, it incorporates a knowledge-based recommendation engine to provide users with *targeted treatment protocols* and preventive management strategies tailored to the diagnosed disease[cite: 1170, 1171, 1172].

---

## ✨ Key Features

The integrated framework provides an end-to-end solution for modern mushroom farming:

* *🌱 Personalized Cultivation Planning:* Generates tailored cultivation plans with cost estimates and timelines.
* *🌡 Real-Time Environmental Monitoring:* Live data on temperature, humidity, and $CO_2$ with automated alerts.
* *🍄 AI-Powered Visual Analysis:*
    * Accurate classification of mushroom varieties.
    * Automated prediction of growth stages and harvest readiness.
    * Rapid detection of common pests and diseases from images.
* *💡 Intelligent Recommendations:* Provides actionable guidance on variety selection, pest treatments, and disease management.
* *🚜 Harvest Optimization:* Determines the perfect time to harvest and grades mushrooms by size and quality to maximize profitability.
* *📱 User-Friendly Mobile Interface:* Designed for easy on-site use by growers with varying technical skills.

---

## 🛠 Technology Stack

* *Hardware:* IoT Sensors (DHT22, MQ-135), ESP32 Microcontroller, Camera Modules.
* *Machine Learning:* Python, TensorFlow, OpenCV, Scikit-learn.
* *AI Models:* Convolutional Neural Networks (CNNs), Recurrent Neural Networks (LSTMs).
* *Backend:* Cloud Hosting, Databases (e.g., Firebase, MySQL).
* *Frontend:* Mobile Application (Android/iOS), Web Dashboard.

---

## 🚀 Getting Started

Instructions on how to get a local copy of the project up and running.

### Prerequisites

* A list of software and tools you need to install.
    sh
    pip install tensorflow numpy opencv-python
    

### Installation

1.  Clone the repo
    sh
    git clone [https://github.com/your_username/your_repository_name.git](https://github.com/your_username/your_repository_name.git)
    
2.  Navigate to the project directory
    sh
    cd your_repository_name
    
3.  Install required packages
    sh
    pip install -r requirements.txt
    

### Running the Application

* Instructions on how to run the project will be added here.

---

## 📂 Project Structure

A brief overview of the project's directory structure.


.
├── data/                  # Datasets for training and testing
├── notebooks/             # Jupyter notebooks for experimentation
├── src/                   # Source code for the application
│   ├── component_1_harvesting/
│   ├── component_2_growth_prediction/
│   ├── component_3_environment_pests/
│   └── component_4_diseases/
├── models/                # Trained machine learning models
└── README.md


---

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.
