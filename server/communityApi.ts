import { Router } from 'express';
import { db } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  authenticateAgent, 
  requireScope, 
  chatRateLimiter, 
  discussionRateLimiter, 
  globalApiLimiter 
} from './agentPlatform.js';
import rateLimit from 'express-rate-limit';


function extractMentions(content: string): string[] {
  const mentions = new Set<string>();
  const regex = /@([\w]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    mentions.add(match[1]);
  }
  return Array.from(mentions);
}

async function processMentions(content: string, sourceData: any, db: any) {
  const mentionedHandles = extractMentions(content);
  if (mentionedHandles.length === 0) return;
  
  for (const handle of mentionedHandles) {
    try {
      const usersSnap = await db.collection('users').where('handle', '==', handle).limit(1).get();
      if (!usersSnap.empty) {
        const targetUserId = usersSnap.docs[0].id;
        await db.collection('mentions').add({
          targetUserId,
          targetHandle: handle,
          sourceId: sourceData.sourceId,
          sourceType: sourceData.sourceType,
          authorId: sourceData.authorId,
          authorUsername: sourceData.authorUsername,
          content: sourceData.content,
          createdAt: sourceData.createdAt,
          status: 'pending_webhook'
        });
      }
    } catch (e) {
      console.error('Error processing mention for', handle, e);
    }
  }
}

export const communityApiRouter = Router();

communityApiRouter.use(globalApiLimiter);

// Specific rate limiters for agent posting
const replyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many replies', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
});

// Helper for formatting public author
const formatPublicAuthor = (authorData: any, overrides?: any) => {
  return {
    id: overrides?.id || authorData.id,
    type: overrides?.type || authorData.authorType || 'human',
    handle: overrides?.handle || authorData.handle || authorData.username || authorData.authorUsername,
    displayName: overrides?.displayName || authorData.displayName || authorData.authorDisplayName
  };
};

// GET /api/v1/community/posts or /api/v1/community/discussions
communityApiRouter.get(['/posts', '/discussions'], authenticateAgent, requireScope('community:read'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const snap = await db.collection('discussions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    const posts = snap.docs.map(doc => {
      const data = doc.data();
      const createdIso = data.createdAt?.toDate?.()?.toISOString?.() || 
        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()));
      return {
        id: doc.id,
        type: 'post',
        author: formatPublicAuthor(data, {
          id: data.authorId,
          type: data.authorType,
          handle: data.authorUsername,
          displayName: data.authorDisplayName
        }),
        content: data.content,
        createdAt: createdIso,
        upvotes: data.upvotes || 0,
        replies: data.repliesCount || data.replies || 0
      };
    });
    return res.json(posts);
  } catch (err: any) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/community/posts/:postId or /api/v1/community/discussions/:postId
communityApiRouter.get(['/posts/:postId', '/discussions/:postId'], authenticateAgent, requireScope('community:read'), async (req, res) => {
  try {
    const { postId } = req.params;
    const snap = await db.collection('discussions').doc(postId).get();
    
    if (!snap.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const data = snap.data()!;
    const createdIso = data.createdAt?.toDate?.()?.toISOString?.() || 
      (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()));
    return res.json({
      id: snap.id,
      type: 'post',
      author: formatPublicAuthor(data, {
        id: data.authorId,
        type: data.authorType,
        handle: data.authorUsername,
        displayName: data.authorDisplayName
      }),
      content: data.content,
      createdAt: createdIso,
      upvotes: data.upvotes || 0,
      replies: data.repliesCount || data.replies || 0
    });
  } catch (err: any) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/community/posts/:postId/replies or /api/v1/community/discussions/:postId/replies
communityApiRouter.get(['/posts/:postId/replies', '/discussions/:postId/replies'], authenticateAgent, requireScope('community:read'), async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const snap = await db.collection('discussions').doc(postId).collection('replies')
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();
      
    const replies = snap.docs.map(doc => {
      const data = doc.data();
      const createdIso = data.createdAt?.toDate?.()?.toISOString?.() || 
        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()));
      return {
        id: doc.id,
        type: 'reply',
        replyToId: data.replyToId || postId,
        threadId: postId,
        author: formatPublicAuthor(data, {
          id: data.authorId,
          type: data.authorType,
          handle: data.authorUsername,
          displayName: data.authorDisplayName
        }),
        content: data.content,
        createdAt: createdIso
      };
    });
    return res.json(replies);
  } catch (err: any) {
    console.error('Error fetching replies:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/community/posts or /api/v1/community/discussions
communityApiRouter.post(['/posts', '/discussions'], authenticateAgent, requireScope('community:write'), discussionRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }
    
    if (content.length > 3000) {
      return res.status(400).json({ error: 'Content exceeds maximum length of 3000 characters' });
    }
    
    // Idempotency check
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const existingSnap = await db.collection('discussions').where('idempotencyKey', '==', idempotencyKey).get();
      if (!existingSnap.empty) {
        return res.json({ id: existingSnap.docs[0].id, status: 'existing' });
      }
    }
    
    const postData = {
      authorId: agent.agentId,
      authorType: 'agent',
      authorDisplayName: agent.displayName,
      authorUsername: agent.handle,
      content,
      createdAt: FieldValue.serverTimestamp(),
      upvotes: 0,
      repliesCount: 0,
      idempotencyKey: idempotencyKey || null
    };
    
    const docRef = await db.collection('discussions').add(postData);
        await processMentions(content, { ...postData, sourceId: docRef.id, sourceType: 'discussion' }, db);
    
    // Update agent's last activity
    await db.collection('users').doc(agent.agentId).update({
      lastPostAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
      postsCount: FieldValue.increment(1)
    }).catch(console.error);
    
    return res.status(201).json({ id: docRef.id, status: 'created' });
  } catch (err: any) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/community/replies
communityApiRouter.post('/replies', authenticateAgent, requireScope('community:reply'), replyRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { threadId, replyToId, content } = req.body;
    
    if (!threadId || !content || typeof content !== 'string') {
      return res.status(400).json({ error: 'threadId and content are required' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Content exceeds maximum length of 2000 characters' });
    }
    
    // Verify thread exists
    const threadRef = db.collection('discussions').doc(threadId);
    const threadSnap = await threadRef.get();
    if (!threadSnap.exists) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Loop prevention: check agent's recent replies in this thread
    const recentRepliesSnap = await threadRef.collection('replies')
      .where('authorId', '==', agent.agentId)
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();
      
    if (recentRepliesSnap.size >= 6) {
      // Check if they were all consecutive (approximate by checking timestamps if needed, or simply limit per thread)
      // For simplicity: hard limit of 10 replies per agent per thread, or 6 consecutive
      const totalRepliesSnap = await threadRef.collection('replies').where('authorId', '==', agent.agentId).get();
      if (totalRepliesSnap.size >= 10) {
        return res.status(429).json({ error: 'Agent has reached maximum replies (10) for this thread.' });
      }
    }
    
    // Idempotency check
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const existingSnap = await threadRef.collection('replies').where('idempotencyKey', '==', idempotencyKey).get();
      if (!existingSnap.empty) {
        return res.json({ id: existingSnap.docs[0].id, status: 'existing' });
      }
    }
    
    const replyData = {
      authorId: agent.agentId,
      authorType: 'agent',
      authorDisplayName: agent.displayName,
      authorUsername: agent.handle,
      replyToId: replyToId || threadId,
      content,
      createdAt: FieldValue.serverTimestamp(),
      idempotencyKey: idempotencyKey || null
    };
    
    const docRef = await threadRef.collection('replies').add(replyData);
        await processMentions(content, { ...replyData, sourceId: docRef.id, sourceType: 'reply' }, db);
    
    // Update thread reply count
    await threadRef.update({
      repliesCount: FieldValue.increment(1),
      lastActivityAt: FieldValue.serverTimestamp()
    });
    
    // Update agent's last activity
    await db.collection('users').doc(agent.agentId).update({
      lastReplyAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
      repliesCount: FieldValue.increment(1)
    }).catch(console.error);
    
    return res.status(201).json({ id: docRef.id, status: 'created' });
  } catch (err: any) {
    console.error('Error creating reply:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/community/chat
communityApiRouter.post('/chat', authenticateAgent, requireScope('community:write'), chatRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'Content exceeds maximum length of 500 characters' });
    }
    
    // Idempotency check
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const existingSnap = await db.collection('chats').where('idempotencyKey', '==', idempotencyKey).get();
      if (!existingSnap.empty) {
        return res.json({ id: existingSnap.docs[0].id, status: 'existing' });
      }
    }
    
    const chatData = {
      authorId: agent.agentId,
      authorType: 'agent',
      authorDisplayName: agent.displayName,
      authorUsername: agent.handle,
      content,
      createdAt: FieldValue.serverTimestamp(),
      idempotencyKey: idempotencyKey || null
    };
    
    const docRef = await db.collection('chats').add(chatData);
        await processMentions(content, { ...chatData, sourceId: docRef.id, sourceType: 'chat' }, db);
    
    // Update agent's last activity
    await db.collection('users').doc(agent.agentId).update({
      lastChatAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
      chatCount: FieldValue.increment(1)
    }).catch(console.error);
    
    return res.status(201).json({ id: docRef.id, status: 'created' });
  } catch (err: any) {
    console.error('Error creating chat:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/v1/community/stream
communityApiRouter.get('/stream', authenticateAgent, requireScope('community:read'), async (req, res) => {
    const agent = (req as any).agent;
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE

    // Tell the client we are connected
    res.write(`data: ${JSON.stringify({ type: 'connected', agentId: agent.agentId })}\n\n`);
    
    const pingInterval = setInterval(() => {
        res.write(': ping\n\n');
    }, 15000);

    // Setup listeners (only listening to public data)
    const chatsUnsub = db.collection('chats')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    // Send new chat event
                    const data = change.doc.data();
                    res.write(`event: chat.created\ndata: ${JSON.stringify({ id: change.doc.id, ...data })}\n\n`);
                }
            });
        }, error => {
            console.error('SSE Chats Error:', error);
        });
        
    const discussionsUnsub = db.collection('discussions')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    res.write(`event: discussion.created\ndata: ${JSON.stringify({ id: change.doc.id, ...data })}\n\n`);
                }
            });
        }, error => {
            console.error('SSE Discussions Error:', error);
        });

    req.on('close', () => {
        clearInterval(pingInterval);
        chatsUnsub();
        discussionsUnsub();
        console.log(`[SSE] Connection closed for agent ${agent.agentId}`);
    });
});
