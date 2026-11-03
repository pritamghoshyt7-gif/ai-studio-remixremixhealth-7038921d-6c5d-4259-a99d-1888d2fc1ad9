import React, { useState } from 'react';
import { BillingRecord, CollectionCentre, Sample, UserProfile } from '../../types';
import { saveBillingRecord } from '../../services/dbService';
import { TEST_CATALOG } from '../../services/seedData';
import {
  CreditCard,
  Plus,
  Printer,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react';

interface BillingModuleProps {
  centres: CollectionCentre[];
  samples: Sample[];
  currentUser: UserProfile;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  centres,
  samples,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'RATES' | 'INVOICE'>('LEDGER');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(centres[0]?.id || '');
  const [paymentModalCentre, setPaymentModalCentre] = useState<CollectionCentre | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMode, setPaymentMode] = useState('UPI / NEFT Transfer');

  // Calculate dynamic centre financial balances based on completed/verified samples
  const centreFinancials = centres.map((centre) => {
    const centreSamples = samples.filter((s) => s.centreId === centre.id);
    const completedCount = centreSamples.length;
    // Calculate gross test revenue
    const sampleCharges = centreSamples.reduce((acc, s) => {
      const catalog = TEST_CATALOG.find((t) => t.name === s.testName);
      return acc + (catalog?.rate || 450);
    }, 0);

    const logisticsCharges = completedCount * 30; // ₹30 per sample courier fee
    const discount = (sampleCharges * (centre.sampleRateDiscountPercent || 15)) / 100;
    const netTotal = sampleCharges + logisticsCharges - discount;
    const paid = Math.round(netTotal * 0.6); // 60% advance paid for demo realism
    const due = netTotal - paid;

    return {
      centre,
      sampleCount: completedCount,
      sampleCharges,
      logisticsCharges,
      discount,
      netTotal,
      paid,
      due,
    };
  });

  const totalDueAcrossNetwork = centreFinancials.reduce((acc, c) => acc + c.due, 0);
  const totalVolumeRevenue = centreFinancials.reduce((acc, c) => acc + c.netTotal, 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCentre) return;

    alert(
      `Payment of ₹${paymentAmount.toLocaleString()} recorded for ${paymentModalCentre.name} via ${paymentMode}. Receipt voucher logged.`
    );
    setPaymentModalCentre(null);
  };

  const activeCentreData = centreFinancials.find((c) => c.centre.id === selectedCentreId) || centreFinancials[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Diagnostic Accounts, B2B Rate Cards & Billing ERP
            </h2>
            <p className="text-xs text-slate-500">
              Centre-wise balance ledgers, courier pickup surcharge accounting, test rate cards, and GST invoice generation
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'LEDGER'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Centre Balances
          </button>
          <button
            onClick={() => setActiveTab('RATES')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'RATES'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Test Rate Card
          </button>
          <button
            onClick={() => setActiveTab('INVOICE')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'INVOICE'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tax Invoice Generator
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Total B2B Network Revenue</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            ₹{totalVolumeRevenue.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Across {centres.length} partner collection centres
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Outstanding Balance Due</span>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            ₹{totalDueAcrossNetwork.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            Pending reconciliation / billing cycle
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Courier Logistics Surcharge</span>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            ₹{(samples.length * 30).toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Flat ₹30 per sample runner transport fee
          </p>
        </div>
      </div>

      {/* Tab 1: Centre Ledgers */}
      {activeTab === 'LEDGER' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-bold text-sm text-slate-900">Collection Centre Financial Statements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Centre Code & Name</th>
                  <th className="py-3 px-4">Samples Processed</th>
                  <th className="py-3 px-4">Gross Charges</th>
                  <th className="py-3 px-4">Logistics Fee</th>
                  <th className="py-3 px-4">B2B Discount</th>
                  <th className="py-3 px-4">Net Billable</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centreFinancials.map((item) => (
                  <tr key={item.centre.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.centre.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.centre.centreCode} • {item.centre.contactPerson}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.sampleCount} vials
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      ₹{item.sampleCharges.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{item.logisticsCharges.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600">
                      -₹{Math.round(item.discount).toLocaleString()} ({item.centre.sampleRateDiscountPercent || 15}%)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Math.round(item.netTotal).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      ₹{Math.round(item.due).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setPaymentModalCentre(item.centre);
                          setPaymentAmount(Math.round(item.due));
                        }}
                        className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Test Rate Card */}
      {activeTab === 'RATES' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-bold text-sm text-slate-900">
              Diagnostic Test Catalog & Standard Rate Card
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Specimen & Container Tube</th>
                  <th className="py-3 px-4">TAT (Hours)</th>
                  <th className="py-3 px-4 text-right">Standard Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TEST_CATALOG.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{t.category}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: t.containerColor }}
                        />
                        <span>{t.container}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.tatHours} hrs</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{t.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tax Invoice Generator */}
      {activeTab === 'INVOICE' && activeCentreData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm max-w-3xl mx-auto font-sans text-slate-900">
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4">
            <div>
              <h2 className="text-xl font-black text-blue-700 tracking-wider">
                HEALTH POINT DIAGNOSTICS
              </h2>
              <p className="text-xs text-slate-500">
                Central Laboratory & Reference Hub • GSTIN: 19AAACH1234F1Z8
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400">TAX INVOICE</div>
              <div className="font-mono text-sm font-bold text-slate-800">
                INV-{new Date().getFullYear()}-{Date.now().toString().slice(-4)}
              </div>
              <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <div className="my-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Billed To:</span>
              <div className="mt-1 font-bold text-slate-900 text-sm">
                {activeCentreData.centre.name}
              </div>
              <div className="text-slate-600">{activeCentreData.centre.fullAddress}</div>
              <div className="text-slate-600">
                Contact: {activeCentreData.centre.contactPerson} • {activeCentreData.centre.mobileNumber}
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Payment Terms:</span>
              <div className="mt-1 font-semibold text-slate-800">Net 15 Days (Monthly Statement)</div>
              <div className="text-slate-500">State: West Bengal (Code: 19)</div>
            </div>
          </div>

          <table className="w-full text-xs text-left my-4">
            <thead className="bg-slate-50 border-y border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Gross (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3">
                  Diagnostic Sample Testing Charges (Aggregated Batch)
                </td>
                <td className="py-2.5 px-3 text-center">{activeCentreData.sampleCount}</td>
                <td className="py-2.5 px-3 text-right">
                  ₹{activeCentreData.sampleCharges.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  Logistics & Phlebotomy Runner Transit Fee (₹30 / sample)
                </td>
                <td className="py-2.5 px-3 text-center">{activeCentreData.sampleCount}</td>
                <td className="py-2.5 px-3 text-right">
                  ₹{activeCentreData.logisticsCharges.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-600 font-semibold">
                  Partner Centre Volume Discount ({activeCentreData.centre.sampleRateDiscountPercent || 15}%)
                </td>
                <td className="py-2.5 px-3 text-center">-</td>
                <td className="py-2.5 px-3 text-right text-emerald-600">
                  -₹{Math.round(activeCentreData.discount).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-slate-200 font-bold">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-right">
                  Total Billable Amount:
                </td>
                <td className="py-3 px-3 text-right text-base text-blue-700">
                  ₹{Math.round(activeCentreData.netTotal).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow"
            >
              <Printer className="h-4 w-4" />
              Print Official PDF Invoice
            </button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Payment Entry: {paymentModalCentre.name}
              </h3>
              <button
                onClick={() => setPaymentModalCentre(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                >
                  <option value="UPI / NEFT Transfer">UPI / NEFT Bank Transfer</option>
                  <option value="Cash Deposit">Cash Deposit at Central Lab</option>
                  <option value="Account Cheque">Account Payee Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalCentre(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
                >
                  Record & Issue Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
