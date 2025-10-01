import { DriverForm, TruckForm, ContractorForm, MissionForm, User } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }) as { message: string; user: User; token: string };
    
    // Return in the format expected by the auth context
    return {
      user: response.user,
      token: response.token,
    };
  }

  async register(userData: {
    email: string;
    name: string;
    password: string;
    role: string;
    organizationName: string;
  }) {
    const response = await this.request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }) as { message: string; user: User; token: string };
    
    // Return in the format expected by the auth context
    return {
      user: response.user,
      token: response.token,
    };
  }

  async getProfile() {
    const response = await this.request('/api/users/profile') as { user: User };
    return response;
  }

  // Drivers
  async getDrivers() {
    try {
      const response = await this.request<{ success?: boolean; data?: unknown }>('/api/gaza/drivers');
      console.log('getDrivers response:', response);
      // Backend returns { success: true, data: drivers }, extract the drivers array
      return response.data || response;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async createDriver(driverData: DriverForm) {
    return this.request('/api/gaza/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async updateDriver(id: string, driverData: Partial<DriverForm>) {
    return this.request(`/api/gaza/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
  }

  async deleteDriver(id: string) {
    return this.request(`/api/gaza/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  async getDriverStats() {
    try {
      const response = await this.request('/api/gaza/drivers/stats');
      console.log('getDriverStats response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      // Return null to indicate stats are not available
      return null;
    }
  }

  async bulkImportDrivers(formData: FormData) {
    const token = localStorage.getItem('token');
    return fetch(`${this.baseURL}/api/gaza/drivers/bulk-import`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json());
  }

  // Trucks
  async getTrucks() {
    const response = await this.request<{ success?: boolean; data?: unknown }>('/api/gaza/trucks');
    // Backend returns { success: true, data: trucks }, extract the trucks array
    return response.data || response;
  }

  async createTruck(truckData: TruckForm) {
    return this.request('/api/gaza/trucks', {
      method: 'POST',
      body: JSON.stringify(truckData),
    });
  }

  async updateTruck(id: string, truckData: Partial<TruckForm>) {
    return this.request(`/api/gaza/trucks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(truckData),
    });
  }

  async updateTruckStatus(id: string, statusData: { status: string; notes?: string }) {
    return this.request(`/api/gaza/trucks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  }

  async deleteTruck(id: string) {
    return this.request(`/api/gaza/trucks/${id}`, {
      method: 'DELETE',
    });
  }

  async approveTruck(id: string) {
    return this.request(`/api/gaza/trucks/${id}/approve`, {
      method: 'POST',
    });
  }

  async getTruckStats() {
    return this.request('/api/gaza/trucks/stats');
  }

  // Contractors
  async getContractors() {
    const url = `${this.baseURL}/api/gaza/contractors`;
    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        headers,
      });

      // If endpoint doesn't exist (404), return empty array silently
      if (response.status === 404) {
        console.warn('Contractors endpoint not implemented yet (404) - returning empty array');
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      // If it's a network error or the fetch itself failed, treat as if endpoint doesn't exist
      console.warn('Contractors endpoint not available - returning empty array:', error);
      return [];
    }
  }

  async createContractor(contractorData: ContractorForm) {
    return this.request('/api/gaza/contractors', {
      method: 'POST',
      body: JSON.stringify(contractorData),
    });
  }

  // Missions
  async getMissions() {
    return this.request('/api/gaza/missions');
  }

  async createMission(missionData: MissionForm) {
    return this.request('/api/gaza/missions', {
      method: 'POST',
      body: JSON.stringify(missionData),
    });
  }

  async updateMission(id: string, missionData: Partial<MissionForm>) {
    return this.request(`/api/gaza/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(missionData),
    });
  }

  // Health checks
  async healthCheck() {
    return this.request('/api/gaza/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;