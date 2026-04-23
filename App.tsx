
/**
 * SERVICE DE STOCKAGE CLOUDINARY
 * 
 * Instructions :
 * 1. Remplacez la valeur de CLOUDINARY_CLOUD_NAME par votre "Cloud Name" (ex: "djiw7uooc").
 * 2. Remplacez la valeur de CLOUDINARY_UPLOAD_PRESET par votre "Upload Preset" non signé (ex: "ml_default").
 */

const CLOUDINARY_CLOUD_NAME = "dq0m5r59m"; // <-- REMPLACER ICI
const CLOUDINARY_UPLOAD_PRESET = "image_storage"; // <-- REMPLACER ICI

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
                console.error("Détails de l'erreur Cloudinary:", errorData);
                throw new Error(errorData.error?.message || "Échec de l'upload sur Cloudinary");
            }

            const data = await response.json();
            
            // Retourne l'URL sécurisée fournie par Cloudinary
            return data.secure_url;
        } catch (error) {
            console.error("Erreur lors de l'appel API Cloudinary:", error);
            throw error;
        }
    },

    /**
     * Détache l'image (la suppression physique nécessite une API signée).
     */
    deleteFile: async (fileUrl: string): Promise<void> => {
        console.log("Image détachée du profil.");
        return Promise.resolve();
    }
};
