export const getInitials = (name?: string | null) =>
  name?.trim().charAt(0).toUpperCase() || 'U';

export const getAvatarSrc = (avatar?: string | null) => {
  if (!avatar) return null;

  if (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('/uploads/')
  ) {
    return avatar;
  }

  return `/uploads/${avatar.replace(/^\/+/, '')}`;
};
