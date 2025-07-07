
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { X, Upload, AlertTriangle } from 'lucide-react';

interface Property {
  id?: string;
  ownerId?: string;
  title: string;
  description: string;
  location: string;
  pricePerDay: number;
  pricePerMonth: number;
  roomsCount: number;
  furnished: boolean;
  images: string[];
}

interface PropertyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  property?: Property;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onClose, onSuccess, property }) => {
  const { currentUser, userData } = useAuth();
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    location: property?.location || '',
    pricePerDay: property ? String(property.pricePerDay) : '',
    pricePerMonth: property ? String(property.pricePerMonth) : '',
    roomsCount: property ? String(property.roomsCount) : '',
    furnished: property?.furnished || false
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const locations = [
    'دمشق - المزة',
    'دمشق - المالكي',
    'دمشق - أبو رمانة',
    'حلب - الفرقان',
    'حلب - الصاخور',
    'حمص - الوعر',
    'اللاذقية - الكورنيش'
  ];

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        location: property.location,
        pricePerDay: String(property.pricePerDay),
        pricePerMonth: String(property.pricePerMonth),
        roomsCount: String(property.roomsCount),
        furnished: property.furnished
      });
    }
  }, [property]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setImages(fileList);
    }
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const imageRef = ref(storage, `properties/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      uploadedUrls.push(downloadUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    // Check if account is suspended
    if (userData?.accountStatus === 'suspended') {
      toast({
        title: "حساب معلق",
        description: "لا يمكن إضافة عقارات جديدة لأن حسابك معلق. يرجى شحن المحفظة أولاً.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const imageUrls = images.length > 0 ? await uploadImages() : [];

      if (property) {
        // Update existing property
        const updatedData: Partial<Property> = {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          pricePerDay: parseInt(formData.pricePerDay),
          pricePerMonth: parseInt(formData.pricePerMonth),
          roomsCount: parseInt(formData.roomsCount),
          furnished: formData.furnished,
        };

        if (imageUrls.length > 0) {
          updatedData.images = imageUrls;
        }

        await updateDoc(doc(db, 'properties', property.id as string), updatedData);

        toast({
          title: 'تم التعديل بنجاح',
          description: 'تم تحديث بيانات العقار',
        });
      } else {
        // Create property document
        await addDoc(collection(db, 'properties'), {
          ownerId: currentUser.uid,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          pricePerDay: parseInt(formData.pricePerDay),
          pricePerMonth: parseInt(formData.pricePerMonth),
          roomsCount: parseInt(formData.roomsCount),
          furnished: formData.furnished,
          images: imageUrls,
          timestamp: new Date(),
        });

        toast({
          title: 'تم إضافة العقار بنجاح',
          description: 'العقار متاح الآن للحجز',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ العقار',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{property ? 'تعديل العقار' : 'إضافة عقار جديد'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>عنوان العقار</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: شقة مفروشة في دمشق"
                required
              />
            </div>

            <div>
              <Label>الموقع</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السعر اليومي (ل.س)</Label>
                <Input
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>
              <div>
                <Label>السعر الشهري (ل.س)</Label>
                <Input
                  type="number"
                  value={formData.pricePerMonth}
                  onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                  placeholder="120000"
                  required
                />
              </div>
            </div>

            <div>
              <Label>عدد الغرف</Label>
              <Select
                value={formData.roomsCount}
                onValueChange={(value) => setFormData({ ...formData, roomsCount: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر عدد الغرف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">غرفة واحدة</SelectItem>
                  <SelectItem value="2">غرفتان</SelectItem>
                  <SelectItem value="3">3 غرف</SelectItem>
                  <SelectItem value="4">4 غرف</SelectItem>
                  <SelectItem value="5">5 غرف أو أكثر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="furnished"
                checked={formData.furnished}
                onCheckedChange={(checked) => setFormData({ ...formData, furnished: checked })}
              />
              <Label htmlFor="furnished">مفروش</Label>
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مفصل للعقار..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label>صور العقار</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                يمكنك اختيار عدة صور (اختياري)
              </p>
            </div>

            <div className="flex space-x-2 space-x-reverse">
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? 'جاري الحفظ...' : property ? 'حفظ التعديل' : 'حفظ العقار'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyForm;
