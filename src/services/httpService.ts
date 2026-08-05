const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const httpService = {
  joinRoom: `${API_BASE_URL}/api/v1/room/create-room-id`,
};
