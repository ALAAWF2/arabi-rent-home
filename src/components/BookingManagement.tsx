
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from '../hooks/use-toast';
import { Calendar, User, MapPin, MessageCircle, AlertTriangle, Wallet } from 'lucide-react';

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
    if (!currentUser) return;

    try {
      const propertiesSnapshot = await getDocs(
        query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid))
      );
      const propertiesMap = new Map(
        propertiesSnapshot.docs.map(doc => [doc.id, doc.data()])
      );

      const bookingsSnapshot = await getDocs(
        query(collection(db, 'bookings'), where('ownerId', '==', currentUser.uid))
      );

      const bookingsData = await Promise.all(
        bookingsSnapshot.docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data();

          const renterDoc = await getDoc(doc(db, 'users', bookingData.renterId));
          const renterName = renterDoc.exists() ? renterDoc.data().name : 'غير معروف';

          const propertyData = propertiesMap.get(bookingData.propertyId);
          const rentalAmount = propertyData?.pricePerMonth || 0;

          return {
            id: bookingDoc.id,
            ...bookingData,
            startDate: bookingData.startDate.toDate(),
            endDate: bookingData.endDate.toDate(),
            timestamp: bookingData.timestamp.toDate(),
            renterName,
            propertyTitle: propertyData?.title || 'عقار غير معروف',
            rentalAmount
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

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'rejected') => {
    const booking = bookings.find(b => b.id === bookingId);
    
    // Check account status before accepting bookings
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

    // For rejection or if no commission needed
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

  const confirmBookingAcceptance = async () => {
    if (!selectedBooking) return;

    try {
      // Deduct commission first
      if (selectedBooking.rentalAmount) {
        await deductCommission(
          selectedBooking.id, 
          selectedBooking.propertyId, 
          selectedBooking.rentalAmount
        );
      }

      // Update booking status
      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        status: 'accepted'
      });

      setBookings(bookings.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, status: 'accepted' }
          : booking
      ));

      setShowCommissionDialog(false);
      setSelectedBooking(null);

      toast({
        title: "تم قبول الطلب",
        description: "تم خصم العمولة وقبول الحجز بنجاح",
      });

      // Refresh page to update wallet balance
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

      {/* Commission Confirmation Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wallet className="w-5 h-5 ml-2" />
              تأكيد خصم العمولة
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
                      عند قبول هذا الحجز، سيتم خصم عمولة 2.5% من قيمة الإيجار من محفظتك.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">قيمة الإيجار:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('ar-SY', {
                      style: 'currency',
                      currency: 'SYP',
                      minimumFractionDigits: 0
                    }).format(selectedBooking.rentalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">العمولة (2.5%):</span>
                  <span className="font-semibold text-red-600">
                    -{new Intl.NumberFormat('ar-SY', {
                      style: 'currency',
                      currency: 'SYP',
                      minimumFractionDigits: 0
                    }).format((selectedBooking.rentalAmount || 0) * 0.025)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رصيدك الحالي:</span>
                  <span className={`font-semibold ${(userData?.walletBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {new Intl.NumberFormat('ar-SY', {
                      style: 'currency',
                      currency: 'SYP',
                      minimumFractionDigits: 0
                    }).format(userData?.walletBalance || 0)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="font-semibold">الرصيد بعد الخصم:</span>
                  <span className={`font-bold ${
                    ((userData?.walletBalance || 0) - (selectedBooking.rentalAmount || 0) * 0.025) < 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {new Intl.NumberFormat('ar-SY', {
                      style: 'currency',
                      currency: 'SYP',
                      minimumFractionDigits: 0
                    }).format((userData?.walletBalance || 0) - (selectedBooking.rentalAmount || 0) * 0.025)}
                  </span>
                </div>
              </div>

              {((userData?.walletBalance || 0) - (selectedBooking.rentalAmount || 0) * 0.025) <= -100 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 ml-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">تحذير!</h4>
                      <p className="text-sm text-red-700 mt-1">
                        قبول هذا الحجز سيؤدي إلى إيقاف حسابك لأن الرصيد سيصل إلى الحد الأدنى (-100 ريال). 
                        ستحتاج لشحن المحفظة لإعادة تفعيل الحساب.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  onClick={confirmBookingAcceptance}
                  className="flex-1"
                >
                  تأكيد وقبول الحجز
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommissionDialog(false);
                    setSelectedBooking(null);
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagement;
