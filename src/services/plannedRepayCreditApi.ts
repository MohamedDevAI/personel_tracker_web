/**
 * API service for planned debt repayment schedule.
 * Communicates with Spring Boot backend MongoDB collection: 'planned_repay_credit'.
 */

import apiClient from './apiClient';
import type {
  PlannedRepayCreditItem,
  PlannedRepayCreditMatrix
} from '../types';

export const plannedRepayCreditApi = {
  /**
   * Fetch pre-aggregated 9-month matrix board summary with column totals & items.
   */
  getMatrix: async (): Promise<PlannedRepayCreditMatrix> => {
    const { data } = await apiClient.get<PlannedRepayCreditMatrix>('/planned-repay-credit/matrix');
    return data;
  },

  /**
   * Fetch all individual planned repay credit items.
   */
  getAll: async (): Promise<PlannedRepayCreditItem[]> => {
    const { data } = await apiClient.get<PlannedRepayCreditItem[]>('/planned-repay-credit');
    return data;
  },

  /**
   * Fetch a single planned repay credit item by ID.
   */
  getById: async (id: string): Promise<PlannedRepayCreditItem> => {
    const { data } = await apiClient.get<PlannedRepayCreditItem>(`/planned-repay-credit/${id}`);
    return data;
  },

  /**
   * Create a new planned repay credit item.
   */
  create: async (item: Omit<PlannedRepayCreditItem, 'id' | '_id'>): Promise<PlannedRepayCreditItem> => {
    const { data } = await apiClient.post<PlannedRepayCreditItem>('/planned-repay-credit', item);
    return data;
  },

  /**
   * Update an existing planned repay credit item.
   */
  update: async (id: string, updates: Partial<PlannedRepayCreditItem>): Promise<PlannedRepayCreditItem> => {
    const { data } = await apiClient.put<PlannedRepayCreditItem>(`/planned-repay-credit/${id}`, updates);
    return data;
  },

  /**
   * Toggle or update the completion status ('Completed' | 'In-Completed') of a scheduled item.
   */
  updateStatus: async (id: string, status: 'Completed' | 'In-Completed'): Promise<PlannedRepayCreditItem> => {
    const { data } = await apiClient.patch<PlannedRepayCreditItem>(`/planned-repay-credit/${id}/status`, { status });
    return data;
  },

  /**
   * Delete a planned repay credit item.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/planned-repay-credit/${id}`);
  }
};

export default plannedRepayCreditApi;
