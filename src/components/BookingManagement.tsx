
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { Calendar, User, MapPin, MessageCircle } from 'lucide-react';

interface Booking {
  id: string;
  renterId: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  renterName?: string;
  propertyTitle?: string;
}

const BookingManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!currentUser) return;

    try {
      // First, get all properties owned by current user
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('ownerId', '==', currentUser.uid)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);
      const propertiesMap = new Map(
        propertiesSnapshot.docs.map(doc => [doc.id, doc.data().title])
      );

      if (propertyIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get all bookings for these properties
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('propertyId', 'in', propertyIds)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      const bookingsData = await Promise.all(
        bookingsSnapshot.docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data();
          
          // Get renter name
          const renterDoc = await getDoc(doc(db, 'users', bookingData.renterId));
          const renterName = renterDoc.exists() ? renterDoc.data().name : 'غير معروف';

          return {
            id: bookingDoc.id,
            ...bookingData,
            startDate: bookingData.startDate.toDate(),
            endDate: bookingData.endDate.toDate(),
            timestamp: bookingData.timestamp.toDate(),
            renterName,
            propertyTitle: propertiesMap.get(bookingData.propertyId) || 'عقار غير معروف'
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

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: action
      });

      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: action }
          : booking
      ));

      toast({
        title: action === 'accepted' ? "تم قبول الطلب" : "تم رفض الطلب",
        description: action === 'accepted' 
          ? "سيتم إشعار المستأجر بقبول طلبه" 
          : "سيتم إشعار المستأجر برفض طلبه",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في معالجة الطلب",
        variant: "destructive",
      });
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

  useEffect(() => {
    fetchBookings();
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
        <h2 className="text-2xl font-bold text-gray-900">طلبات الحجز</h2>
        <div className="text-sm text-gray-600">
          إجمالي الطلبات: {bookings.length}
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">
              لا توجد طلبات حجز حتى الآن
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{booking.propertyTitle}</CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 ml-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>المستأجر:</strong> {booking.renterName}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>من:</strong> {formatDate(booking.startDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>إلى:</strong> {formatDate(booking.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {booking.message && (
                      <div>
                        <div className="flex items-start">
                          <MessageCircle className="w-4 h-4 ml-2 mt-1 text-gray-500" />
                          <div>
                            <strong className="text-sm">رسالة المستأجر:</strong>
                            <p className="text-sm text-gray-600 mt-1">{booking.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      تم الإرسال: {formatDate(booking.timestamp)}
                    </div>
                  </div>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex space-x-2 space-x-reverse mt-4 pt-4 border-t">
                    <Button
                      onClick={() => handleBookingAction(booking.id, 'accepted')}
                      size="sm"
                      className="flex-1"
                    >
                      قبول الطلب
                    </Button>
                    <Button
                      onClick={() => handleBookingAction(booking.id, 'rejected')}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      رفض الطلب
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
