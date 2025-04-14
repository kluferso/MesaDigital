import React from 'react';

export const GuitarIcon = ({ color = '#DC143C', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 4.41C19.9625 4.0375 20.1562 3.53437 20.1562 3C20.1562 2.46562 19.9625 1.9625 19.59 1.59C19.2175 1.2175 18.7144 1.02375 18.18 1.02375C17.6456 1.02375 17.1425 1.2175 16.77 1.59L9.88 8.5C9.1425 8.25187 8.35875 8.19375 7.59375 8.33437C6.82875 8.475 6.11063 8.80875 5.5 9.3125C4.15875 10.3613 3.3525 11.925 3.25125 13.59C3.23933 13.7747 3.25789 13.9605 3.30583 14.1387C3.35378 14.3168 3.43022 14.4843 3.53125 14.6325C3.63521 14.7816 3.76296 14.9094 3.91 15.0094C4.05704 15.1094 4.22027 15.1798 4.39125 15.2163C4.77387 15.2886 5.17084 15.2306 5.51125 15.0525C5.85166 14.8743 6.1146 14.5874 6.25 14.24C6.35963 13.9458 6.55091 13.6889 6.7998 13.5019C7.04869 13.3149 7.34456 13.2059 7.65 13.1875C8.15063 13.17 8.64187 13.3388 9.025 13.65C9.39812 13.9613 9.63188 14.4094 9.67063 14.9063C9.69751 15.2177 9.67251 15.5318 9.59678 15.8338C9.52105 16.1357 9.39606 16.4204 9.2275 16.6725C8.915 17.1569 8.73188 17.7319 8.7 18.3225C8.69212 18.9173 8.83936 19.5035 9.1275 20.0188C9.56125 20.8338 10.3225 21.4088 11.2087 21.59C12.095 21.7713 13.0162 21.5413 13.71 20.9613C14.2137 20.5513 14.5475 19.9838 14.6513 19.3613C14.7363 18.9238 14.6813 18.4713 14.4938 18.0638C14.3181 17.6845 14.2471 17.266 14.2888 16.8525C14.32 16.5219 14.4538 16.2103 14.6713 15.9587C14.8887 15.7072 15.1794 15.5282 15.5038 15.4462C15.8281 15.3642 16.1707 15.3834 16.4829 15.5014C16.795 15.6194 17.0623 15.83 17.25 16.1038C17.3863 16.3025 17.5825 16.4525 17.8088 16.535C18.035 16.6174 18.2813 16.6287 18.5138 16.5675C18.7462 16.5063 18.9553 16.3753 19.1113 16.1925C19.2672 16.0096 19.3622 15.7837 19.3838 15.5463C19.4413 14.6413 19.2775 13.735 18.9075 12.9C18.4088 11.78 17.59 10.8338 16.5575 10.1525C16.0762 9.8625 15.5375 9.67125 14.9775 9.59125L19.59 4.41Z" fill={color}/>
  </svg>
);

export const BassIcon = ({ color = '#4169E1', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 4.41C20.9625 4.0375 21.1562 3.53437 21.1562 3C21.1562 2.46562 20.9625 1.9625 20.59 1.59C20.2175 1.2175 19.7144 1.02375 19.18 1.02375C18.6456 1.02375 18.1425 1.2175 17.77 1.59L10.88 8.5C10.1425 8.25187 9.35875 8.19375 8.59375 8.33437C7.82875 8.475 7.11063 8.80875 6.5 9.3125C5.15875 10.3613 4.3525 11.925 4.25125 13.59C4.23933 13.7747 4.25789 13.9605 4.30583 14.1387C4.35378 14.3168 4.43022 14.4843 4.53125 14.6325C4.63521 14.7816 4.76296 14.9094 4.91 15.0094C5.05704 15.1094 5.22027 15.1798 5.39125 15.2163C5.77387 15.2886 6.17084 15.2306 6.51125 15.0525C6.85166 14.8743 7.1146 14.5874 7.25 14.24C7.35963 13.9458 7.55091 13.6889 7.7998 13.5019C8.04869 13.3149 8.34456 13.2059 8.65 13.1875C9.15063 13.17 9.64187 13.3388 10.025 13.65C10.3981 13.9613 10.6319 14.4094 10.6706 14.9063C10.6975 15.2177 10.6725 15.5318 10.5968 15.8338C10.5211 16.1357 10.3961 16.4204 10.2275 16.6725C9.915 17.1569 9.73188 17.7319 9.7 18.3225C9.69212 18.9173 9.83936 19.5035 10.1275 20.0188C10.5613 20.8338 11.3225 21.4088 12.2087 21.59C13.095 21.7713 14.0162 21.5413 14.71 20.9613C15.2137 20.5513 15.5475 19.9838 15.6513 19.3613C15.7363 18.9238 15.6813 18.4713 15.4938 18.0638C15.3181 17.6845 15.2471 17.266 15.2888 16.8525C15.32 16.5219 15.4538 16.2103 15.6713 15.9587C15.8887 15.7072 16.1794 15.5282 16.5038 15.4462C16.8281 15.3642 17.1707 15.3834 17.4829 15.5014C17.795 15.6194 18.0623 15.83 18.25 16.1038C18.3863 16.3025 18.5825 16.4525 18.8088 16.535C19.035 16.6174 19.2813 16.6287 19.5138 16.5675C19.7462 16.5063 19.9553 16.3753 20.1113 16.1925C20.2672 16.0096 20.3622 15.7837 20.3838 15.5463C20.4413 14.6413 20.2775 13.735 19.9075 12.9C19.4088 11.78 18.59 10.8338 17.5575 10.1525C17.0762 9.8625 16.5375 9.67125 15.9775 9.59125L20.59 4.41Z" fill={color}/>
    <path d="M4 16.5L6.5 19M6.5 16.5L4 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PianoIcon = ({ color = '#1E1E1E', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
    <rect x="6.5" y="4" width="3" height="10" fill={color}/>
    <rect x="14.5" y="4" width="3" height="10" fill={color}/>
    <line x1="6.5" y1="14" x2="6.5" y2="20" stroke={color} strokeWidth="1.5"/>
    <line x1="10" y1="14" x2="10" y2="20" stroke={color} strokeWidth="1.5"/>
    <line x1="14" y1="14" x2="14" y2="20" stroke={color} strokeWidth="1.5"/>
    <line x1="17.5" y1="14" x2="17.5" y2="20" stroke={color} strokeWidth="1.5"/>
  </svg>
);

export const DrumIcon = ({ color = '#8B4513', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C15.728 4 18.75 5.34 18.75 7C18.75 8.66 15.728 10 12 10C8.27196 10 5.25 8.66 5.25 7C5.25 5.34 8.27196 4 12 4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.75 12C18.75 13.66 15.728 15 12 15C8.27196 15 5.25 13.66 5.25 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.25 7V17C5.25 18.66 8.27196 20 12 20C15.728 20 18.75 18.66 18.75 17V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.7501 9L21.0001 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.25012 9L3.00012 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ViolinIcon = ({ color = '#8B008B', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 18.5L5.5 13.5M18.5 10.5L13.5 5.5M10.5 6L18 13.5M6 10.5L13.5 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5"/>
    <path d="M17.5 3L21 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17.5L6.5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const VocalIcon = ({ color = '#FF6347', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V13M12 13C13.6569 13 15 11.6569 15 10V7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7V10C9 11.6569 10.3431 13 12 13Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10C7 13.3137 9.23858 16 12 16C14.7614 16 17 13.3137 17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19V16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 19H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SaxophoneIcon = ({ color = '#FFD700', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 12L19.5 8.5C20.3284 7.67157 20.3284 6.32843 19.5 5.5V5.5C18.6716 4.67157 17.3284 4.67157 16.5 5.5L13 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 9L14 10L12 12L11 11L13 9Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 12L10 14C9.46957 14.5304 9.46957 15.4696 10 16V16C10.5304 16.5304 11.4696 16.5304 12 16L13 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 15L8 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6.5" cy="21.5" r="1.5" fill={color}/>
  </svg>
);

export const TrumpetIcon = ({ color = '#B8860B', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 12H10C8.89543 12 8 12.8954 8 14V14C8 15.1046 8.89543 16 10 16H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8H11C9.89543 8 9 8.89543 9 10V10C9 11.1046 9.89543 12 11 12H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 16H11C9.89543 16 9 16.8954 9 18V18C9 19.1046 9.89543 20 11 20H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 10V18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8C17 5.79086 18.7909 4 21 4V4V4C21 6.20914 19.2091 8 17 8V8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OtherInstrumentIcon = ({ color = '#696969', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10V14M12 8V16M15 10V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default {
  GuitarIcon,
  BassIcon,
  PianoIcon,
  DrumIcon,
  ViolinIcon,
  VocalIcon,
  SaxophoneIcon,
  TrumpetIcon,
  OtherInstrumentIcon
};
