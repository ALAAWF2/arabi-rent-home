import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PropertyCard from '../components/PropertyCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Filter, ArrowRight } from 'lucide-react';

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
  timestamp: Date;
}

const PropertyListings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || 'all',
    rooms: searchParams.get('rooms') || 'all',
    furnished: 'all',
    priceRange: searchParams.get('price') || 'all'
  });

  const navigate = useNavigate();

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const baseQuery = query(collection(db, 'properties'), orderBy('timestamp', 'desc'));
      const conditions = [];

      if (filters.location !== 'all') {
        conditions.push(where('location', '==', filters.location));
      }

      if (filters.rooms !== 'all' && !isNaN(parseInt(filters.rooms))) {
        conditions.push(where('roomsCount', '==', parseInt(filters.rooms)));
      }

      if (filters.furnished !== 'all') {
        conditions.push(where('furnished', '==', filters.furnished === 'true'));
      }

      let q = baseQuery;
      for (const condition of conditions) {
        q = query(q, condition);
      }

      const snapshot = await getDocs(q);
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];

      let filteredProperties = propertiesData;
      if (filters.priceRange !== 'all') {
        const [minRaw, maxRaw] = filters.priceRange.split('-');
        const min = parseInt(minRaw);
        const max = maxRaw === '+' ? Infinity : parseInt(maxRaw);

        filteredProperties = propertiesData.filter(property => {
          const priceK = property.pricePerMonth / 1000;
          return priceK >= min && priceK <= max;
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

        {/* زر العودة للرئيسية */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="ghost"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => navigate('/')}
          >
            العودة للرئيسية
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">العقارات المتاحة</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
                <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المناطق</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
                <Select value={filters.rooms} onValueChange={(value) => setFilters({ ...filters, rooms: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="عدد الغرف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="1">غرفة</SelectItem>
                    <SelectItem value="2">غرفتان</SelectItem>
                    <SelectItem value="3">3 غرف</SelectItem>
                    <SelectItem value="4">4 غرف أو أكثر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأثاث</label>
                <Select value={filters.furnished} onValueChange={(value) => setFilters({ ...filters, furnished: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الأثاث" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="true">مفروش</SelectItem>
                    <SelectItem value="false">غير مفروش</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النطاق السعري (ألف شهرياً)</label>
                <Select value={filters.priceRange} onValueChange={(value) => setFilters({ ...filters, priceRange: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="السعر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
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

        {loading ? (
          <div className="text-center py-12 text-gray-600">جاري التحميل...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-gray-600">لا توجد عقارات تطابق الفلتر</div>
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
