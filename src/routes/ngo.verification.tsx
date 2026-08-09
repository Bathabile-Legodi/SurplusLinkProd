import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AppHeader, ngoNav } from '@/components/AppHeader'
import { useNgoVerification } from '@/hooks/useNgoVerification'
import { UploadCloud, CheckCircle, FileText, Clock } from 'lucide-react'

export const Route = createFileRoute('/ngo/verification')({
  head: () => ({ meta: [{ title: 'Verification Status — SurplusLink' }] }),
  component: NgoVerification,
})

function NgoVerification() {
  const { isAuthorized, isVerified, isChecking, user } = useNgoVerification()
  const [hasUploaded, setHasUploaded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    // Check if they previously uploaded documents (simulated via localStorage)
    if (localStorage.getItem('ngo_documents_uploaded') === 'true') {
      setHasUploaded(true)
    }
  }, [])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthorized) return null

  const orgName = user?.user_metadata?.organization_name || 'Organisation'
  const initials = orgName.slice(0, 2).toUpperCase()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false)
      setHasUploaded(true)
      localStorage.setItem('ngo_documents_uploaded', 'true')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={ngoNav} userLabel={initials} />
      
      <main className="flex-1 w-full flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          
          <div className="mb-8">
            <Link to="/ngo/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black tracking-tight mt-2">Verification Status</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              SurplusLink requires all NGO partners to be independently verified to ensure food safety and regulatory compliance.
            </p>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            {isVerified ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Account Fully Verified</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Your organization has been successfully verified. You have full access to claim donations on the SurplusLink platform.
                </p>
              </div>
            ) : hasUploaded ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/20">
                  <Clock className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Documents Received</h2>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
                  Thank you for submitting your registration documents. Our team is currently reviewing your application.
                </p>
                <div className="bg-muted/50 w-full p-4 rounded-lg text-left border">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-widest mb-1">What happens next?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Please allow 3-7 working days for processing. You will receive an email notification as soon as your account has been approved and you can start claiming donations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-start gap-4 mb-8">
                  <div className="h-10 w-10 bg-warning/10 text-warning-foreground rounded-full flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Action Required</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Please upload your official NPO/NGO registration certificate or equivalent documentation to prove your organization is registered.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpload}>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/30 transition-colors">
                    <input 
                      type="file" 
                      id="document-upload" 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label 
                      htmlFor="document-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <UploadCloud className={`h-10 w-10 mb-4 ${selectedFile ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold mb-1">
                        {selectedFile ? selectedFile.name : 'Click to select a file'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedFile ? 'Click to change file' : 'PDF, PNG, or JPG up to 5MB'}
                      </span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!selectedFile || isUploading}
                    className="mt-6 w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                  >
                    {isUploading ? 'Uploading...' : 'Submit Documents'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
