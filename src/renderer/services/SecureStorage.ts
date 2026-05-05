/**
 * Secure Storage Service
 * Handles encrypted storage of sensitive credentials and data
 */

export interface StoredCredential {
  id: string;
  name: string;
  type: 'password' | 'ssh-key' | 'api-key' | 'token';
  username?: string;
  encrypted: string;
  createdAt: Date;
  lastUsed?: Date;
  metadata?: Record<string, any>;
}

export class SecureStorage {
  private static readonly STORAGE_KEY = 'secure-credentials';
  private static readonly ENCRYPTION_KEY_STORAGE = 'encryption-key';
  private static encryptionKey: CryptoKey | null = null;

  /**
   * Initialize encryption key
   */
  static async initialize(): Promise<void> {
    try {
      // Try to load existing key
      const storedKey = localStorage.getItem(this.ENCRYPTION_KEY_STORAGE);
      
      if (storedKey) {
        // Import existing key
        const keyData = JSON.parse(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store key
        const exportedKey = await crypto.subtle.exportKey('jwk', this.encryptionKey);
        localStorage.setItem(this.ENCRYPTION_KEY_STORAGE, JSON.stringify(exportedKey));
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Encrypt data
   */
  private static async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        encryptedBuffer
      );

      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store credential securely
   */
  static async storeCredential(
    name: string,
    type: StoredCredential['type'],
    value: string,
    username?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const encrypted = await this.encrypt(value);

      const credential: StoredCredential = {
        id: `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        username,
        encrypted,
        createdAt: new Date(),
        metadata,
      };

      const credentials = await this.getAllCredentials();
      credentials.push(credential);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));

      return credential.id;
    } catch (error) {
      console.error('Failed to store credential:', error);
      throw new Error('Failed to store credential');
    }
  }

  /**
   * Retrieve credential
   */
  static async getCredential(id: string): Promise<string> {
    try {
      const credentials = await this.getAllCredentials();
      const credential = credentials.find((c) => c.id === id);

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Update last used timestamp
      credential.lastUsed = new Date();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));

      return await this.decrypt(credential.encrypted);
    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      throw new Error('Failed to retrieve credential');
    }
  }

  /**
   * Get all stored credentials (without decrypting values)
   */
  static async getAllCredentials(): Promise<StoredCredential[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const credentials = JSON.parse(stored);
      return credentials.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        lastUsed: c.lastUsed ? new Date(c.lastUsed) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return [];
    }
  }

  /**
   * Update credential
   */
  static async updateCredential(
    id: string,
    updates: {
      name?: string;
      value?: string;
      username?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const credentials = await this.getAllCredentials();
      const index = credentials.findIndex((c) => c.id === id);

      if (index === -1) {
        throw new Error('Credential not found');
      }

      if (updates.name) {
        credentials[index].name = updates.name;
      }

      if (updates.username !== undefined) {
        credentials[index].username = updates.username;
      }

      if (updates.value) {
        credentials[index].encrypted = await this.encrypt(updates.value);
      }

      if (updates.metadata) {
        credentials[index].metadata = {
          ...credentials[index].metadata,
          ...updates.metadata,
        };
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to update credential:', error);
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Delete credential
   */
  static async deleteCredential(id: string): Promise<void> {
    try {
      const credentials = await this.getAllCredentials();
      const filtered = credentials.filter((c) => c.id !== id);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete credential:', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Clear all credentials
   */
  static async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      throw new Error('Failed to clear credentials');
    }
  }

  /**
   * Export credentials (encrypted)
   */
  static async exportCredentials(): Promise<string> {
    try {
      const credentials = await this.getAllCredentials();
      return JSON.stringify(credentials, null, 2);
    } catch (error) {
      console.error('Failed to export credentials:', error);
      throw new Error('Failed to export credentials');
    }
  }

  /**
   * Import credentials
   */
  static async importCredentials(data: string): Promise<number> {
    try {
      const imported = JSON.parse(data) as StoredCredential[];
      const existing = await this.getAllCredentials();

      // Merge credentials, avoiding duplicates by name
      const merged = [...existing];
      let importedCount = 0;

      for (const cred of imported) {
        if (!existing.find((c) => c.name === cred.name)) {
          merged.push({
            ...cred,
            id: `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(cred.createdAt),
            lastUsed: cred.lastUsed ? new Date(cred.lastUsed) : undefined,
          });
          importedCount++;
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      return importedCount;
    } catch (error) {
      console.error('Failed to import credentials:', error);
      throw new Error('Failed to import credentials');
    }
  }

  /**
   * Search credentials
   */
  static async searchCredentials(query: string): Promise<StoredCredential[]> {
    try {
      const credentials = await this.getAllCredentials();
      const lowerQuery = query.toLowerCase();

      return credentials.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.username?.toLowerCase().includes(lowerQuery) ||
          c.type.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search credentials:', error);
      return [];
    }
  }

  /**
   * Get credentials by type
   */
  static async getCredentialsByType(
    type: StoredCredential['type']
  ): Promise<StoredCredential[]> {
    try {
      const credentials = await this.getAllCredentials();
      return credentials.filter((c) => c.type === type);
    } catch (error) {
      console.error('Failed to get credentials by type:', error);
      return [];
    }
  }

  /**
   * Validate credential exists
   */
  static async credentialExists(id: string): Promise<boolean> {
    try {
      const credentials = await this.getAllCredentials();
      return credentials.some((c) => c.id === id);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get credential metadata
   */
  static async getCredentialMetadata(id: string): Promise<StoredCredential | null> {
    try {
      const credentials = await this.getAllCredentials();
      return credentials.find((c) => c.id === id) || null;
    } catch (error) {
      return null;
    }
  }
}
