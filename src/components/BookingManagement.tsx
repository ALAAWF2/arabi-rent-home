import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from '../hooks/use-toast';
import { Calendar, User, MessageCircle, AlertTriangle, Wallet } from 'lucide-react';

interface Booking {
  id: string;
  renterId: string;
  ownerId: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  renterName?: string;
  propertyTitle?: string;
  rentalAmount?: number;
}

const BookingManagement: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const { deductCommission, checkAccountStatus } = useWallet();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

 const fetchBookings = async () => {
  if (!currentUser || !userData) return;

  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('ownerId', '==', currentUser.uid)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    const bookingsData = await Promise.all(
      bookingsSnapshot.docs.map(async (bookingDoc) => {
        const bookingData = bookingDoc.data();

        const renterDoc = await getDoc(doc(db, 'users', bookingData.renterId));
        const renterName = renterDoc.exists() ? renterDoc.data().name : 'غير معروف';

        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
        const propertyData = propertyDoc.exists() ? propertyDoc.data() : null;
        const propertyTitle = propertyData?.title || 'عقار غير معروف';
        const rentalAmount = propertyData?.pricePerMonth || 0;

        return {
          id: bookingDoc.id,
          ...bookingData,
          startDate: bookingData.startDate.toDate(),
          endDate: bookingData.endDate.toDate(),
          timestamp: bookingData.timestamp.toDate(),
          renterName,
          propertyTitle,
          rentalAmount,
        } as Booking;
      })
    );

    bookingsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setBookings(bookingsData);
  } catch (error) {
    console.error('Error fetching bookings:', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBookings();
  }, [currentUser, userData]);

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'rejected') => {
    const booking = bookings.find(b => b.id === bookingId);

    if (action === 'accepted') {
      const isAccountActive = await checkAccountStatus();
      if (!isAccountActive || userData?.accountStatus === 'suspended') {
        toast({
          title: "حساب معلق",
          description: "لا يمكن قبول الحجوزات لأن حسابك معلق. يرجى شحن المحفظة أولاً.",
          variant: "destructive",
        });
        return;
      }

      if (booking && booking.rentalAmount) {
        setSelectedBooking(booking);
        setShowCommissionDialog(true);
        return;
      }
    }

    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: action });

      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: action } : b
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

  const confirmBookingAcceptance = async () => {
    if (!selectedBooking) return;

    try {
      if (selectedBooking.rentalAmount) {
        await deductCommission(
          selectedBooking.id, 
          selectedBooking.propertyId, 
          selectedBooking.rentalAmount
        );
      }

      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        status: 'accepted'
      });

      setBookings(bookings.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'accepted' } : b
      ));

      setShowCommissionDialog(false);
      setSelectedBooking(null);

      toast({
        title: "تم قبول الطلب",
        description: "تم خصم العمولة وقبول الحجز بنجاح",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error accepting booking:', error);
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

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">جاري التحميل...</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold text-gray-900">
  {userData?.role === 'owner' ? 'طلبات الحجز الواردة' : 'حجوزاتي السابقة'}
</h2>
            <div className="text-sm text-gray-600">
              عدد الطلبات: {bookings.length}
            </div>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-600">
                لا توجد طلبات حالياً
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
                          <span className="text-sm"><strong>من:</strong> {formatDate(booking.startDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-2 text-gray-500" />
                          <span className="text-sm"><strong>إلى:</strong> {formatDate(booking.endDate)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {booking.message && (
                          <div className="flex items-start">
                            <MessageCircle className="w-4 h-4 ml-2 mt-1 text-gray-500" />
                            <div>
                              <strong className="text-sm">رسالة:</strong>
                              <p className="text-sm text-gray-600 mt-1">{booking.message}</p>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          تم الإرسال: {formatDate(booking.timestamp)}
                        </div>
                      </div>
                    </div>

                 {booking.status === 'pending' && userData?.role === 'owner' && (
  <div className="flex space-x-2 space-x-reverse mt-4 pt-4 border-t">
    <Button onClick={() => handleBookingAction(booking.id, 'accepted')} size="sm" className="flex-1">قبول</Button>
    <Button onClick={() => handleBookingAction(booking.id, 'rejected')} variant="destructive" size="sm" className="flex-1">رفض</Button>
  </div>
)}

                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Wallet className="w-5 h-5 ml-2" /> تأكيد خصم العمولة
                </DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-blue-600 ml-2 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">تنبيه العمولة</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          سيتم خصم 2.5% من قيمة الإيجار عند قبول الحجز.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>قيمة الإيجار:</span>
                    <span>{selectedBooking.rentalAmount} ل.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العمولة:</span>
                    <span className="text-red-600">-{selectedBooking.rentalAmount * 0.025} ل.س</span>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button onClick={confirmBookingAcceptance} className="flex-1">تأكيد</Button>
                    <Button onClick={() => setShowCommissionDialog(false)} variant="outline" className="flex-1">إلغاء</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default BookingManagement;
