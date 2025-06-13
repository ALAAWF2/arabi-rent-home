
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Building, Calendar, Users } from 'lucide-react';
import PropertyForm from '../components/PropertyForm';
import BookingManagement from '../components/BookingManagement';
import PropertyManagement from '../components/PropertyManagement';

const LandlordDashboard: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        // Fetch properties count
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('ownerId', '==', currentUser.uid)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const totalProperties = propertiesSnapshot.size;

        // Fetch bookings for all properties
        const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);
        let totalBookings = 0;
        let pendingBookings = 0;

        if (propertyIds.length > 0) {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('propertyId', 'in', propertyIds)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          totalBookings = bookingsSnapshot.size;
          pendingBookings = bookingsSnapshot.docs.filter(
            doc => doc.data().status === 'pending'
          ).length;
        }

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المالك</h1>
            <p className="text-gray-600 mt-2">مرحباً {userData?.name}</p>
          </div>
          <Button onClick={() => setShowPropertyForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة عقار جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties">إدارة العقارات</TabsTrigger>
            <TabsTrigger value="bookings">إدارة الحجوزات</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <PropertyManagement />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>
        </Tabs>

        {/* Property Form Modal */}
        {showPropertyForm && (
          <PropertyForm
            onClose={() => setShowPropertyForm(false)}
            onSuccess={() => {
              setShowPropertyForm(false);
              window.location.reload(); // Refresh to update stats
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LandlordDashboard;
