import { describe, it, expect, vi } from 'vitest';

// Mock Firebase Admin
vi.mock('./firebaseAdmin.js', () => {
  const mockDocs: Record<string, any> = {
    'users/agent_test_1': {
      displayName: 'Test Quant Agent 1',
      handle: 'quant_1',
      authorType: 'agent',
      status: 'active',
      verificationStatus: 'verified',
      specialties: ['TECH_AI'],
      ownerUid: 'user_owner_1'
    }
  };

  const mockCollections: Record<string, any[]> = {
    'forecasts': [],
    'research': [],
    'theses': [],
    'agent_feedback': [],
    'corrections': []
  };

  const db = {
    collection: (collName: string) => ({
      doc: (docId: string) => ({
        get: async () => ({
          exists: !!mockDocs[`${collName}/${docId}`],
          id: docId,
          data: () => mockDocs[`${collName}/${docId}`]
        }),
        update: async (data: any) => {
          if (mockDocs[`${collName}/${docId}`]) {
            mockDocs[`${collName}/${docId}`] = { ...mockDocs[`${collName}/${docId}`], ...data };
          }
        },
        collection: (subColl: string) => ({
          doc: (subId: string) => ({
            set: async (subData: any) => {
              mockCollections[`${collName}/${docId}/${subColl}`] = mockCollections[`${collName}/${docId}/${subColl}`] || [];
              mockCollections[`${collName}/${docId}/${subColl}`].push({ id: subId, ...subData });
            }
          }),
          get: async () => ({
            docs: (mockCollections[`${collName}/${docId}/${subColl}`] || []).map(item => ({
              id: item.id,
              data: () => item
            }))
          }),
          orderBy: () => ({
            get: async () => ({
              docs: (mockCollections[`${collName}/${docId}/${subColl}`] || []).map(item => ({
                id: item.id,
                data: () => item
              }))
            })
          })
        })
      }),
      add: async (data: any) => {
        const id = `${collName}_doc_${Date.now()}`;
        const newDoc = { id, ...data };
        mockCollections[collName] = mockCollections[collName] || [];
        mockCollections[collName].push(newDoc);
        mockDocs[`${collName}/${id}`] = newDoc;
        return { id };
      },
      where: (field: string, op: string, val: any) => {
        const getFn = async () => {
          const list = (mockCollections[collName] || []).filter(item => {
            if (op === '==') return item[field] === val;
            return true;
          });
          return {
            empty: list.length === 0,
            docs: list.map(item => ({ id: item.id, data: () => item }))
          };
        };

        return {
          get: getFn,
          where: () => ({ get: getFn }),
          limit: () => ({ get: getFn }),
          orderBy: () => ({ limit: () => ({ get: getFn }) })
        };
      }
    })
  };

  return {
    db,
    auth: {
      verifyIdToken: async (token: string) => ({ uid: token })
    }
  };
});

describe('Phase 4 Intelligence API Suite', () => {
  it('verifies that sample size protection activates for < 5 resolved forecasts', async () => {
    const { calculateAgentMetrics } = await import('./agentIntelligenceApi.js');
    const metrics = await calculateAgentMetrics('agent_test_1');
    expect(metrics).not.toBeNull();
    expect(metrics?.reputationStatus).toBe('INSUFFICIENT_DATA');
    expect(metrics?.brierScore).toBeNull();
    expect(metrics?.sampleSizeSufficient).toBe(false);
  });
});
