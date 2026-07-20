import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Package } from 'lucide-react';
import { DeliveryRecord } from '../App';

interface DeliveryFormProps {
  onBack: () => void;
  onSubmit: (delivery: DeliveryRecord) => void;
}

export function DeliveryForm({ onBack, onSubmit }: DeliveryFormProps) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [distance, setDistance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupLocation || !deliveryLocation || !clientName || !driverName) {
      alert('Please fill in all required fields');
      return;
    }

    const delivery: DeliveryRecord = {
      id: Date.now().toString(),
      pickupLocation,
      deliveryLocation,
      clientName,
      driverName,
      distance: parseFloat(distance) || 0,
      timestamp: new Date(),
    };

    onSubmit(delivery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>New Delivery</CardTitle>
                <CardDescription>Enter delivery details to create a new route</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location *</Label>
                <Input
                  id="pickup"
                  type="text"
                  placeholder="e.g., 123 Main St, City, State"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery Location *</Label>
                <Input
                  id="delivery"
                  type="text"
                  placeholder="e.g., 456 Oak Ave, City, State"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client Name *</Label>
                <Input
                  id="client"
                  type="text"
                  placeholder="Client's full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Driver Name *</Label>
                <Input
                  id="driver"
                  type="text"
                  placeholder="Driver's full name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
                <p className="text-sm text-gray-500">Leave empty to calculate automatically</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create Delivery
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

