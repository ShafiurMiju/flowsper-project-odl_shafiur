import {
  GHLContact,
  GHLContactsResponse,
  GHLOpportunity,
  GHLOpportunitiesResponse,
  GHLPipelinesResponse,
  CreateContactPayload,
  UpdateContactPayload,
  CreateOpportunityPayload,
  UpdateOpportunityPayload,
} from '@/types';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

class GHLClient {
  private apiKey: string;
  private locationId: string;

  constructor() {
    this.apiKey = process.env.GHL_API_KEY || '';
    this.locationId = process.env.GHL_LOCATION_ID || '';

    if (!this.apiKey || !this.locationId) {
      console.warn('GHL API Key or Location ID not configured');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GHL_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        ...options.headers,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL API Error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      throw new Error(
        `GHL API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // ==================== CONTACTS ====================

  async getContacts(limit = 100): Promise<GHLContactsResponse> {
    return this.request<GHLContactsResponse>(
      `/contacts/?locationId=${this.locationId}&limit=${limit}`
    );
  }

  async getContact(contactId: string): Promise<{ contact: GHLContact }> {
    return this.request<{ contact: GHLContact }>(`/contacts/${contactId}`);
  }

  async createContact(data: CreateContactPayload): Promise<{ contact: GHLContact }> {
    return this.request<{ contact: GHLContact }>('/contacts/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        locationId: this.locationId,
      }),
    });
  }

  async updateContact(
    contactId: string,
    data: Partial<CreateContactPayload>
  ): Promise<{ contact: GHLContact }> {
    return this.request<{ contact: GHLContact }>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(contactId: string): Promise<{ succeeded: boolean }> {
    return this.request<{ succeeded: boolean }>(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async searchContacts(query: string, limit = 20): Promise<GHLContactsResponse> {
    return this.request<GHLContactsResponse>(
      `/contacts/search?locationId=${this.locationId}&query=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  // ==================== OPPORTUNITIES ====================

  async getOpportunities(pipelineId?: string, limit = 100): Promise<GHLOpportunitiesResponse> {
    let url = `/opportunities/search?location_id=${this.locationId}&limit=${limit}`;
    if (pipelineId) {
      url += `&pipeline_id=${pipelineId}`;
    }
    return this.request<GHLOpportunitiesResponse>(url);
  }

  async getOpportunity(opportunityId: string): Promise<{ opportunity: GHLOpportunity }> {
    return this.request<{ opportunity: GHLOpportunity }>(
      `/opportunities/${opportunityId}`
    );
  }

  async createOpportunity(
    data: CreateOpportunityPayload
  ): Promise<{ opportunity: GHLOpportunity }> {
    // Convert camelCase to snake_case for GHL API
    const payload: Record<string, unknown> = {
      location_id: this.locationId,
      name: data.name,
      pipeline_id: data.pipelineId,
      pipeline_stage_id: data.pipelineStageId,
      contact_id: data.contactId,
    };

    if (data.monetaryValue !== undefined) payload.monetary_value = data.monetaryValue;
    if (data.status) payload.status = data.status;
    if (data.source) payload.source = data.source;
    if (data.assignedTo) payload.assigned_to = data.assignedTo;

    return this.request<{ opportunity: GHLOpportunity }>('/opportunities/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateOpportunity(
    opportunityId: string,
    data: Partial<CreateOpportunityPayload>
  ): Promise<{ opportunity: GHLOpportunity }> {
    // Convert camelCase to snake_case for GHL API
    const payload: Record<string, unknown> = {};

    if (data.name) payload.name = data.name;
    if (data.pipelineId) payload.pipeline_id = data.pipelineId;
    if (data.pipelineStageId) payload.pipeline_stage_id = data.pipelineStageId;
    if (data.contactId) payload.contact_id = data.contactId;
    if (data.monetaryValue !== undefined) payload.monetary_value = data.monetaryValue;
    if (data.status) payload.status = data.status;
    if (data.source) payload.source = data.source;
    if (data.assignedTo) payload.assigned_to = data.assignedTo;

    return this.request<{ opportunity: GHLOpportunity }>(
      `/opportunities/${opportunityId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteOpportunity(opportunityId: string): Promise<{ succeeded: boolean }> {
    return this.request<{ succeeded: boolean }>(`/opportunities/${opportunityId}`, {
      method: 'DELETE',
    });
  }

  async updateOpportunityStatus(
    opportunityId: string,
    status: 'open' | 'won' | 'lost' | 'abandoned'
  ): Promise<{ opportunity: GHLOpportunity }> {
    return this.updateOpportunity(opportunityId, { status });
  }

  async moveOpportunityStage(
    opportunityId: string,
    pipelineStageId: string
  ): Promise<{ opportunity: GHLOpportunity }> {
    return this.updateOpportunity(opportunityId, { pipelineStageId });
  }

  // ==================== PIPELINES ====================

  async getPipelines(): Promise<GHLPipelinesResponse> {
    return this.request<GHLPipelinesResponse>(
      `/opportunities/pipelines?locationId=${this.locationId}`
    );
  }

  // ==================== UTILITY ====================

  getLocationId(): string {
    return this.locationId;
  }
}

// Export a singleton instance
export const ghlClient = new GHLClient();
