export type PwaPromptKind = "none" | "install" | "ios-guide";

export function isStandaloneDisplay(
  mediaMatches: boolean,
  navigatorStandalone?: boolean,
): boolean {
  return mediaMatches || navigatorStandalone === true;
}

export function getPwaPromptKind({
  standalone,
  mobile,
  ios,
  installAvailable,
}: {
  standalone: boolean;
  mobile: boolean;
  ios: boolean;
  installAvailable: boolean;
}): PwaPromptKind {
  if (standalone || !mobile) return "none";
  if (ios) return "ios-guide";
  return installAvailable ? "install" : "none";
}
