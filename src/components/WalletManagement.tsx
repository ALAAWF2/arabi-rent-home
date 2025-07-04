
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  History,
  CreditCard
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const WalletManagement: React.FC = () => {
  const { userData } = useAuth();
  const { transactions, loading, rechargeWallet } = useWallet();
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'commission':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'recharge':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount < 0) return 'text-red-600';
    if (amount > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive"
      });
      return;
    }

    setRechargeLoading(true);
    try {
      await rechargeWallet(amount, `إعادة شحن المحفظة - ${formatCurrency(amount)}`);
      setRechargeAmount('');
      setShowRechargeDialog(false);
      toast({
        title: "تم بنجاح",
        description: `تم شحن المحفظة بمبلغ ${formatCurrency(amount)}`,
      });
      // Refresh page to update balance
      window.location.reload();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في عملية الشحن",
        variant: "destructive"
      });
    } finally {
      setRechargeLoading(false);
    }
  };

  const walletBalance = userData?.walletBalance || 0;
  const accountStatus = userData?.accountStatus || 'active';
  const isAccountSuspended = accountStatus === 'suspended';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">المحفظة المالية</h2>
        <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
          <DialogTrigger asChild>
            <Button disabled={isAccountSuspended}>
              <Plus className="w-4 h-4 ml-2" />
              شحن المحفظة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>شحن المحفظة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">المبلغ (ريال سوري)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="أدخل المبلغ"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>ملاحظة: يرجى التواصل مع إدارة الموقع لتأكيد الدفع بعد إدخال المبلغ.</p>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  onClick={handleRecharge}
                  disabled={rechargeLoading}
                  className="flex-1"
                >
                  {rechargeLoading ? 'جاري المعالجة...' : 'تأكيد الشحن'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRechargeDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Balance Card */}
      <Card className={isAccountSuspended ? 'border-red-200 bg-red-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 ml-2" />
            الرصيد الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(walletBalance)}
              </p>
              <div className="flex items-center mt-2">
                <Badge 
                  variant={isAccountSuspended ? "destructive" : "default"}
                  className="ml-2"
                >
                  {isAccountSuspended ? 'حساب معلق' : 'حساب نشط'}
                </Badge>
                {walletBalance < -50 && !isAccountSuspended && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    تحذير: رصيد منخفض
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">آخر معاملة</p>
              <p className="text-xs text-gray-500">
                {userData?.lastTransactionDate 
                  ? formatDate(new Date(userData.lastTransactionDate))
                  : 'لا توجد معاملات'
                }
              </p>
            </div>
          </div>

          {isAccountSuspended && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 ml-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">حساب معلق</h4>
                  <p className="text-sm text-red-700 mt-1">
                    تم إيقاف حسابك بسبب وصول الرصيد إلى الحد الأدنى (-100 ريال). 
                    يرجى شحن المحفظة لإعادة تفعيل الحساب واستكمال استخدام الخدمات.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات العمولة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">نسبة العمولة</p>
              <p className="text-gray-600">2.5% من قيمة كل حجز مؤكد</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">طريقة الخصم</p>
              <p className="text-gray-600">تلقائياً عند قبول طلب الحجز</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">حد إيقاف الحساب</p>
              <p className="text-gray-600">-100 ريال سوري</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">إعادة التفعيل</p>
              <p className="text-gray-600">عند شحن المحفظة لرصيد موجب</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 ml-2" />
            سجل المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">جاري التحميل...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">لا توجد معاملات حتى الآن</div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <div className="mr-3">
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        الرصيد: {formatCurrency(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManagement;
