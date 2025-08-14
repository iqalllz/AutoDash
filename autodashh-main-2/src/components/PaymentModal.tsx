import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, QrCode, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  amount, 
  currency = 'IDR' 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: 'gopay',
      name: 'GoPay',
      description: 'Pay with your GoPay wallet',
      icon: Smartphone,
      color: 'bg-green-500',
    },
    {
      id: 'qris',
      name: 'QRIS',
      description: 'Scan QR code to pay',
      icon: QrCode,
      color: 'bg-blue-500',
    },
    {
      id: 'shopee',
      name: 'ShopeePay',
      description: 'Pay with ShopeePay',
      icon: ShoppingCart,
      color: 'bg-orange-500',
    },
    {
      id: 'stripe',
      name: 'Credit Card',
      description: 'International payment via Stripe',
      icon: CreditCard,
      color: 'bg-purple-500',
    },
  ];

  const handlePayment = async (method: string) => {
    setLoading(true);
    setSelectedMethod(method);

    try {
      // Record payment in database
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please login to make a payment');
        return;
      }

      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.user.id,
          payment_method: method,
          amount: amount,
          currency: currency,
          status: 'pending',
        });

      if (insertError) {
        toast.error('Failed to initialize payment');
        return;
      }

      // Simulate payment processing for demo
      setTimeout(() => {
        if (method === 'stripe') {
          // For Stripe, you would typically redirect to Stripe Checkout
          toast.success('Redirecting to Stripe payment...');
          // window.open('stripe-checkout-url', '_blank');
        } else {
          // For local payment methods, show success
          toast.success(`Payment initiated via ${paymentMethods.find(p => p.id === method)?.name}`);
        }
        
        setLoading(false);
        setSelectedMethod(null);
        onClose();
      }, 2000);

    } catch (error) {
      toast.error('Payment failed');
      setLoading(false);
      setSelectedMethod(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Complete your payment of {formatCurrency(amount, currency)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            const isSelected = selectedMethod === method.id;
            const isLoading = loading && isSelected;
            
            return (
              <Card 
                key={method.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => !loading && handlePayment(method.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${method.color} text-white`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {method.description}
                      </CardDescription>
                    </div>
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Secure payment powered by multiple providers
          </div>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
