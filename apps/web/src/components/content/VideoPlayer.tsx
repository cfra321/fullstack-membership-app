/**
 * Video Player Component
 *
 * HTML5 video player with custom styling and controls.
 */

import { formatDuration } from '../../lib/utils';

/**
 * Props for VideoPlayer component.
 */
export interface VideoPlayerProps {
  /** Video source URL */
  src: string;
  /** Video poster/thumbnail image */
  poster?: string;
  /** Video title for accessibility */
  title: string;
  /** Video duration in seconds */
  duration?: number;
}

/**
 * Video Player Component
 *
 * Renders an HTML5 video player with:
 * - Native browser controls
 * - Poster image
 * - Responsive aspect ratio
 * - Duration display
 *
 * @example
 * <VideoPlayer
 *   src="https://example.com/video.mp4"
 *   poster="/images/thumbnail.jpg"
 *   title="Introduction to React"
 *   duration={1800}
 * />
 */
export function VideoPlayer({ src, poster, title, duration }: VideoPlayerProps) {
  return (
    <div className="relative">
      {/* Video container with aspect ratio */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video
          className="w-full h-full"
          src={src}
          poster={poster}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          aria-label={title}
        >
          <track kind="captions" label="English" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/80 text-white text-sm rounded">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
