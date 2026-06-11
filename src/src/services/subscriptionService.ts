/**
 * Subscription Service
 * Handles all subscription and billing operations including plan management,
 * subscription lifecycle, invoice generation, and payment processing.
 */

import { supabase } from '../lib/supabaseClient';

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: any[];
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  school_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  school_id: string;
  subscription_id: string | null;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  due_date: string;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStats {
  total_revenue: number;
  active_subscriptions: number;
  mrr: number;
  churn_rate: number;
}

class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      throw new Error(error.message || 'Failed to fetch subscription plans');
    }
  }

  /**
   * Get a specific subscription plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Plan not found');
      return data;
    } catch (error: any) {
      console.error('Error fetching subscription plan:', error);
      throw new Error(error.message || 'Failed to fetch subscription plan');
    }
  }

  /**
   * Create a new subscription for a school
   */
  async createSubscription(schoolId: string, planId: string, trialDays: number = 14): Promise<Subscription> {
    try {
      const plan = await this.getPlanById(planId);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          school_id: schoolId,
          plan_id: planId,
          status: 'trialing',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          cancel_at_period_end: false
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create subscription');

      // Create initial invoice
      await this.createInvoice(schoolId, data.id, plan.price, plan.currency, periodEnd);

      return data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(error.message || 'Failed to create subscription');
    }
  }

  /**
   * Get subscription for a school
   */
  async getSchoolSubscription(schoolId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error fetching school subscription:', error);
      throw new Error(error.message || 'Failed to fetch subscription');
    }
  }

  /**
   * Update subscription plan (upgrade/downgrade)
   */
  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    try {
      const newPlan = await this.getPlanById(newPlanId);
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update subscription');

      // Record the plan change in history
      await this.recordSubscriptionHistory(subscriptionId, 'plan_change', {
        old_plan_id: data.plan_id,
        new_plan_id: newPlanId,
        price: newPlan.price
      });

      // Create new invoice for the plan change
      await this.createInvoice(data.school_id, subscriptionId, newPlan.price, newPlan.currency, periodEnd);

      return data;
    } catch (error: any) {
      console.error('Error updating subscription plan:', error);
      throw new Error(error.message || 'Failed to update subscription plan');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    try {
      const updates: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      };

      if (!cancelAtPeriodEnd) {
        updates.status = 'canceled';
        updates.canceled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to cancel subscription');

      await this.recordSubscriptionHistory(subscriptionId, 'cancellation', {
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: updates.canceled_at
      });

      return data;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    schoolId: string,
    subscriptionId: string,
    amount: number,
    currency: string = 'USD',
    dueDate: Date
  ): Promise<Invoice> {
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          school_id: schoolId,
          subscription_id: subscriptionId,
          number: invoiceNumber,
          amount: amount,
          currency: currency,
          status: 'open',
          due_date: dueDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create invoice');

      return data;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      throw new Error(error.message || 'Failed to create invoice');
    }
  }

  /**
   * Get all invoices for a school
   */
  async getSchoolInvoices(schoolId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching school invoices:', error);
      throw new Error(error.message || 'Failed to fetch invoices');
    }
  }

  /**
   * Get all subscriptions (for admin)
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          schools (name, logo_path),
          subscription_plans:plan_id (name, price, interval)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all subscriptions:', error);
      throw new Error(error.message || 'Failed to fetch subscriptions');
    }
  }

  /**
   * Get all invoices (for admin)
   */
  async getAllInvoices(limit: number = 50): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          schools (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all invoices:', error);
      throw new Error(error.message || 'Failed to fetch invoices');
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_subscription_stats');
      
      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Fallback to manual calculation if RPC fails
      console.warn('RPC function failed, calculating stats manually');
      
      const [subscriptionsResult, invoicesResult] = await Promise.all([
        supabase.from('subscriptions').select('*'),
        supabase.from('invoices').select('*')
      ]);

      const subscriptions = subscriptionsResult.data || [];
      const invoices = invoicesResult.data || [];

      const activeSubs = subscriptions.filter(s => ['active', 'trialing'].includes(s.status));
      const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);

      // Calculate MRR
      const plans = await this.getPlans();
      const mrr = activeSubs.reduce((sum, s) => {
        const plan = plans.find(p => p.id === s.plan_id);
        const price = plan?.price || 0;
        return sum + (plan?.interval === 'year' ? price / 12 : price);
      }, 0);

      // Calculate churn rate
      const totalSubs = subscriptions.length;
      const cancelledSubs = subscriptions.filter(s => s.status === 'canceled').length;
      const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;

      return {
        total_revenue: totalRevenue,
        active_subscriptions: activeSubs.length,
        mrr,
        churn_rate: parseFloat(churnRate.toFixed(1))
      };
    } catch (error: any) {
      console.error('Error fetching subscription stats:', error);
      throw new Error(error.message || 'Failed to fetch subscription stats');
    }
  }

  /**
   * Record subscription history
   */
  private async recordSubscriptionHistory(
    subscriptionId: string,
    action: string,
    details: any
  ): Promise<void> {
    try {
      await supabase.from('subscription_history').insert({
        subscription_id: subscriptionId,
        action,
        details,
        performed_by: null // Can be updated to include user ID
      });
    } catch (error) {
      console.error('Error recording subscription history:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Process payment for an invoice
   */
  async processInvoicePayment(invoiceId: string, paymentMethod: string): Promise<Invoice> {
    try {
      const now = new Date().toISOString();

      // Update invoice status
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: now
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to process payment');

      // Record payment
      await supabase.from('subscription_payments').insert({
        invoice_id: invoiceId,
        amount: data.amount,
        currency: data.currency,
        payment_method: paymentMethod,
        transaction_id: `TXN-${Date.now()}`,
        status: 'completed'
      });

      // Update subscription if needed
      if (data.subscription_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', data.subscription_id);
      }

      return data;
    } catch (error: any) {
      console.error('Error processing invoice payment:', error);
      throw new Error(error.message || 'Failed to process payment');
    }
  }

  /**
   * Check and update subscription status based on payment
   */
  async checkSubscriptionStatus(): Promise<void> {
    try {
      const now = new Date();
      
      // Find subscriptions that need status updates
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .or('status.eq.trialing,status.eq.active');

      if (error) throw error;

      for (const sub of subscriptions || []) {
        const periodEnd = new Date(sub.current_period_end);
        
        // Check if trial has ended
        if (sub.status === 'trialing' && sub.trial_end) {
          const trialEnd = new Date(sub.trial_end);
          if (now > trialEnd) {
            await supabase
              .from('subscriptions')
              .update({ status: 'active' })
              .eq('id', sub.id);
          }
        }

        // Check if billing period has ended
        if (now > periodEnd) {
          if (sub.cancel_at_period_end) {
            await supabase
              .from('subscriptions')
              .update({ 
                status: 'canceled',
                canceled_at: now.toISOString()
              })
              .eq('id', sub.id);
          } else {
            // Renew subscription
            const newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await supabase
              .from('subscriptions')
              .update({
                current_period_start: now.toISOString(),
                current_period_end: newPeriodEnd.toISOString()
              })
              .eq('id', sub.id);
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      throw new Error(error.message || 'Failed to check subscription status');
    }
  }
}

export const subscriptionService = new SubscriptionService();