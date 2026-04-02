'use server';

import { workspacesApi, ApiError } from '@/shared/lib/api/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getWorkspacesAction() {
  try {
    return await workspacesApi.list();
  } catch {
    return [];
  }
}

export async function createWorkspaceAction(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  if (!name) return { error: 'Name is required' };

  try {
    await workspacesApi.create(name);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create workspace';
    return { error: message };
  }

  revalidatePath('/workspaces');
  redirect('/workspaces');
}

export async function deleteWorkspaceAction(workspaceId: string) {
  try {
    await workspacesApi.delete(workspaceId);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to delete workspace';
    return { error: message };
  }

  revalidatePath('/workspaces');
  return { success: true };
}

export async function acceptInviteAction(token: string) {
  try {
    const result = await workspacesApi.acceptInvite(token);
    return { workspace_id: result.workspace_id };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Invalid or expired invite link';
    return { error: message };
  }
}

export async function createInviteAction(workspaceId: string) {
  try {
    const result = await workspacesApi.createInvite(workspaceId);
    return { url: result.url };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create invite';
    return { error: message };
  }
}
