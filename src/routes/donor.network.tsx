import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { useState } from "react";
import { MapPin, ChevronRight, X, HeartHandshake } from "lucide-react";
import CommunityMap from "@/components/CommunityMap";

export const Route = createFileRoute("/donor/network")({
  head: () => ({
    meta: [{ title: "Community Network — Developing digital projects" }],
  }),
  component: DonorNetwork,
});

// NOTE: This fake array is temporarily kept so your sidebar doesn't break.
// We will replace this with live Supabase data in the next step.
type NGO = {
  id: string;
  name: string;
  needs: string[];
  distance: string;
  top: string;
  left: string;
  impactStory: string;
  impactMetric: string;
};

const ngos: NGO[] = [
  {
    id: "1",
    name: "Downtown Hope Shelter",
    needs: ["Fresh Produce", "Dairy"],
    distance: "1.9 km",
    top: "30%",
    left: "40%",
    impactStory: "Your donations last week provided fresh salads to 150 families who otherwise wouldn't have had access to greens.",
    impactMetric: "150 families fed",
  },
  {
    id: "2",
    name: "Valley Food Bank",
    needs: ["Canned Goods", "Bread"],
    distance: "5.6 km",
    top: "60%",
    left: "70%",
    impactStory: "The surplus bread provided breakfast for the entire community center children's program all month.",
    impactMetric: "3,000 breakfasts served",
  },
  {
    id: "3",
    name: "Sunrise Community Kitchen",
    needs: ["Prepared Meals", "Meat"],
    distance: "3.4 km",
    top: "20%",
    left: "80%",
    impactStory: "Hot meals diverted from your deli fed 80 unhoused individuals during the recent cold snap.",
    impactMetric: "80 hot meals",
  },
  {
    id: "4",
    name: "Westside Family Services",
    needs: ["Baby Food", "Snacks"],
    distance: "7.7 km",
    top: "75%",
    left: "25%",
    impactStory: "Healthy snacks kept our after-school tutoring program energized and focused.",
    impactMetric: "200 students supported",
  },
];

function DonorNetwork() {
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Community Network</h1>
          <p className="mt-2 text-muted-foreground">
            See exactly where your surplus goes and the lives it touches in real-time.
          </p>
        </div>

        <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:flex-row">
          
          {/* LIVE MAP INTERFACE */}
          <div className="relative flex-1 bg-muted/30 overflow-hidden flex items-center justify-center p-2">
            <div className="w-full h-full overflow-hidden rounded-lg bg-white">
               {/* 
                 Because CommunityMap has its own padding/title inside its file right now, 
                 it will render here. We can clean up CommunityMap.tsx later to remove 
                 its internal title so it fits perfectly here!
               */}
              <CommunityMap loggedInDonorId="PASTE_A_TEST_UUID_HERE" />
            </div>
          </div>

          {/* Directory / Detail Panel Container */}
          <div className="relative w-full border-l bg-card lg:w-[400px] overflow-hidden">
            
            {/* NGO Directory List */}
            <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${selectedNgo ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
              <div className="border-b p-5 bg-muted/20">
                <h2 className="font-semibold">Local Partner Directory</h2>
                <p className="text-xs text-muted-foreground mt-1">Select a partner to view impact details.</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y">
                {ngos.map((ngo) => (
                  <button
                    key={ngo.id}
                    onClick={() => setSelectedNgo(ngo)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/50 group"
                  >
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">{ngo.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {ngo.distance} away
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={`absolute inset-0 flex flex-col bg-card transition-transform duration-300 ease-in-out shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] ${selectedNgo ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
              {selectedNgo && (
                <>
                  <div className="border-b p-4 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
                    <button 
                      onClick={() => setSelectedNgo(null)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Back to list
                    </button>
                    <button onClick={() => setSelectedNgo(null)} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold tracking-tight">{selectedNgo.name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center mt-2">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {selectedNgo.distance} from loading dock
                      </p>
                    </div>

                    <div className="mb-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 border border-emerald-100/50 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <HeartHandshake className="h-24 w-24 text-emerald-600" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400 mb-3">
                          <HeartHandshake className="h-5 w-5" />
                          Impact Story
                        </div>
                        <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90 italic leading-relaxed">
                          "{selectedNgo.impactStory}"
                        </p>
                        <div className="mt-4 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
                          {selectedNgo.impactMetric}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Primary Needs</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNgo.needs.map(need => (
                          <span key={need} className="inline-flex items-center rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground border">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t bg-muted/10">
                    <button className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                      Direct Donation
                    </button>
                  </div>
                </>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}