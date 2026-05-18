import { useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook partagé pour l'upload d'avatar vers Supabase Storage.
 * Utilisé par OnboardingForm et EditProfileModal.
 */
export function useAvatarUpload(userId, initialUrl = '') {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local instantané
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError("Erreur lors du chargement de l'image. Veuillez réessayer.");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    avatarUrl,
    avatarPreview,
    uploading,
    error,
    fileInputRef,
    handleClick,
    handleFileChange,
    clearError,
    currentAvatar: avatarPreview || avatarUrl || null
  };
}
