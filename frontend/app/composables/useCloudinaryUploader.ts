export const useCloudinaryUploader = () => {
  const config = useRuntimeConfig();
  const cloudName = config.public.CLOUDINARY_CLOUD_NAME as string;
  const uploadPreset = config.public.CLOUDINARY_UPLOAD_PRESET as string;

  // --- Upload image file
  const uploadImage = async (file: File | Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Image upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.secure_url;
  };

  // --- Upload JSON metadata
  const uploadJson = async (json: object): Promise<string> => {
    // Convert JSON to base64 data URI (lebih aman)
    const jsonString = JSON.stringify(json);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `JSON upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.secure_url;
  };

  return { uploadImage, uploadJson };
};
