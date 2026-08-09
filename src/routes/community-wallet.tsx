import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppHeader } from '@/components/AppHeader'
import { CommunityWalletForm } from '@/components/CommunityWalletForm'

export const Route = createFileRoute('/community-wallet')({
  component: CommunityWalletPage,
})

function CommunityWalletPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 w-full pb-20">
        {/* Hero Banner Section */}
        <div className="relative w-full h-[380px] bg-primary overflow-hidden flex items-center justify-center">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80 opacity-90" />
          {/* Abstract pattern / blur */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-overlay" />
          
          <h1 className="relative z-10 text-5xl md:text-7xl font-black tracking-widest text-white uppercase mt-[-80px] drop-shadow-lg text-center px-4">
            Community Wallet
          </h1>
        </div>

        {/* Floating Card */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-20 -mt-32">
          <CommunityWalletForm onSuccess={() => navigate({ to: '/' })} />
        </div>
      </main>
    </div>
  )
}
