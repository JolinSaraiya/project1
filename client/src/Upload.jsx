import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import EXIF from 'exif-js';

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
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload Image to Storage
            const { error: uploadError } = await supabase.storage
                .from('compost-evidence')
                .upload(filePath, image);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('compost-evidence')
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center">
                        <span className="mr-2">📸</span> Upload Evidence
                    </h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-white hover:bg-green-700 p-2 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Society</label>
                        <select
                            value={selectedSocietyId}
                            onChange={(e) => setSelectedSocietyId(e.target.value)}
                            required
                            className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md border"
                        >
                            <option value="">-- Helper Text --</option>
                            {societies.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capture Photo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                required
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                        Take a photo
                                    </span>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </div>

                    {previewUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity pointer-events-none"></div>
                        </div>
                    )}

                    <div className={`rounded-md p-4 ${location ? (isWithinRange ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-gray-100'
                        }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {location ? (
                                    isWithinRange ? (
                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                {location ? (
                                    <>
                                        <h3 className={`text-sm font-medium ${isWithinRange ? 'text-green-800' : 'text-red-800'}`}>
                                            Location Captured
                                        </h3>
                                        <div className={`mt-2 text-sm ${isWithinRange ? 'text-green-700' : 'text-red-700'}`}>
                                            <p>Coords: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                                            {distance !== null && (
                                                <p className="font-bold mt-1">
                                                    Distance: {distance.toFixed(0)}m
                                                    {!isWithinRange && " (Too far! Max 50m)"}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : locationError ? (
                                    <h3 className="text-sm font-medium text-red-800">{locationError}</h3>
                                ) : (
                                    <h3 className="text-sm font-medium text-gray-800">Waiting for location...</h3>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button
                            type="submit"
                            disabled={uploading || !location || (distance !== null && !isWithinRange)}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${(uploading || !location || (distance !== null && !isWithinRange)) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {uploading ? 'Uploading Evidence...' : 'Submit Claims'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
