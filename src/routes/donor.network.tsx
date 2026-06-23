import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { useState } from "react";
import { MapPin, Building, ChevronRight, X, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/donor/network")({
  head: () => ({
    meta: [{ title: "Community Network — SurplusLink" }],
  }),
  component: DonorNetwork,
});

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
    distance: "1.2 miles",
    top: "30%",
    left: "40%",
    impactStory: "Your donations last week provided fresh salads to 150 families who otherwise wouldn't have had access to greens.",
    impactMetric: "150 families fed",
  },
  {
    id: "2",
    name: "Valley Food Bank",
    needs: ["Canned Goods", "Bread"],
    distance: "3.5 miles",
    top: "60%",
    left: "70%",
    impactStory: "The surplus bread provided breakfast for the entire community center children's program all month.",
    impactMetric: "3,000 breakfasts served",
  },
  {
    id: "3",
    name: "Sunrise Community Kitchen",
    needs: ["Prepared Meals", "Meat"],
    distance: "2.1 miles",
    top: "20%",
    left: "80%",
    impactStory: "Hot meals diverted from your deli fed 80 unhoused individuals during the recent cold snap.",
    impactMetric: "80 hot meals",
  },
  {
    id: "4",
    name: "Westside Family Services",
    needs: ["Baby Food", "Snacks"],
    distance: "4.8 miles",
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
          {/* Map Interface */}
          <div className="relative flex-1 bg-muted/30 overflow-hidden">
            {/* Map Background Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            />
            
            {/* Store Pin (Center) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 z-20">
                <Building className="h-5 w-5" />
              </div>
              <div className="mt-2 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm z-20">
                Your Store
              </div>
              
              {/* Pulse effect */}
              <div className="absolute top-0 left-0 h-10 w-10 animate-ping rounded-full bg-primary/40 z-10" />
            </div>

            {/* Path lines mock */}
            {selectedNgo && (
              <svg className="absolute inset-0 h-full w-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                <line 
                  x1="50%" 
                  y1="50%" 
                  x2={selectedNgo.left} 
                  y2={selectedNgo.top} 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray="4 4" 
                  className="text-primary/30 animate-pulse" 
                />
              </svg>
            )}

            {/* NGO Pins */}
            {ngos.map((ngo) => (
              <button
                key={ngo.id}
                onClick={() => setSelectedNgo(ngo)}
                className={`absolute flex flex-col items-center transition-transform hover:scale-110 z-20 group`}
                style={{ top: ngo.top, left: ngo.left, transform: 'translate(-50%, -50%)' }}
              >
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition-colors ${selectedNgo?.id === ngo.id ? 'bg-secondary-foreground scale-110' : 'bg-emerald-500 group-hover:bg-emerald-600'}`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div className={`mt-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm transition-opacity ${selectedNgo?.id === ngo.id ? 'opacity-100 font-bold' : 'opacity-70 group-hover:opacity-100'}`}>
                  {ngo.name}
                </div>
              </button>
            ))}
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
