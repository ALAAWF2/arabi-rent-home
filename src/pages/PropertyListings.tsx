
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PropertyCard from '../components/PropertyCard';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Search, Filter } from 'lucide-react';

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
  timestamp: any;
}

const PropertyListings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    rooms: searchParams.get('rooms') || '',
    furnished: '',
    priceRange: searchParams.get('price') || ''
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'properties'), orderBy('timestamp', 'desc'));
      
      // Apply filters
      if (filters.location) {
        q = query(q, where('location', '>=', filters.location), where('location', '<=', filters.location + '\uf8ff'));
      }
      if (filters.rooms) {
        q = query(q, where('roomsCount', '==', parseInt(filters.rooms)));
      }
      if (filters.furnished !== '') {
        q = query(q, where('furnished', '==', filters.furnished === 'true'));
      }

      const snapshot = await getDocs(q);
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];

      // Client-side price filtering
      let filteredProperties = propertiesData;
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
        filteredProperties = propertiesData.filter(property => {
          const monthlyPrice = property.pricePerMonth / 1000; // Convert to thousands
          return monthlyPrice >= min && (max === Infinity || monthlyPrice <= max);
        });
      }

      setProperties(filteredProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const locations = [
    'دمشق - المزة',
    'دمشق - المالكي',
    'دمشق - أبو رمانة',
    'حلب - الفرقان',
    'حلب - الصاخور',
    'حمص - الوعر',
    'اللاذقية - الكورنيش'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">العقارات المتاحة</h1>
          
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموقع
                  </label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => setFilters({ ...filters, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع المناطق</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عدد الغرف
                  </label>
                  <Select
                    value={filters.rooms}
                    onValueChange={(value) => setFilters({ ...filters, rooms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="عدد الغرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الغرف</SelectItem>
                      <SelectItem value="1">غرفة واحدة</SelectItem>
                      <SelectItem value="2">غرفتان</SelectItem>
                      <SelectItem value="3">3 غرف</SelectItem>
                      <SelectItem value="4">4 غرف أو أكثر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأثاث
                  </label>
                  <Select
                    value={filters.furnished}
                    onValueChange={(value) => setFilters({ ...filters, furnished: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نوع الأثاث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      <SelectItem value="true">مفروش</SelectItem>
                      <SelectItem value="false">غير مفروش</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النطاق السعري (ألف شهرياً)
                  </label>
                  <Select
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="السعر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الأسعار</SelectItem>
                      <SelectItem value="0-50">أقل من 50 ألف</SelectItem>
                      <SelectItem value="50-100">50-100 ألف</SelectItem>
                      <SelectItem value="100-200">100-200 ألف</SelectItem>
                      <SelectItem value="200+">أكثر من 200 ألف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchProperties} className="w-full">
                    <Filter className="w-4 h-4 ml-2" />
                    تطبيق الفلتر
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">جاري التحميل...</div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600">لا توجد عقارات تطابق معايير البحث</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyListings;
