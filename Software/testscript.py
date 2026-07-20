# main.py
# ============================================
# =========== IMPORTS (yours) ================
# ============================================
import googlemaps
import folium

from collections import deque, defaultdict, Counter
import heapq
import math
import itertools
import json
import os
import time
import re
from datetime import datetime
import polyline
from geopy.distance import geodesic

import networkx as nx

# ============================================
# =============== CONFIG =====================
# ============================================
API_KEY = "YOUR_API_KEY"
origin = "Tallahassee, FL"
destination = "Orlando, FL"
travel_mode = "driving"


# ============================================
# ====== FETCH DIRECTIONS (your logic) =======
# ============================================
def fetch_directions():
    # If API key is not configured, do not call Google; fallback to sample data
    if not API_KEY or API_KEY.startswith("YOUR"):
        return None

    gmaps = googlemaps.Client(key=API_KEY)
    directions_result = gmaps.directions(
        origin=origin,
        destination=destination,
        mode=travel_mode,
        departure_time=datetime.now(),
        alternatives=True
    )
    if not directions_result:
        raise ValueError("No directions returned from Google Maps API.")
    return directions_result


# ============================================
# ==== BUILD STEP-LEVEL GRAPH (your logic) ===
# ============================================
def build_step_graph(directions_result):
    G_steps = nx.DiGraph()

    for route_idx, route in enumerate(directions_result, start=1):
        steps_all = []
        for leg in route.get("legs", []):
            steps_all.extend(leg.get("steps", []))

        # Add step nodes
        for s_idx, step in enumerate(steps_all):
            node_id = f"R{route_idx}_S{s_idx}"
            start_loc = step.get("start_location", {})
            lat = start_loc.get("lat")
            lng = start_loc.get("lng")
            instr = re.sub("<[^<]+?>", "", step.get("html_instructions", ""))
            G_steps.add_node(node_id,
                             lat=lat, lng=lng,
                             route=route_idx, step=s_idx,
                             instruction=instr)

        # Add edges
        for s_idx in range(len(steps_all) - 1):
            u = f"R{route_idx}_S{s_idx}"
            v = f"R{route_idx}_S{s_idx+1}"
            step_data = steps_all[s_idx]
            dist_m = step_data["distance"]["value"]
            dur_s = step_data["duration"]["value"]

            G_steps.add_edge(u, v,
                             weight=dist_m,
                             distance=dist_m,
                             duration=dur_s,
                             route=route_idx)

    return G_steps


# ============================================
# ============== RUN DIJKSTRA ================
# ============================================
def compute_shortest_path(G_steps, route_index=1):
    # Pick route
    route_nodes = [n for n, d in G_steps.nodes(data=True) if d['route'] == route_index]
    route_nodes_sorted = sorted(route_nodes, key=lambda nid: G_steps.nodes[nid]['step'])

    pickup_node = route_nodes_sorted[0]
    delivery_node = route_nodes_sorted[-1]

    # Run Dijkstra
    shortest_nodes = nx.dijkstra_path(G_steps, pickup_node, delivery_node, weight="weight")
    total_distance = nx.dijkstra_path_length(G_steps, pickup_node, delivery_node, weight="weight")

    # Compute total time
    total_time = sum(G_steps[u][v].get("duration", 0)
                     for u, v in zip(shortest_nodes[:-1], shortest_nodes[1:]))

    # Return coords for React
    coords = [
        [G_steps[n]['lat'], G_steps[n]['lng']]
        for n in shortest_nodes
    ]

    return {
        "coords": coords,
        "total_distance_m": total_distance,
        "total_time_s": total_time,
        "path_nodes": shortest_nodes,
        "steps": [
            {
                "node": n,
                "route": G_steps.nodes[n]["route"],
                "step": G_steps.nodes[n]["step"],
                "lat": G_steps.nodes[n]["lat"],
                "lng": G_steps.nodes[n]["lng"],
                "instruction": G_steps.nodes[n]["instruction"],
            }
            for n in shortest_nodes
        ]
    }


# ============================================
# ============= FASTAPI BACKEND ==============
# ============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for development
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/shortest-path")
def shortest_path_api():
    # If there's no Google API key, try to load a static `route.json` from the frontend
    if not API_KEY or API_KEY.startswith("YOUR"):
        # Expected path: project_root/frontend/public/route.json
        sample_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "route.json")
        )
        if os.path.exists(sample_path):
            with open(sample_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Normalize to the expected output shape
            coords = data.get("coords") or data.get("shape") or []
            distance_km = data.get("distance_km") or data.get("distance") or 0
            duration_s = data.get("duration_s") or data.get("duration") or 0
            return {
                "coords": coords,
                "total_distance_m": int(distance_km * 1000) if isinstance(distance_km, (int, float)) else 0,
                "total_time_s": int(duration_s) if isinstance(duration_s, (int, float)) else 0,
                "origin": data.get("origin"),
                "destination": data.get("destination"),
            }
        # If no sample file, return a small hard-coded route
        return {
            "coords": [[40.7128, -74.0060], [40.7138, -74.0050], [40.7148, -74.0040]],
            "total_distance_m": 3200,
            "total_time_s": 420,
            "origin": "Sample Origin",
            "destination": "Sample Destination",
        }

    # Otherwise call Google and compute shortest path normally
    directions = fetch_directions()
    G = build_step_graph(directions)
    result = compute_shortest_path(G)
    return result


# ============================================
# ============= RUN BACKEND ==================
# ============================================
if __name__ == "__main__":
    print("Starting API...")
    # run the app object directly; reload requires module path so set reload=False here
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
