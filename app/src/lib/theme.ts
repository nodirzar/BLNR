export const palette = {
  ink: '#12100D',
  charcoal: '#1C1915',
  card: '#242019',
  cream: '#F4EFE6',
  sand: '#CfC5B4',
  muted: '#8C8273',
  terracotta: '#D2693C',
  terracottaSoft: '#E8956B',
  sage: '#7C8A6E',
  line: '#363025',
  danger: '#C75450',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
} as const;

export const spacing = (n: number) => n * 4;
