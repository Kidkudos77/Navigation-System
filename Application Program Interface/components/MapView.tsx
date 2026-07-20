// MapView.tsx
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, User, Truck, Route, ExternalLink } from 'lucide-react';
import { DeliveryRecord } from '../App';

interface RouteApiResponse {
  origin: string;
  destination: string;
  routes: any[];
  shortest_path: Array<[number, number]>;
}

interface MapViewProps {
  delivery: DeliveryRecord | null;
  onBack: () => void;
}

export function MapView({ delivery, onBack }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiData, setApiData] = useState<RouteApiResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (!delivery) return;
    // Try to load a pre-exported route JSON (frontend/public/route.json) first,
    // otherwise fall back to calling the backend API at /api/shortest-path
    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        // attempt static file
        const staticRes = await fetch('/route.json');
        if (staticRes.ok) {
          const json = await staticRes.json();
          // normalize to RouteApiResponse shape used by this component
          const normalized: RouteApiResponse = {
            origin: json.origin ?? delivery.pickupLocation,
            destination: json.destination ?? delivery.deliveryLocation,
            routes: json.routes ?? [],
            shortest_path: (json.coords ?? json.shortest_path ?? []).map((c: any) => [Number(c[0]), Number(c[1])])
          };
          setApiData(normalized);
          return;
        }

        // fallback to backend endpoint
        const res = await fetch('/api/shortest-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: delivery.pickupLocation, destination: delivery.deliveryLocation })
        });
        if (!res.ok) throw new Error('Route fetch failed');
        const data = await res.json();
        // backend returns coords in `coords` field in our current server implementation
        const normalized2: RouteApiResponse = {
          origin: data.origin ?? delivery.pickupLocation,
          destination: data.destination ?? delivery.deliveryLocation,
          routes: data.routes ?? [],
          shortest_path: (data.coords ?? data.shortest_path ?? []).map((c: any) => [Number(c[0]), Number(c[1])])
        };
        setApiData(normalized2);
      } catch (err) {
        console.error('Failed to fetch route', err);
        setApiData(null);
      } finally {
        setLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [delivery]);

  useEffect(() => {
    if (!apiData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // size canvas
    const container = canvas.parentElement || document.body;
    canvas.width = container.clientWidth;
    canvas.height = 500;

    drawMapFromApi(ctx, canvas.width, canvas.height, apiData, delivery!);
    setMapLoaded(true);
  }, [apiData, delivery]);

  // project lat/lng to canvas coords using bounding box -> linear interpolation
  const projectLatLngToCanvas = (
    lat: number,
    lng: number,
    bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    width: number,
    height: number,
    padding = 40
  ) => {
    const latRange = bbox.maxLat - bbox.minLat || 1;
    const lngRange = bbox.maxLng - bbox.minLng || 1;
    // x: lng, y: lat (invert y so larger lat is up)
    const x = padding + ((lng - bbox.minLng) / lngRange) * (width - padding * 2);
    const y = padding + ((bbox.maxLat - lat) / latRange) * (height - padding * 2);
    return { x, y };
  };

  const drawMapFromApi = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: RouteApiResponse,
    delivery: DeliveryRecord
  ) => {
    ctx.clearRect(0, 0, width, height);

    // background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // draw grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const pts = data.shortest_path.filter(pt => pt[0] !== null && pt[1] !== null);
    if (!pts || pts.length === 0) {
      // fallback: show pickup/delivery placeholders
      drawPlaceholderMap(ctx, width, height, delivery);
      return;
    }

    // compute bounding box
    const lats = pts.map(p => p[0]);
    const lngs = pts.map(p => p[1]);
    const bbox = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };

    // project points
    const projected = pts.map(([lat, lng]) => projectLatLngToCanvas(lat, lng, bbox, width, height));

    // draw route polyline (solid)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    projected.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // dashed direction overlay
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    projected.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // pickup / delivery markers (first/last)
    const pickup = projected[0];
    const deliveryP = projected[projected.length - 1];

    drawMarker(ctx, pickup.x, pickup.y, '#22c55e', 'P');
    drawMarker(ctx, deliveryP.x, deliveryP.y, '#ef4444', 'D');

    // labels
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKUP', pickup.x, pickup.y - 35);
    ctx.fillText('DELIVERY', deliveryP.x, deliveryP.y - 35);

    // distance text (use provided delivery.distance if available)
    const rawDistanceKm = delivery.distance ? Number(delivery.distance) : ((data.routes[0]?.distance_meters ?? 0) / 1000);
    const distanceText = `${Number(rawDistanceKm ?? 0).toFixed(2)} km`;
    const midIdx = Math.floor(projected.length / 2);
    const mid = projected[midIdx];
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    const textWidth = ctx.measureText(distanceText).width;
    ctx.fillRect(mid.x - textWidth / 2 - 10, mid.y - 20, textWidth + 20, 30);
    ctx.strokeRect(mid.x - textWidth / 2 - 10, mid.y - 20, textWidth + 20, 30);
    ctx.fillStyle = '#2563eb';
    ctx.fillText(distanceText, mid.x, mid.y + 5);
  };

  const drawMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
    ctx.fill();
    // pin point
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y - 15);
    ctx.lineTo(x + 8, y - 15);
    ctx.closePath();
    ctx.fill();
    // white circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - 20, 10, 0, Math.PI * 2);
    ctx.fill();
    // label
    ctx.fillStyle = color;
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - 20);
  };

  const drawPlaceholderMap = (ctx: CanvasRenderingContext2D, width: number, height: number, delivery: DeliveryRecord) => {
    // simple fallback (re-uses your original random placement)
    const padding = 80;
    const pickupX = padding + Math.random() * (width - 2 * padding) * 0.3;
    const pickupY = height / 2 + (Math.random() - 0.5) * (height - 2 * padding);
    const deliveryX = width - padding - Math.random() * (width - 2 * padding) * 0.3;
    const deliveryY = height / 2 + (Math.random() - 0.5) * (height - 2 * padding);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pickupX, pickupY);
    const controlX = (pickupX + deliveryX) / 2;
    const controlY = Math.min(pickupY, deliveryY) - 50;
    ctx.quadraticCurveTo(controlX, controlY, deliveryX, deliveryY);
    ctx.stroke();
    // dashed
    ctx.setLineDash([10,5]);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pickupX, pickupY);
    ctx.quadraticCurveTo(controlX, controlY, deliveryX, deliveryY);
    ctx.stroke();
    ctx.setLineDash([]);
    drawMarker(ctx, pickupX, pickupY, '#22c55e', 'P');
    drawMarker(ctx, deliveryX, deliveryY, '#ef4444', 'D');
  };

  const openInGoogleMaps = () => {
    if (!delivery) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      delivery.pickupLocation
    )}&destination=${encodeURIComponent(delivery.deliveryLocation)}`;
    window.open(url, '_blank');
  };

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No delivery selected</p>
            <Button onClick={onBack} className="mt-4">Back to Menu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
              <CardDescription>Route information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600">Pickup</p>
                    <p className="break-words">{delivery.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600">Delivery</p>
                    <p className="break-words">{delivery.deliveryLocation}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-600">Client</p>
                    <p>{delivery.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-600">Driver</p>
                    <p>{delivery.driverName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-600">Total Distance</p>
                    <p>{delivery.distance} km</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={openInGoogleMaps} variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Optimal Route Map</CardTitle>
              <CardDescription>Shortest path from pickup to delivery location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-white rounded-lg overflow-hidden border">
                <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
                {(!mapLoaded || loadingRoute) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500">{loadingRoute ? 'Calculating route...' : 'Loading map...'}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span className="text-gray-600">Pickup Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span className="text-gray-600">Delivery Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">Route Path</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

