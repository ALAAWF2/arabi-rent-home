
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Search, MapPin, Users, Shield, Star, Building, Home, Bed } from 'lucide-react';

const Homepage: React.FC = () => {
  const [searchData, setSearchData] = useState({
    location: '',
    rooms: '',
    priceRange: ''
  });
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.location) params.set('location', searchData.location);
    if (searchData.rooms) params.set('rooms', searchData.rooms);
    if (searchData.priceRange) params.set('price', searchData.priceRange);
    
    navigate(`/properties?${params.toString()}`);
  };

  const features = [
    {
      icon: Shield,
      title: 'آمان وموثوقية',
      description: 'جميع العقارات محققة والمالكين موثقين'
    },
    {
      icon: Search,
      title: 'بحث متقدم',
      description: 'اعثر على العقار المناسب بسهولة'
    },
    {
      icon: Users,
      title: 'خدمة عملاء 24/7',
      description: 'فريق دعم متاح لمساعدتك في أي وقت'
    }
  ];

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              اعثر على بيتك المثالي في سوريا
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              منصة عقارية شاملة للإيجار اليومي والشهري في جميع أنحاء سوريا
            </p>
          </div>

          {/* Search Box */}
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموقع
                  </label>
                  <Select onValueChange={(value) => setSearchData({ ...searchData, location: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select onValueChange={(value) => setSearchData({ ...searchData, rooms: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="عدد الغرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">غرفة واحدة</SelectItem>
                      <SelectItem value="2">غرفتان</SelectItem>
                      <SelectItem value="3">3 غرف</SelectItem>
                      <SelectItem value="4">4 غرف أو أكثر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النطاق السعري
                  </label>
                  <Select onValueChange={(value) => setSearchData({ ...searchData, priceRange: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="السعر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-50">أقل من 50 ألف</SelectItem>
                      <SelectItem value="50-100">50-100 ألف</SelectItem>
                      <SelectItem value="100-200">100-200 ألف</SelectItem>
                      <SelectItem value="200+">أكثر من 200 ألف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="w-4 h-4 ml-2" />
                    ابحث
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">عقار متاح</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">عميل راضٍ</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-gray-600">مدينة مغطاة</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              لماذا تختار عقاري سوريا؟
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              نقدم لك تجربة مميزة في البحث عن العقار المناسب بأفضل الأسعار وأعلى معايير الجودة
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              أنواع العقارات المتاحة
            </h2>
            <p className="text-gray-600">استكشف مجموعة متنوعة من العقارات</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Building className="w-16 h-16 text-blue-600" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">شقق كاملة</h3>
                  <p className="text-gray-600">شقق مفروشة وغير مفروشة للإيجار الشهري</p>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <Bed className="w-16 h-16 text-green-600" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">غرف فردية</h3>
                  <p className="text-gray-600">غرف للإيجار اليومي والأسبوعي</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">هل تريد تأجير عقارك؟</h2>
          <p className="text-xl mb-8 opacity-90">
            انضم إلى آلاف الملاك الذين يحققون دخلاً من عقاراتهم معنا
          </p>
          <Button variant="secondary" size="lg" onClick={() => navigate('/register')}>
            ابدأ كمالك عقار
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
