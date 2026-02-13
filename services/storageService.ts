

/**
 * SERVICE DE STOCKAGE CLOUDINARY
 * 
 * Configuration actuelle :
 * Cloud Name : djiw7uooc
 * Upload Preset : cloudinary_storage (Unsigned)
 */

const CLOUDINARY_CLOUD_NAME = "djiw7uooc"; 
const CLOUDINARY_UPLOAD_PRESET = "cloudinary_storage";

export const storageService = {
    /**
     * Upload un fichier vers Cloudinary et retourne l'URL publique durable
     */
    uploadFile: async (file: File, path: string): Promise<string> => {
        // Validation simple du type
        if (!file.type.startsWith('image/')) {
            throw new Error("Le fichier doit être une image.");
        }

        // DO: Fix comparison error where '"djiw7uooc"' and '"votre_cloud_name"' have no overlap.
        // The service is already configured, so we remove the placeholder check.

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', path.split('/')[0]); // Organise dans des dossiers (ex: avatars)

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Échec de l'upload sur Cloudinary");
            }

            const data = await response.json();
            
            // Retourne l'URL sécurisée fournie par Cloudinary
            return data.secure_url;
        } catch (error) {
            console.error("Erreur Cloudinary:", error);
            throw error;
        }
    },

    /**
     * Note: La suppression physique nécessite une API signée (plus complexe).
     * Dans cette version gratuite, on se contente de détacher l'image du profil.
     */
    deleteFile: async (fileUrl: string): Promise<void> => {
        console.log("Image détachée du profil.");
        return Promise.resolve();
    }
};
