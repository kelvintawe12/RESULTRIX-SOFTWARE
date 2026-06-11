/**
 * Subscription Helper
 * Handles subscription creation separately from auth to avoid circular dependencies
 */

import { subscriptionService } from '../services/subscriptionService';

/**
 * Create subscription for a school after signup
 * Call this after successful signup to avoid blocking auth flow
 */
export async function createSubscriptionAfterSignup(schoolId: string, planId: string, trialDays: number = 14): Promise<void> {
  try {
    await subscriptionService.createSubscription(schoolId, planId, trialDays);
    console.log('Subscription created successfully for school:', schoolId);
  } catch (error) {
    console.error('Failed to create subscription after signup:', error);
    // Don't throw - subscription creation failure shouldn't break the signup flow
  }
}

/**
 * Initialize subscription for a school if they have a selected plan
 * This can be called from the signup success page or dashboard
 */
export async function initializeSubscriptionForSchool(schoolId: string, planId?: string): Promise<void> {
  if (!planId) {
    console.log('No plan selected, skipping subscription creation');
    return;
  }

  try {
    await createSubscriptionAfterSignup(schoolId, planId, 14);
  } catch (error) {
    console.error('Failed to initialize subscription:', error);
  }
}