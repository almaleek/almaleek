export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile_no: string;
  isVerified: boolean;
  balance: number;
  bonus: number;
  referralCode: string;
  pinStatus: boolean;
  account?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    virtualAccountId: string;
  };
}
