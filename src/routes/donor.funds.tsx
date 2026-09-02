import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';

export const Route = createFileRoute('/donor/funds')({
  component: DonorFundsComponent,
});

function DonorFundsComponent() {
  const [selectedAmount, setSelectedAmount] = useState<number | string>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState({
    addressLine1: '',
    city: '',
    postalCode: '',
    country: 'South Africa',
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [wantsSection18A, setWantsSection18A] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  const presets = [50, 100, 250, 500, 1000];

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    setSelectedAmount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    
    console.log('Submitting Community Wallet Logistics Contribution:', {
      amount: finalAmount,
      billingAddress,
      emailAddress,
      wantsSection18A,
      note,
    });

    alert(`Thank you for funding R${finalAmount} towards rescue logistics!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header Title Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
          Community Wallet
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
          Fund the logistics that rescue the food
        </p>
      </div>

      {/* Main Form Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
          
          {/* Amount Selection Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
            <div className="w-full md:w-auto text-center md:text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Choose an Amount
              </label>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetSelect(amt)}
                    className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      selectedAmount === amt && !customAmount
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    R{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase">OR</div>

            <div className="w-full md:w-64">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center md:text-left">
                Enter Your Own
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-slate-500 font-bold text-sm">R</span>
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-9 pr-4 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Details Inner Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Billing Address Column */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Billing Address{' '}
                  <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                    (Required for Tax Receipt)
                  </span>
                </h3>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Address Line 1"
                    value={billingAddress.addressLine1}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, addressLine1: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={billingAddress.city}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, city: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Postal Code"
                    value={billingAddress.postalCode}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={billingAddress.country}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, country: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
              </div>

              {/* Contact Details & Section 18A Column */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Contact Details{' '}
                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                      (Required)
                    </span>
                  </h3>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    Section 18A Certificate
                  </h3>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsSection18A}
                      onChange={(e) => setWantsSection18A(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I would like to receive a Section 18A tax certificate for this donation. By ticking this box, I confirm that the details provided are correct for tax purposes.
                    </span>
                  </label>
                </div>

              </div>

            </div>
          </div>

          {/* Optional Note Field */}
          {showNoteField && (
            <div>
              <textarea
                rows={3}
                placeholder="Add your note here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Action Buttons Line */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowNoteField(!showNoteField)}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-all"
            >
              {showNoteField ? 'Remove Note' : 'Add Note (Optional)'}
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-12 py-3.5 rounded-xl bg-[#737bb9] hover:bg-[#626ab0] text-white font-bold text-sm tracking-wider uppercase shadow-md transition-all"
            >
              Submit
            </button>
          </div>

        </form>

        {/* Bottom Disclaimer Banner */}
        <div className="bg-slate-100/70 border-t border-slate-200/60 px-6 sm:px-10 py-6 flex items-start sm:items-center gap-4">
          <div className="text-[#3b4386] shrink-0 pt-0.5 sm:pt-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All donations go directly towards funding operational deliveries for our verified NGOs and keeping the SurplusLink platform running. Your support ensures that perfectly good surplus food reaches those who need it most, without being hindered by logistical costs.
          </p>
        </div>

      </div>
    </div>
  );
}