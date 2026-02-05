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

// GHL Knowledge Base Types
export interface GHLKnowledgeBase {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateKnowledgeBasePayload {
  name: string;
  description?: string;
  locationId?: string; // Will be injected by GHL client
}

export interface UpdateKnowledgeBasePayload {
  name?: string;
  description?: string;
}

export interface GHLKnowledgeBasesResponse {
  success: boolean;
  data: {
    knowledgeBases: GHLKnowledgeBase[];
    hasMore?: boolean;
    lastKnowledgeBaseId?: string;
  };
}

// Knowledge Base Website/Crawler Types
export interface GHLWebsiteUrl {
  id: string;
  url: string;
  status: 'discovered' | 'trained' | 'failed';
  title?: string;
  crawledAt?: string;
  trainedAt?: string;
  error?: string;
}

export interface GHLWebsiteUrlsResponse {
  success: boolean;
  data: {
    urls: GHLWebsiteUrl[];
    total: number;
  };
}

export interface DiscoverWebsitePayload {
  url: string;
}

export interface TrainUrlsPayload {
  urlIds: string[];
}

export interface GHLCrawlingStatus {
  status: 'idle' | 'discovering' | 'training' | 'completed' | 'failed';
  progress?: number;
  totalUrls?: number;
  processedUrls?: number;
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

// Knowledge Base FAQ Types
export interface GHLFAQ {
  id: string;
  knowledgeBaseId: string;
  question: string;
  answer: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFAQPayload {
  question: string;
  answer: string;
}

export interface UpdateFAQPayload {
  question?: string;
  answer?: string;
}

export interface GHLFAQsResponse {
  success: boolean;
  data: {
    faqs: GHLFAQ[];
    total: number;
  };
}

// ==================== CONVERSATION AI AGENTS ====================

export type ConversationAIAgentMode = 'off' | 'suggestive' | 'auto-pilot';
export type ConversationAIChannel = 'IG' | 'FB' | 'SMS' | 'WebChat' | 'WhatsApp' | 'Live_Chat';
export type ConversationAIWaitTimeUnit = 'minutes' | 'seconds';
export type ConversationAISleepTimeUnit = 'hours' | 'minutes' | 'seconds';

// Action types for Conversation AI
export type ConversationAIActionType = 
  | 'triggerWorkflow' 
  | 'updateContactField' 
  | 'appointmentBooking' 
  | 'stopBot' 
  | 'humanHandOver' 
  | 'advancedFollowup' 
  | 'transferBot';

export interface GHLConversationAIAction {
  id: string;
  type: ConversationAIActionType;
  name: string;
  details: {
    workflowIds?: string[];
    triggerCondition?: string;
    triggerMessage?: string;
    // For updateContactField
    fieldKey?: string;
    fieldValue?: string;
    // For appointmentBooking
    calendarId?: string;
    // For transferBot
    targetAgentId?: string;
    // For advancedFollowup
    followupDelay?: number;
    followupMessage?: string;
  };
}

export interface CreateConversationAIActionPayload {
  type: ConversationAIActionType;
  name: string;
  details: {
    workflowIds?: string[];
    triggerCondition?: string;
    triggerMessage?: string;
    fieldKey?: string;
    fieldValue?: string;
    calendarId?: string;
    targetAgentId?: string;
    followupDelay?: number;
    followupMessage?: string;
  };
}

export interface UpdateConversationAIActionPayload extends Partial<CreateConversationAIActionPayload> {}

// Conversation AI Agent
export interface GHLConversationAIAgent {
  id: string;
  name: string;
  businessName?: string;
  mode: ConversationAIAgentMode;
  channels: ConversationAIChannel[];
  isPrimary: boolean;
  waitTime: number;
  waitTimeUnit: ConversationAIWaitTimeUnit;
  sleepEnabled: boolean;
  sleepTime?: number;
  sleepTimeUnit?: ConversationAISleepTimeUnit;
  personality?: string;
  goal?: string;
  instructions?: string;
  autoPilotMaxMessages: number;
  knowledgeBaseIds?: string[];
  actions?: GHLConversationAIAction[];
  respondToImages?: boolean;
  respondToAudio?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConversationAIAgentPayload {
  name: string;
  businessName?: string;
  mode?: ConversationAIAgentMode;
  channels?: ConversationAIChannel[];
  isPrimary?: boolean;
  waitTime?: number;
  waitTimeUnit?: ConversationAIWaitTimeUnit;
  sleepEnabled?: boolean;
  sleepTime?: number;
  sleepTimeUnit?: ConversationAISleepTimeUnit;
  personality: string;
  goal: string;
  instructions: string;
  autoPilotMaxMessages?: number;
  knowledgeBaseIds?: string[];
  respondToImages?: boolean;
  respondToAudio?: boolean;
}

export interface UpdateConversationAIAgentPayload {
  name?: string;
  businessName?: string;
  mode?: ConversationAIAgentMode;
  channels?: ConversationAIChannel[];
  isPrimary?: boolean;
  waitTime?: number;
  waitTimeUnit?: ConversationAIWaitTimeUnit;
  sleepEnabled?: boolean;
  sleepTime?: number;
  sleepTimeUnit?: ConversationAISleepTimeUnit;
  personality?: string;
  goal?: string;
  instructions?: string;
  autoPilotMaxMessages?: number;
  knowledgeBaseIds?: string[];
  respondToImages?: boolean;
  respondToAudio?: boolean;
}

export interface GHLConversationAIAgentsResponse {
  agents: GHLConversationAIAgent[];
  totalCount: number;
  count: number;
}

export interface GHLConversationAIActionsResponse {
  data: GHLConversationAIAction[];
  success: boolean;
}

// ==================== CALENDAR TYPES ====================

// Calendar Types
export type CalendarType = 'round_robin' | 'event' | 'class_booking' | 'collective' | 'service_booking' | 'personal';
export type CalendarWidgetType = 'default' | 'classic';
export type CalendarEventType = 'RoundRobin_OptimizeForAvailability' | 'RoundRobin_OptimizeForEqualDistribution';
export type CalendarTimeUnit = 'mins' | 'hours';
export type CalendarBookingUnit = 'hours' | 'days' | 'weeks' | 'months';
export type CalendarFormSubmitType = 'RedirectURL' | 'ThankYouMessage';
export type CalendarGuestType = 'count_only' | 'collect_detail';
export type AppointmentStatus = 'new' | 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid' | 'active' | 'completed';
export type MeetingLocationType = 'custom' | 'zoom' | 'gmeet' | 'phone' | 'address' | 'ms_teams' | 'google';

// Calendar Open Hours
export interface CalendarOpenHours {
  daysOfTheWeek: number[];
  hours: {
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  }[];
}

// Calendar Availability
export interface CalendarAvailability {
  id?: string;
  date: string;
  hours: {
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  }[];
  deleted?: boolean;
}

// Location Configuration
export interface CalendarLocationConfiguration {
  kind: 'custom' | 'zoom' | 'gmeet' | 'phone' | 'address' | 'ms_teams' | 'google';
  location?: string;
}

// Team Member
export interface CalendarTeamMember {
  userId: string;
  priority?: number;
  isPrimary?: boolean;
  locationConfigurations?: CalendarLocationConfiguration[];
}

// Recurring Config
export interface CalendarRecurringConfig {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  count?: number;
  bookingOption?: 'skip' | 'book';
  bookingOverlapDefaultStatus?: 'confirmed' | 'pending';
}

// Look Busy Config
export interface CalendarLookBusyConfig {
  enabled: boolean;
  LookBusyPercentage?: number;
}

// Calendar Interface
export interface GHLCalendar {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  widgetSlug?: string;
  calendarType?: CalendarType;
  widgetType?: CalendarWidgetType;
  eventType?: CalendarEventType;
  eventTitle?: string;
  eventColor?: string;
  isActive?: boolean;
  groupId?: string;
  teamMembers?: CalendarTeamMember[];
  slotDuration?: number;
  slotDurationUnit?: CalendarTimeUnit;
  slotInterval?: number;
  slotIntervalUnit?: CalendarTimeUnit;
  slotBuffer?: number;
  slotBufferUnit?: CalendarTimeUnit;
  preBuffer?: number;
  preBufferUnit?: CalendarTimeUnit;
  appoinmentPerSlot?: number;
  appoinmentPerDay?: number;
  allowBookingAfter?: number;
  allowBookingAfterUnit?: CalendarBookingUnit;
  allowBookingFor?: number;
  allowBookingForUnit?: CalendarBookingUnit;
  openHours?: CalendarOpenHours[];
  enableRecurring?: boolean;
  recurring?: CalendarRecurringConfig;
  formId?: string;
  stickyContact?: boolean;
  isLivePaymentMode?: boolean;
  autoConfirm?: boolean;
  shouldSendAlertEmailsToAssignedMember?: boolean;
  alertEmail?: string;
  googleInvitationEmails?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  shouldAssignContactToTeamMember?: boolean;
  shouldSkipAssigningContactForExisting?: boolean;
  notes?: string;
  pixelId?: string;
  formSubmitType?: CalendarFormSubmitType;
  formSubmitRedirectURL?: string;
  formSubmitThanksMessage?: string;
  availabilityType?: 0 | 1 | null;
  availabilities?: CalendarAvailability[];
  guestType?: CalendarGuestType;
  consentLabel?: string;
  calendarCoverImage?: string;
  lookBusyConfig?: CalendarLookBusyConfig;
  locationConfigurations?: CalendarLocationConfiguration[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCalendarPayload {
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  widgetSlug?: string;
  calendarType?: CalendarType;
  widgetType?: CalendarWidgetType;
  eventType?: CalendarEventType;
  eventTitle?: string;
  eventColor?: string;
  isActive?: boolean;
  groupId?: string;
  teamMembers?: CalendarTeamMember[];
  slotDuration?: number;
  slotDurationUnit?: CalendarTimeUnit;
  slotInterval?: number;
  slotIntervalUnit?: CalendarTimeUnit;
  slotBuffer?: number;
  slotBufferUnit?: CalendarTimeUnit;
  preBuffer?: number;
  preBufferUnit?: CalendarTimeUnit;
  appoinmentPerSlot?: number;
  appoinmentPerDay?: number;
  allowBookingAfter?: number;
  allowBookingAfterUnit?: CalendarBookingUnit;
  allowBookingFor?: number;
  allowBookingForUnit?: CalendarBookingUnit;
  openHours?: CalendarOpenHours[];
  enableRecurring?: boolean;
  recurring?: CalendarRecurringConfig;
  formId?: string;
  stickyContact?: boolean;
  isLivePaymentMode?: boolean;
  autoConfirm?: boolean;
  shouldSendAlertEmailsToAssignedMember?: boolean;
  alertEmail?: string;
  googleInvitationEmails?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  shouldAssignContactToTeamMember?: boolean;
  shouldSkipAssigningContactForExisting?: boolean;
  notes?: string;
  pixelId?: string;
  formSubmitType?: CalendarFormSubmitType;
  formSubmitRedirectURL?: string;
  formSubmitThanksMessage?: string;
  availabilityType?: 0 | 1 | null;
  availabilities?: CalendarAvailability[];
  guestType?: CalendarGuestType;
  consentLabel?: string;
  calendarCoverImage?: string;
  lookBusyConfig?: CalendarLookBusyConfig;
  locationConfigurations?: CalendarLocationConfiguration[];
}

export interface UpdateCalendarPayload extends Partial<Omit<CreateCalendarPayload, 'locationId'>> {}

export interface GHLCalendarsResponse {
  calendars: GHLCalendar[];
}

export interface GHLCalendarResponse {
  calendar: GHLCalendar;
}

// Calendar Group Types
export interface GHLCalendarGroup {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCalendarGroupPayload {
  locationId: string;
  name: string;
  description: string;
  slug: string;
  isActive?: boolean;
}

export interface UpdateCalendarGroupPayload {
  name: string;
  description: string;
  slug: string;
}

export interface GHLCalendarGroupsResponse {
  groups: GHLCalendarGroup[];
}

export interface GHLCalendarGroupResponse {
  group: GHLCalendarGroup;
}

// Appointment Types
export interface GHLAppointment {
  id: string;
  calendarId: string;
  locationId: string;
  contactId: string;
  startTime: string;
  endTime: string;
  title?: string;
  description?: string;
  address?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: string;
  meetingLocationType?: MeetingLocationType;
  meetingLocationId?: string;
  isRecurring?: boolean;
  rrule?: string;
  masterEventId?: string;
  contact?: GHLContact;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  calendarId: string;
  locationId: string;
  contactId: string;
  startTime: string;
  endTime?: string;
  title?: string;
  description?: string;
  address?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: string;
  meetingLocationType?: MeetingLocationType;
  meetingLocationId?: string;
  overrideLocationConfig?: boolean;
  ignoreDateRange?: boolean;
  toNotify?: boolean;
  ignoreFreeSlotValidation?: boolean;
  rrule?: string;
}

export interface UpdateAppointmentPayload extends Partial<Omit<CreateAppointmentPayload, 'locationId' | 'contactId'>> {
  calendarId?: string;
}

export interface GHLAppointmentResponse {
  event: GHLAppointment;
}

// Block Slot Types
export interface GHLBlockSlot {
  id: string;
  locationId: string;
  title?: string;
  startTime: string;
  endTime: string;
  calendarId?: string;
  assignedUserId?: string;
}

export interface CreateBlockSlotPayload {
  locationId: string;
  calendarId?: string;
  assignedUserId?: string;
  title?: string;
  startTime: string;
  endTime: string;
}

export interface UpdateBlockSlotPayload {
  locationId: string;
  calendarId?: string;
  assignedUserId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
}

// Calendar Event Types (for fetching events)
export interface GHLCalendarEvent {
  id: string;
  calendarId?: string;
  locationId: string;
  title?: string;
  startTime: string;
  endTime: string;
  status?: AppointmentStatus;
  appointmentStatus?: AppointmentStatus;
  contactId?: string;
  assignedUserId?: string;
  type?: 'appointment' | 'blocked_slot';
  isRecurring?: boolean;
  masterEventId?: string;
}

export interface GHLCalendarEventsResponse {
  events: GHLCalendarEvent[];
}

// Free Slots Response
export interface GHLFreeSlot {
  slots: string[];
}

export interface GHLFreeSlotsResponse {
  [date: string]: GHLFreeSlot;
}

// Appointment Notes Types
export interface GHLAppointmentNote {
  id: string;
  appointmentId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentNotePayload {
  body: string;
}

export interface UpdateAppointmentNotePayload {
  body: string;
}

export interface GHLAppointmentNotesResponse {
  notes: GHLAppointmentNote[];
}