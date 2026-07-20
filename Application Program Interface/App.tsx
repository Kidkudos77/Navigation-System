import { useState } from 'react';
import { CompanyInfo } from './components/CompanyInfo';
import { DeliveryForm } from './components/DeliveryForm';
import { DeliveryList } from './components/DeliveryList';
import { MapView } from './components/MapView';
import { Button } from './components/ui/button';
import { Package, Building2, List, Map } from 'lucide-react';

export interface DeliveryRecord {
  id: string;
  pickupLocation: string;
  deliveryLocation: string;
  clientName: string;
  driverName: string;
  distance: number;
  timestamp: Date;
  pickupCoords?: { lat: number; lng: number };
  deliveryCoords?: { lat: number; lng: number };
}

type View = 'menu' | 'company-info' | 'delivery-form' | 'delivery-list' | 'map';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);

  const handleDeliverySubmit = (delivery: DeliveryRecord) => {
    setDeliveries(prev => [delivery, ...prev]);
    setSelectedDelivery(delivery);
    setCurrentView('map');
  };

  const handleViewDeliveryMap = (delivery: DeliveryRecord) => {
    setSelectedDelivery(delivery);
    setCurrentView('map');
  };

  const renderView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <h1 className="mb-2">SwiftRoute Delivery</h1>
                <p className="text-gray-600">Optimized Delivery Route Management System</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Button
                  onClick={() => setCurrentView('company-info')}
                  className="h-32 flex flex-col gap-3"
                  variant="outline"
                >
                  <Building2 className="w-8 h-8" />
                  <div>
                    <div>Company Info</div>
                    <div className="text-gray-500">About our startup</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setCurrentView('delivery-form')}
                  className="h-32 flex flex-col gap-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Package className="w-8 h-8" />
                  <div>
                    <div>New Delivery</div>
                    <div className="text-blue-100">Enter delivery details</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setCurrentView('delivery-list')}
                  className="h-32 flex flex-col gap-3"
                  variant="outline"
                  disabled={deliveries.length === 0}
                >
                  <List className="w-8 h-8" />
                  <div>
                    <div>Delivery Records</div>
                    <div className="text-gray-500">{deliveries.length} deliveries</div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    if (deliveries.length > 0) {
                      setSelectedDelivery(deliveries[0]);
                      setCurrentView('map');
                    }
                  }}
                  className="h-32 flex flex-col gap-3"
                  variant="outline"
                  disabled={deliveries.length === 0}
                >
                  <Map className="w-8 h-8" />
                  <div>
                    <div>View Map</div>
                    <div className="text-gray-500">Latest route</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        );

      case 'company-info':
        return <CompanyInfo onBack={() => setCurrentView('menu')} />;

      case 'delivery-form':
        return (
          <DeliveryForm
            onBack={() => setCurrentView('menu')}
            onSubmit={handleDeliverySubmit}
          />
        );

      case 'delivery-list':
        return (
          <DeliveryList
            deliveries={deliveries}
            onBack={() => setCurrentView('menu')}
            onViewMap={handleViewDeliveryMap}
          />
        );

      case 'map':
        return (
          <MapView
            delivery={selectedDelivery}
            onBack={() => setCurrentView('menu')}
          />
        );

      default:
        return null;
    }
  };

  return renderView();
}
