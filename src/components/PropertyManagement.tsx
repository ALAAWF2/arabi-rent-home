
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { MapPin, Bed, Trash2, Edit } from 'lucide-react';
import PropertyForm from './PropertyForm';

interface Property {
  id: string;
  title: string;
  location: string;
  pricePerMonth: number;
  roomsCount: number;
  furnished: boolean;
  images: string[];
}

const PropertyManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const fetchProperties = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'properties'),
        where('ownerId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) return;

    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      setProperties(properties.filter(p => p.id !== propertyId));
      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار بنجاح",
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف العقار",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY').format(price);
  };

  useEffect(() => {
    fetchProperties();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">عقاراتي</h2>
        <div className="text-sm text-gray-600">
          إجمالي العقارات: {properties.length}
        </div>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">
              لم تقم بإضافة أي عقارات بعد
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
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
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 ml-1" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <Bed className="w-4 h-4 ml-1" />
                    <span className="text-sm">{property.roomsCount} غرف</span>
                    {property.furnished && (
                      <Badge variant="secondary" className="mr-2">
                        مفروش
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-primary">
                      {formatPrice(property.pricePerMonth)} ل.س
                    </div>
                    <div className="text-xs text-gray-500">شهرياً</div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingProperty(property)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {editingProperty && (
        <PropertyForm
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSuccess={() => {
            setEditingProperty(null);
            fetchProperties();
          }}
        />
      )}
    </div>
  );
};

export default PropertyManagement;
