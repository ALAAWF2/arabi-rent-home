
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Building } from 'lucide-react';

interface Booking {
  id: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  ownerId?: string;
  propertyTitle?: string;
  propertyLocation?: string;
}

const RenterDashboard: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!currentUser) return;

    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('renterId', '==', currentUser.uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      const bookingsData = await Promise.all(
        bookingsSnapshot.docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data();
          
          // Get property details
          const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
          const propertyData = propertyDoc.exists() ? propertyDoc.data() : null;

          return {
            id: bookingDoc.id,
            ...bookingData,
            startDate: bookingData.startDate.toDate(),
            endDate: bookingData.endDate.toDate(),
            timestamp: bookingData.timestamp.toDate(),
            propertyTitle: propertyData?.title || 'عقار غير معروف',
            propertyLocation: propertyData?.location || 'موقع غير معروف'
          } as Booking;
        })
      );

      // Sort by timestamp (newest first)
      bookingsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">معلق</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-600">مقبول</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">مرفوض</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في انتظار رد المالك';
      case 'accepted':
        return 'تم قبول طلبك! سيتم التواصل معك قريباً';
      case 'rejected':
        return 'تم رفض الطلب من قبل المالك';
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  if (userData?.role !== 'renter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            غير مصرح لك بالوصول
          </h1>
          <p className="text-gray-600">
            هذه الصفحة مخصصة للمستأجرين فقط
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المستأجر</h1>
          <p className="text-gray-600 mt-2">مرحباً {userData?.name}</p>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-primary ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-green-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">الطلبات المقبولة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'accepted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>طلبات الحجز</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600">لم ترسل أي طلبات حجز بعد</div>
                <p className="text-sm text-gray-500 mt-2">
                  تصفح العقارات المتاحة وأرسل طلب حجز
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{booking.propertyTitle}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 ml-2" />
                            <span className="text-sm">{booking.propertyLocation}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 ml-2" />
                            <span className="text-sm">
                              من {formatDate(booking.startDate)} إلى {formatDate(booking.endDate)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            تم الإرسال: {formatDate(booking.timestamp)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-2">
                            {getStatusMessage(booking.status)}
                          </div>
                          
                          {booking.message && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">رسالتك:</p>
                              <p className="text-sm text-gray-600">{booking.message}</p>
                            </div>
                          )}
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
};

export default RenterDashboard;
