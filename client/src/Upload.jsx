import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import EXIF from 'exif-js';
import CONFIG from './config';

const Upload = ({ session }) => {
    const navigate = useNavigate();
    const locationState = useLocation();
    const [societies, setSocieties] = useState([]);
    const [selectedSocietyId, setSelectedSocietyId] = useState(locationState.state?.societyId || '');
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [distance, setDistance] = useState(null);
    const [isWithinRange, setIsWithinRange] = useState(false);
    const [exifData, setExifData] = useState(null);

    useEffect(() => {
        fetchSocieties();
    }, []);

    // Haversine formula to calculate distance in meters
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    useEffect(() => {
        if (selectedSocietyId && location && societies.length > 0) {
            const society = societies.find(s => s.id === selectedSocietyId);
            if (society && society.latitude && society.longitude) {
                const dist = calculateDistance(
                    location.latitude,
                    location.longitude,
                    society.latitude,
                    society.longitude
                );
                setDistance(dist);
                setIsWithinRange(dist <= 50); // 50 meters threshold
            }
        }
    }, [selectedSocietyId, location, societies]);

    const fetchSocieties = async () => {
        try {
            const { data, error } = await supabase.from('societies').select('*').eq('is_verified', true);
            if (error) throw error;
            setSocieties(data || []);
        } catch (error) {
            console.error('Error fetching societies:', error.message);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Anti-Cheat: EXIF Check
        EXIF.getData(file, function () {
            const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
            const lat = EXIF.getTag(this, "GPSLatitude");
            const lon = EXIF.getTag(this, "GPSLongitude");

            console.log("EXIF Data:", { dateTimeOriginal, lat, lon });

            if (dateTimeOriginal) {
                // Parse "YYYY:MM:DD HH:MM:SS"
                const [datePart, timePart] = dateTimeOriginal.split(" ");
                const [year, month, day] = datePart.split(":");
                const [hour, minute, second] = timePart.split(":");

                const photoDate = new Date(year, month - 1, day, hour, minute, second);
                const now = new Date();
                const diffHours = (now - photoDate) / (1000 * 60 * 60);

                if (diffHours > 2) {
                    alert(`⚠️ Anti-Cheat Warning: This photo was taken ${diffHours.toFixed(1)} hours ago. You must upload evidence immediately (within 2 hours). Upload Rejected.`);
                    e.target.value = ""; // Reset input
                    return;
                }
            } else {
                console.warn("No EXIF Timestamp found.");
            }

            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setExifData({ dateTimeOriginal, lat, lon });

            // Capture Geolocation immediately when file is selected
            if (!navigator.geolocation) {
                setLocationError('Geolocation is not supported by your browser');
            } else {
                setUploading(true); // Show some activity while getting location
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        setUploading(false);
                    },
                    (error) => {
                        setLocationError('Unable to retrieve your location: ' + error.message);
                        setUploading(false);
                    }
                );
            }
        });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!image || !selectedSocietyId || !location) {
            alert('Please select a society, an image, and ensure location is captured.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = image.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload Image to Storage
            const { error: uploadError } = await supabase.storage
                .from(CONFIG.STORAGE_BUCKET)
                .upload(filePath, image);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(CONFIG.STORAGE_BUCKET)
                .getPublicUrl(filePath);

            // 3. Insert Record into Database
            const { error: dbError } = await supabase
                .from('compost_logs')
                .insert([
                    {
                        society_id: selectedSocietyId,
                        image_url: publicUrl,
                        verified_lat: location.latitude,
                        verified_long: location.longitude,
                        status: 'pending'
                    }
                ]);

            if (dbError) throw dbError;

            alert('Evidence uploaded successfully!');
            navigate('/dashboard');

        } catch (error) {
            console.error('Error uploading evidence:', error.message);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="max-w-lg w-full glass-card relative z-10 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center drop-shadow-md">
                        <span className="mr-3 text-3xl">📸</span> Upload Evidence
                    </h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-blue-100 uppercase tracking-widest mb-2 ml-1">Select Society</label>
                        <div className="relative">
                            <select
                                value={selectedSocietyId}
                                onChange={(e) => setSelectedSocietyId(e.target.value)}
                                required
                                className="block w-full input-glass appearance-none cursor-pointer"
                            >
                                <option value="" className="text-gray-800">-- Select Society --</option>
                                {societies.map((s) => (
                                    <option key={s.id} value={s.id} className="text-gray-800">{s.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-blue-100 uppercase tracking-widest mb-2 ml-1">Evidence Photo</label>
                        <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed border-white/20 rounded-2xl hover:border-green-400/50 hover:bg-white/5 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                required
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="space-y-2 text-center relative z-10">
                                <div className="mx-auto h-16 w-16 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="h-8 w-8 text-white/80" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="text-sm text-blue-100 font-medium">
                                    Tap to Capture
                                </div>
                                <p className="text-xs text-blue-200/60">Geo-tagging enabled</p>
                            </div>
                        </div>
                    </div>

                    {previewUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                            <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        </div>
                    )}

                    <div className={`rounded-xl p-4 backdrop-blur-md border transition-all ${location ? (isWithinRange ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30') : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {location ? (
                                    isWithinRange ? (
                                        <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 animate-pulse">
                                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-300">
                                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                                        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    </div>
                                )}
                            </div>
                            <div className="ml-4">
                                {location ? (
                                    <>
                                        <h3 className={`text-sm font-bold ${isWithinRange ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {isWithinRange ? 'Location Verified' : 'Location Check Failed'}
                                        </h3>
                                        <div className={`mt-1 text-xs font-mono opacity-80 ${isWithinRange ? 'text-emerald-100' : 'text-red-100'}`}>
                                            {distance !== null && (
                                                <span>Distance: {distance.toFixed(0)}m {isWithinRange ? '✅' : '(>50m) ❌'}</span>
                                            )}
                                        </div>
                                    </>
                                ) : locationError ? (
                                    <h3 className="text-sm font-bold text-red-300">{locationError}</h3>
                                ) : (
                                    <h3 className="text-sm font-bold text-white/70">Acquiring Satellites...</h3>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3 pt-2">
                        <button
                            type="submit"
                            disabled={uploading || !location || (distance !== null && !isWithinRange)}
                            className={`w-full btn-glass bg-gradient-to-r from-green-400 to-emerald-600 border-0 shadow-lg shadow-green-500/20 ${(uploading || !location || (distance !== null && !isWithinRange)) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'
                                }`}
                        >
                            {uploading ? 'Transmitting Data...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
