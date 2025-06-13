
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'renter' as 'owner' | 'renter'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.name, formData.role, formData.phone);
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في منصة عقاري سوريا",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: "حدث خطأ، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>انضم إلى منصة عقاري سوريا</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">الاسم الكامل</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل بريدك الإلكتروني"
                required
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">رقم الهاتف</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="أدخل رقم هاتفك"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">كلمة المرور</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="أدخل كلمة المرور"
                required
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="أعد إدخال كلمة المرور"
                required
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3">نوع الحساب</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as 'owner' | 'renter' })}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="renter" id="renter" />
                  <Label htmlFor="renter">مستأجر - أبحث عن عقار</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner">مالك - أريد تأجير عقاري</Label>
                </div>
              </RadioGroup>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-primary hover:text-primary/80">
                سجل دخولك
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
