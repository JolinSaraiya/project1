import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import EXIF from 'exif-js';
import CONFIG from './config';
import { SparklesText } from './components/SparklesText';

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

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
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
                setIsWithinRange(dist <= CONFIG.GEO_FENCE_RADIUS_METERS);
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

        EXIF.getData(file, function () {
            const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
            const lat = EXIF.getTag(this, "GPSLatitude");
            const lon = EXIF.getTag(this, "GPSLongitude");

            console.log("EXIF Data:", { dateTimeOriginal, lat, lon });

            if (dateTimeOriginal) {
                const [datePart, timePart] = dateTimeOriginal.split(" ");
                const [year, month, day] = datePart.split(":");
                const [hour, minute, second] = timePart.split(":");

                const photoDate = new Date(year, month - 1, day, hour, minute, second);
                const now = new Date();
                const diffHours = (now - photoDate) / (1000 * 60 * 60);

                if (diffHours > 2) {
                    alert(`⚠️ Anti-Cheat Warning: This photo was taken ${diffHours.toFixed(1)} hours ago. You must upload evidence immediately (within 2 hours). Upload Rejected.`);
                    e.target.value = "";
                    return;
                }
            } else {
                console.warn("No EXIF Timestamp found.");
            }

            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setExifData({ dateTimeOriginal, lat, lon });

            if (!navigator.geolocation) {
                setLocationError('Geolocation is not supported by your browser');
            } else {
                setUploading(true);
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

            const { error: uploadError } = await supabase.storage
                .from(CONFIG.STORAGE_BUCKET)
                .upload(filePath, image);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(CONFIG.STORAGE_BUCKET)
                .getPublicUrl(filePath);

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full modern-card">
                <div className="text-center mb-8">
                    <SparklesText
                        text="Upload Evidence"
                        className="text-4xl mb-2"
                        colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                        sparklesCount={8}
                    />
                    <p className="text-gray-400 mt-4">📸 Submit your waste disposal proof</p>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                    {/* Society Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Society
                        </label>
                        <select
                            value={selectedSocietyId}
                            onChange={(e) => setSelectedSocietyId(e.target.value)}
                            className="modern-input w-full"
                            required
                        >
                            <option value="">-- Choose a verified society --</option>
                            {societies.map((society) => (
                                <option key={society.id} value={society.id}>
                                    {society.name} - {society.address}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Upload Photo Evidence
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="modern-input w-full"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            ⚠️ Photo must be taken within the last 2 hours
                        </p>
                    </div>

                    {/* Image Preview */}
                    {previewUrl && (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-3">Preview:</p>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-lg border border-slate-700"
                            />
                        </div>
                    )}

                    {/* Location Status */}
                    {location && (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">📍 Location Captured:</span>
                                <span className="text-sm text-green-400 font-semibold">✓ Success</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                            {distance !== null && (
                                <div className="pt-2 border-t border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Distance from society:</span>
                                        <span className={`text-sm font-semibold ${isWithinRange ? 'text-green-400' : 'text-red-400'}`}>
                                            {distance.toFixed(0)}m {isWithinRange ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    {!isWithinRange && (
                                        <p className="text-xs text-red-400 mt-2">
                                            ⚠️ You must be within {CONFIG.GEO_FENCE_RADIUS_METERS}m of the society location
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {locationError && (
                        <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                            {locationError}
                        </div>
                    )}

                    {/* EXIF Data */}
                    {exifData?.dateTimeOriginal && (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-2">📅 Photo Timestamp:</p>
                            <p className="text-sm text-white">{exifData.dateTimeOriginal}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="modern-btn flex-1"
                        >
                            ← Back
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !isWithinRange}
                            className="btn-primary flex-1"
                        >
                            {uploading ? 'Uploading...' : '📤 Submit Evidence'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
