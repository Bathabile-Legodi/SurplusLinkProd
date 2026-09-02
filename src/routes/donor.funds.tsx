import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import {
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Lock,
  ArrowUpRight,
  AlertCircle,
  Truck,
  HeartHandshake,
} from 'lucide-react'

export const Route = createFileRoute('/donor/funds')({
  component: DonorFundsPage,
})

// --- Authentic South African & Global Payment Brand Logos ---

function MastercardLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#1A1F2C" />
      <circle cx="13" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M18 6.804A6.97 6.97 0 0 0 15.333 12 6.97 6.97 0 0 0 18 17.196 6.97 6.97 0 0 0 20.667 12 6.97 6.97 0 0 0 18 6.804Z"
        fill="#FF5F00"
      />
    </svg>
  )
}

function VisaLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#0E4595" />
      <path
        d="M13.88 16.31h-2.12l1.33-8.23h2.12l-1.33 8.23zm7.04-8.03c-.42-.16-1.07-.33-1.89-.33-2.08 0-3.55 1.11-3.56 2.69-.02 1.17 1.05 1.82 1.85 2.21.82.4 1.1.66 1.1 1.02-.01.55-.66.8-1.28.8-.85 0-1.31-.13-2.01-.44l-.28-.13-.3 1.87c.5.23 1.43.43 2.4.44 2.26 0 3.73-1.12 3.75-2.85.02-.95-.57-1.68-1.82-2.28-.76-.39-1.23-.65-1.22-1.05 0-.35.39-.72 1.23-.72.7 0 1.21.15 1.6.32l.19.09.29-1.82zm5.7 8.03h1.85l-1.61-8.23h-1.71c-.38 0-.71.22-.85.56l-3.02 7.22h2.23l.44-1.23h2.72l.25 1.23zm-2.35-2.87l.84-2.31c-.01.02.17-.47.28-.78l.14.7.49 2.39h-1.75zM10.74 8.08L8.68 13.7l-.22-1.12c-.39-1.32-1.61-2.76-2.98-3.48l1.93 7.21h2.24l3.33-8.23h-2.24z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function CapitecLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#003366" />
      <rect x="5" y="8" width="12" height="8" rx="2" fill="#0099FF" />
      <rect x="19" y="8" width="12" height="8" rx="2" fill="#E60000" />
    </svg>
  )
}

function StandardBankLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#0033A0" />
      <path d="M18 5L25 12L18 19L11 12L18 5Z" fill="#FFFFFF" />
      <path d="M18 8L22 12L18 16L14 12L18 8Z" fill="#0033A0" />
    </svg>
  )
}

function FnbLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#008A97" />
      <circle cx="18" cy="12" r="6" fill="#F26A36" />
      <path d="M18 6V18M12 12H24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function AbsaLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="3" fill="#DC0032" />
      <circle cx="18" cy="12" r="6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
    </svg>
  )
}

// --- Data Structures ---

const PRESET_AMOUNTS = [50, 100, 250, 500]

type PaymentMethodType = 'card' | 'eft'

interface SavedPaymentMethod {
  id: string
  type: 'card' | 'bank'
  title: string
  subtitle: string
  brand: 'mastercard' | 'visa' | 'capitec' | 'standardbank' | 'fnb' | 'absa'
  isDefault?: boolean
}

function DonorFundsPage() {
  const [amount, setAmount] = useState<number | ''>(100)

  // Checkout State
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('card')
  const [selectedSavedId, setSelectedSavedId] = useState<string>('pm-1')
  const [selectedBank, setSelectedBank] = useState<string>('capitec')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Card Inputs
  const [cardHolder, setCardHolder] = useState<string>('')
  const [cardNumber, setCardNumber] = useState<string>('')
  const [cardExpiry, setCardExpiry] = useState<string>('')
  const [cardCvv, setCardCvv] = useState<string>('')

  const savedMethods: SavedPaymentMethod[] = [
    {
      id: 'pm-1',
      type: 'card',
      title: 'Mastercard ending in 4821',
      subtitle: 'Expires 09/28',
      brand: 'mastercard',
      isDefault: true,
    },
    {
      id: 'pm-2',
      type: 'card',
      title: 'Visa ending in 1092',
      subtitle: 'Expires 11/26',
      brand: 'visa',
    },
    {
      id: 'pm-3',
      type: 'bank',
      title: 'Capitec Direct EFT',
      subtitle: 'Acc ending in 9940',
      brand: 'capitec',
    },
  ]

  const bankOptions = [
    { id: 'capitec', name: 'Capitec Bank', icon: CapitecLogo },
    { id: 'fnb', name: 'First National Bank (FNB)', icon: FnbLogo },
    { id: 'standardbank', name: 'Standard Bank', icon: StandardBankLogo },
    { id: 'absa', name: 'Absa Bank', icon: AbsaLogo },
  ]

  const renderBrandIcon = (brand: SavedPaymentMethod['brand']) => {
    switch (brand) {
      case 'mastercard':
        return <MastercardLogo className="h-6 w-9" />
      case 'visa':
        return <VisaLogo className="h-6 w-9" />
      case 'capitec':
        return <CapitecLogo className="h-6 w-9" />
      case 'standardbank':
        return <StandardBankLogo className="h-6 w-9" />
      case 'fnb':
        return <FnbLogo className="h-6 w-9" />
      case 'absa':
        return <AbsaLogo className="h-6 w-9" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-400" />
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setAmount('')
    } else {
      const parsed = parseFloat(val)
      if (!isNaN(parsed)) {
        setAmount(parsed)
      }
    }
  }

  const handleSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = typeof amount === 'number' ? amount : 0
    if (numericAmount <= 0) return

    setIsProcessing(true)
    setSuccessMessage(null)

    setTimeout(() => {
      setIsProcessing(false)
      setSuccessMessage(
        `Successfully contributed R${numericAmount.toFixed(2)} to the SurplusLink Delivery & Logistics Wallet!`
      )
      setCardNumber('')
      setCardExpiry('')
      setCardCvv('')
      setCardHolder('')
    }, 1200)
  }

  const displayAmount = typeof amount === 'number' ? amount : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">SurplusLink Delivery Wallet Fund</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fund the central logistics wallet used to cover transit and dispatch costs when food surplus is delivered to partner NGOs.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 transition-all">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSponsorSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form Section */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Delivery Purpose Banner */}
            <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
              <div className="rounded-lg bg-emerald-600 p-2 text-white">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Earmarked Purpose: Food Delivery & Transit</h2>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  All financial contributions added here are strictly reserved for delivery fees. When an NGO requests surplus food, SurplusLink utilizes this wallet balance to request and fulfill driver dispatch directly.
                </p>
              </div>
            </div>

            {/* Step 1: Select Donation Amount */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label htmlFor="amount-input" className="block text-sm font-semibold text-gray-800">
                1. Select Delivery Contribution Amount (ZAR)
              </label>

              {/* Quick-select chips */}
              <div className="mt-3 grid grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                      amount === val
                        ? 'bg-emerald-600 text-white shadow'
                        : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    R{val}
                  </button>
                ))}
              </div>

              {/* Controlled numeric field */}
              <div className="mt-4">
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-sm font-bold text-gray-500">R</span>
                  </div>
                  <input
                    id="amount-input"
                    type="number"
                    min="10"
                    step="10"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter custom amount"
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Checkout & Payment Methods */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800">
                2. Select Payment Checkout Method
              </label>
              <p className="mb-4 text-xs text-gray-500">
                Transactions are processed securely via South African bank gateways.
              </p>

              {/* Payment Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                    paymentType === 'card'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-700 font-semibold shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('eft')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                    paymentType === 'eft'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-700 font-semibold shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Instant EFT (SA Banks)</span>
                </button>
              </div>

              {/* Card Payment Sub-Panel */}
              {paymentType === 'card' ? (
                <div className="mt-4 space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Saved Cards</span>
                    <div className="flex items-center gap-1.5">
                      <MastercardLogo />
                      <VisaLogo />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {savedMethods
                      .filter((m) => m.type === 'card')
                      .map((method) => (
                        <label
                          key={method.id}
                          onClick={() => setSelectedSavedId(method.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                            selectedSavedId === method.id
                              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="savedMethod"
                              checked={selectedSavedId === method.id}
                              onChange={() => setSelectedSavedId(method.id)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            {renderBrandIcon(method.brand)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{method.title}</p>
                              <p className="text-xs text-gray-500">{method.subtitle}</p>
                            </div>
                          </div>
                          {method.isDefault && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              Default
                            </span>
                          )}
                        </label>
                      ))}

                    {/* Add New Card Radio */}
                    <label
                      onClick={() => setSelectedSavedId('new-card')}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        selectedSavedId === 'new-card'
                          ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="savedMethod"
                          checked={selectedSavedId === 'new-card'}
                          onChange={() => setSelectedSavedId('new-card')}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex h-6 w-9 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Use a new credit or debit card
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Expandable New Card Fields */}
                  {selectedSavedId === 'new-card' && (
                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required={selectedSavedId === 'new-card'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Card Number
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="5123 •••• •••• 4821"
                            maxLength={19}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required={selectedSavedId === 'new-card'}
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <MastercardLogo className="h-4 w-auto" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required={selectedSavedId === 'new-card'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            CVV / CVC
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            maxLength={4}
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required={selectedSavedId === 'new-card'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* EFT Sub-Panel */
                <div className="mt-4 space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <span className="text-xs font-semibold text-gray-500">
                    Select Your Bank for Direct Instant EFT
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {bankOptions.map((bank) => {
                      const BankIcon = bank.icon
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.id)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            selectedBank === bank.id
                              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <BankIcon className="h-6 w-9 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-800">
                            {bank.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <p className="text-xs">
                      Instant EFT connects directly to your SA banking portal. Funds clear immediately into the central network wallet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Summary Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Network Wallet
                </span>
                <span className="font-mono text-xs text-gray-500">DELIVERY-ONLY</span>
              </div>

              <h3 className="mt-3 text-lg font-bold text-gray-900">SurplusLink Transport Fund</h3>
              <p className="text-xs text-gray-600">Central Logistics Management</p>

              <div className="mt-4 space-y-2 border-t border-emerald-200/60 pt-3 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Earmarked For:</span>
                  <span className="font-medium text-emerald-800">Driver & Transit Fees</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Managed By:</span>
                  <span className="font-medium text-gray-800">SurplusLink Platform</span>
                </div>
              </div>

              <div className="mt-6 border-t border-emerald-200/60 pt-4">
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Total Delivery Top-up</span>
                  <span className="text-emerald-700">
                    R
                    {displayAmount.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || displayAmount <= 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {paymentType === 'eft' ? 'Proceed with EFT' : `Pay R${displayAmount} Now`}
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted Payment</span>
              </div>
            </div>

            {/* Impact Note */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <HeartHandshake className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Automated Dispatch Top-up</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    When verified NGOs claim food batches, SurplusLink automatically uses this wallet pool to dispatch delivery couriers to collect and transport the surplus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}