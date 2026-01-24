import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { classificationService } from '../services/api';

const SubscriptionSuccessHandler: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [hasProcessed, setHasProcessed] = useState(false);
  const [previousPlan, setPreviousPlan] = useState<string | null>(null);

  // Store the current plan on component mount
  useEffect(() => {
    const storeCurrentPlan = async () => {
      if (user) {
        try {
          const usage = await classificationService.getCurrentUsage();
          setPreviousPlan(usage.usage.current_plan);
        } catch (error) {
          console.error('Could not store current plan:', error);
        }
      }
    };
    storeCurrentPlan();
  }, [user]);

  useEffect(() => {
    const handleSubscriptionSuccess = async () => {
      // Check URL parameters for success indicators
      const urlParams = new URLSearchParams(location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const sessionId = urlParams.get('session_id');

      // Only process if we have clear success indicators AND haven't processed this already
      const hasSuccessParams = paymentSuccess === 'true' || sessionId;
      
      if (hasSuccessParams && user && !hasProcessed) {
        console.log('🎉 Payment success detected, updating user data...');
        setHasProcessed(true);
        
        try {
          // Store the old plan before refreshing
          let oldPlan = previousPlan;
          if (!oldPlan) {
            try {
              const usage = await classificationService.getCurrentUsage();
              oldPlan = usage.usage.current_plan;
            } catch (error) {
              console.warn('Could not get current plan:', error);
            }
          }

          // Refresh user data
          await refreshUser();
          
          // Refresh plan features
          try {
            await classificationService.checkPlanFeatures();
          } catch (error) {
            console.warn('Could not refresh plan features:', error);
          }

          // Check if plan actually changed
          setTimeout(async () => {
            try {
              const newUsage = await classificationService.getCurrentUsage();
              const newPlan = newUsage.usage.current_plan.toLowerCase();
              const isFreePlan = newPlan === 'free' || newPlan === 'explorer';
              
              console.log('📊 Plan check - Old:', oldPlan, 'New:', newPlan);
              
              // Only show success if user is no longer on free plan
              if (!isFreePlan) {
                alert('🎉 Your subscription has been activated! You now have access to batch processing and higher limits.');
              } else {
                console.log('Plan has not updated yet - webhook might be pending');
                // You could show a different message here if needed
              }
            } catch (error) {
              console.error('Could not verify subscription status:', error);
            }
          }, 1500);

          // Remove success parameters from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
        } catch (error) {
          console.error('❌ Failed to update after payment:', error);
        }
      }
    };

    handleSubscriptionSuccess();
  }, [user, refreshUser, location, hasProcessed, previousPlan]);

  return null;
};

export default SubscriptionSuccessHandler;