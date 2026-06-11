-- Student Fee Invoices Schema
-- This schema adds proper invoice functionality for student fee billing
-- Separate from the subscription billing system in billing.sql

-- Student Fee Invoices Table
CREATE TABLE IF NOT EXISTS student_fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount_due NUMERIC(10, 2) NOT NULL CHECK (amount_due >= 0),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    description TEXT,
    billing_reason VARCHAR(50) DEFAULT 'manual',
    period_start DATE,
    period_end DATE,
    line_items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_student_fee_invoices_student ON student_fee_invoices(student_id);
CREATE INDEX idx_student_fee_invoices_term ON student_fee_invoices(term_id);
CREATE INDEX idx_student_fee_invoices_status ON student_fee_invoices(status);
CREATE INDEX idx_student_fee_invoices_due_date ON student_fee_invoices(due_date);
CREATE INDEX idx_student_fee_invoices_number ON student_fee_invoices(invoice_number);

-- Add comments
COMMENT ON TABLE student_fee_invoices IS 'Invoices for student fee billing, separate from subscription billing';
COMMENT ON COLUMN student_fee_invoices.line_items IS 'JSON array of invoice items with description, amount, fee_type';
COMMENT ON COLUMN student_fee_invoices.billing_reason IS 'Reason for invoice: manual, recurring, adjustment, etc.';

-- Function to update invoice status
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on payment
    IF NEW.amount_paid >= NEW.amount_due THEN
        NEW.status := 'paid';
        NEW.paid_date := CURRENT_DATE;
    ELSIF NEW.amount_paid > 0 THEN
        NEW.status := 'partial';
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.status NOT IN ('paid', 'cancelled') THEN
        NEW.status := 'overdue';
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER trg_update_invoice_status
BEFORE UPDATE ON student_fee_invoices
FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- Function to sync invoice payments with student fee balances
CREATE OR REPLACE FUNCTION sync_student_fee_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total paid from all invoices for this student
    UPDATE students
    SET total_paid = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM student_fee_invoices
        WHERE student_id = NEW.student_id
    ),
    remaining = total_fee - (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM student_fee_invoices
        WHERE student_id = NEW.student_id
    )
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student fee balance sync
CREATE TRIGGER trg_sync_student_fee_balance
AFTER INSERT OR UPDATE ON student_fee_invoices
FOR EACH ROW EXECUTE FUNCTION sync_student_fee_balance();