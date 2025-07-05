/**
 * Security Credential Manager for 48 Continental
 * 
 * - Primary source: 1Password Connect API
 * - Fallbacks: secondary vault, environment, GitHub secrets, .env
 * - Audits all credential access and failures
 * - Designed for integration with MCP, API Manager, and CI/CD
 */

import fetch from 'node-fetch';

// Define interfaces for 1Password item structure
interface OnePasswordField {
  id: string;
  label: string;
  value: string;
  type: string;
}

interface OnePasswordItem {
  id: string;
  title: string;
  fields?: OnePasswordField[];
}

export type CredentialCriticality = 'critical' | 'important' | 'optional';

export interface CredentialSource {
  name: string;
  getCredential(key: string): Promise<string | null>;
}

export class OnePasswordSource implements CredentialSource {
  name = '1Password';
  constructor(private connectUrl: string, private vaultId: string, private token: string) {}
  async getCredential(key: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.connectUrl}/v1/vaults/${this.vaultId}/items?filter=${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) return null;
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) return null;
      // Find field with matching label
      const field = items[0].fields?.find((f: OnePasswordField) => f.label === key);
      return field?.value || null;
    } catch (err) {
      return null;
    }
  }
}

export class EnvSource implements CredentialSource {
  name = 'Environment';
  async getCredential(key: string): Promise<string | null> {
    return process.env[key] || null;
  }
}

export class CredentialManager {
  private sources: CredentialSource[];
  constructor(sources: CredentialSource[]) {
    this.sources = sources;
  }

  async getCredential(key: string, criticality: CredentialCriticality = 'important'): Promise<string | null> {
    for (const source of this.sources) {
      try {
        const value = await source.getCredential(key);
        if (value) {
          await this.logSuccess(key, source.name);
          return value;
        }
      } catch (err) {
        await this.logSourceFailure(key, source.name, err);
      }
    }
    await this.handleMissingCredential(key, criticality);
    return null;
  }

  private async logSuccess(key: string, source: string) {
    // TODO: Implement audit log (to file, DB, or MCP)
    console.log(`[CredentialManager] Found ${key} in ${source}`);
  }
  private async logSourceFailure(key: string, source: string, err: Error | unknown) {
    // TODO: Implement error log
    console.error(`[CredentialManager] Error in ${source} for ${key}:`, err);
  }
  private async logMissingCredential(key: string, criticality: string) {
    // TODO: Implement missing credential log
    console.warn(`[CredentialManager] Missing credential: ${key} (criticality: ${criticality})`);
  }
  private async handleMissingCredential(key: string, criticality: CredentialCriticality) {
    await this.logMissingCredential(key, criticality);
    // TODO: Alert, escalate, or enter safe mode based on criticality
  }
}
