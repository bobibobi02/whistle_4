export type HapticTabProps = {
  name?: string;
  color?: string;
  children?: any;
};

/**
 * Stub HapticTab component.
 * This is only here so the web Next.js build stops failing on the mobile app import.
 * The actual mobile app is not used in the Whistle web beta.
 */
export function HapticTab(_props: HapticTabProps) {
  return null as any;
}