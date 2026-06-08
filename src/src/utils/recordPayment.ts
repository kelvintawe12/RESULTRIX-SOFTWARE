/**
 * Utility function to record a payment with proper error handling
 * This handles the school_id requirement in the payments table
 */

import { supabase } from '../lib/supabaseClient';
interface RecordPaymentParams {
  studentId: string;
  amount: number;
  date: string;
  method: string;
  notes?: string;
}
interface RecordPaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  receiptData?: any;
}
export async function recordPayment(params: RecordPaymentParams): Promise<RecordPaymentResult> {
  const {
    studentId,
    amount,
    date,
    method,
    notes
  } = params;
  try {
    // Step 1: Get current student data INCLUDING school_id
    const {
      data: student,
      error: studentFetchError
    } = await supabase.from('students').select('id, full_name, admission_number, total_fee, total_paid, remaining, school_id, classes(name)').eq('id', studentId).single();
    if (studentFetchError) {
      throw new Error(`Failed to fetch student: ${studentFetchError.message}`);
    }
    if (!student) {
      throw new Error('Student not found');
    }
    if (!student.school_id) {
      throw new Error('Student does not have a school_id assigned');
    }

    // Step 2: Calculate new balances
    const newTotalPaid = Number(student.total_paid) + amount;
    const newRemaining = Number(student.total_fee) - newTotalPaid;

    // Step 3: Update the student balance first
    const {
      error: updateError
    } = await supabase.from('students').update({
      total_paid: newTotalPaid,
      remaining: newRemaining
    }).eq('id', studentId);
    if (updateError) {
      throw new Error(`Failed to update student balance: ${updateError.message}`);
    }
    console.log('Student balances updated successfully');

    // Step 4: Insert payment record WITH school_id
    const {
      data: payment,
      error: paymentError
    } = await supabase.from('payments').insert({
      student_id: studentId,
      school_id: student.school_id,
      // CRITICAL: Include school_id
      amount,
      date,
      method,
      notes: notes || null
    }).select().single();
    if (paymentError) {
      console.error('Payment insert error:', paymentError);

      // Rollback student update
      await supabase.from('students').update({
        total_paid: student.total_paid,
        remaining: student.remaining
      }).eq('id', studentId);
      throw new Error(`Failed to record payment: ${paymentError.message}. ${paymentError.hint || ''}`);
    }
    console.log('Payment recorded successfully:', payment.id);

    // Step 5: Generate receipt data
    const receiptData = {
      receiptNumber: `RCP-${payment.id.slice(0, 8).toUpperCase()}`,
      date: new Date(date).toLocaleDateString(),
      student: {
        name: student.full_name,
        admissionNumber: student.admission_number,
        class: (Array.isArray(student.classes) ? student.classes[0] : student.classes)?.name
      },
      payment: {
        amount: amount,
        method: method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        previousBalance: Number(student.total_fee) - Number(student.total_paid),
        amountPaid: amount,
        newBalance: newRemaining
      }
    };
    return {
      success: true,
      paymentId: payment.id,
      receiptData
    };
  } catch (error: any) {
    console.error('Payment recording error:', error);
    return {
      success: false,
      error: error.message || 'Failed to record payment'
    };
  }
}