import { toast } from "sonner";
import { API_CONFIG } from "./api.config";

export async function getRegions() {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.regions}`, {
      headers: API_CONFIG.headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch regions");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    toast.error('something went wrong')
    return [];
  }
}
