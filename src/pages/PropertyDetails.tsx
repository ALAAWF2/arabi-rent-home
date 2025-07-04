
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import { MapPin, Bed, Calendar, Star, Phone, MessageCircle, ArrowRight } from 'lucide-react';

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

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          setProperty({ id: propertyDoc.id, ...propertyDoc.data() } as Property);
        } else {
          toast({
            title: "خطأ",
            description: "العقار غير موجود",
            variant: "destructive",
          });
          navigate('/properties');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات العقار",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleBookingRequest = async () => {
    if (!currentUser) {
      toast({
        title: "مطلوب تسجيل الدخول",
        description: "يجب تسجيل الدخول لإرسال طلب حجز",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (userData?.role !== 'renter') {
      toast({
        title: "غير مسموح",
        description: "هذه الخدمة متاحة للمستأجرين فقط",
        variant: "destructive",
      });
      return;
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (!property) return;

      await addDoc(collection(db, 'bookings'), {
        renterId: currentUser.uid,
        ownerId: property.ownerId,
        propertyId: id,
        startDate: new Date(bookingData.startDate),
        endDate: new Date(bookingData.endDate),
        message: bookingData.message,
        status: 'pending',
        timestamp: new Date()
      });

      toast({
        title: "تم إرسال الطلب",
        description: "سيتم التواصل معك قريباً من قبل المالك",
      });

      setBookingData({ startDate: '', endDate: '', message: '' });
    } catch (error) {
      console.error('Error submitting booking request:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال طلب الحجز",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">العقار غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/properties')}
          className="mb-6 flex items-center space-x-2 space-x-reverse"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للعقارات</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {/* Image Gallery */}
                <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
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

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {property.title}
                      </h1>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-5 h-5 ml-1" />
                        <span>{property.location}</span>
                      </div>
                    </div>
                    {property.furnished && (
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        مفروش
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 space-x-reverse mb-6">
                    <div className="flex items-center text-gray-600">
                      <Bed className="w-5 h-5 ml-1" />
                      <span>{property.roomsCount} غرف</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">وصف العقار</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {property.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3">الأسعار</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(property.pricePerDay)} ل.س
                        </div>
                        <div className="text-gray-600">يومياً</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(property.pricePerMonth)} ل.س
                        </div>
                        <div className="text-gray-600">شهرياً</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>طلب حجز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ البداية
                  </label>
                  <Input
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ النهاية
                  </label>
                  <Input
                    type="date"
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                    min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رسالة للمالك (اختيارية)
                  </label>
                  <Textarea
                    value={bookingData.message}
                    onChange={(e) => setBookingData({ ...bookingData, message: e.target.value })}
                    placeholder="أضف أي ملاحظات أو استفسارات..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleBookingRequest}
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                </Button>
                
                {!currentUser && (
                  <p className="text-sm text-gray-600 text-center">
                    يجب <span className="text-primary cursor-pointer" onClick={() => navigate('/login')}>تسجيل الدخول</span> لإرسال طلب حجز
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
