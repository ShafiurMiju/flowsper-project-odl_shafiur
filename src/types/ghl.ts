// GHL Contact Types
export interface GHLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  timezone?: string;
  dnd?: boolean;
  tags?: string[];
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
  customFields?: Record<string, unknown>;
}

export interface CreateContactPayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  timezone?: string;
  dnd?: boolean;
  tags?: string[];
  source?: string;
  customFields?: { id: string; value: string }[];
}

export interface UpdateContactPayload extends Partial<CreateContactPayload> {
  id: string;
}

// GHL Opportunity Types
export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue?: number;
  pipelineId: string;
  pipelineStageId: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  source?: string;
  contactId: string;
  locationId: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  contact?: GHLContact;
}

export interface CreateOpportunityPayload {
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
  contactId: string;
  source?: string;
  assignedTo?: string;
}

export interface UpdateOpportunityPayload extends Partial<CreateOpportunityPayload> {
  id: string;
}

// GHL Pipeline Types
export interface GHLPipelineStage {
  id: string;
  name: string;
  position: number;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
  locationId: string;
}

// API Response Types
export interface GHLContactsResponse {
  contacts: GHLContact[];
  meta?: {
    total: number;
    currentPage: number;
    nextPage?: number;
    prevPage?: number;
  };
}

export interface GHLOpportunitiesResponse {
  opportunities: GHLOpportunity[];
  meta?: {
    total: number;
    currentPage: number;
    nextPage?: number;
    prevPage?: number;
  };
}

export interface GHLPipelinesResponse {
  pipelines: GHLPipeline[];
}

// GHL Conversation Types
export interface GHLMessage {
  id: string;
  conversationId: string;
  locationId: string;
  contactId: string;
  body: string;
  type: 'SMS' | 'Email' | 'GMB' | 'IG' | 'FB' | 'WhatsApp' | 'Live_Chat' | 'Custom';
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  contentType?: string;
  attachments?: string[];
  userId?: string;
  dateAdded: string;
  meta?: Record<string, unknown>;
}

export interface GHLConversation {
  id: string;
  locationId: string;
  contactId: string;
  type: 'SMS' | 'Email' | 'GMB' | 'IG' | 'FB' | 'WhatsApp' | 'Live_Chat' | 'Custom';
  unreadCount: number;
  lastMessageDate: string;
  lastMessageBody?: string;
  lastMessageType?: string;
  starred?: boolean;
  deleted?: boolean;
  contact?: GHLContact;
  fullName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

export interface CreateMessagePayload {
  type: 'SMS' | 'Email' | 'WhatsApp';
  contactId: string;
  message?: string;
  subject?: string; // For email
  html?: string; // For email
  attachments?: string[];
  conversationId?: string;
}

export interface GHLConversationsResponse {
  conversations: GHLConversation[];
  total?: number;
}

export interface GHLMessagesResponse {
  messages: GHLMessage[];
  total?: number;
}
