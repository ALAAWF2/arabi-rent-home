import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { WalletProvider } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Plus, Building, Calendar, Users, Wallet, AlertTriangle } from 'lucide-react';
import PropertyForm from '../components/PropertyForm';
import BookingManagement from '../components/BookingManagement';
import PropertyManagement from '../components/PropertyManagement';
import WalletManagement from '../components/WalletManagement';

const LandlordDashboard: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0
  });

  const isAccountSuspended = userData?.accountStatus === 'suspended';
  const walletBalance = userData?.walletBalance || 0;

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        const propertiesSnapshot = await getDocs(
          query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid))
        );
        const bookingsSnapshot = await getDocs(
          query(collection(db, 'bookings'), where('ownerId', '==', currentUser.uid))
        );

        const totalProperties = propertiesSnapshot.size;
        const totalBookings = bookingsSnapshot.size;
        const pendingBookings = bookingsSnapshot.docs.filter(
          doc => doc.data().status === 'pending'
        ).length;

        setStats({ totalProperties, totalBookings, pendingBookings });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [currentUser]);

  if (userData?.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            غير مصرح لك بالوصول
          </h1>
          <p className="text-gray-600">
            هذه الصفحة مخصصة لملاك العقارات فقط
          </p>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المالك</h1>
              <div className="flex items-center mt-2">
                <p className="text-gray-600">مرحباً {userData?.name}</p>
                {isAccountSuspended && (
                  <Badge variant="destructive" className="mr-2">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    حساب معلق
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setShowPropertyForm(true)}
              disabled={isAccountSuspended}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة عقار جديد
            </Button>
          </div>

          {/* تحذير الحساب المعلق */}
          {isAccountSuspended && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 ml-2 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">حساب معلق</h3>
                  <p className="text-sm text-red-700 mt-1">
                    تم إيقاف حسابك بسبب وصول رصيد المحفظة إلى الحد الأدنى. 
                    يرجى شحن المحفظة من تبويب "المحفظة" لإعادة تفعيل الحساب وإضافة عقارات جديدة.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="w-8 h-8 text-primary ml-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي العقارات</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-600 ml-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الحجوزات</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-orange-600 ml-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">طلبات معلقة</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isAccountSuspended ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Wallet className="w-8 h-8 text-blue-600 ml-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">رصيد المحفظة</p>
                    <p className={`text-2xl font-bold ${walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {new Intl.NumberFormat('ar-SY', {
                        style: 'currency',
                        currency: 'SYP',
                        minimumFractionDigits: 0
                      }).format(walletBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="properties" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="properties">إدارة العقارات</TabsTrigger>
              <TabsTrigger value="bookings">إدارة الحجوزات</TabsTrigger>
              <TabsTrigger value="wallet">المحفظة</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <PropertyManagement />
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManagement />
            </TabsContent>

            <TabsContent value="wallet">
              <WalletManagement />
            </TabsContent>
          </Tabs>

          {showPropertyForm && (
            <PropertyForm
              onClose={() => setShowPropertyForm(false)}
              onSuccess={() => {
                setShowPropertyForm(false);
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </WalletProvider>
  );
};

export default LandlordDashboard;
