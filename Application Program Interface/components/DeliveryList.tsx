import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, User, Truck, Map, Calendar } from 'lucide-react';
import { DeliveryRecord } from '../App';

interface DeliveryListProps {
  deliveries: DeliveryRecord[];
  onBack: () => void;
  onViewMap: (delivery: DeliveryRecord) => void;
}

export function DeliveryList({ deliveries, onBack, onViewMap }: DeliveryListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Delivery Records</CardTitle>
            <CardDescription>
              {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No deliveries yet</p>
                <Button onClick={onBack} variant="outline">
                  Create Your First Delivery
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600">Pickup</p>
                              <p className="font-medium break-words">{delivery.pickupLocation}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600">Delivery</p>
                              <p className="font-medium break-words">{delivery.deliveryLocation}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">{delivery.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">{delivery.driverName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">{formatDate(delivery.timestamp)}</span>
                            </div>
                          </div>
                          {delivery.distance > 0 && (
                            <Badge variant="outline" className="w-fit">
                              {delivery.distance.toFixed(2)} km
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onViewMap(delivery)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Map className="w-4 h-4" />
                            View Map
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

