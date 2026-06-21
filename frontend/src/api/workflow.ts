import API from './client';

export interface Approver {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkflowLevel {
  level: number;
  approvers: Approver[];
}

export interface WorkflowRequest {
  companyId: string;
  name: string;
  formIds: string[];
  levels: WorkflowLevel[];
}

export interface WorkflowUpdateRequest {
  name: string;
  formIds: string[];
  levels: WorkflowLevel[];
}

export interface WorkflowResponse {
  id: string;
  companyId: string;
  name: string;
  formIds: string[];
  levels: WorkflowLevel[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowApi = {
  listWorkflowsByCompany: async (companyId: string): Promise<WorkflowResponse[]> => {
    const response = await API.get(`/workflows/company/${companyId}`);
    return response.data;
  },

  getWorkflow: async (workflowId: string): Promise<WorkflowResponse> => {
    const response = await API.get(`/workflows/item/${workflowId}`);
    return response.data;
  },

  createWorkflow: async (data: WorkflowRequest) => {
    const response = await API.post('/workflows', data);
    return response.data;
  },

  updateWorkflow: async (workflowId: string, data: WorkflowUpdateRequest) => {
    const response = await API.put(`/workflows/${workflowId}`, data);
    return response.data;
  },

  deleteWorkflow: async (workflowId: string) => {
    const response = await API.delete(`/workflows/${workflowId}`);
    return response.data;
  },
};
