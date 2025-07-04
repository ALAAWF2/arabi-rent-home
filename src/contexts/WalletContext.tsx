
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface WalletTransaction {
  id: string;
  userId: string;
  type: 'commission' | 'payment' | 'recharge';
  amount: number;
  description: string;
  bookingId?: string;
  propertyId?: string;
  timestamp: Date;
  balanceAfter: number;
}

interface WalletContextType {
  transactions: WalletTransaction[];
  loading: boolean;
  deductCommission: (bookingId: string, propertyId: string, rentalAmount: number) => Promise<void>;
  rechargeWallet: (amount: number, description: string) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  checkAccountStatus: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const useWallet = () => {
  return useContext(WalletContext);
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!currentUser || userData?.role !== 'owner') return;

    setLoading(true);
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as WalletTransaction[];

      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deductCommission = async (bookingId: string, propertyId: string, rentalAmount: number) => {
    if (!currentUser || userData?.role !== 'owner') return;

    const commissionRate = 0.025; // 2.5%
    const commissionAmount = rentalAmount * commissionRate;
    const currentBalance = userData.walletBalance || 0;
    const newBalance = currentBalance - commissionAmount;

    try {
      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'commission',
        amount: -commissionAmount,
        description: `عمولة حجز - ${commissionRate * 100}% من ${rentalAmount} ريال`,
        bookingId,
        propertyId,
        timestamp: Timestamp.now(),
        balanceAfter: newBalance
      });

      // Update user balance
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: newBalance,
        lastTransactionDate: Timestamp.now(),
        // Suspend account if balance drops below -100
        ...(newBalance <= -100 && { accountStatus: 'suspended' })
      });

      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error deducting commission:', error);
      throw error;
    }
  };

  const rechargeWallet = async (amount: number, description: string) => {
    if (!currentUser || userData?.role !== 'owner') return;

    const currentBalance = userData.walletBalance || 0;
    const newBalance = currentBalance + amount;

    try {
      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'recharge',
        amount: amount,
        description: description,
        timestamp: Timestamp.now(),
        balanceAfter: newBalance
      });

      // Update user balance and reactivate account if needed
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: newBalance,
        lastTransactionDate: Timestamp.now(),
        // Reactivate account if balance is now positive
        ...(newBalance > 0 && { accountStatus: 'active' })
      });

      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error recharging wallet:', error);
      throw error;
    }
  };

  const checkAccountStatus = async (): Promise<boolean> => {
    if (!currentUser || userData?.role !== 'owner') return true;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.accountStatus === 'active';
      }
      return true;
    } catch (error) {
      console.error('Error checking account status:', error);
      return true;
    }
  };

  useEffect(() => {
    if (currentUser && userData?.role === 'owner') {
      fetchTransactions();
    }
  }, [currentUser, userData]);

  const value: WalletContextType = {
    transactions,
    loading,
    deductCommission,
    rechargeWallet,
    fetchTransactions,
    checkAccountStatus
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
