export {};

declare global {
  var __firestoreData: {
    activityLogs: Record<string, any>;
    aggregatedActivityLogs: Record<string, any>;
  } | undefined;
}
