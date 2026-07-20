# mainscript.py
# Run with: uvicorn mainscript:app --reload
# Requirements: fastapi uvicorn googlemaps polyline networkx geopy folium python-dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
import googlemaps
import polyline
import networkx as nx
from geopy.distance import geodesic
from pathlib import Path
import json

# --- CONFIG ---
API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or "AIzaSyAdtNNkPvxgW9nlWiv-EnLUSzyrzaguD70"
# NOTE: Replace above with env var in production: export GOOGLE_MAPS_API_KEY="..."
gmaps = googlemaps.Client(key=API_KEY)

app = FastAPI(title="Routing API")

# allow CORS for dev (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteQuery(BaseModel):
    origin: str
    destination: str
    mode: str = "driving"

def format_duration(seconds: int) -> str:
    hrs, rem = divmod(int(seconds), 3600)
    mins, secs = divmod(rem, 60)
    parts = []
    if hrs: parts.append(f"{hrs} hr")
    if mins: parts.append(f"{mins} min")
    if secs and not parts: parts.append(f"{secs} sec")
    return " ".join(parts) if parts else "0 sec"

@app.post("/directions")
def get_directions(q: RouteQuery):
    # fetch directions (may raise)
    try:
        directions_result = gmaps.directions(
            origin=q.origin,
            destination=q.destination,
            mode=q.mode,
            departure_time=datetime.now(),
            alternatives=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not directions_result:
        raise HTTPException(404, "No directions returned")

    # Build route summary + decoded polylines
    routes_out = []
    for route_idx, route in enumerate(directions_result, start=1):
        overview_poly = route.get("overview_polyline", {}).get("points", "")
        coords = polyline.decode(overview_poly) if overview_poly else []
        legs = []
        total_m = 0
        total_s = 0
        for leg in route.get("legs", []):
            leg_steps = []
            for step in leg.get("steps", []):
                instr = step.get("html_instructions", "")
                # strip tags quickly
                from re import sub
                instr_text = sub("<[^<]+?>", "", instr)
                leg_steps.append({
                    "start_location": step.get("start_location"),
                    "end_location": step.get("end_location"),
                    "instruction": instr_text,
                    "distance": step.get("distance"),
                    "duration": step.get("duration"),
                })
            legs.append({
                "start_address": leg.get("start_address"),
                "end_address": leg.get("end_address"),
                "steps": leg_steps
            })
            total_m += sum((s.get("distance", {}).get("value", 0) for s in leg.get("steps", [])))
            total_s += sum((s.get("duration", {}).get("value", 0) for s in leg.get("steps", [])))

        routes_out.append({
            "route_index": route_idx,
            "summary": route.get("summary"),
            "distance_meters": total_m,
            "duration_seconds": total_s,
            "distance_text": route.get("legs", [{}])[0].get("distance", {}).get("text", ""),
            "duration_text": route.get("legs", [{}])[0].get("duration", {}).get("text", ""),
            "coords": coords,
            "legs": legs
        })

    # Build step-level directed graph and run Dijkstra on distance for shortest path
    G_steps = nx.DiGraph()
    for route_idx, route in enumerate(routes_out, start=1):
        # legs in route come from routes_out[route_idx-1]['legs']
        leg_steps_all = []
        for leg in route["legs"]:
            leg_steps_all.extend(leg["steps"])
        # create nodes and edges
        for idx, step in enumerate(leg_steps_all):
            node_id = f"R{route_idx}_S{idx}"
            start_loc = step.get("start_location") or {}
            lat = start_loc.get("lat")
            lng = start_loc.get("lng")
            G_steps.add_node(node_id, lat=lat, lng=lng, route=route_idx, step=idx, instruction=step.get("instruction"))

        for idx in range(len(leg_steps_all) - 1):
            u = f"R{route_idx}_S{idx}"
            v = f"R{route_idx}_S{idx+1}"
            sd = leg_steps_all[idx]
            dist = sd.get("distance", {}).get("value", 0)
            dur = sd.get("duration", {}).get("value", 0)
            G_steps.add_edge(u, v, weight=dist, distance=dist, duration=dur, route=route_idx)

    # choose route1 first/last step as pickup/delivery if available else fallback to first/last coords
    shortest_path_coords = []
    shortest_path_nodes = []
    try:
        route1_nodes = [n for n,d in G_steps.nodes(data=True) if d.get('route')==1]
        if route1_nodes:
            route1_nodes_sorted = sorted(route1_nodes, key=lambda nid: G_steps.nodes[nid]['step'])
            pickup_node = route1_nodes_sorted[0]
            delivery_node = route1_nodes_sorted[-1]
            shortest_path_nodes = nx.dijkstra_path(G_steps, pickup_node, delivery_node, weight='weight')
            # coords
            shortest_path_coords = [(G_steps.nodes[n]['lat'], G_steps.nodes[n]['lng']) for n in shortest_path_nodes]
    except Exception:
        # if graph/dijkstra fails, fallback to first route coords
        if routes_out:
            shortest_path_coords = routes_out[0]["coords"]

    response = {
        "origin": q.origin,
        "destination": q.destination,
        "routes": routes_out,
        "shortest_path": shortest_path_coords,
        "shortest_nodes": shortest_path_nodes
    }

    # Optionally: save folium maps to disk (uncomment to enable)
    # try:
    #     import folium
    #     if routes_out and routes_out[0]['coords']:
    #         m = folium.Map(location=routes_out[0]['coords'][0], zoom_start=10)
    #         for i, r in enumerate(routes_out, start=1):
    #             folium.PolyLine(r['coords'], color=['blue','green','purple','orange'][(i-1)%4], weight=5).add_to(m)
    #         m.save("routes_map.html")
    # except Exception:
    #     pass

    return response

@app.post("/api/shortest-path")
def get_shortest_path(q: RouteQuery):
    """
    Endpoint for frontend to get shortest path coordinates.
    Returns data in format expected by MapView component.
    """
    try:
        # Use the existing directions endpoint logic
        directions_result = gmaps.directions(
            origin=q.origin,
            destination=q.destination,
            mode=q.mode,
            departure_time=datetime.now(),
            alternatives=True
        )
    except Exception as e:
        # If API fails, try to load static route.json
        route_json_path = Path(__file__).parent.parent / "frontend" / "public" / "route.json"
        if route_json_path.exists():
            with open(route_json_path, 'r') as f:
                data = json.load(f)
            coords = data.get("coords") or data.get("shortest_path") or []
            return {
                "origin": data.get("origin") or q.origin,
                "destination": data.get("destination") or q.destination,
                "routes": data.get("routes", []),
                "coords": coords,
                "shortest_path": coords
            }
        raise HTTPException(status_code=500, detail=str(e))

    if not directions_result:
        raise HTTPException(404, "No directions returned")

    # Build route summary + decoded polylines (same as /directions)
    routes_out = []
    for route_idx, route in enumerate(directions_result, start=1):
        overview_poly = route.get("overview_polyline", {}).get("points", "")
        coords = polyline.decode(overview_poly) if overview_poly else []
        legs = []
        total_m = 0
        total_s = 0
        for leg in route.get("legs", []):
            leg_steps = []
            for step in leg.get("steps", []):
                instr = step.get("html_instructions", "")
                from re import sub
                instr_text = sub("<[^<]+?>", "", instr)
                leg_steps.append({
                    "start_location": step.get("start_location"),
                    "end_location": step.get("end_location"),
                    "instruction": instr_text,
                    "distance": step.get("distance"),
                    "duration": step.get("duration"),
                })
            legs.append({
                "start_address": leg.get("start_address"),
                "end_address": leg.get("end_address"),
                "steps": leg_steps
            })
            total_m += sum((s.get("distance", {}).get("value", 0) for s in leg.get("steps", [])))
            total_s += sum((s.get("duration", {}).get("value", 0) for s in leg.get("steps", [])))

        routes_out.append({
            "route_index": route_idx,
            "summary": route.get("summary"),
            "distance_meters": total_m,
            "duration_seconds": total_s,
            "distance_text": route.get("legs", [{}])[0].get("distance", {}).get("text", ""),
            "duration_text": route.get("legs", [{}])[0].get("duration", {}).get("text", ""),
            "coords": coords,
            "legs": legs
        })

    # Build step-level graph and compute shortest path
    G_steps = nx.DiGraph()
    for route_idx, route in enumerate(routes_out, start=1):
        leg_steps_all = []
        for leg in route["legs"]:
            leg_steps_all.extend(leg["steps"])
        for idx, step in enumerate(leg_steps_all):
            node_id = f"R{route_idx}_S{idx}"
            start_loc = step.get("start_location") or {}
            lat = start_loc.get("lat")
            lng = start_loc.get("lng")
            G_steps.add_node(node_id, lat=lat, lng=lng, route=route_idx, step=idx, instruction=step.get("instruction"))
        for idx in range(len(leg_steps_all) - 1):
            u = f"R{route_idx}_S{idx}"
            v = f"R{route_idx}_S{idx+1}"
            sd = leg_steps_all[idx]
            dist = sd.get("distance", {}).get("value", 0)
            dur = sd.get("duration", {}).get("value", 0)
            G_steps.add_edge(u, v, weight=dist, distance=dist, duration=dur, route=route_idx)

    # Compute shortest path
    shortest_path_coords = []
    try:
        route1_nodes = [n for n, d in G_steps.nodes(data=True) if d.get('route') == 1]
        if route1_nodes:
            route1_nodes_sorted = sorted(route1_nodes, key=lambda nid: G_steps.nodes[nid]['step'])
            pickup_node = route1_nodes_sorted[0]
            delivery_node = route1_nodes_sorted[-1]
            shortest_path_nodes = nx.dijkstra_path(G_steps, pickup_node, delivery_node, weight='weight')
            shortest_path_coords = [(G_steps.nodes[n]['lat'], G_steps.nodes[n]['lng']) for n in shortest_path_nodes]
    except Exception:
        if routes_out:
            shortest_path_coords = routes_out[0]["coords"]

    # Return in format expected by frontend
    return {
        "origin": q.origin,
        "destination": q.destination,
        "routes": routes_out,
        "coords": shortest_path_coords,
        "shortest_path": shortest_path_coords
    }