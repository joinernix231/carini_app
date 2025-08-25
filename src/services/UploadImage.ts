import API from './api';

export const uploadImage = async (uri: string, name: string, token: string) => {
  const formData = new FormData();

  formData.append('image', {
    uri,
    type: 'image/jpeg',
    name,
  } as any);

  formData.append('name', name);

  const response = await API.post('/api/loadImage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
