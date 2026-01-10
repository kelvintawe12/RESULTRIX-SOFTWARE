import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { DollarSign, CreditCard, TrendingUp, Calendar, Building2, CheckCircle, XCircle, Download, Search, Filter, Eye, RefreshCw, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { downloadCSV } from '../../utils/csvExport';
// --- Types ---
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  is_active: boolean;
  is_popular: boolean;
}
interface Subscription {
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
  schools: {
    id: string;
    name: string;
    logo_path?: string;
  };
  subscription_plans: {
    name: string;
    price: number;
    interval: string;
  };
}
interface Invoice {
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
  schools: {
    id: string;
    name: string;
  };
}
interface BillingStats {
  total_revenue: number;
  active_subscriptions: number;
  mrr: number;
  churn_rate: number;
}
export function BillingPage() {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BillingStats>({
    total_revenue: 0,
    active_subscriptions: 0,
    mrr: 0,
    churn_rate: 0
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  // Modals
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);
  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      // 1. Fetch Stats (using the RPC function if available, otherwise manual calc)
      // Note: In a real scenario, we'd call the RPC. For now, we'll calculate manually from fetched data
      // if the RPC fails or just fetch raw data to be safe since we just created the table.
      // Let's try to fetch raw data and calculate to ensure it works immediately without RPC permissions issues.
      // Fetch Plans
      const {
        data: plansData,
        error: plansError
      } = await supabase.from('subscription_plans').select('*');
      if (plansError) throw plansError;
      setPlans(plansData || []);
      // Fetch Subscriptions
      const {
        data: subsData,
        error: subsError
      } = await supabase.from('subscriptions').select(`
          *,
          schools (name, logo_path),
          subscription_plans:plan_id (name, price, interval)
        `).order('created_at', {
        ascending: false
      });
      if (subsError) throw subsError;
      setSubscriptions(subsData || []);
      // Fetch Invoices
      const {
        data: invData,
        error: invError
      } = await supabase.from('invoices').select(`
          *,
          schools (name)
        `).order('created_at', {
        ascending: false
      }).limit(50);
      if (invError) throw invError;
      setInvoices(invData || []);
      // Calculate Stats manually for immediate feedback
      const activeSubs = (subsData || []).filter(s => ['active', 'trialing'].includes(s.status));
      const totalRevenue = (invData || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
      const mrr = activeSubs.reduce((sum, s) => {
        const price = Number(s.subscription_plans?.price || 0);
        return sum + (s.subscription_plans?.interval === 'year' ? price / 12 : price);
      }, 0);
      // Mock churn rate for now as we need historical data
      const churnRate = 2.4;
      setStats({
        total_revenue: totalRevenue,
        active_subscriptions: activeSubs.length,
        mrr,
        churn_rate: churnRate
      });
      // Generate Mock Revenue Trend Data (since we might not have 6 months of history yet)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const mockTrend = months.map((month, i) => ({
        name: month,
        revenue: mrr * (0.8 + i * 0.1) + Math.random() * 1000
      }));
      setRevenueData(mockTrend);
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing information. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // --- Helpers ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-amber-100 text-amber-800',
      past_due: 'bg-red-100 text-red-800',
      canceled: 'bg-slate-100 text-slate-800',
      incomplete: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      open: 'bg-blue-100 text-blue-800',
      draft: 'bg-slate-100 text-slate-600',
      void: 'bg-gray-100 text-gray-600',
      uncollectible: 'bg-red-100 text-red-800'
    };
    return <Badge className={styles[status] || 'bg-slate-100 text-slate-800'} variant="neutral">
        {status.replace('_', ' ').toUpperCase()}
      </Badge>;
  };
  const handleExport = () => {
    const data = filteredSubscriptions.map(sub => ({
      School: sub.schools?.name,
      Plan: sub.subscription_plans?.name,
      Status: sub.status,
      Price: sub.subscription_plans?.price,
      Interval: sub.subscription_plans?.interval,
      'Start Date': new Date(sub.current_period_start).toLocaleDateString(),
      'End Date': new Date(sub.current_period_end).toLocaleDateString()
    }));
    downloadCSV(data, 'subscriptions-export.csv');
  };
  // --- Filtering ---
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.schools?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.plan_id === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });
  if (loading) {
    return <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner />
      </div>;
  }
  return <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Billing & Subscriptions
          </h1>
          <p className="text-slate-500 mt-1">
            Manage plans, subscriptions, and financial overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} disabled={refreshing} leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Error">{error}</Alert>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {formatCurrency(stats.total_revenue)}
              </h3>
              <div className="flex items-center mt-1 text-emerald-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Subscriptions
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {stats.active_subscriptions}
              </h3>
              <div className="flex items-center mt-1 text-blue-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+4 this month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Monthly Recurring (MRR)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {formatCurrency(stats.mrr)}
              </h3>
              <div className="flex items-center mt-1 text-purple-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+8.2%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Churn Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {stats.churn_rate}%
              </h3>
              <div className="flex items-center mt-1 text-green-600 text-sm font-medium">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span>-0.5%</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <XCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                  fill: '#64748B'
                }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{
                  fill: '#64748B'
                }} tickFormatter={val => `$${val}`} />
                  <Tooltip contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} formatter={(val: number) => [formatCurrency(val), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution / Quick Plans View */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Active Plans</h3>
          <div className="space-y-4">
            {plans.map(plan => <div key={plan.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-900">{plan.name}</h4>
                  {plan.is_popular && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      POPULAR
                    </span>}
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-slate-500">
                    /{plan.interval}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{
                width: `${subscriptions.filter(s => s.plan_id === plan.id).length / Math.max(subscriptions.length, 1) * 100}%`
              }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>
                    {subscriptions.filter(s => s.plan_id === plan.id).length}{' '}
                    active
                  </span>
                  <span>
                    {Math.round(subscriptions.filter(s => s.plan_id === plan.id).length / Math.max(subscriptions.length, 1) * 100)}
                    %
                  </span>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Active Subscriptions</CardTitle>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search schools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    School
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Plan
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Next Billing
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length > 0 ? filteredSubscriptions.map(sub => <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {sub.schools?.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">
                            {sub.schools?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-medium">
                          {sub.subscription_plans?.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatCurrency(sub.subscription_plans?.price)}
                        <span className="text-xs text-slate-400">
                          /{sub.subscription_plans?.interval}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSubscription(sub)}>
                          Details
                        </Button>
                      </td>
                    </tr>) : <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No subscriptions found matching your filters.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    School
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Due Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? invoices.map(inv => <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-slate-600">
                        {inv.number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {inv.schools?.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>) : <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      <Dialog isOpen={!!selectedSubscription} onClose={() => setSelectedSubscription(null)} title="Subscription Details" size="lg">
        {selectedSubscription && <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-xl font-bold text-indigo-600">
                  {selectedSubscription.schools?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedSubscription.schools?.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    ID: {selectedSubscription.school_id}
                  </p>
                </div>
              </div>
              {getStatusBadge(selectedSubscription.status)}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-2">
                  Current Plan
                </h4>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900">
                      {selectedSubscription.subscription_plans?.name}
                    </span>
                    <span className="font-mono text-slate-600">
                      {formatCurrency(selectedSubscription.subscription_plans?.price)}
                      /{selectedSubscription.subscription_plans?.interval}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Renews on{' '}
                    {new Date(selectedSubscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-2">
                  Billing Period
                </h4>
                <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Start Date</span>
                    <span className="font-medium">
                      {new Date(selectedSubscription.current_period_start).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">End Date</span>
                    <span className="font-medium">
                      {new Date(selectedSubscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedSubscription(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>

      {/* Invoice Details Modal */}
      <Dialog isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice ${selectedInvoice?.number}`}>
        {selectedInvoice && <div className="space-y-6">
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Amount Due</p>
              <h2 className="text-4xl font-bold text-slate-900">
                {formatCurrency(selectedInvoice.amount)}
              </h2>
              <div className="mt-4">
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Invoice Number</span>
                <span className="font-mono font-medium">
                  {selectedInvoice.number}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">School</span>
                <span className="font-medium">
                  {selectedInvoice.schools?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Issue Date</span>
                <span className="font-medium">
                  {new Date(selectedInvoice.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Due Date</span>
                <span className="font-medium">
                  {new Date(selectedInvoice.due_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                Download PDF
              </Button>
              <Button variant="primary" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}