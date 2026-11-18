function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ user, size = 40 }) {
  const photo = user?.photo;
  const name = user?.name || '';
  const initials = getInitials(name);

  const style = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-grid',
    placeItems: 'center',
    fontSize: Math.max(10, Math.floor(size * 0.38)),
    fontWeight: 700,
    backgroundColor: '#ffedf3',
    color: '#d47c9d',
    border: '1px solid #f6d1df',
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name ? `Foto ${name}` : 'Foto profil'}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          border: '1px solid #f6d1df',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={style} aria-label={name ? `Inisial ${name}` : 'Avatar'}>
      {initials}
    </div>
  );
}
