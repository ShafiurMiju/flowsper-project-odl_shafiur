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
