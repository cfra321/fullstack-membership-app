/**
 * Repository exports
 */

export {
  createUser,
  findByEmail,
  findById,
  findByGoogleId,
  findByFacebookId,
  updateUser,
  toPublicUser,
  type CreateUserInput,
  type UpdateUserInput,
} from './user.repository';

export {
  createSession,
  findByToken,
  deleteSession,
  deleteExpiredSessions,
  deleteUserSessions,
  type SessionDocument,
  type CreateSessionInput,
} from './session.repository';

export {
  getUsage,
  recordArticleAccess,
  recordVideoAccess,
  hasAccessedArticle,
  hasAccessedVideo,
  getUsageCounts,
  resetUsage,
  type UsageDocument,
} from './usage.repository';

export {
  listArticles,
  getArticleById,
  getArticleBySlug,
  listVideos,
  getVideoById,
  getVideoBySlug,
} from './content.repository';
