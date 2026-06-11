import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const ChangeView = ({ center, zoom }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

// Fix Leaflet's default icon path issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;

const jindungoIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #D4AF37; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;"><div style="background-color: black; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const LocationMarker = ({ position, setPosition, setAddress }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            fetchAddress(e.latlng.lat, e.latlng.lng);
        },
    });

    const fetchAddress = async (lat, lng) => {
        try {
            // Using reverse geocoding from Nominatim (Free, no API key required)
            // Nominatim limits: 1 request per second max. Use email header.
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
                 headers: {
                      'Accept-Language': 'pt'
                 }
            });
            const data = await response.json();
            
            if (data && data.display_name) {
                // Simplify the string
                const parts = data.display_name.split(', ');
                const cleanAddress = parts.slice(0, 3).join(', ');
                setAddress(cleanAddress);
            }
        } catch (err) {
            console.error("Erro ao obter morada do mapa", err);
        }
    };

    return position === null ? null : (
        <Marker position={position} icon={jindungoIcon} />
    );
};

const MapPicker = ({ defaultLat, defaultLng, onLocationSelected }) => {
    const fallbackLat = -8.8390;
    const fallbackLng = 13.2894;
    const initialLat = defaultLat || fallbackLat;
    const initialLng = defaultLng || fallbackLng;

    const [position, setPosition] = useState(defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null);
    const [addressText, setAddressText] = useState("");
    const [isLocating, setIsLocating] = useState(false);

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
                 headers: { 'Accept-Language': 'pt' }
            });
            const data = await response.json();
            if (data && data.display_name) {
                const parts = data.display_name.split(', ');
                const cleanAddress = parts.slice(0, 3).join(', ');
                setAddressText(cleanAddress);
            }
        } catch (err) {
            console.error("Erro ao obter morada", err);
        }
    };

    const handleFindMe = () => {
        if (!("geolocation" in navigator)) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                fetchAddress(newPos.lat, newPos.lng);
                setIsLocating(false);
            },
            (err) => {
                console.error("Erro GPS:", err);
                setIsLocating(false);
                alert("Não foi possível aceder à sua localização. Verifique as permissões do navegador.");
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };
    
    // Auto-attempt GPS on mount ONLY if no saved location is provided
    useEffect(() => {
        if (!position && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(userLoc);
                fetchAddress(userLoc.lat, userLoc.lng); // Pre-fill address for new users
            }, () => {
                // If fail, defaults are used gracefully by map centering
            });
        }
    }, []);

    useEffect(() => {
        if (position) {
            onLocationSelected(position, addressText);
        }
    }, [position, addressText]);

    return (
        <div className="w-full flex inset-0 flex-col gap-2 relative">
            <div className="w-full h-[200px] rounded-xl overflow-hidden border-2 border-gray-200/50 shadow-inner relative z-0">
                <MapContainer center={[initialLat, initialLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <ChangeView center={position} />
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} setAddress={setAddressText} />
                </MapContainer>

                {/* Current Location Button Over Map */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleFindMe(); }}
                    className="absolute bottom-4 right-4 z-[1000] bg-white text-gray-800 p-2.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
                    title="Usar localização atual"
                >
                    {isLocating ? <Loader2 size={20} className="animate-spin text-[#D4AF37]" /> : <Navigation size={20} className="text-[#D4AF37]" />}
                </button>
                
                {!position && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[400] flex flex-col items-center justify-center text-white p-4 text-center pointer-events-none">
                        <MapPin size={32} className="mb-2 text-[#D4AF37] drop-shadow-md animate-bounce" />
                        <p className="font-bold drop-shadow-md">Toque no mapa para indicar a sua morada</p>
                    </div>
                )}
            </div>
            
            {position && (
                <div className="text-[10px] text-blue-500 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center justify-between gap-2">
                     <span>✓ GPS Associado à Encomenda</span>
                </div>
            )}
        </div>
    );
};

export default MapPicker;
