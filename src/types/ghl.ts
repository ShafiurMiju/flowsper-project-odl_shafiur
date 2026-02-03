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

// GHL Phone Number Types
export interface GHLPhoneNumber {
  id: string;
  locationId: string;
  phoneNumber: string;
  friendlyName?: string;
  type?: 'local' | 'tollfree' | 'mobile';
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
  status?: 'active' | 'inactive';
  dateAdded?: string;
}

export interface GHLPhoneNumbersResponse {
  phoneNumbers: GHLPhoneNumber[];
  total: number;
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

// AI Voice Agent Types
// Voice AI Agent Types (Based on official GHL API docs)
export interface GHLVoiceAgent {
  id: string;
  locationId: string;
  agentName: string;
  businessName: string;
  welcomeMessage: string;
  agentPrompt: string;
  voiceId: string;
  language: string;
  patienceLevel: 'low' | 'medium' | 'high';
  maxCallDuration: number;
  sendUserIdleReminders: boolean;
  reminderAfterIdleTimeSeconds: number;
  inboundNumber?: string | null;
  inboundNumbers?: string[];
  numberPoolId?: string | null;
  callEndWorkflowIds?: string[];
  sendPostCallNotificationTo?: {
    admins?: boolean;
    allUsers?: boolean;
    contactAssignedUser?: boolean;
    specificUsers?: string[];
    customEmails?: string[];
  };
  agentWorkingHours?: {
    dayOfTheWeek: number;
    intervals: {
      startHour: number;
      startMinute: number;
      endHour: number;
      endMinute: number;
    }[];
  }[];
  timezone: string;
  isAgentAsBackupDisabled: boolean;
  translation?: {
    enabled: boolean;
    language?: string | null;
  };
  actions?: any[];
  prompts?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVoiceAgentPayload {
  locationId?: string; // Will be injected by GHL client
  agentName?: string;
  businessName?: string;
  welcomeMessage?: string;
  agentPrompt?: string;
  voiceId?: string;
  llmModel?: string; // LLM model selection
  knowledgeBaseId?: string; // Knowledge base ID
  language?: 'en-US' | 'pt-BR' | 'es' | 'fr' | 'de' | 'it' | 'nl-NL' | 'multi';
  patienceLevel?: 'low' | 'medium' | 'high';
  maxCallDuration?: number;
  sendUserIdleReminders?: boolean;
  reminderAfterIdleTimeSeconds?: number;
  inboundNumber?: string;
  numberPoolId?: string;
  callEndWorkflowIds?: string[];
  sendPostCallNotificationTo?: {
    admins?: boolean;
    allUsers?: boolean;
    contactAssignedUser?: boolean;
    specificUsers?: string[];
    customEmails?: string[];
  };
  agentWorkingHours?: {
    dayOfTheWeek: number;
    intervals: {
      startHour: number;
      startMinute: number;
      endHour: number;
      endMinute: number;
    }[];
  }[];
  timezone?: string;
  isAgentAsBackupDisabled?: boolean;
  translation?: {
    enabled: boolean;
    language?: string;
  };
}

export interface UpdateVoiceAgentPayload extends Partial<CreateVoiceAgentPayload> {
  id: string;
}

export interface GHLVoiceAgentGoal {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  type: 'appointment' | 'qualification' | 'information' | 'transfer' | 'custom';
  targetValue?: number;
  currentValue?: number;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  updatedAt?: string;
}

export interface GHLVoiceAgentCall {
  id: string;
  agentId: string;
  contactId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  status: 'completed' | 'failed' | 'no-answer' | 'busy';
  recordingUrl?: string;
  transcription?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  goalsAchieved?: string[];
  createdAt: string;
}

export interface GHLVoiceAgentsResponse {
  agents: GHLVoiceAgent[];
  total?: number;
}

export interface GHLVoiceAgentCallsResponse {
  calls: GHLVoiceAgentCall[];
  total?: number;
}

// Voice AI Call Log Types (Dashboard)
export interface GHLVoiceCallLog {
  id: string;
  contactId?: string;
  agentId: string;
  isAgentDeleted: boolean;
  fromNumber?: string;
  createdAt: string;
  duration: number;
  trialCall: boolean;
  executedCallActions: {
    actionType: VoiceActionType;
    name: string;
    success: boolean;
  }[];
  summary: string;
  transcript: string;
  translation?: {
    enabled: boolean;
    language?: string;
  };
  extractedData?: Record<string, any>;
  messageId?: string;
}

export interface GHLVoiceCallLogsResponse {
  total: number;
  page: number;
  pageSize: number;
  callLogs: GHLVoiceCallLog[];
}

// Voice AI Action Types
export type VoiceActionType = 
  | 'CALL_TRANSFER'
  | 'DATA_EXTRACTION'
  | 'IN_CALL_DATA_EXTRACTION'
  | 'WORKFLOW_TRIGGER'
  | 'SMS'
  | 'APPOINTMENT_BOOKING'
  | 'CUSTOM_ACTION'
  | 'KNOWLEDGE_BASE';

export interface GHLVoiceAction {
  id: string;
  agentId?: string;
  locationId?: string;
  actionType: VoiceActionType;
  name: string;
  actionParameters: {
    triggerPrompt?: string;
    triggerMessage?: string;
    // Call Transfer specific
    transferToType?: 'number' | 'user' | 'queue';
    transferToValue?: string;
    hearWhisperMessage?: boolean;
    // SMS specific
    smsTemplate?: string;
    // Workflow specific
    workflowId?: string;
    // Data extraction specific
    extractionFields?: {
      fieldName: string;
      fieldDescription: string;
      required?: boolean;
    }[];
    // Appointment booking specific
    calendarId?: string;
    // Custom action specific
    webhookUrl?: string;
    // Knowledge base specific
    knowledgeBaseId?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVoiceActionPayload {
  agentId: string;
  locationId?: string;
  actionType: VoiceActionType;
  name: string;
  actionParameters: GHLVoiceAction['actionParameters'];
}

export interface UpdateVoiceActionPayload extends Partial<Omit<CreateVoiceActionPayload, 'agentId' | 'locationId'>> {
  actionId: string;
  agentId: string;
  locationId?: string;
  actionType: VoiceActionType;
  name: string;
  actionParameters: GHLVoiceAction['actionParameters'];
}
