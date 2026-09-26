import { vi } from 'vitest';

// Shared Hermetic Firestore & Auth Mock for Unit & Integration Tests
// Prevents network access and GCP credential dependencies during test runs.

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => [{}]),
  getApp: vi.fn(() => ({}))
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => null),
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
    increment: (n: number) => n,
    arrayUnion: (...items: any[]) => items,
    arrayRemove: (...items: any[]) => items,
    delete: () => undefined
  },
  Firestore: vi.fn()
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: async (token: string) => {
      if (!token) {
        throw new Error('Token is required');
      }
      if (token === 'valid_human_token') {
        return { uid: 'human_developer_01', name: 'Developer', email: 'developer@stockbloc.ai' };
      }
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.user_id || payload.sub || payload.uid || payload.email)) {
            return {
              uid: payload.user_id || payload.sub || payload.uid || 'mock_uid_' + Math.random().toString(36).substring(2, 6),
              name: payload.name || payload.email?.split('@')[0] || 'User',
              email: payload.email,
            };
          }
        }
      } catch (e) {}

      return { uid: 'human_developer_01', name: 'Developer', email: 'developer@stockbloc.ai' };
    }
  }))
}));

// In-memory data store for the mocked firebaseAdmin
class FakeLocalDbStore {
  collections = new Map<string, Map<string, any>>();

  getCollection(name: string): Map<string, any> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name)!;
  }

  saveToDisk() {
    // No-op to keep unit tests completely in-memory
  }
}

const fakeStore = new FakeLocalDbStore();

// Seed initial verified system/treasury wallet
fakeStore.getCollection('agent_wallets').set('system_treasury', {
  agentId: 'system_treasury',
  creditsBalance: 1000000,
  updatedAt: new Date().toISOString()
});

// Seed initial SEED_AGENTS
const SEED_AGENTS = [
  {
    id: 'agent_spark_01',
    agentId: 'agent_spark_01',
    handle: 'spark_agent',
    displayName: 'Gemini Spark Agent',
    verificationStatus: 'verified',
    status: 'active',
    isAgent: true,
  },
  {
    id: 'agent_quant_02',
    agentId: 'agent_quant_02',
    handle: 'alpha_quant',
    displayName: 'AlphaQuant Oracle',
    verificationStatus: 'verified',
    status: 'active',
    isAgent: true,
  }
];
SEED_AGENTS.forEach(agent => {
  fakeStore.getCollection('users').set(agent.id, agent);
});

// Mock the ./firebaseAdmin.js module globally!
vi.mock('../firebaseAdmin.js', () => {
  const getDocRef = (colName: string, docId: string) => {
    return {
      id: docId,
      get: async () => {
        const col = fakeStore.getCollection(colName);
        const data = col.get(docId);
        return {
          id: docId,
          exists: col.has(docId),
          data: () => data,
          get: (field: string) => data?.[field]
        };
      },
      set: async (data: any, options?: any) => {
        const col = fakeStore.getCollection(colName);
        const current = options?.merge ? (col.get(docId) || {}) : {};
        col.set(docId, { ...current, ...data });
        return { id: docId };
      },
      update: async (data: any) => {
        const col = fakeStore.getCollection(colName);
        const current = col.get(docId) || {};
        col.set(docId, { ...current, ...data });
        return { id: docId };
      },
      delete: async () => {
        const col = fakeStore.getCollection(colName);
        col.delete(docId);
      },
      create: async (data: any) => {
        const col = fakeStore.getCollection(colName);
        if (col.has(docId)) {
          const err = new Error(`Document already exists at ${colName}/${docId}`);
          (err as any).code = 6; // ALREADY_EXISTS code
          throw err;
        }
        col.set(docId, data);
        return { id: docId };
      },
      collection: (subColName: string) => {
        const subPath = `${colName}/${docId}/${subColName}`;
        return {
          ...createQueryObj(subPath),
          doc: (subDocId?: string) => {
            const subId = subDocId || 'doc_' + Math.random().toString(36).substring(2, 11);
            return getDocRef(subPath, subId);
          },
          add: async (data: any) => {
            const subId = 'doc_' + Math.random().toString(36).substring(2, 11);
            fakeStore.getCollection(subPath).set(subId, { id: subId, ...data });
            return { id: subId };
          }
        };
      }
    };
  };

  const createQueryObj = (colName: string, filters: any[] = [], limitVal?: number, orderVal?: any) => {
    const queryObj: any = {
      where: (field: string, op: string, val: any) => {
        return createQueryObj(colName, [...filters, { field, op, val }], limitVal, orderVal);
      },
      orderBy: (field: string, dir: string = 'asc') => {
        return createQueryObj(colName, filters, limitVal, { field, dir });
      },
      limit: (n: number) => {
        return createQueryObj(colName, filters, n, orderVal);
      },
      get: async () => {
        const col = fakeStore.getCollection(colName);
        let docs: any[] = [];
        for (const [id, data] of col.entries()) {
          let matches = true;
          for (const f of filters) {
            const itemVal = data[f.field];
            if (f.op === '==' && itemVal !== f.val) matches = false;
            else if (f.op === 'in' && Array.isArray(f.val) && !f.val.includes(itemVal)) matches = false;
            else if (f.op === 'array-contains' && (!Array.isArray(itemVal) || !itemVal.includes(f.val))) matches = false;
            else if (f.op === '!=' && itemVal === f.val) matches = false;
          }
          if (matches) {
            docs.push({ id, ...data });
          }
        }

        if (orderVal) {
          docs.sort((a, b) => {
            const vA = a[orderVal.field];
            const vB = b[orderVal.field];
            return orderVal.dir === 'desc' ? (vB > vA ? 1 : -1) : (vA > vB ? 1 : -1);
          });
        }

        if (typeof limitVal === 'number') {
          docs = docs.slice(0, limitVal);
        }

        const formattedDocs = docs.map(d => ({
          id: d.id,
          exists: true,
          data: () => d,
          get: (field: string) => d[field]
        }));

        return {
          empty: formattedDocs.length === 0,
          size: formattedDocs.length,
          docs: formattedDocs,
          forEach: (cb: any) => formattedDocs.forEach(cb)
        };
      }
    };
    return queryObj;
  };

  const db = {
    collection: (name: string) => {
      const query = createQueryObj(name);
      return {
        ...query,
        doc: (id?: string) => {
          const docId = id || 'doc_' + Math.random().toString(36).substring(2, 11);
          return getDocRef(name, docId);
        },
        add: async (data: any) => {
          const docId = 'doc_' + Math.random().toString(36).substring(2, 11);
          fakeStore.getCollection(name).set(docId, { id: docId, ...data });
          return { id: docId };
        }
      };
    },
    runTransaction: async (updateFunction: any) => {
      const transaction = {
        get: async (docRef: any) => {
          return await docRef.get();
        },
        set: (docRef: any, data: any, options?: any) => {
          docRef.set(data, options);
          return transaction;
        },
        update: (docRef: any, data: any) => {
          docRef.update(data);
          return transaction;
        },
        delete: (docRef: any) => {
          docRef.delete();
          return transaction;
        }
      };
      return await updateFunction(transaction);
    }
  };

  const auth = {
    verifyIdToken: async (token: string) => {
      if (!token) {
        throw new Error('Token is required');
      }
      if (token === 'valid_human_token') {
        return { uid: 'human_developer_01', name: 'Developer', email: 'developer@stockbloc.ai' };
      }
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.user_id || payload.sub || payload.uid || payload.email)) {
            return {
              uid: payload.user_id || payload.sub || payload.uid || 'mock_uid_' + Math.random().toString(36).substring(2, 6),
              name: payload.name || payload.email?.split('@')[0] || 'User',
              email: payload.email,
            };
          }
        }
      } catch (e) {}

      return { uid: 'human_developer_01', name: 'Developer', email: 'developer@stockbloc.ai' };
    }
  };

  const dbStoreProxy = new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return fakeStore.getCollection(prop);
      }
      return undefined;
    },
    set: (target, prop, value) => {
      if (typeof prop === 'string') {
        fakeStore.collections.set(prop, value);
        return true;
      }
      return false;
    }
  });

  return {
    db,
    auth,
    dbStoreInstance: fakeStore,
    dbStore: dbStoreProxy
  };
});
