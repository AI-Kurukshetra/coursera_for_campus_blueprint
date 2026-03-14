export type NotificationType =
  | 'new_lesson'
  | 'quiz_graded'
  | 'certificate_issued'
  | 'reply';

export type NotificationMetadataValue = string | number | boolean | null;

export type NotificationMetadata = Record<string, NotificationMetadataValue>;

export type NotificationItem = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  metadata: NotificationMetadata | null;
  created_at: string;
};
