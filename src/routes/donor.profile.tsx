import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { requireRole } from '@/lib/auth-guard'
import { AppHeader, donorNav } from '@/components/AppHeader'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Phone, Home, Settings, HelpCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete'

export const Route = createFileRoute('/donor/profile')({
  beforeLoad: () => requireRole('donor'),
  component: DonorProfile,
})

function DonorProfile() {
  const navigate = useNavigate()
  const { user, displayName, initials, signOut } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    phone: '',
    address: '',
    city: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        businessName: displayName || '',
        businessType: (user.user_metadata?.business_type as string) || '',
        phone: (user.user_metadata?.phone as string) || '',
        address: (user.user_metadata?.address as string) || '',
        city: (user.user_metadata?.city as string) || '',
      })
    }
  }, [user, displayName])

  const [addressInput, setAddressInput] = useState<HTMLInputElement | null>(null)
  
  usePlacesAutocomplete(addressInput, (formattedAddress, city) => {
    setFormData(prev => ({
      ...prev,
      address: formattedAddress,
      city: city || prev.city
    }))
  })

  async function handleSave() {
    setSaving(true)
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          business_name: formData.businessName,
          business_type: formData.businessType,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        }
      })
      if (authError) throw authError

      if (user?.id) {
        const { error: dbError } = await supabase
          .from('donors')
          .update({
            organization_name: formData.businessName,
            address: formData.address,
          })
          .eq('id', user.id)
          
        if (dbError) {
          await supabase.from('donors').upsert({
            id: user.id,
            organization_name: formData.businessName,
            address: formData.address,
          })
        }
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const donor = {
    email: user?.email || 'No email provided',
    businessName: displayName,
    businessType: (user?.user_metadata?.business_type as string) || 'Food Donor',
    phone: (user?.user_metadata?.phone as string) || 'No phone provided',
    address: (user?.user_metadata?.address as string) || 'No address provided',
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={donorNav} userLabel={initials} />
      
      <main className="mx-auto flex-1 w-full max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Donor Profile</h1>
          <button
            onClick={() => navigate({ to: '/donor/dashboard' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Top Profile Banner */}
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          <div className="h-28 w-28 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{donor.businessName}</h2>
              <p className="text-muted-foreground mt-0.5">{donor.businessType}</p>
            </div>
          </div>
          <div className="w-full md:w-48 space-y-3 shrink-0 pt-2 md:pt-0">
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
            </button>
            {isEditing ? (
              <button 
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button 
                onClick={signOut}
                className="w-full rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-colors"
              >
                Log Out
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details (Spans 2 cols) */}
          <div className="md:col-span-2">
            <div className="rounded-xl border bg-card shadow-sm h-full">
              <div className="px-6 py-5 border-b bg-muted/30">
                <h3 className="font-semibold text-foreground text-lg">Contact Information</h3>
              </div>
              
              <div className="p-6 grid gap-6 sm:grid-cols-2">
                {isEditing && (
                  <>
                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Name</label>
                      <input 
                        type="text" 
                        value={formData.businessName}
                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Type</label>
                      <input 
                        type="text" 
                        value={formData.businessType}
                        onChange={e => setFormData({...formData, businessType: e.target.value})}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</div>
                    <div className="text-sm font-medium text-foreground">{donor.email}</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone</div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{donor.phone}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 col-span-1 sm:col-span-2">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50 flex items-center justify-center">
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Address</div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        ref={setAddressInput}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Start typing your address..."
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{donor.address}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links (Spans 1 col) */}
          <div className="md:col-span-1">
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm h-full">
              <div className="px-6 py-5 border-b bg-muted/30">
                <h3 className="font-semibold text-foreground text-lg">Account Links</h3>
              </div>
              <div className="divide-y">
                <button className="w-full flex items-center gap-4 px-6 py-4 text-sm font-medium hover:bg-muted/50 transition-colors text-left text-foreground">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Preferences
                </button>
                <button className="w-full flex items-center gap-4 px-6 py-4 text-sm font-medium hover:bg-muted/50 transition-colors text-left text-foreground">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Tax Certificates
                </button>
                <button className="w-full flex items-center gap-4 px-6 py-4 text-sm font-medium hover:bg-muted/50 transition-colors text-left text-foreground">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  Support & FAQ
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}