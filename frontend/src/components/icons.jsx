// Hand-authored outline icon set: 24x24, currentColor stroke, consistent
// weight. Replaces emoji throughout the app.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export function ImageIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L4 19" />
    </svg>
  );
}

export function DocumentIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
      <path d="M8.5 13h7M8.5 16.5h5" />
    </svg>
  );
}

export function VideoIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="13" height="13" rx="2.5" />
      <path d="M16 10l5-2.8v9.6l-5-2.8" />
    </svg>
  );
}

export function AudioIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M9 17V6.5l10-2v10.5" />
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
    </svg>
  );
}

export function ArchiveIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="1.5" />
      <path d="M3.5 7.5V5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5" />
      <path d="M10.5 11.5h3" />
    </svg>
  );
}

export function FileIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
    </svg>
  );
}

export function UploadCloudIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 17.5a4 4 0 0 1-.5-7.96 5 5 0 0 1 9.62-1.8A4.5 4.5 0 0 1 16.5 17.5" />
      <path d="M12 20v-7M9 15.5 12 13l3 2.5" />
    </svg>
  );
}

export function DownloadIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v11M8.5 12 12 15.5 15.5 12" />
      <path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
    </svg>
  );
}

export function AlertIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M10.6 4.3a1.6 1.6 0 0 1 2.8 0l8 14a1.6 1.6 0 0 1-1.4 2.4H4a1.6 1.6 0 0 1-1.4-2.4z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17.2" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const CATEGORY_ICON_COMPONENTS = {
  image: ImageIcon,
  document: DocumentIcon,
  video: VideoIcon,
  audio: AudioIcon,
  archive: ArchiveIcon,
  unknown: FileIcon
};

export function CategoryIcon({ category, className }) {
  const Icon = CATEGORY_ICON_COMPONENTS[category] || FileIcon;
  return <Icon className={className} />;
}
