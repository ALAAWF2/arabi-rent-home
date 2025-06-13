
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Bed, Calendar, Star } from 'lucide-react';

interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  pricePerDay: number;
  pricePerMonth: number;
  roomsCount: number;
  furnished: boolean;
  images: string[];
}

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY').format(price);
  };

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="property-card hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <CardContent className="p-0">
          <div className="relative">
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500">لا توجد صورة</div>
              )}
            </div>
            <div className="absolute top-3 right-3">
              {property.furnished && (
                <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  مفروش
                </Badge>
              )}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 ml-1" />
              <span className="text-sm">{property.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-3">
              <Bed className="w-4 h-4 ml-1" />
              <span className="text-sm">{property.roomsCount} غرف</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {property.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-primary">
                  {formatPrice(property.pricePerMonth)} ل.س
                </div>
                <div className="text-xs text-gray-500">شهرياً</div>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-700">
                  {formatPrice(property.pricePerDay)} ل.س
                </div>
                <div className="text-xs text-gray-500">يومياً</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
