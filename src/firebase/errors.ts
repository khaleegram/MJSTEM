
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  public readonly isFirestorePermissionError = true;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify({ ...context }, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error visible in the Next.js dev overlay
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        // Throwing in a timeout allows the dev overlay to catch it without crashing the app
        throw this;
      }, 0);
    }
  }
}

    