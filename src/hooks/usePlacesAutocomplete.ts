import { useEffect, useState } from 'react';

export function usePlacesAutocomplete(
  inputElement: HTMLInputElement | null,
  onPlaceSelect: (formattedAddress: string, city: string) => void
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setIsReady(true);
      return;
    }

    if (!(window as any)._placesReadyCallbacks) {
      (window as any)._placesReadyCallbacks = [];
    }
    
    (window as any)._placesReadyCallbacks.push(() => setIsReady(true));

    const existing = document.getElementById("google-places-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if ((window as any).google?.maps?.places) setIsReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,routes`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any)._placesReadyCallbacks) {
        (window as any)._placesReadyCallbacks.forEach((cb: () => void) => cb());
      }
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isReady || !inputElement) return;

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputElement, {
      fields: ["formatted_address", "address_components"],
      types: ["address"],
      componentRestrictions: { country: "ZA" }
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        let city = "";
        place.address_components?.forEach((component: any) => {
          if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
            city = component.long_name;
          }
        });
        
        onPlaceSelect(place.formatted_address, city);
      }
    });

    return () => {
      (window as any).google.maps.event.removeListener(listener);
    };
  }, [isReady, inputElement, onPlaceSelect]);

  return isReady;
}
