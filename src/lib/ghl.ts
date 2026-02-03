import {
  GHLContact,
  GHLContactsResponse,
  GHLOpportunity,
  GHLOpportunitiesResponse,
  GHLPipelinesResponse,
  CreateContactPayload,
  CreateOpportunityPayload,
  GHLConversation,
  GHLConversationsResponse,
  GHLMessage,
  GHLMessagesResponse,
  CreateMessagePayload,
  GHLVoiceAgent,
  GHLVoiceAgentsResponse,
  CreateVoiceAgentPayload,
  UpdateVoiceAgentPayload,
  GHLVoiceAgentCall,
  GHLVoiceAgentCallsResponse,
  GHLVoiceCallLog,
  GHLVoiceCallLogsResponse,
  GHLVoiceAction,
  CreateVoiceActionPayload,
  UpdateVoiceActionPayload,
  VoiceActionType,
  GHLPhoneNumber,
  GHLPhoneNumbersResponse,
} from '@/types';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

/**
 * Multi-tenant GHL Client
 * Now accepts apiKey and locationId per request instead of using env vars
 */
export class GHLClient {
  private apiKey: string;
  private locationId: string;

  constructor(apiKey?: string, locationId?: string) {
    // Fallback to env vars for backward compatibility
    this.apiKey = apiKey || process.env.GHL_API_KEY || '';
    this.locationId = locationId || process.env.GHL_LOCATION_ID || '';

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

  // Request with specific API version (for Voice AI which uses 2021-04-15)
  private async requestWithVersion<T>(
    endpoint: string,
    version: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GHL_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': version,
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

  // Request with specific API version that returns no content (for DELETE)
  private async requestWithVersionRaw(
    endpoint: string,
    version: string,
    options: RequestInit = {}
  ): Promise<void> {
    const url = `${GHL_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': version,
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
    // GHL API uses camelCase for request body
    const payload: Record<string, unknown> = {
      locationId: this.locationId,
      name: data.name,
      pipelineId: data.pipelineId,
      pipelineStageId: data.pipelineStageId,
      contactId: data.contactId,
    };

    if (data.monetaryValue !== undefined) payload.monetaryValue = data.monetaryValue;
    if (data.status) payload.status = data.status;
    if (data.source) payload.source = data.source;
    if (data.assignedTo) payload.assignedTo = data.assignedTo;

    return this.request<{ opportunity: GHLOpportunity }>('/opportunities/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateOpportunity(
    opportunityId: string,
    data: Partial<CreateOpportunityPayload>
  ): Promise<{ opportunity: GHLOpportunity }> {
    // GHL API uses camelCase for request body
    const payload: Record<string, unknown> = {};

    if (data.name) payload.name = data.name;
    if (data.pipelineId) payload.pipelineId = data.pipelineId;
    if (data.pipelineStageId) payload.pipelineStageId = data.pipelineStageId;
    if (data.contactId) payload.contactId = data.contactId;
    if (data.monetaryValue !== undefined) payload.monetaryValue = data.monetaryValue;
    if (data.status) payload.status = data.status;
    if (data.source) payload.source = data.source;
    if (data.assignedTo) payload.assignedTo = data.assignedTo;

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

  // ==================== CONVERSATIONS ====================

  async getConversations(limit = 100, query?: string): Promise<GHLConversationsResponse> {
    let url = `/conversations/search?locationId=${this.locationId}&limit=${limit}`;
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    return this.request<GHLConversationsResponse>(url);
  }

  async getConversation(conversationId: string): Promise<{ conversation: GHLConversation }> {
    return this.request<{ conversation: GHLConversation }>(
      `/conversations/${conversationId}`
    );
  }

  async getConversationMessages(
    conversationId: string,
    limit = 100,
    lastMessageId?: string
  ): Promise<GHLMessagesResponse> {
    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (lastMessageId) {
      url += `&lastMessageId=${lastMessageId}`;
    }
    return this.request<GHLMessagesResponse>(url);
  }

  async sendMessage(data: CreateMessagePayload): Promise<{ message: GHLMessage; conversation: GHLConversation }> {
    const payload: Record<string, unknown> = {
      type: data.type,
      contactId: data.contactId,
      locationId: this.locationId,
    };

    if (data.message) payload.message = data.message;
    if (data.subject) payload.subject = data.subject;
    if (data.html) payload.html = data.html;
    if (data.attachments) payload.attachments = data.attachments;
    if (data.conversationId) payload.conversationId = data.conversationId;

    return this.request<{ message: GHLMessage; conversation: GHLConversation }>(
      '/conversations/messages',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/conversations/${conversationId}/read`,
      {
        method: 'PUT',
      }
    );
  }

  async markConversationAsUnread(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/conversations/${conversationId}/unread`,
      {
        method: 'PUT',
      }
    );
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/conversations/${conversationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async cancelScheduledMessage(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/conversations/messages/${messageId}/schedule`,
      {
        method: 'DELETE',
      }
    );
  }

  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('locationId', this.locationId);

    const response = await fetch(`${GHL_API_BASE}/medias/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Version': '2021-07-28',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // ==================== AI VOICE AGENTS ====================

  async getVoiceAgents(page = 1, pageSize = 50): Promise<GHLVoiceAgentsResponse> {
    const url = `/voice-ai/agents?locationId=${this.locationId}&page=${page}&pageSize=${pageSize}`;
    return this.requestWithVersion<GHLVoiceAgentsResponse>(url, '2021-04-15');
  }

  async getVoiceAgent(agentId: string): Promise<GHLVoiceAgent> {
    const url = `/voice-ai/agents/${agentId}?locationId=${this.locationId}`;
    return this.requestWithVersion<GHLVoiceAgent>(url, '2021-04-15');
  }

  async createVoiceAgent(data: CreateVoiceAgentPayload): Promise<GHLVoiceAgent> {
    return this.requestWithVersion<GHLVoiceAgent>('/voice-ai/agents', '2021-04-15', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        locationId: this.locationId,
      }),
    });
  }

  async updateVoiceAgent(
    agentId: string,
    data: Partial<CreateVoiceAgentPayload>
  ): Promise<GHLVoiceAgent> {
    const url = `/voice-ai/agents/${agentId}?locationId=${this.locationId}`;
    return this.requestWithVersion<GHLVoiceAgent>(url, '2021-04-15', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteVoiceAgent(agentId: string): Promise<void> {
    const url = `/voice-ai/agents/${agentId}?locationId=${this.locationId}`;
    await this.requestWithVersionRaw(url, '2021-04-15', {
      method: 'DELETE',
    });
  }

  async getVoiceAgentCalls(agentId: string): Promise<GHLVoiceAgentCallsResponse> {
    return this.requestWithVersion<GHLVoiceAgentCallsResponse>(
      `/voice-ai/agents/${agentId}/calls?locationId=${this.locationId}`,
      '2021-04-15'
    );
  }

  async triggerVoiceCall(agentId: string, phoneNumber: string, contactId?: string): Promise<{ call: GHLVoiceAgentCall }> {
    const url = `/voice-ai/agents/${agentId}/call?locationId=${this.locationId}`;
    return this.requestWithVersion<{ call: GHLVoiceAgentCall }>(url, '2021-04-15', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        contactId,
      }),
    });
  }

  // ==================== VOICE AI CALL LOGS (Dashboard) ====================

  async getVoiceCallLogs(options: {
    agentId?: string;
    contactId?: string;
    callType?: 'LIVE' | 'TRIAL';
    startDate?: number;
    endDate?: number;
    actionType?: VoiceActionType[];
    sortBy?: 'duration' | 'createdAt';
    sort?: 'ascend' | 'descend';
    page?: number;
    pageSize?: number;
  } = {}): Promise<GHLVoiceCallLogsResponse> {
    const params = new URLSearchParams({ locationId: this.locationId });
    
    if (options.agentId) params.append('agentId', options.agentId);
    if (options.contactId) params.append('contactId', options.contactId);
    if (options.callType) params.append('callType', options.callType);
    if (options.startDate) params.append('startDate', options.startDate.toString());
    if (options.endDate) params.append('endDate', options.endDate.toString());
    if (options.actionType?.length) params.append('actionType', options.actionType.join(','));
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sort) params.append('sort', options.sort);
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('pageSize', options.pageSize.toString());

    return this.requestWithVersion<GHLVoiceCallLogsResponse>(
      `/voice-ai/dashboard/call-logs?${params.toString()}`,
      '2021-04-15'
    );
  }

  async getVoiceCallLog(callId: string): Promise<GHLVoiceCallLog> {
    return this.requestWithVersion<GHLVoiceCallLog>(
      `/voice-ai/dashboard/call-logs/${callId}?locationId=${this.locationId}`,
      '2021-04-15'
    );
  }

  // ==================== VOICE AI ACTIONS ====================

  async createVoiceAction(data: CreateVoiceActionPayload): Promise<GHLVoiceAction> {
    return this.requestWithVersion<GHLVoiceAction>('/voice-ai/actions', '2021-04-15', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        locationId: this.locationId,
      }),
    });
  }

  async getVoiceAction(actionId: string): Promise<GHLVoiceAction> {
    return this.requestWithVersion<GHLVoiceAction>(
      `/voice-ai/actions/${actionId}?locationId=${this.locationId}`,
      '2021-04-15'
    );
  }

  async updateVoiceAction(
    actionId: string,
    data: UpdateVoiceActionPayload
  ): Promise<GHLVoiceAction> {
    return this.requestWithVersion<GHLVoiceAction>(
      `/voice-ai/actions/${actionId}`,
      '2021-04-15',
      {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          locationId: this.locationId,
        }),
      }
    );
  }

  async deleteVoiceAction(actionId: string, agentId: string): Promise<void> {
    const url = `/voice-ai/actions/${actionId}?locationId=${this.locationId}&agentId=${agentId}`;
    await this.requestWithVersionRaw(url, '2021-04-15', {
      method: 'DELETE',
    });
  }

  /**
   * Get phone numbers for a location using Phone System API
   * @see https://marketplace.gohighlevel.com/docs/ghl/phone-system/active-numbers
   */
  /**
   * Get phone numbers for location using Phone System API
   * @see https://marketplace.gohighlevel.com/docs/ghl/phone-system/active-numbers
   */
  async getPhoneNumbers(): Promise<GHLPhoneNumbersResponse> {
    console.log('📞 getPhoneNumbers called for locationId:', this.locationId);
    const response = await this.request<{ numbers: GHLPhoneNumber[] }>(
      `/phone-system/numbers/location/${this.locationId}?pageSize=1000&skipNumberPool=false`
    );
    console.log('📞 Raw GHL response:', JSON.stringify(response, null, 2));
    return {
      phoneNumbers: response.numbers || [],
      total: response.numbers?.length || 0,
    };
  }

  // ==================== KNOWLEDGE BASE ====================

  /**
   * List all knowledge bases (paginated)
   * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/list-all-knowledge-bases-paginated
   */
  async getKnowledgeBases(page = 1, limit = 50): Promise<any> {
    return this.requestWithVersion(
      `/voice-ai/knowledge-bases?locationId=${this.locationId}&page=${page}&limit=${limit}`,
      '2021-04-15'
    );
  }

  // ==================== UTILITY ====================

  getLocationId(): string {
    return this.locationId;
  }

  getApiKey(): string {
    return this.apiKey;
  }
}

/**
 * Create a GHL client for a specific sub-account
 */
export function createGHLClient(apiKey: string, locationId: string): GHLClient {
  return new GHLClient(apiKey, locationId);
}

// Export a singleton instance for backward compatibility (uses env vars)
export const ghlClient = new GHLClient();
