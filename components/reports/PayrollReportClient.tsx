'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export interface PayrollReportClientProps {
  shopId: string;
  staffId?: string;
  isPersonalView?: boolean;
  currency?: string;
}

export default function PayrollReportClient({
  shopId,
  staffId,
  isPersonalView,
  currency = 'USD'
}: PayrollReportClientProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchData();
  }, [shopId, startDate, endDate, staffId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/api/shops/${shopId}/payroll?start=${startDate}&end=${endDate}${staffId ? `&staffId=${staffId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || []);
        setExpenses(data.expenses || []);
        setTotalExpenses(data.totalExpenses || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (range: string) => {
    setDateRange(range);
    const d = new Date();
    if (range === 'this_month') {
      d.setDate(1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (range === 'last_month') {
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const end = new Date(d.getFullYear(), d.getMonth(), 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === 'this_year') {
      d.setMonth(0, 1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll & Accounting</h2>
          <p className="text-crm-muted text-sm">
            {isPersonalView ? 'View your hours, commissions, and rent' : 'Aggregate TimeLog, Commission, Expense, and Booth Rent data'}
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={dateRange}
            onChange={(e) => handleDateChange(e.target.value)}
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex gap-4 items-center bg-crm-card p-4 rounded-lg border border-crm-border">
          <div>
            <label className="block text-xs text-crm-muted mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
          </div>
          <div>
            <label className="block text-xs text-crm-muted mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="mt-5">
            <button onClick={fetchData} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
              Apply
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {!isPersonalView && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.reduce((acc, s) => acc + s.netPayout, 0), currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Booth Rent Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.reduce((acc, s) => acc + s.boothRentPaid, 0), currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Shop Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(totalExpenses, currency)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Staff Payroll Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-crm-muted uppercase bg-crm-card/50 border-b border-crm-border">
                    <tr>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Hours Worked</th>
                      <th className="px-4 py-3">Commission</th>
                      <th className="px-4 py-3">Tips</th>
                      <th className="px-4 py-3">Booth Rent Paid</th>
                      <th className="px-4 py-3 text-right">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-crm-muted">
                          No payroll data found for this period.
                        </td>
                      </tr>
                    ) : (
                      summary.map((s, idx) => (
                        <tr key={idx} className="border-b border-crm-border last:border-0 hover:bg-crm-card/30">
                          <td className="px-4 py-3 font-medium">{s.staffName || 'Unknown'}</td>
                          <td className="px-4 py-3">{s.totalHoursWorked > 0 ? s.totalHoursWorked.toFixed(1) : '-'}</td>
                          <td className="px-4 py-3">{formatCurrency(s.totalCommission, currency)}</td>
                          <td className="px-4 py-3">{formatCurrency(s.totalTips, currency)}</td>
                          <td className="px-4 py-3">{formatCurrency(s.boothRentPaid, currency)}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatCurrency(s.netPayout, currency)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {!isPersonalView && expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Shop Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-crm-muted uppercase bg-crm-card/50 border-b border-crm-border">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e, idx) => (
                        <tr key={idx} className="border-b border-crm-border last:border-0 hover:bg-crm-card/30">
                          <td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{e.category}</td>
                          <td className="px-4 py-3">{e.description || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-red-500">
                            {formatCurrency(e.amount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
