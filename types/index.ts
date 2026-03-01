export type ApiKeyType = 'simple' | 'pair';

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  type: ApiKeyType;
  encrypted_payload: string;
  iv: string;
  salt: string;
  created_at: string;
}

export interface SimpleData {
  key: string;
}

export interface PairData {
  appId: string;
  appSecret: string;
}
