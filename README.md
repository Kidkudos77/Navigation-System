# SwiftRoute Delivery - Navigation System

A cutting-edge delivery route management system that optimizes delivery routes using intelligent algorithms and real-time traffic data.

## 🚀 Features

- **Route Optimization**: Calculate the shortest path between pickup and delivery locations
- **Interactive Maps**: View routes on Google Maps with real-time visualization
- **Delivery Management**: Create, track, and manage delivery records
- **Distance Calculation**: Automatic distance calculation using Google Maps API
- **Real-time Updates**: Dynamic route adjustments based on traffic conditions

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Google Maps JavaScript API
- Tailwind CSS

### Backend
- Python 3.13
- FastAPI
- Google Maps API
- NetworkX (for route optimization)
- Uvicorn (ASGI server)

## 📋 Prerequisites

- Python 3.13 or higher
- Google Maps API Key
- Node.js (optional, for full React app)

## 🔧 Installation

### Backend Setup

1. Navigate to the Software directory:
```bash
cd Software
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set your Google Maps API key (optional, defaults to provided key):
```bash
export GOOGLE_MAPS_API_KEY="your-api-key-here"
```

4. Start the backend server:
```bash
python -m uvicorn mainscript:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- API: http://127.0.0.1:8000
- Documentation: http://127.0.0.1:8000/docs

### Frontend Setup

#### Option 1: Standalone HTML (No Installation Required)
Simply open `swiftroute-app.html` in your web browser.

#### Option 2: Full React App (Requires Node.js)
1. Install Node.js from https://nodejs.org/
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## 📖 Usage

1. **Start the Backend**: Run the FastAPI server (see Backend Setup)
2. **Open the Frontend**: Open `swiftroute-app.html` in your browser
3. **Create a Delivery**: 
   - Click "New Delivery"
   - Enter pickup and delivery locations
   - Fill in client and driver information
   - The system will automatically calculate the route and distance
4. **View Routes**: Click "View Map" to see the optimized route on Google Maps

## 🏢 Company Information

**Founded**: 2025

**Team Members**:
- Alissa Forde
- Javonte Carter

## 📁 Project Structure

```
Navigation System/
├── Application Program Interface/    # React components (TypeScript)
│   ├── components/                   # React components
│   ├── styles/                      # CSS styles
│   └── App.tsx                      # Main app component
├── Software/                        # Backend API
│   ├── mainscript.py               # FastAPI application
│   ├── testscript.py               # Test script
│   └── requirements.txt            # Python dependencies
├── frontend/                        # Frontend assets
│   └── public/
│       └── route.json              # Sample route data
├── swiftroute-app.html             # Standalone HTML app
├── test-app.html                   # Test application
└── package.json                    # Node.js dependencies
```

## 🔑 API Endpoints

### POST `/api/shortest-path`
Calculate the shortest path between two locations.

**Request Body**:
```json
{
  "origin": "Tallahassee, FL",
  "destination": "Orlando, FL"
}
```

**Response**:
```json
{
  "origin": "Tallahassee, FL",
  "destination": "Orlando, FL",
  "routes": [...],
  "coords": [[lat, lng], ...],
  "shortest_path": [[lat, lng], ...]
}
```

## 🤝 Contributing

This project was developed by Alissa Forde and Javonte Carter.

## 📝 License

All rights reserved.

## 📧 Contact

- Email: info@swiftroute.com
- Phone: (555) 123-4567
- Address: 123 Innovation Drive, Tech City, TC 12345


[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/erzDJBXh)
# Navigation-System
25c4fe1b5c3fc0674ba27d704417f96888e5974f
