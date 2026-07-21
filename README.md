# 🌱 Digital Twin Agriculture Platform

A full-stack Digital Twin Agriculture Platform developed to simulate and monitor agricultural field conditions through a virtual representation of a farm. The platform enables visualization of environmental parameters, crop health assessment, irrigation recommendations, yield prediction, and analytics using synthetic sensor data generated through Python.

The project was developed as part of an internship at **Punjab Agricultural University (PAU), Ludhiana**, with the objective of demonstrating how Digital Twin technology can support data-driven decision-making in agriculture.

---

# 🚀 Live Demo

🌐 **Website:** https://digital-twin-agriculture-platform.onrender.com

---

# 📖 Project Overview

Digital Twin is an emerging technology that creates a virtual representation of a physical system. In agriculture, it can help monitor field conditions, analyse crop performance, and assist farmers in making informed decisions.

Since physical IoT sensors were not available during development, the current version of the platform uses **synthetically generated sensor data** created using Python. The generated data simulates real agricultural parameters such as temperature, humidity, rainfall, and soil moisture, allowing the Digital Twin platform to demonstrate real-world functionality.

The platform provides an interactive dashboard that visualizes sensor readings, calculates crop health, estimates irrigation requirements, predicts yield, and supports simulation-based analysis.

---

# ✨ Features

- 🌱 Digital Twin framework for smart agriculture
- 📊 Interactive dashboard for agricultural monitoring
- 📡 Synthetic sensor data generation and real-time visualization
- 🤖 AI-assisted crop analytics and decision support
- 📈 Historical trend analysis with interactive charts
- ⚙️ Environmental scenario simulation
- ☁️ Cloud-based full-stack deployment

---


# 🏗 System Architecture

```
Python Sensor Data Generator
            │
            ▼
     PostgreSQL (Neon)
            │
            ▼
 Spring Boot REST API
            │
            ▼
     React + Vite Frontend
            │
            ▼
 Digital Twin Dashboard & Analytics
```

---

# 🛠 Technology Stack

## Frontend

- React
- Vite
- JavaScript
- Axios
- HTML
- CSS

## Backend

- Java
- Spring Boot
- REST APIs

## Database

- PostgreSQL
- Neon Database

## Programming Languages

- Java
- Python
- JavaScript

## Deployment

- Render
- GitHub

---

# 📁 Project Structure

```
digital-twin-agriculture-platform
│
├── frontend                 # React Frontend
├── backend                  # Spring Boot Backend
├── ml                       # Machine Learning components
├── twin-engine              # Digital Twin logic
├── docs                     # Project documentation
├── README.md
└── LICENSE
```

---


# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/asmitabansal05/digital-twin-agriculture-platform.git
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend/backend
mvn spring-boot:run
```

---

# ☁️ Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| Database | Neon PostgreSQL |
| Source Code | GitHub |

---

# 🔮 Future Scope

The current platform uses synthetic sensor data. Future enhancements include:

- Integration with real IoT sensors for live field monitoring
- CNN-based crop disease detection using leaf images
- Drone-based crop monitoring
- Satellite imagery integration for large-scale field analysis
- Weather API integration for real-time forecasting
- Mobile application for farmers
- Multi-user and multi-farm management
- Advanced machine learning models for yield prediction

---

# 👩‍💻 Author

**Asmita Bansal**

B.Tech Computer Science & Engineering

Mody University of Science and Technology

Internship Project at Punjab Agricultural University (PAU), Ludhiana

GitHub: https://github.com/asmitabansal05

---

# 📄 License

This project is licensed under the MIT License.

---

⭐ If you found this project useful, consider giving it a Star.
