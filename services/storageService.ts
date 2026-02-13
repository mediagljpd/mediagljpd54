
/**
 * SERVICE DE STOCKAGE CLOUDINARY
 * 
 * Instructions de migration :
 * 1. Remplacez CLOUDINARY_CLOUD_NAME par votre nouveau "Cloud Name".
 * 2. Remplacez CLOUDINARY_UPLOAD_PRESET par le nom de votre nouveau "Upload Preset" (configuré en mode 'Unsigned').
 */

const dq0m5r59m = "VOTRE_NOUVEAU_CLOUD_NAME"; 
const image_storage = "VOTRE_NOUVEAU_PRESET_NAME";

export const storageService = {
    /**
     * Upload un fichier vers Cloudinary et retourne l'URL publique durable
     */
    uploadFile: async (file: File, path: string): Promise<string> => {
        // Validation simple du type
        if (!file.type.startsWith('image/')) {
            throw new Error("Le fichier doit être une image.");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', image_storage);
        formData.append('folder', path.split('/')[0]); // Organise dans des dossiers (ex: avatars)

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${dq0m5r59m}/image/upload`,
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
