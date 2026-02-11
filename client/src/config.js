// Application Configuration Constants
// Centralized configuration to avoid hardcoded values across the application

export const CONFIG = {
    // Supabase Storage
    STORAGE_BUCKET: 'compost-evidence',

    // Tax and Rewards
    TAX_DISCOUNT_RATE: 0.05, // 5% discount per approved submission

    // Geolocation
    GEO_FENCE_RADIUS_METERS: 50, // Maximum distance from society location

    // Server
    DEFAULT_PORT: 5000,
};

export default CONFIG;
