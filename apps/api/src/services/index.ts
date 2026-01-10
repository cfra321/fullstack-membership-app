/**
 * Service exports
 */

export {
  createSession,
  validateSession,
  invalidateSession,
  refreshSession,
  type CreateSessionOptions,
  type ValidSessionResult,
} from './session.service';

export {
  register,
  login,
  logout,
  getGoogleAuthUrl,
  getFacebookAuthUrl,
  handleGoogleCallback,
  handleFacebookCallback,
  type LoginOptions,
} from './auth.service';

export {
  checkAccess,
  recordAccess,
  getUsageStats,
  hasRemainingQuota,
  type ContentType,
} from './quota.service';

export {
  listArticlesForUser,
  getArticle,
  listVideosForUser,
  getVideo,
  getContentUsage,
  type ArticleListResult,
  type VideoListResult,
} from './content.service';

export {
  getProfile,
  getUsage,
  getProfileWithUsage,
} from './user.service';
