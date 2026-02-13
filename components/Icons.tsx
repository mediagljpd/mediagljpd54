import React from 'react';

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118 3.375 3.375 0 0 0-.573 1.086 3.375 3.375 0 0 0 1.087.573 2.25 2.25 0 0 1 2.118 2.475 3 3 0 0 0 1.128 5.78 3 3 0 0 0 5.78-1.128 2.25 2.25 0 0 1 2.475-2.118 3.375 3.375 0 0 0 .573-1.086 3.375 3.375 0 0 0-1.087-.573 2.25 2.25 0 0 1-2.118-2.475 3 3 0 0 0-1.128-5.78Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 9-9c0-5.022-4.002-9.022-9-9.022a9.004 9.004 0 0 0-9 9c0 5.022 4.002 9.022 9 9.022Z" />
    </svg>
);

export const SortAscIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

export const SortDescIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const SortIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
);

export const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="6" r="1.5"/>
        <circle cx="15" cy="6" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/>
        <circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="18" r="1.5"/>
        <circle cx="15" cy="18" r="1.5"/>
    </svg>
);

export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

export const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4Zm.5 4.5v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Zm-6 3v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Zm-6 3v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Zm2 0v1h1v-1h-1Z"/>
        <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.658-.897.382-.23.844-.282 1.31-.154.58.157.96.626.96 1.258v.02c0 .546-.226.99-.48 1.344a7.41 7.41 0 0 1-1.246.997.557.557 0 0 0-.014.014 20.44 20.44 0 0 0-1.282 2.26a7.47 7.47 0 0 1 .452 1.34c.086.41.118.801.046 1.136-.075.353-.275.672-.659.897-.383.229-.844.28-1.31.153-.58-.157-.96-.625-.96-1.258v-.019a.99.99 0 0 1 .03-.189Zm-2.112-3.585c.117-.51.36-1.002.71-1.417.35-.415.78-.73 1.28-.924.5-.193 1.05-.248 1.58-.145.532.104 1.003.37 1.393.758.39.387.643.86.758 1.393.116.53.06 1.08-.146 1.58a5.39 5.39 0 0 1-.924 1.28c-.415.35-.91.6-1.417.71a5.39 5.39 0 0 1-1.58.145c-.53-.104-1.003-.37-1.393-.758a5.39 5.39 0 0 1-.758-1.393Z"/>
    </svg>
);


export const WordIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.43 2.25h-5.86a.75.75 0 0 0-.72.633L4.5 5.25v9.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-9.5l-.35-2.367a.75.75 0 0 0-.72-.633ZM9.25 4.5v3.896l-1.34-2.233a.75.75 0 0 0-1.32.788l2 3.333a.75.75 0 0 0 1.32 0l2-3.333a.75.75 0 1 0-1.32-.788L10.75 8.396V4.5a.75.75 0 0 0-1.5 0Z" clipRule="evenodd"/>
        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4Zm0 1.5h12a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5Z"/>
    </svg>
);

export const JournalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

export const PuzzlePieceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.354-.667.354-1.079 0-.625-.372-1.194-.901-1.492A3.75 3.75 0 0 0 12 2.25c-1.057 0-2.022.44-2.707 1.152-.641.682-.942 1.62-.942 2.598 0 .412.133.79.354 1.079.215.283.401.604.401.959v.214c0 .021.002.042.002.063a3.75 3.75 0 0 1-1.5 3.28V12a3.75 3.75 0 0 0-3.75 3.75v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5v-1.5a3.75 3.75 0 0 1 3.75-3.75h3.75a3.75 3.75 0 0 1 3.75 3.75v1.5h1.5a1.5 1.5 0 0 0 1.5-1.5v-1.5a3.75 3.75 0 0 0-3.75-3.75v-2.143a3.75 3.75 0 0 1-1.5-3.28v-.063c0-.021.002-.042.002-.063v-.214Z" />
    </svg>
);

export const CubeTransparentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75l-9-5.25m9 5.25l9-5.25" />
    </svg>
);

export const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12a2.25 2.25 0 0 1-18 0V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.75v16.5M15.75 3.75v16.5M3.75 10.5h16.5M3.75 15.75h16.5" />
    </svg>
);
