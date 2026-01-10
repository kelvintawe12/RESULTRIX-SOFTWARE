
-- ==============================================================================
-- 1. FIX FOR ANNOUNCEMENTS ISSUE
-- ==============================================================================
-- Allow school_id to be NULL for platform-wide announcements created by Super Admins
ALTER TABLE announcements ALTER COLUMN school_id DROP NOT NULL;


-- ==============================================================================
-- 2. BILLING & SUBSCRIPTIONS SCHEMA
-- ==============================================================================

-- Enums
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'expired');
CREATE TYPE billing_interval AS ENUM ('month', 'year');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'uncollectible', 'void');

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    interval billing_interval NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    number VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    status invoice_status NOT NULL DEFAULT 'draft',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Payments
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription History (Audit Trail)
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. HELPER FUNCTIONS
-- ==============================================================================

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS JSONB AS $$
DECLARE
    total_revenue NUMERIC;
    active_subs INTEGER;
    mrr NUMERIC;
    churn_rate NUMERIC;
    total_active_last_month INTEGER;
    canceled_last_month INTEGER;
BEGIN
    -- Calculate Total Revenue (sum of paid invoices)
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue 
    FROM invoices 
    WHERE status = 'paid';
    
    -- Calculate Active Subscriptions
    SELECT COUNT(*) INTO active_subs 
    FROM subscriptions 
    WHERE status IN ('active', 'trialing');
    
    -- Calculate MRR (Monthly Recurring Revenue)
    -- For yearly plans, we divide price by 12
    SELECT COALESCE(SUM(
        CASE 
            WHEN sp.interval = 'year' THEN sp.price / 12 
            ELSE sp.price 
        END
    ), 0) INTO mrr 
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.status IN ('active', 'trialing');
    
    -- Calculate Churn Rate (Simple calculation: canceled last 30 days / active 30 days ago)
    SELECT COUNT(*) INTO canceled_last_month
    FROM subscriptions
    WHERE status = 'canceled' 
    AND canceled_at > (CURRENT_TIMESTAMP - INTERVAL '30 days');

    SELECT COUNT(*) INTO total_active_last_month
    FROM subscriptions
    WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
    
    IF total_active_last_month > 0 THEN
        churn_rate := (canceled_last_month::NUMERIC / total_active_last_month::NUMERIC) * 100;
    ELSE
        churn_rate := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'total_revenue', total_revenue,
        'active_subscriptions', active_subs,
        'mrr', mrr,
        'churn_rate', ROUND(churn_rate, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. SEED DATA (Initial Plans)
-- ==============================================================================

INSERT INTO subscription_plans (name, description, price, interval, features, is_active, is_popular) VALUES
('Starter', 'Perfect for small schools just getting started.', 49.00, 'month', '["Up to 100 Students", "Basic Reporting", "Email Support", "Attendance Tracking"]'::jsonb, true, false),
('Professional', 'Best for growing institutions with advanced needs.', 149.00, 'month', '["Up to 500 Students", "Advanced Analytics", "Priority Support", "Fee Management", "Parent Portal"]'::jsonb, true, true),
('Enterprise', 'For large networks and universities.', 499.00, 'month', '["Unlimited Students", "Custom Integrations", "Dedicated Account Manager", "SLA Guarantee", "API Access"]'::jsonb, true, false);
